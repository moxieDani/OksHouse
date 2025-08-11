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
	import FeedbackManager from '$lib/components/FeedbackManager.svelte';
	import { 
		reservationState, 
		stepNavigation, 
		nextStep, 
		prevStep, 
		setGuestInfo,
		resetReservation,
		updateReservationData 
	} from '$lib/stores/reservation.js';
	import { userAPI, formatDateForAPI } from '$lib/services/api.js';

	let calendarComponent;
	let isModificationMode = false;
	let modificationData = null;
	let currentMonth = new Date().getMonth();
	let currentYear = new Date().getFullYear();
	
	// Existing reservations for blocking dates
	let existingReservations = [];
	let isLoadingReservations = false;
	
	// FeedbackManager state
	let showFeedback = false;
	let feedbackType = 'info';
	let feedbackTitle = '';
	let feedbackMessage = '';
	let feedbackCallback = null;

	$: currentStep = $reservationState.currentStep;
	$: duration = $reservationState.duration;
	$: startDate = $reservationState.startDate;
	$: guestInfo = $reservationState.guestInfo;
	
	// Reactive date range display for Step 2
	$: step2DateRangeText = formatStep2DateRange(startDate, duration);
	
	// Load reservations when entering step 2 or when month/year changes
	$: if (currentStep === 2) {
		loadMonthlyReservations(currentYear, currentMonth);
	}
	

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

	function handleNext() {
		if (currentStep === 1) {
			if (!duration) {
				showAlert('숙박 기간을 선택해주세요.', 'warning');
				return;
			}
		} else if (currentStep === 2) {
			if (!startDate) {
				showAlert('체크인 날짜를 선택해주세요.', 'warning');
				return;
			}
		}
		
		nextStep();
	}

	// Load existing reservations for the current month
	async function loadMonthlyReservations(year, month) {
		// Convert JavaScript 0-based month to 1-based month for API
		const apiMonth = month + 1;
		const cacheKey = `${year}-${apiMonth}`;
		
		// Skip if already loading the same month
		if (isLoadingReservations) return;
		
		try {
			isLoadingReservations = true;
			
			const reservations = await userAPI.getMonthlyReservations(year, apiMonth);
			existingReservations = reservations || [];
		} catch (error) {
			existingReservations = [];
		} finally {
			isLoadingReservations = false;
		}
	}

	// Handle calendar month changes to load new data
	function handleMonthChange(event) {
		const { month, year } = event.detail;
		currentMonth = month;
		currentYear = year;
		
		// Force reload reservations for the new month
		if (currentStep === 2) {
			isLoadingReservations = false; // Reset loading state
			loadMonthlyReservations(year, month);
		}
	}

	// Handle blocked date clicks
	function handleBlockedDateClick(event) {
		const { message } = event.detail;
		showAlert(message, 'warning');
	}

	// Handle conflict detection
	function handleConflictDetected(event) {
		const { message } = event.detail;
		showAlert(message, 'warning');
	}

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

			// Show success message for modification
			const endDate = new Date(startDate);
			endDate.setDate(startDate.getDate() + duration);
			
			showSuccess(
				'🎉 예약 변경 완료!',
				`체크인: ${formatKoreanDate(startDate)}<br>체크아웃: ${formatKoreanDate(endDate)}<br>기간: ${duration}박 ${duration + 1}일`,
				() => goto('/')
			);
			return;
		}

		// Original reservation completion logic
		const { name, phone, password } = guestInfo;
		
		if (!name.trim()) {
			showAlert('이름을 입력해주세요.', 'warning');
			return;
		}
		
		if (!phone.trim()) {
			showAlert('전화번호를 입력해주세요.', 'warning');
			return;
		}
		
		if (!password.trim()) {
			showAlert('비밀번호를 입력해주세요.', 'warning');
			return;
		}
		
		if (password.length !== 4 || !/^\d{4}$/.test(password)) {
			showAlert('비밀번호는 4자리 숫자여야 합니다.', 'warning');
			return;
		}

		// Create reservation via API
		try {
			const endDate = new Date(startDate);
			endDate.setDate(startDate.getDate() + duration);
			
			const reservationData = {
				name: name.trim(),
				phone: phone.trim(),
				start_date: formatDateForAPI(startDate),
				end_date: formatDateForAPI(endDate),
				duration: duration,
				guests: 1, // Default to 1 guest
				purpose: null,
				password: password
			};
			
			const response = await userAPI.createReservation(reservationData);
			
			showSuccess(
				'🎉 예약 완료!',
				`예약이 성공적으로 저장되었습니다.<br><br>예약자: ${name}<br>체크인: ${formatKoreanDate(startDate)}<br>체크아웃: ${formatKoreanDate(endDate)}<br>기간: ${duration}박 ${duration + 1}일<br>예약번호: ${response.id}`,
				() => {
					// Clear existing reservations cache to force reload
					existingReservations = [];
					resetReservation();
					goto('/');
				}
			);
		} catch (error) {
			console.error('Reservation creation failed:', error);
			const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
			showAlert(`예약 저장에 실패했습니다: ${errorMessage}`, 'error');
		}
	}

	// 사용자 대면 날짜 포매팅 유틸리티
	function formatKoreanDate(date) {
		if (!date) return '';
		
		// Date 객체 보장 및 유효성 검증
		const dateObj = date instanceof Date ? date : new Date(date);
		if (isNaN(dateObj.getTime())) {
			console.error('Invalid date passed to formatKoreanDate:', date);
			return '';
		}
		
		const year = dateObj.getFullYear();
		const month = dateObj.getMonth() + 1;
		const day = dateObj.getDate();
		const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
		const weekday = weekdays[dateObj.getDay()];
		return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')} (${weekday})`;
	}

	// 날짜 범위 계산 유틸리티 함수
	function calculateDateRange(startDate, duration) {
		if (!startDate || !duration) return null;
		const endDate = new Date(startDate);
		endDate.setDate(startDate.getDate() + duration);
		return { startDate, endDate, duration };
	}

	function formatReservationInfo() {
		const range = calculateDateRange(startDate, duration);
		if (!range) return '날짜를 선택해주세요';
		
		return `<strong>체크인:</strong> ${formatKoreanDate(range.startDate)}<br><strong>체크아웃:</strong> ${formatKoreanDate(range.endDate)}<br><strong>숙박기간:</strong> ${range.duration}박 ${range.duration + 1}일`;
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

<h1 id="page-title" style="margin-top: 10%;">
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
		<div class="progress-guide">
			<h4>🗓️ 2단계: 체크인 날짜 선택</h4>
			<p>달력에서 체크인하는 날짜를 클릭해주세요</p>
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
				bind:currentMonth={currentMonth}
				bind:currentYear={currentYear}
				{existingReservations}
				on:dateSelect={(e) => {
					// Update the store - this will automatically update startDate via reactive statement
					updateReservationData({ startDate: e.detail });
				}}
				on:monthChange={handleMonthChange}
				on:blockedDateClick={handleBlockedDateClick}
				on:conflictDetected={handleConflictDetected}
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
			<div 
				class="date-range-display selected"
				class:modification={isModificationMode}
			>
				<h4>📅 변경된 예약 정보</h4>
				<div class="reservation-info">
					<div class="reservation-details">
						{@html formatReservationInfo()}
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
						placeholder="010-1234-5678"
						bind:value={guestInfo.phone}
						on:input={(e) => {
							// 전화번호 자동 포맷팅
							let value = e.target.value.replace(/[^0-9]/g, '');
							if (value.length > 3 && value.length <= 7) {
								value = value.replace(/(\d{3})(\d+)/, '$1-$2');
							} else if (value.length > 7) {
								value = value.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
							}
							if (value.length > 13) {
								value = value.substring(0, 13);
							}
							e.target.value = value;
							handleGuestInfoChange('phone', value);
						}}
					>
				</div>
				<div class="form-group">
					<label for="password">비밀번호:</label>
					<input 
						type="password" 
						id="password" 
						placeholder="4자리 숫자 비밀번호"
						maxlength="4"
						bind:value={guestInfo.password}
						on:input={(e) => {
							// 숫자만 허용, 4자리 제한
							let value = e.target.value.replace(/[^0-9]/g, '');
							if (value.length > 4) {
								value = value.substring(0, 4);
							}
							e.target.value = value;
							handleGuestInfoChange('password', value);
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
	}
</style>