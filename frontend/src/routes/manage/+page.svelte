<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	
	// SvelteKit automatically provides these props - declare them to avoid warnings
	export let data = {};
	export let params = {};
	
	import StepIndicator from '$lib/components/StepIndicator.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import FeedbackManager from '$lib/components/FeedbackManager.svelte';
	import { userAPI } from '$lib/services/api.js';

	let currentStep = 1;
	let authName = '';
	let authPhone = '';
	let password = '';
	let reservations = [];
	let selectedReservation = null;
	let calendar;
	let authenticatedReservationId = null; // Store the authenticated reservation ID

	// FeedbackManager state
	let showFeedback = false;
	let feedbackType = 'info';
	let feedbackTitle = '';
	let feedbackMessage = '';
	let feedbackCallback = null;

	// Mock reservation data - 실제로는 서버에서 가져올 데이터
	const mockReservations = [
		{
			id: 1,
			name: '홍길동',
			phone: '010-1234-5678',
			startDate: new Date(2025, 7, 10), // 8월 10일
			duration: 2,
			status: 'confirmed' // pending(예약신청), confirmed(예약확정), denied(예약거부) 중 하나
		},
		{
			id: 2,
			name: '홍길동',
			phone: '010-1234-5678',
			startDate: new Date(2025, 8, 15), // 9월 15일
			duration: 3,
			status: 'pending' // 예약신청 상태
		},
		{
			id: 3,
			name: '홍길동',
			phone: '010-1234-5678',
			startDate: new Date(2025, 9, 20), // 10월 20일
			duration: 1,
			status: 'denied' // 예약거부 상태
		},
		{
			id: 4,
			name: '홍길동',
			phone: '010-1234-5678',
			startDate: new Date(2025, 10, 5), // 11월 5일
			duration: 2,
			status: 'pending' // 예약신청 상태
		}
	];

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
				// Show loading state - only target step 1 confirm button
				const originalButtonText = '확인';
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
					// Authentication successful, store the authenticated reservation ID
					authenticatedReservationId = response.reservation_id;
					currentStep = 2;
					await loadUserReservations();
				} else {
					// Authentication failed
					showAlert('입력하신 정보와 일치하는 예약을 찾을 수 없습니다. 이름, 전화번호, 비밀번호를 다시 확인해주세요.', 'warning');
				}

			} catch (error) {
				console.error('Authentication failed:', error);
				const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
				showAlert(`인증 중 오류가 발생했습니다: ${errorMessage}`, 'error');
			} finally {
				// Restore button state - only target step 1 confirm button
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
		if (password.length !== 4 || !/^\d{4}$/.test(password)) {
			showAlert('비밀번호는 4자리 숫자여야 합니다.', 'warning');
			return false;
		}
		return true;
	}

	function findUserReservations() {
		const allUserReservations = mockReservations.filter(res => 
			res.name === authName && res.phone === authPhone
		);
		
		// 모든 예약을 표시 (pending, confirmed, denied)
		return allUserReservations;
	}

	// 예약 상태는 pending, confirmed, denied 3가지만 사용
	function getReservationStatus(reservation) {
		return reservation.status || 'pending';
	}

	function getReservationStatusType(reservation) {
		// pending: 예약신청, confirmed: 예약확정, denied: 예약거부
		return reservation.status || 'pending'; // 기본값은 pending
	}

	function getReservationStatusText(reservation) {
		// 3가지 상태만 처리
		if (reservation.status === 'pending') return '예약신청';
		if (reservation.status === 'denied') return '예약거부';
		if (reservation.status === 'confirmed') return '예약확정';
		return '예약신청'; // default
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
				setTimeout(() => selectReservation(reservations[0].id), 300);
			}
		} catch (error) {
			console.error('Failed to load user reservations:', error);
			showAlert('예약 목록을 불러오는 중 오류가 발생했습니다.', 'error');
			reservations = [];
		}
	}

	function selectReservation(reservationId) {
		selectedReservation = reservations.find(res => res.id === reservationId);
		
		if (selectedReservation && calendar) {
			calendar.navigateToDate(selectedReservation.startDate);
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
						'👌🏻 예약 취소 완료!',
						`${selectedReservation.name}님의 예약이 성공적으로 취소되었습니다.`,
						async () => {
							// Clear selection and reload reservations
							selectedReservation = null;
							await loadUserReservations();
						}
					);
				} catch (error) {
					console.error('Failed to delete reservation:', error);
					const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
					showAlert(`예약 취소 중 오류가 발생했습니다: ${errorMessage}`, 'error');
				}
			}
		);
	}

	// 날짜 포매팅 유틸리티 - 일관된 포매팅을 위해 통합
	function formatKoreanDate(date) {
		if (!date) return '';
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
		const weekday = weekdays[date.getDay()];
		return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')} (${weekday})`;
	}

	// Calculate duration in days between start and end dates for calendar highlighting
	function calculateDurationInDays(startDate, endDate) {
		if (!startDate || !endDate) return 0;
		const timeDiff = endDate.getTime() - startDate.getTime();
		return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
	}

	// 예약 카드 데이터 처리 - 성능 최적화
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

	$: formattedReservations = reservations.map(createReservationCard);

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

	function showConfirm(title, message, onConfirm, onCancel = null) {
		feedbackType = 'confirm';
		feedbackTitle = title;
		feedbackMessage = message;
		
		// Store callbacks for confirm dialog
		confirmCallback = onConfirm;
		cancelCallback = onCancel;
		
		showFeedback = true;
	}

	let confirmCallback = null;
	let cancelCallback = null;

	function handleConfirm() {
		showFeedback = false;
		if (confirmCallback) confirmCallback();
	}

	function handleCancel() {
		showFeedback = false;
		if (cancelCallback) cancelCallback();
	}
