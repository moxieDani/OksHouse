<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	
	// SvelteKit automatically provides these props - declare them to avoid warnings
	export let data = {};
	export let params = {};
	
	import StepIndicator from '$lib/components/StepIndicator.svelte';
	import DurationSelector from '$lib/components/DurationSelector.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import FeedbackManager from '../../../../shared/components/FeedbackManager.svelte';
	import { 
		reservationState, 
		stepNavigation, 
		nextStep, 
		prevStep, 
		setGuestInfo,
		resetReservation,
		updateReservationData 
	} from '$lib/stores/reservation.js';
	import { userAPI } from '$lib/services/api.js';
	import { formatDateForAPI } from '../../../../shared/services/apiBase.js';
	import { RESERVATION_STEPS, DEFAULT_MESSAGES, PLACEHOLDERS } from '$lib/constants/reservationConstants.js';
	import { formatKoreanDate, calculateDateRange } from '../../../../shared/utils/dateUtils.js';
	import { formatPhoneNumber, formatPassword, validateReservationInfo, VALIDATION_CONSTANTS } from '$lib/utils/validationUtils.js';
	import { handleError, safeAsync, retryAsync } from '../../../../shared/utils/errorUtils.js';

	// === 상수 정의 ===
	const STEPS = RESERVATION_STEPS;
	
	// === 컴포넌트 상태 관리 ===
	/** @type {any} 달력 컴포넌트 참조 */
	let calendarComponent;
	/** @type {boolean} 예약 변경 모드 여부 */
	let isModificationMode = false;
	/** @type {Object|null} 변경 예약 데이터 */
	let modificationData = null;
	
	// === 달력 상태 관리 ===
	/** @type {number} 현재 달 */
	let currentMonth = new Date().getMonth();
	/** @type {number} 현재 년도 */
	let currentYear = new Date().getFullYear();
	/** @type {string} 마지막 로드된 달 */
	let lastLoadedMonth = '';
	
	// === 예약 데이터 관리 ===
	/** @type {Array<Object>} 기존 예약 목록 (날짜 차단용) */
	let existingReservations = [];
	/** @type {boolean} 예약 데이터 로딩 상태 */
	let isLoadingReservations = false;
	/** @type {boolean} 수동 새로고침 중 여부 */
	let isRefreshing = false;
	
	// === 피드백 매니저 상태 ===
	/** @type {boolean} 피드백 모달 표시 여부 */
	let showFeedback = false;
	/** @type {string} 피드백 타입 */
	let feedbackType = 'info';
	/** @type {string} 피드백 제목 */
	let feedbackTitle = '';
	/** @type {string} 피드백 메시지 */
	let feedbackMessage = '';
	/** @type {Function|null} 피드백 콜백 함수 */
	let feedbackCallback = null;

	// === 성능 최적화된 반응형 문 ===
	
	// 기본 상태 추출 (메모이제이션 적용)
	$: currentStep = $reservationState.currentStep;
	$: duration = $reservationState.duration;
	$: startDate = $reservationState.startDate;
	$: guestInfo = $reservationState.guestInfo;
	
	// 날짜 범위 표시 최적화 (매개변수 변경 시에만 재계산)
	$: step2DateRangeText = startDate && duration ? formatStep2DateRange(startDate, duration) : '날짜를 선택해주세요';
	
	// 예약 데이터 로드 최적화 (중복 로드 방지)
	let lastLoadKey = '';
	$: {
		const loadKey = `${currentStep}-${currentYear}-${currentMonth}`;
		if (currentStep === 2 && loadKey !== lastLoadKey) {
			lastLoadKey = loadKey;
			loadMonthlyReservations(currentYear, currentMonth);
		}
	}
	

	// === 페이지 라이프사이클 함수 ===
	
	/**
	 * 컴포넌트 마운트 시 초기화 작업
	 * - 세션 스토리지에서 변경 예약 데이터 복원
	 * - 예약 모드 (새로운 예약/변경) 설정
	 */
	onMount(() => {
		// Always initialize properly regardless of browser state
		const storedModificationData = browser ? sessionStorage.getItem('modificationData') : null;
		
		if (storedModificationData) {
			try {
				modificationData = JSON.parse(storedModificationData);
				
				// Convert date strings back to Date objects
				if (modificationData.originalReservation?.startDate) {
					modificationData.originalReservation.startDate = new Date(modificationData.originalReservation.startDate);
				}
				
				isModificationMode = true;
				if (browser) sessionStorage.removeItem('modificationData');
				setupModificationMode();
			} catch (e) {
				console.error('Error parsing modification data:', e);
				// If parsing fails, reset to normal mode
				if (browser) sessionStorage.removeItem('modificationData');
				resetToNormalMode();
			}
		} else {
			// Force reset to normal reservation mode
			resetToNormalMode();
		}
		
		// If we're on step 2, load current month's reservations
		if ($reservationState.currentStep === 2) {
			loadMonthlyReservations(currentYear, currentMonth);
		}
	});
	
	function resetToNormalMode() {
		isModificationMode = false;
		modificationData = null;
		
		// Reset the stores to initial state
		reservationState.set({
			currentStep: 1,
			duration: 0,
			startDate: null,
			endDate: null,
			guestInfo: { name: '', phone: '', password: '' },
			isModificationMode: false,
			originalReservation: null
		});
		
		stepNavigation.set({
			totalSteps: 3,
			completedSteps: [],
			activeStep: 1
		});
	}

	function setupModificationMode() {
		if (!modificationData) {
			return;
		}
		
		const originalDuration = modificationData.originalReservation?.duration || 0;
		// Use fallback duration of 2 days if no duration found
		const safeDuration = originalDuration || 2;
		
		updateReservationData({
			isModificationMode: true,
			originalReservation: modificationData.originalReservation,
			duration: safeDuration,
			guestInfo: modificationData.userInfo
		});

		// For modification mode, start with step 1 (duration selection)
		// User needs to confirm or change the duration first
		updateReservationData({ currentStep: 1 });
		stepNavigation.update(nav => ({
			...nav,
			activeStep: 1,
			completedSteps: []
		}));
	}

	// === 단계 내비게이션 함수 ===
	
	/**
	 * 다음 단계로 이동
	 * 각 단계별로 필수 입력 값 검증 후 진행
	 */
	function handleNext() {
		if (currentStep === 1) {
			if (!duration) {
				showAlert(DEFAULT_MESSAGES.SELECT_DURATION, 'warning');
				return;
			}
		} else if (currentStep === 2) {
			if (!startDate) {
				showAlert(DEFAULT_MESSAGES.SELECT_CHECKIN, 'warning');
				return;
			}
		}
		
		nextStep();
	}

	// === 예약 데이터 관리 함수 ===
	
	/**
	 * 월별 예약 데이터 로드 (인접 달 포함)
	 * 달력에서 날짜 차단을 위해 이전/다음 달 데이터도 함께 로드
	 * @param {number} year - 년도
	 * @param {number} month - 달 (0-11)
	 */
	async function loadMonthlyReservations(year, month) {
		// Skip if already loading the same month
		if (isLoadingReservations) return;
		
		const result = await safeAsync(async () => {
			isLoadingReservations = true;
			
			// Calculate previous and next month
			const prevMonth = month === 0 ? 11 : month - 1;
			const prevYear = month === 0 ? year - 1 : year;
			const nextMonth = month === 11 ? 0 : month + 1;
			const nextYear = month === 11 ? year + 1 : year;
			
			// Load current month and adjacent months in parallel
			const [currentReservations, prevReservations, nextReservations] = await Promise.all([
				userAPI.getMonthlyReservations(year, month + 1), // Convert to 1-based
				userAPI.getMonthlyReservations(prevYear, prevMonth + 1), // Convert to 1-based
				userAPI.getMonthlyReservations(nextYear, nextMonth + 1) // Convert to 1-based
			]);
			
			// Combine all reservations and remove duplicates by ID
			const allReservations = [
				...(currentReservations || []),
				...(prevReservations || []),
				...(nextReservations || [])
			];
			
			// Remove duplicates based on reservation ID
			const uniqueReservations = allReservations.filter((reservation, index, self) => 
				index === self.findIndex(r => r.id === reservation.id)
			);
			
			return uniqueReservations;
		}, '예약 데이터 로드', showAlert);
		
		existingReservations = result || [];
		isLoadingReservations = false;
	}

	/**
	 * 달력 달 변경 시 데이터 로드
	 * @param {Object} event - 달 변경 이벤트
	 */
	function handleMonthChange(event) {
		const { month, year } = event.detail;
		currentMonth = month;
		currentYear = year;
		
		// Always reload reservations for the new month when on step 2
		if (currentStep === 2) {
			isLoadingReservations = false; // Reset loading state
			loadMonthlyReservations(year, month);
		}
	}

	
	// 중복 로드 방지를 위한 라이프사이클 관리는 위에서 처리

	/**
	 * 수동 새로고침 - 사용자가 버튼을 클릭할 때
	 */
	async function handleRefresh() {
		if (isRefreshing || isLoadingReservations) return; // 이미 로딩 중이면 중단
		
		isRefreshing = true;
		try {
			// 현재 달의 예약 정보를 새로고침
			isLoadingReservations = false; // 로딩 상태 리셋
			await loadMonthlyReservations(currentYear, currentMonth);
		} catch (error) {
			console.error('새로고침 실패:', error);
			showFeedback = true;
			feedbackType = 'error';
			feedbackTitle = '새로고침 실패';
			feedbackMessage = '예약 정보를 불러오는데 실패했습니다.';
		} finally {
			isRefreshing = false;
		}
	}

	// === 달력 이벤트 처리 함수 ===
	
	/**
	 * 차단된 날짜 클릭 시 경고 메시지 표시
	 * @param {Object} event - 차단된 날짜 클릭 이벤트
	 */
	function handleBlockedDateClick(event) {
		const { message } = event.detail;
		showAlert(message, 'warning');
	}

	/**
	 * 예약 충돌 감지 시 경고 메시지 표시
	 * @param {Object} event - 충돌 감지 이벤트
	 */
	function handleConflictDetected(event) {
		const { message } = event.detail;
		showAlert(message, 'warning');
	}

	/**
	 * 이전 단계로 이동
	 * - 변경 모드: 관리 페이지로 돌아가기
	 * - 새 예약 모드: 메인 페이지 또는 이전 단계로 이동
	 */
	function handlePrev() {
		if (isModificationMode && currentStep === 1) {
			// Save current auth info to return to manage page step2
			if (modificationData && browser) {
				sessionStorage.setItem('returnToManageStep2', JSON.stringify({
					authName: modificationData.userInfo.name,
					authPhone: modificationData.userInfo.phone,
					password: modificationData.userInfo.password
				}));
			}
			goto('/manage#step2');
			return;
		}
		
		if (!isModificationMode && currentStep === 1) {
			goto('/');
			return;
		}
		
		prevStep();
	}

	async function handleComplete() {
		if (isModificationMode) {
			// For modifications, we don't need to validate personal info again
			if (!startDate) {
				showAlert('새로운 예약 날짜를 선택해주세요.', 'warning');
				return;
			}

			if (!duration) {
				showAlert('숙박 기간을 선택해주세요.', 'warning');
				return;
			}

			try {
				// Calculate end date
				const endDate = new Date(startDate);
				endDate.setDate(startDate.getDate() + duration);

				// Call update API
				await userAPI.updateReservation(
					modificationData.originalReservation.id,
					modificationData.userInfo.name,
					modificationData.userInfo.phone,
					formatDateForAPI(startDate),
					formatDateForAPI(endDate),
					duration
				);

				// 예약 변경 완료 페이지로 이동
				const completionData = {
					guestName: modificationData.userInfo.name,
					guestPhone: modificationData.userInfo.phone,
					guestPassword: modificationData.userInfo.password,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					duration: duration
				};
				
				// Store auth data for returning to manage page
				if (browser) {
					sessionStorage.setItem('returnToManageStep2', JSON.stringify({
						authName: modificationData.userInfo.name,
						authPhone: modificationData.userInfo.phone,
						password: modificationData.userInfo.password
					}));
				}
				
				const params = new URLSearchParams({
					data: encodeURIComponent(JSON.stringify(completionData)),
					modification: 'true'
				});
				goto(`/reservation/complete?${params.toString()}`);
			} catch (error) {
				handleError(error, '예약 변경', showAlert);
			}
			return;
		}

		// Original reservation completion logic
		// 예약 정보 유효성 검사 (유틸리티 함수 사용)
		const validation = validateReservationInfo(startDate, duration, guestInfo);
		if (!validation.isValid) {
			showAlert(validation.message, 'warning');
			return;
		}

		// Create reservation via API
		try {
			const endDate = new Date(startDate);
			endDate.setDate(startDate.getDate() + duration);
			
			const reservationData = {
				name: guestInfo.name.trim(),
				phone: guestInfo.phone.trim(),
				start_date: formatDateForAPI(startDate),
				end_date: formatDateForAPI(endDate),
				duration: duration,
				password: guestInfo.password
			};
			
			const response = await userAPI.createReservation(reservationData);
			
			// 예약 완료 페이지로 이동
			const completionData = {
				guestName: guestInfo.name.trim(),
				guestPhone: guestInfo.phone.trim(),
				guestPassword: guestInfo.password,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				duration: duration,
				reservationId: response.id
			};
			
			// Store auth data for automatic login to manage page
			if (browser) {
				sessionStorage.setItem('returnToManageStep2', JSON.stringify({
					authName: guestInfo.name.trim(),
					authPhone: guestInfo.phone.trim(),
					password: guestInfo.password
				}));
			}
			
			// Clear existing reservations cache to force reload
			existingReservations = [];
			resetReservation();
			
			const params = new URLSearchParams({
				data: encodeURIComponent(JSON.stringify(completionData)),
				modification: 'false'
			});
			goto(`/reservation/complete?${params.toString()}`);
		} catch (error) {
			handleError(error, '예약 생성', showAlert);
		}
	}

	// 날짜 범위 표시 유틸리티 (유틸리티 함수 사용)

	function formatReservationInfo() {
		const range = calculateDateRange(startDate, duration);
		if (!range) return DEFAULT_MESSAGES.SELECT_DATE;
		
		return `<strong>체크인:</strong> ${formatKoreanDate(range.startDate)}<br><strong>체크아웃:</strong> ${formatKoreanDate(range.endDate)}<br><strong>숙박기간:</strong> ${range.duration}박 ${range.duration + 1}일`;
	}

	function formatOriginalReservationInfo() {
		if (!modificationData?.originalReservation) return '원본 예약 정보 없음';
		
		const original = modificationData.originalReservation;
		const originalStartDate = original.startDate instanceof Date ? original.startDate : new Date(original.start_date);
		const originalEndDate = original.endDate instanceof Date ? original.endDate : new Date(original.end_date);
		const originalDuration = original.duration || Math.ceil((originalEndDate - originalStartDate) / (1000 * 60 * 60 * 24));
		
		return `<strong>체크인:</strong> ${formatKoreanDate(originalStartDate)}<br><strong>체크아웃:</strong> ${formatKoreanDate(originalEndDate)}<br><strong>숙박기간:</strong> ${originalDuration}박 ${originalDuration + 1}일`;
	}

	function formatStep2DateRange(selectedDate, selectedDuration) {
		const range = calculateDateRange(selectedDate, selectedDuration);
		if (!range) return '날짜를 선택해주세요';
		
		return `${formatKoreanDate(range.startDate)} - ${formatKoreanDate(range.endDate)}`;
	}

	function handleGuestInfoChange(field, value) {
		setGuestInfo({ [field]: value });
	}

	// FeedbackManager helper functions
	function showAlert(message, type = 'warning') {
		feedbackType = type;
		feedbackTitle = type === 'warning' ? '주의' : '알림';
		feedbackMessage = message;
		feedbackCallback = null;
		showFeedback = true;
	}

	function showSuccess(title, message, onClose = null) {
		feedbackType = 'success';
		feedbackTitle = title;
		feedbackMessage = message;
		feedbackCallback = onClose;
		showFeedback = true;
	}
