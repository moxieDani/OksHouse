<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	
	// SvelteKit automatically provides these props - declare them to avoid warnings
	export let data = {};
	export let params = {};
	
	import Calendar from '$lib/components/Calendar.svelte';
	import FeedbackManager from '../../../../shared/components/FeedbackManager.svelte';
	import { userAPI } from '$lib/services/api.js';
	import { MANAGE_STEPS, DEFAULT_MESSAGES, PLACEHOLDERS } from '$lib/constants/reservationConstants.js';
	import { formatKoreanDate } from '../../../../shared/utils/dateUtils.js';
	import { formatPhoneNumber, formatPassword, VALIDATION_CONSTANTS } from '$lib/utils/validationUtils.js';
	import { handleError, safeAsync } from '../../../../shared/utils/errorUtils.js';

	// === 페이지 상태 관리 ===
	/** @type {number} 현재 단계 (1: 인증, 2: 예약 목록) */
	let currentStep = 1;
	
	// === 사용자 인증 정보 ===
	/** @type {string} 사용자 이름 */
	let authName = '';
	/** @type {string} 사용자 전화번호 */
	let authPhone = '';
	/** @type {string} 사용자 비밀번호 */
	let password = '';
	
	// === 예약 관련 데이터 ===
	/** @type {Array<Object>} 사용자의 예약 목록 */
	let reservations = [];
	/** @type {Object|null} 선택된 예약 */
	let selectedReservation = null;
	/** @type {any} 달력 컴포넌트 참조 */
	let calendar;
	/** @type {number} 달력 현재 월 (0-11) */
	let calendarCurrentMonth = new Date().getMonth();
	/** @type {number} 달력 현재 년도 */
	let calendarCurrentYear = new Date().getFullYear();
	/** @type {boolean} 예약 정보 로딩 중 여부 */
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


	onMount(() => {
		// Check URL hash for direct navigation
		if (browser && window.location.hash === '#step2') {
			// Check if returning from modification page
			const returnData = sessionStorage.getItem('returnToManageStep2');
			if (returnData) {
				try {
					const authData = JSON.parse(returnData);
					authName = authData.authName;
					authPhone = authData.authPhone;
					password = authData.password;
					sessionStorage.removeItem('returnToManageStep2');
				} catch (e) {
					console.error('Error parsing return auth data:', e);
					// Fallback to demo data
					authName = '홍길동';
					authPhone = '010-1234-5678';
					password = '1234';
				}
			} else {
				// Auto-fill demo data for direct navigation
				authName = '홍길동';
				authPhone = '010-1234-5678';
				password = '1234';
			}
			currentStep = 2;
			loadUserReservations();
		}
	});

	async function handleNext() {
		if (currentStep === 1) {
			if (!validateAuthInfo()) return;
			
			try {
				// 로딩 상태 표시 - 1단계 확인 버튼만 대상
				const confirmButton = currentStep === 1 ? document.querySelector('#step1-confirm-button') : null;
				if (confirmButton) {
					confirmButton.textContent = '확인 중...';
					confirmButton.disabled = true;
				}

				// Call API to verify user authentication
				const authData = {
					name: authName.trim(),
					phone: authPhone.trim(),
					password: password.trim()
				};

				const response = await userAPI.verifyReservation(authData);
				
				if (response.verified && response.reservation_id) {
					// 인증 성공 - 다음 단계로 이동
					currentStep = 2;
					await loadUserReservations();
				} else {
					// 인증 실패
					showAlert(DEFAULT_MESSAGES.AUTH_FAILED, 'warning');
				}

			} catch (error) {
				handleError(error, '사용자 인증', showAlert);
			} finally {
				// 버튼 상태 복원 - 1단계 확인 버튼만 대상
				const confirmButton = currentStep === 1 ? document.querySelector('#step1-confirm-button') : null;
				if (confirmButton) {
					confirmButton.textContent = '확인';
					confirmButton.disabled = false;
				}
			}
		}
	}

	function handlePrev() {
		if (currentStep === 1) {
			goto('/');
		} else {
			currentStep = currentStep - 1;
			if (currentStep === 1) {
				selectedReservation = null;
				reservations = [];
			}
		}
	}

	function validateAuthInfo() {
		if (!authName.trim()) {
			showAlert('이름을 입력해주세요.', 'warning');
			return false;
		}
		if (!authPhone.trim()) {
			showAlert('전화번호를 입력해주세요.', 'warning');
			return false;
		}
		if (!password.trim()) {
			showAlert('비밀번호를 입력해주세요.', 'warning');
			return false;
		}
		if (password.length !== VALIDATION_CONSTANTS.PASSWORD_LENGTH || !/^\d{4}$/.test(password)) {
			showAlert('비밀밀번호는 4자리 숫자여야 합니다.', 'warning');
			return false;
		}
		return true;
	}


	function getReservationStatusType(reservation) {
		// pending: 예약대기, confirmed: 예약확정, denied: 예약거부
		return reservation.status || 'pending'; // 기본값은 pending
	}

	function getReservationStatusText(reservation) {
		// 3가지 상태만 처리
		if (reservation.status === 'pending') return '예약대기';
		if (reservation.status === 'denied') return '예약거부';
		if (reservation.status === 'confirmed') return '예약확정';
		return '예약대기'; // default
	}

	async function loadUserReservations() {
		try {
			// Fetch all reservations for the authenticated user
			const userReservations = await userAPI.getUserReservations(authName.trim(), authPhone.trim());
			
			// Convert API date strings to Date objects ensuring local timezone
			reservations = userReservations.map(reservation => {
				// Parse dates as local timezone to avoid UTC conversion issues
				const startParts = reservation.start_date.split('-');
				const endParts = reservation.end_date.split('-');
				
				return {
					...reservation,
					startDate: new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2])),
					endDate: new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]))
				};
			});
			
			// Auto-select the first reservation if available
			if (reservations.length > 0) {
				setTimeout(() => selectReservation(reservations[0].id, true), 300);
			}
		} catch (error) {
			handleError(error, '예약 목록 로드', showAlert);
			reservations = [];
		}
	}

	/**
	 * 수동 새로고침 - 사용자가 버튼을 클릭할 때
	 */
	async function handleRefresh() {
		if (isRefreshing || isLoadingReservations) return; // 이미 로딩 중이면 중단
		
		isRefreshing = true;
		try {
			// 선택된 예약 초기화 (새로고침시 깨끗한 상태로 시작)
			selectedReservation = null;
			
			// 현재 사용자의 예약 정보를 새로고침
			await loadUserReservations();
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

	function selectReservation(reservationId, fromMonthChange = false) {
		selectedReservation = reservations.find(res => res.id === reservationId);
		
		if (selectedReservation && calendar && !fromMonthChange) {
			// 예약 카드 클릭 시에는 항상 해당 날짜로 이동
			calendar.navigateToDate(selectedReservation.startDate);
			// 달력 상태도 동기화
			calendarCurrentMonth = selectedReservation.startDate.getMonth();
			calendarCurrentYear = selectedReservation.startDate.getFullYear();
		}
	}

	/**
	 * 특정 월의 예약 내역을 필터링하여 반환
	 * @param {Array<Object>} reservations - 전체 예약 목록
	 * @param {number} year - 년도
	 * @param {number} month - 월 (0-11)
	 * @returns {Array<Object>} 해당 월의 예약 내역
	 */
	function getReservationsForMonth(reservations, year, month) {
		if (!reservations || reservations.length === 0) return [];
		
		return reservations.filter(reservation => {
			const startDate = reservation.startDate;
			const endDate = reservation.endDate;
			
			// 예약 시작날이나 끝나는 날이 해당 월에 포함되면 표시
			const monthStart = new Date(year, month, 1);
			const monthEnd = new Date(year, month + 1, 0);
			
			return (startDate <= monthEnd && endDate >= monthStart);
		});
	}

	/**
	 * 달력 월 변경 시 호출되는 핸들러
	 * @param {CustomEvent} event - month: 변경된 월(0-11), year: 변경된 년도
	 */
	function handleMonthChange(event) {
		const { month, year } = event.detail;
		
		// 달력 상태 업데이트
		calendarCurrentMonth = month;
		calendarCurrentYear = year;
		
		// 해당 월의 예약 내역을 가져와서 첫 번째 예약을 자동 선택
		const monthReservations = getReservationsForMonth(reservations, year, month);
		
		if (monthReservations.length > 0) {
			// 해당 월에 예약이 있으면 첫 번째 예약을 선택 (달력 이동하지 않음)
			selectReservation(monthReservations[0].id, true);
		} else {
			// 해당 월에 예약이 없으면 선택된 예약 해제
			selectedReservation = null;
		}
	}

	function startReservationModification() {
		if (!selectedReservation) {
			showAlert('변경할 예약을 선택해주세요.', 'warning');
			return;
		}

		const modificationData = {
			isModification: true,
			originalReservation: selectedReservation,
			userInfo: {
				name: authName,
				phone: authPhone,
				password: password
			}
		};

		if (browser) {
			sessionStorage.setItem('modificationData', JSON.stringify(modificationData));
		}
		goto('/reservation');
	}

	async function cancelSelectedReservation() {
		if (!selectedReservation) {
			showAlert('취소할 예약을 선택해주세요.', 'warning');
			return;
		}

		const endDate = selectedReservation.endDate || new Date(selectedReservation.startDate.getTime() + selectedReservation.duration * 24 * 60 * 60 * 1000);

		showConfirm(
			'이 예약을 취소하시겠습니까?',
			`예약자: ${selectedReservation.name}<br>체크인: ${formatKoreanDate(selectedReservation.startDate)}<br>체크아웃: ${formatKoreanDate(endDate)}<br>기간: ${selectedReservation.duration}박 ${selectedReservation.duration + 1}일`,
			async () => {
				try {
					// Call API to delete the reservation
					await userAPI.deleteReservation(
						selectedReservation.id,
						authName.trim(),
						authPhone.trim(),
						password.trim()
					);

					// Show success message and reload reservations
					showSuccess(
						DEFAULT_MESSAGES.CANCELLATION_SUCCESS,
						`${selectedReservation.name}님의 예약이 성공적으로 취소되었습니다.`,
						async () => {
							// Clear selection and reload reservations
							selectedReservation = null;
							await loadUserReservations();
						}
					);
				} catch (error) {
					handleError(error, '예약 취소', showAlert);
				}
			}
		);
	}

	// 날짜 포매팅 유틸리티 (유틸리티 함수 사용)

	// Calculate duration in days between start and end dates for calendar highlighting
	function calculateDurationInDays(startDate, endDate) {
		if (!startDate || !endDate) return 0;
		const timeDiff = endDate.getTime() - startDate.getTime();
		return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
	}

	// === 성능 최적화된 예약 카드 데이터 처리 ===
	
	/**
	 * 예약 카드 데이터 생성 (메모이제이션 적용)
	 * @param {Object} reservation - 예약 객체
	 * @returns {Object} 포맷팅된 예약 카드 데이터
	 */
	function createReservationCard(reservation) {
		// API에서 이미 endDate를 제공하므로 계산하지 않음
		const endDate = reservation.endDate || new Date(reservation.startDate.getTime() + reservation.duration * 24 * 60 * 60 * 1000);
		
		return {
			...reservation,
			endDate,
			formattedStartDate: formatKoreanDate(reservation.startDate),
			formattedEndDate: formatKoreanDate(endDate)
		};
	}

	// 예약 목록 포맷팅 - 직접적인 reactive statement로 즉시 업데이트
	$: formattedReservations = reservations.map(createReservationCard);

	// === 피드백 매니저 헬퍼 함수 ===
	
	/**
	 * 경고 메시지 표시
	 * @param {string} message - 표시할 메시지
	 * @param {string} type - 메시지 타입 ('warning', 'error', 'info')
	 */
	function showAlert(message, type = 'warning') {
		feedbackType = type;
		feedbackTitle = type === 'warning' ? '주의' : '알림';
		feedbackMessage = message;
		feedbackCallback = null;
		showFeedback = true;
	}

	/**
	 * 성공 메시지 표시
	 * @param {string} title - 메시지 제목
	 * @param {string} message - 메시지 내용
	 * @param {Function|null} onClose - 닫기 콜백 함수
	 */
	function showSuccess(title, message, onClose = null) {
		feedbackType = 'success';
		feedbackTitle = title;
		feedbackMessage = message;
		feedbackCallback = onClose;
		showFeedback = true;
	}

	/**
	 * 확인 대화상자 표시
	 * @param {string} title - 대화상자 제목
	 * @param {string} message - 대화상자 내용
	 * @param {Function} onConfirm - 확인 콜백 함수
	 * @param {Function|null} onCancel - 취소 콜백 함수
	 */
	function showConfirm(title, message, onConfirm, onCancel = null) {
		feedbackType = 'confirm';
		feedbackTitle = title;
		feedbackMessage = message;
		
		// Store callbacks for confirm dialog
		confirmCallback = onConfirm;
		cancelCallback = onCancel;
		
		showFeedback = true;
	}

	// === 확인 대화상자 콜백 관리 ===
	/** @type {Function|null} 확인 콜백 함수 */
	let confirmCallback = null;
	/** @type {Function|null} 취소 콜백 함수 */
	let cancelCallback = null;

	/**
	 * 확인 버튼 클릭 처리
	 */
	function handleConfirm() {
		showFeedback = false;
		if (confirmCallback) confirmCallback();
	}

	/**
	 * 취소 버튼 클릭 처리
	 */
	function handleCancel() {
		showFeedback = false;
		if (cancelCallback) cancelCallback();
	}
</script>

<svelte:head>
	<title>예약 확인·변경 - Ok's House</title>
</svelte:head>

<h1 style="margin-top: 55px;"><span class="emoji-normal">⚙️</span> 예약 확인·변경하기</h1>

<!-- Step 1: 예약자 정보 입력 -->
{#if currentStep === 1}
	<div class="step">
		<h3><span class="emoji-normal">🔑</span> 예약자 인증</h3>
		<p class="step-description">
			예약에 사용하신 정보를 입력해주세요.<br>
			비밀번호는 4자리 숫자입니다.
		</p>
		<div class="form-group">
			<label for="auth-name">이름:</label>
			<input type="text" id="auth-name" placeholder="예약자 이름을 입력하세요" bind:value={authName}>
		</div>
		<div class="form-group">
			<label for="auth-phone">전화번호:</label>
			<input 
				type="tel" 
				id="auth-phone" 
				placeholder={PLACEHOLDERS.PHONE} 
				bind:value={authPhone}
				on:input={(e) => {
					// 전화번호 자동 포매팅 (유틸리티 함수 사용)
					const formattedValue = formatPhoneNumber(e.target.value);
					authPhone = formattedValue;
					e.target.value = formattedValue;
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
				bind:value={password}
				on:input={(e) => {
					// 비밀번호 포매팅 (유틸리티 함수 사용)
					const formattedValue = formatPassword(e.target.value);
					password = formattedValue;
					e.target.value = formattedValue;
				}}
			>
		</div>
		<div class="button-container">
			<button class="btn btn-back" on:click={handlePrev}>이전</button>
			<button id="step1-confirm-button" class="btn" on:click={handleNext}>확인</button>
		</div>
	</div>
{/if}

<!-- Step 2: 예약 목록 확인 -->
{#if currentStep === 2}
	<div class="step">
		<div class="step-header">
			<div class="title-section">
				<h3><span class="emoji-normal">📊</span> 예약 현황 확인</h3>
				<p class="step-description">
					<strong>{authName}</strong>님의 예약 현황입니다.
				</p>
			</div>
			
		</div>
		
		<!-- 달력 보기 -->
		<div class="calendar-view">
			<Calendar 
				bind:this={calendar}
				readOnly={true}
				selectedDate={selectedReservation?.startDate}
				duration={selectedReservation ? calculateDurationInDays(selectedReservation.startDate, selectedReservation.endDate) : 0}
				selectedReservation={selectedReservation}
				currentMonth={calendarCurrentMonth}
				currentYear={calendarCurrentYear}
				{isRefreshing}
				onRefresh={handleRefresh}
				on:monthChange={handleMonthChange}
			/>
		</div>
		
		<!-- 예약 목록 -->
		<div class="reservations-section">
			<h4><span class="emoji-normal">📈</span> 내 예약 목록</h4>
			<div class="reservations-list">
				{#if formattedReservations.length === 0}
					<div class="no-reservations">
						<p>현재 변경 가능한 예약이 없습니다.</p>
						<div class="info-box">
							<p>ℹ️ <strong>안내:</strong> 이미 종료된 예약이나 현재 이용 중인 예약은 변경할 수 없어 목록에 표시되지 않습니다.</p>
						</div>
					</div>
				{:else}
					{#each formattedReservations as reservation (reservation.id)}
						<div 
							class="reservation-card" 
							class:selected={selectedReservation?.id === reservation.id}
							on:click={() => selectReservation(reservation.id)}
							role="button"
							tabindex="0"
							on:keydown={(e) => e.key === 'Enter' && selectReservation(reservation.id)}
						>
							<div class="reservation-header">
								<span class="reservation-date">
									{reservation.formattedStartDate} ~ {reservation.formattedEndDate}
								</span>
								<div class="reservation-badges">
									<span class="reservation-duration">
										{reservation.duration}박 {reservation.duration + 1}일
									</span>
									<span class="reservation-status reservation-status-{getReservationStatusType(reservation)}">
										{getReservationStatusText(reservation)}
									</span>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
		
		<div class="button-container step2-buttons">
			<button class="btn btn-back compact-btn" on:click={handlePrev}>이전</button>
			<button 
				class="btn compact-btn" 
				disabled={!selectedReservation}
				on:click={startReservationModification}
			>
				예약 변경
			</button>
			<button 
				class="btn compact-btn cancel-btn" 
				disabled={!selectedReservation}
				on:click={cancelSelectedReservation}
			>
				예약 취소
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
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>

<style>
	.step {
		animation: fadeIn 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Step 헤더 - 제목과 새로고침 버튼 */
	.step-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-6);
		gap: var(--space-4);
	}

	.title-section {
		flex: 1;
	}

	.title-section .step-description {
		margin-bottom: 0;
	}

	/* 모바일 반응형 */
	@media (max-width: 768px) {
		.step-header {
			flex-direction: column;
			gap: var(--space-3);
			align-items: center;
		}

		.title-section {
			text-align: center;
		}
	}

	.step h3 {
		font-size: var(--text-xl);
		color: var(--warning);
		margin-bottom: var(--space-4);
		text-align: center;
	}

	.step-description {
		text-align: center;
		color: var(--neutral-600);
		margin-bottom: var(--space-6);
		line-height: 1.6;
	}

	.calendar-view {
		margin-bottom: var(--space-6);
	}

	.reservations-section {
		margin-bottom: var(--space-6);
	}

	.reservations-section h4 {
		font-size: var(--text-lg);
		color: var(--neutral-700);
		margin-bottom: var(--space-4);
		text-align: center;
	}

	.reservations-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.no-reservations {
		text-align: center;
		padding: var(--space-8);
	}

	.no-reservations p {
		font-size: var(--text-lg);
		color: var(--neutral-600);
		margin-bottom: var(--space-4);
	}

	.info-box {
		background: rgba(245, 158, 11, 0.1);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.info-box p {
		font-size: var(--text-base);
		color: var(--neutral-600);
		margin: 0;
		line-height: 1.6;
	}

	.reservation-card {
		background: white;
		border: 2px solid var(--neutral-200);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		cursor: pointer;
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		box-shadow: var(--shadow-sm);
	}

	.reservation-card:hover {
		border-color: var(--warning);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.reservation-card.selected {
		border-color: var(--warning);
		background: rgba(245, 158, 11, 0.05);
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	.reservation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.reservation-date {
		font-weight: 600;
		color: var(--neutral-800);
		font-size: var(--text-sm);
	}

	.reservation-badges {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		flex-wrap: wrap;
	}

	.reservation-duration {
		background: var(--warning);
		color: white;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.reservation-status {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 500;
		color: white;
		white-space: nowrap;
	}

	/* 3가지 예약 상태만 지원 */
	.reservation-status-pending {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	}

	.reservation-status-confirmed {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
	}

	.reservation-status-denied {
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
	}

	.step2-buttons {
		display: flex;
		gap: var(--space-2);
		justify-content: center;
		flex-wrap: wrap;
	}

	.compact-btn {
		flex: 1;
		min-width: 120px;
		max-width: 150px;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
	}

	.cancel-btn {
		background: linear-gradient(135deg, var(--error) 0%, #b91c1c 100%);
	}

	.cancel-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #b91c1c 0%, var(--error) 100%);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Management theme - orange colors */
	h1 {
		background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		color: transparent !important;
		-webkit-text-fill-color: transparent !important;
	}

	/* 이모지는 정상 색상으로 표시 */
	h1 .emoji-normal {
		background: none !important;
		background-clip: initial !important;
		-webkit-background-clip: initial !important;
		color: initial !important;
		-webkit-text-fill-color: initial !important;
	}

	.step h3 {
		background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		color: transparent !important;
		-webkit-text-fill-color: transparent !important;
	}

	/* 이모지는 정상 색상으로 표시 */
	.emoji-normal {
		background: none !important;
		background-clip: initial !important;
		-webkit-background-clip: initial !important;
		color: initial !important;
		-webkit-text-fill-color: initial !important;
	}

	.btn:not(.btn-back):not(.cancel-btn) {
		background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
	}

	.btn:not(.btn-back):not(.cancel-btn):hover:not(:disabled) {
		background: linear-gradient(135deg, #d97706 0%, var(--warning) 100%);
	}

	@media (max-width: 640px) {
		.reservation-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.reservation-badges {
			justify-content: flex-start;
			width: 100%;
		}

		.step2-buttons {
			flex-direction: column;
		}

		.compact-btn {
			max-width: none;
		}
	}
</style>