</script>

<svelte:head>
	<title>예약 확인·변경 - Ok's House</title>
</svelte:head>

<h1 style="margin-top: 10%;"><span class="emoji-normal">⚙️</span> 예약 확인·변경하기</h1>

<!-- Step 1: 예약자 정보 입력 -->
{#if currentStep === 1}
	<div class="step">
		<h3><span class="emoji-normal">🔑</span> 1단계: 예약자 인증</h3>
		<p class="step-description">
			예약 시 입력하신 정보를 동일하게 입력해주세요. 비밀번호는 예약 시 설정하신 4자리 숫자입니다.
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
				placeholder="010-1234-5678" 
				bind:value={authPhone}
				on:input={(e) => {
					let value = e.target.value.replace(/[^0-9]/g, '');
					if (value.length > 3 && value.length <= 7) {
						value = value.replace(/(\d{3})(\d+)/, '$1-$2');
					} else if (value.length > 7) {
						value = value.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
					}
					if (value.length > 13) {
						value = value.substring(0, 13);
					}
					authPhone = value;
					e.target.value = value;
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
				bind:value={password}
				on:input={(e) => {
					let value = e.target.value.replace(/[^0-9]/g, '');
					if (value.length > 4) {
						value = value.substring(0, 4);
					}
					password = value;
					e.target.value = value;
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
		<h3><span class="emoji-normal">📊</span> 2단계: 예약 현황 확인</h3>
		<p class="step-description">
			<strong>{authName}</strong>님의 예약을 확인하실 수 있습니다.
		</p>
		
		<!-- 달력 보기 -->
		<div class="calendar-view">
			<Calendar 
				bind:this={calendar}
				readOnly={true}
				selectedDate={selectedReservation?.startDate}
				duration={selectedReservation ? calculateDurationInDays(selectedReservation.startDate, selectedReservation.endDate) : 0}
				selectedReservation={selectedReservation}
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
							<div class="reservation-details">
								<span>예약자: {reservation.name}</span>
								<span>연락처: {reservation.phone}</span>
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
		font-size: var(--text-base);
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

	.reservation-details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--text-sm);
		color: var(--neutral-600);
		flex-wrap: wrap;
		gap: var(--space-2);
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

		.reservation-details {
			flex-direction: column;
			align-items: flex-start;
		}

		.step2-buttons {
			flex-direction: column;
		}

		.compact-btn {
			max-width: none;
		}
	}
</style>