</script>

<svelte:head>
	<title>{isModificationMode ? '예약 변경' : '예약'} - Ok's House</title>
</svelte:head>

<h1 id="page-title" style="margin-top: 55px;">
	{#if isModificationMode}
		<span class="emoji-normal">📋</span> 예약 변경
	{:else}
		<span class="emoji-normal">🏠</span> 새로운 예약하기
	{/if}
</h1>

<StepIndicator {isModificationMode} />



<!-- Step 1: 숙박 기간 선택 -->
{#if currentStep === 1}
	<div class="step">
		<div class="progress-guide">
			<h4>📅 1단계: 숙박 기간 선택</h4>
			<p>머물고 싶은 날짜 수를 선택해주세요</p>
		</div>
		
		<div class="help-box">
			<p>🙋🏻‍♂️ 만약 <strong>2박 3일</strong> 선택했다면?</p>
			<p><strong>2일 밤을 자고 3일째 체크아웃</strong></p>
		</div>
		
		<DurationSelector 
			bind:selectedDuration={$reservationState.duration}
			{isModificationMode}
			on:select={(e) => {
				duration = e.detail;
				// Update the store with the new duration
				updateReservationData({ duration: e.detail });
				// Calendar will automatically update through props binding
			}}
		/>
		
		
		<div class="button-container">
			<button class="btn btn-back" on:click={handlePrev}>이전</button>
			<button class="btn" on:click={handleNext}>다음</button>
		</div>
	</div>
{/if}

<!-- Step 2: 달력에서 시작일 선택 -->
{#if currentStep === 2}
	<div class="step">
		<div class="step-header">
			<div class="progress-guide">
				<h4>🗓️ 2단계: 체크인 날짜 선택</h4>
				<p>달력에서 체크인하는 날짜를 클릭해주세요</p>
			</div>
			
		</div>
		
		<div class="date-range-display" class:selected={startDate}>
			{step2DateRangeText}
		</div>
		
		{#if isLoadingReservations}
			<div class="loading-indicator">
				<p>🔄 예약 정보를 불러오는 중...</p>
			</div>
		{/if}
		
		{#key `${$reservationState.duration}-${$reservationState.startDate?.getTime() || 'none'}-${currentMonth}-${currentYear}-${isLoadingReservations}-${JSON.stringify(existingReservations)}`}
			<Calendar 
				bind:this={calendarComponent}
				selectedDate={$reservationState.startDate}
				duration={$reservationState.duration}
				{isModificationMode}
				originalReservation={$reservationState.originalReservation}
				bind:currentMonth={currentMonth}
				bind:currentYear={currentYear}
				{existingReservations}
				{isRefreshing}
				onRefresh={handleRefresh}
				on:dateSelect={(e) => {
					// Update the store - this will automatically update startDate via reactive statement
					updateReservationData({ startDate: e.detail });
				}}
				on:monthChange={handleMonthChange}
				on:blockedDateClick={handleBlockedDateClick}
				on:conflictDetected={handleConflictDetected}
				on:sameDatesSelected={(e) => {
					const { message } = e.detail;
					showAlert(message, 'warning');
				}}
			/>
		{/key}

		<div class="button-container">
			<button class="btn btn-back" on:click={handlePrev}>이전</button>
			<button class="btn" id="nextBtn2" disabled={!startDate} on:click={handleNext}>다음</button>
		</div>
	</div>
{/if}

<!-- Step 3: 예약자 정보 입력 -->
{#if currentStep === 3}
	<div class="step">
		<div class="progress-guide">
			<h4 id="step3-title">
				{isModificationMode ? '📝 3단계: 예약 변경 확인' : '📝 3단계: 예약자 정보 입력'}
			</h4>
			<p>{isModificationMode ? '새로운 예약 정보를 확인해주세요' : '예약자 정보를 정확히 입력해주세요'}</p>
		</div>
		
		{#if !isModificationMode}
			<div class="help-box">
				<p><strong>💡 이름, 연락처, 4자리 비밀번호 입력</strong></p>
			</div>
			<div 
				class="date-range-display selected"
				class:modification={isModificationMode}
			>
				<h4>📅 선택된 예약 정보</h4>
				<div class="reservation-info">
					<div class="reservation-details">
						{@html formatReservationInfo()}
					</div>
				</div>
			</div>
		{/if}

		{#if isModificationMode && modificationData}
			<div class="modification-info-container">
				<!-- 기존 예약 정보 -->
				<div class="date-range-display original-reservation-info">
					<h4>📋 기존 예약 정보</h4>
					<div class="reservation-info original">
						<div class="reservation-details">
							{@html formatOriginalReservationInfo()}
						</div>
					</div>
				</div>
				
				<!-- 화살표 -->
				<div class="change-arrow">
					<span class="arrow-icon">⬇</span>
				</div>
				
				<!-- 새로운 예약 정보 -->
				<div class="date-range-display new-reservation-info">
					<h4>🔄 변경될 예약 정보</h4>
					<div class="reservation-info new">
						<div class="reservation-details">
							{@html formatReservationInfo()}
						</div>
					</div>
				</div>
			</div>
		{/if}
		
		{#if !isModificationMode}
			<div class="personal-info-form">
				<div class="form-group">
					<label for="name">이름:</label>
					<input 
						type="text" 
						id="name" 
						placeholder="이름을 입력하세요"
						bind:value={guestInfo.name}
						on:input={(e) => handleGuestInfoChange('name', e.target.value)}
					>
				</div>
				<div class="form-group">
					<label for="phone">전화번호:</label>
					<input 
						type="tel" 
						id="phone" 
						placeholder={PLACEHOLDERS.PHONE}
						bind:value={guestInfo.phone}
						on:input={(e) => {
							// 전화번호 자동 포매팅 (유틸리티 함수 사용)
							const formattedValue = formatPhoneNumber(e.target.value);
							e.target.value = formattedValue;
							handleGuestInfoChange('phone', formattedValue);
						}}
					>
				</div>
				<div class="form-group">
					<label for="password">비밀번호:</label>
					<input 
						type="password" 
						id="password" 
						placeholder={PLACEHOLDERS.PASSWORD}
						maxlength={VALIDATION_CONSTANTS.PASSWORD_LENGTH}
						bind:value={guestInfo.password}
						on:input={(e) => {
							// 비밀번호 포매팅 (유틸리티 함수 사용)
							const formattedValue = formatPassword(e.target.value);
							e.target.value = formattedValue;
							handleGuestInfoChange('password', formattedValue);
						}}
					>
				</div>
			</div>
		{/if}
		
		<div class="button-container">
			<button class="btn btn-back" on:click={handlePrev}>이전</button>
			<button class="btn" on:click={handleComplete}>
				{isModificationMode ? '예약 변경 완료' : '예약 완료'}
			</button>
		</div>
	</div>
{/if}


<FeedbackManager 
	bind:show={showFeedback}
	type={feedbackType}
	title={feedbackTitle}
	message={feedbackMessage}
	onClose={feedbackCallback}
/>

<style>
	:global(body) {
		background: linear-gradient(135deg, var(--neutral-50) 0%, var(--neutral-100) 100%);
	}

	.step {
		animation: fadeIn 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.progress-guide {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.progress-guide h4 {
		font-size: var(--text-xl);
		color: var(--primary);
		margin-bottom: var(--space-2);
	}

	.progress-guide p {
		color: var(--neutral-600);
		font-size: var(--text-base);
	}

	/* Step 헤더 - 제목과 새로고침 버튼 */
	.step-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-6);
		gap: var(--space-4);
	}

	.step-header .progress-guide {
		flex: 1;
		margin-bottom: 0;
	}

	/* 모바일 반응형 */
	@media (max-width: 768px) {
		.step-header {
			flex-direction: column;
			gap: var(--space-3);
			align-items: center;
		}

		.step-header .progress-guide {
			text-align: center;
		}
	}

	.help-box {
		background: rgba(67, 56, 202, 0.1);
		border: 1px solid rgba(67, 56, 202, 0.2);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		margin-bottom: var(--space-6);
		text-align: center;
	}

	.help-box p {
		margin: 0;
		color: var(--primary);
		font-size: var(--text-base);
	}

	.date-range-display {
		background: var(--neutral-100);
		border: 2px solid var(--neutral-200);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		text-align: center;
		margin-bottom: var(--space-6);
		font-size: var(--text-base);
		color: var(--neutral-600);
	}

	.date-range-display.selected {
		background: rgba(67, 56, 202, 0.1);
		color: var(--primary);
		border-color: var(--primary);
		border-width: 2px;
		font-weight: 600;
	}

	.date-range-display.modification {
		background: rgba(245, 158, 11, 0.1);
		color: var(--warning);
		border-color: var(--warning);
	}

	.reservation-info {
		background: white;
		padding: var(--space-4);
		border-left: 4px solid #c3c3c3;
		margin: var(--space-4) 0;
		border-radius: var(--radius-md);
	}

	.reservation-details :global(p) {
		margin-bottom: var(--space-2);
		color: var(--neutral-600);
	}

	/* Modification info styling */
	.modification-info-container {
		margin-bottom: var(--space-6);
	}

	.original-reservation-info {
		background: rgba(107, 114, 128, 0.1);
		border-color: #6b7280;
		color: #4b5563;
		margin-bottom: var(--space-4);
	}

	.original-reservation-info h4 {
		color: #4b5563;
	}

	.new-reservation-info {
		background: rgba(67, 56, 202, 0.15);
		border-color: var(--primary);
		color: var(--primary);
		border-width: 3px;
		box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.1), 0 2px 4px -1px rgba(67, 56, 202, 0.06);
		margin-bottom: var(--space-4);
	}

	.new-reservation-info h4 {
		color: var(--primary);
		font-weight: 700;
	}

	.change-arrow {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: var(--space-3) 0;
		width: 100%;
		height: 50px;
	}

	.arrow-icon {
		font-size: 2.5rem;
		color: var(--primary);
		filter: drop-shadow(0 2px 4px rgba(67, 56, 202, 0.3));
		animation: bounce 2s infinite;
		transform: scaleX(1.2);
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: scaleX(1.2) translateY(0);
		}
		40% {
			transform: scaleX(1.2) translateY(-3px);
		}
		60% {
			transform: scaleX(1.2) translateY(-2px);
		}
	}

	.reservation-info.original {
		border-left: 4px solid #6b7280;
	}

	.reservation-info.new {
		border-left: 4px solid var(--primary);
		background: rgba(67, 56, 202, 0.05);
	}

	.reservation-info.new .reservation-details :global(strong) {
		color: var(--primary);
	}

	.loading-indicator {
		text-align: center;
		padding: var(--space-4);
		color: var(--primary);
		font-weight: 500;
		background: rgba(67, 56, 202, 0.05);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-4);
	}

	.loading-indicator p {
		margin: 0;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.personal-info-form {
		margin-bottom: var(--space-6);
	}

	/* Modification mode styling */
	:global(.modification) h1 {
		background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		color: transparent !important;
		-webkit-text-fill-color: transparent !important;
	}

	:global(.modification) .progress-guide h4 {
		color: var(--warning);
	}

	:global(.modification) .btn:not(.btn-back) {
		background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
	}

	:global(.modification) .btn:not(.btn-back):hover {
		background: linear-gradient(135deg, #d97706 0%, var(--warning) 100%);
	}

	/* 이모지는 정상 색상으로 표시 */
	.emoji-normal {
		background: none !important;
		background-clip: initial !important;
		-webkit-background-clip: initial !important;
		color: initial !important;
		-webkit-text-fill-color: initial !important;
	}

	@media (max-width: 640px) {
		.progress-guide h4 {
			font-size: var(--text-lg);
		}

		.date-range-display {
			padding: var(--space-3);
			font-size: var(--text-sm);
		}

		.change-arrow {
			margin: var(--space-2) 0;
			height: 40px;
		}

		.arrow-icon {
			font-size: 2rem;
			transform: scaleX(1.15);
		}

		@keyframes bounce {
			0%, 20%, 50%, 80%, 100% {
				transform: scaleX(1.15) translateY(0);
			}
			40% {
				transform: scaleX(1.15) translateY(-2px);
			}
			60% {
				transform: scaleX(1.15) translateY(-1px);
			}
		}
	}
</style>