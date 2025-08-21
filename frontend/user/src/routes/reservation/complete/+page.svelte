<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { checkAuth } from '$lib/stores/auth.js';
	import { formatKoreanDate } from '../../../../../shared/utils/dateUtils.js';

	// 예약 정보 상태
	let reservationData = null;
	let isModification = false;

	onMount(() => {
		// 인증 상태 확인
		if (browser) {
			const authStatus = checkAuth();
			if (!authStatus) {
				goto('/login');
				return;
			}
		}

		// URL에서 예약 정보를 가져옵니다
		const urlParams = new URLSearchParams(window.location.search);
		const dataParam = urlParams.get('data');
		const modParam = urlParams.get('modification');
		
		if (dataParam) {
			try {
				reservationData = JSON.parse(decodeURIComponent(dataParam));
				isModification = modParam === 'true';
			} catch (error) {
				console.error('예약 정보 파싱 오류:', error);
				goto('/');
			}
		} else {
			// 예약 정보가 없으면 홈으로 리다이렉트
			goto('/');
		}
	});

	function handleGoHome() {
		goto('/');
	}

	function handleViewReservations() {
		// 예약자 정보를 세션 스토리지에 저장하고 관리 페이지로 이동
		if (reservationData && !isModification) {
			sessionStorage.setItem('returnToManageStep2', JSON.stringify({
				authName: reservationData.guestName,
				authPhone: reservationData.guestPhone,
				password: reservationData.guestPassword
			}));
		}
		goto('/manage#step2');
	}

	// 예약 정보 포맷팅
	function formatReservationPeriod() {
		if (!reservationData) return '';
		return `${reservationData.duration}박 ${reservationData.duration + 1}일`;
	}
</script>

<svelte:head>
	<title>예약 완료 - Ok's House</title>
</svelte:head>

{#if reservationData}
	<div class="completion-container">
		<div class="success-header">
			<div class="success-icon">🎉</div>
			<h1 class="success-title">
				{isModification ? '예약 변경 완료!' : '예약 완료!'}
			</h1>
			<p class="success-message">
				{isModification 
					? '예약이 성공적으로 변경되었습니다.'
					: '예약이 성공적으로 저장되었습니다.'
				}
			</p>
		</div>

		<!-- 예약 정보 표시 -->
		<div class="date-range-display selected">
			<h4>📅 {isModification ? '변경된' : '예약된'} 정보</h4>
			<div class="reservation-info">
				<div class="reservation-details">
					<div class="detail-row">
						<span class="label">예약자:</span>
						<span class="value">{reservationData.guestName}</span>
					</div>
					<div class="detail-row">
						<span class="label">연락처:</span>
						<span class="value">{reservationData.guestPhone}</span>
					</div>
					<div class="detail-row">
						<span class="label">체크인:</span>
						<span class="value">{formatKoreanDate(new Date(reservationData.startDate))}</span>
					</div>
					<div class="detail-row">
						<span class="label">체크아웃:</span>
						<span class="value">{formatKoreanDate(new Date(reservationData.endDate))}</span>
					</div>
					<div class="detail-row">
						<span class="label">숙박기간:</span>
						<span class="value">{formatReservationPeriod()}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 액션 버튼들 -->
		<div class="action-buttons">
			<button class="btn btn-secondary" on:click={handleGoHome}>
				🏠 처음으로
			</button>
			<button class="btn btn-primary" on:click={handleViewReservations}>
				📊 나의 모든 예약보기
			</button>
		</div>
	</div>
{:else}
	<div class="loading-container">
		<div class="loading-spinner"></div>
		<p>예약 정보를 불러오는 중...</p>
	</div>
{/if}

<style>
	:global(body) {
		background: linear-gradient(135deg, var(--neutral-50) 0%, var(--neutral-100) 100%);
	}

	.completion-container {
		max-width: 500px;
		margin: 0 auto;
		padding: var(--space-6);
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		animation: fadeIn 0.6s ease-in-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.success-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.success-icon {
		font-size: 4rem;
		margin-bottom: var(--space-4);
		animation: bounce 1s ease-in-out;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-10px);
		}
		60% {
			transform: translateY(-5px);
		}
	}

	.success-title {
		font-size: var(--text-3xl);
		font-weight: 700;
		color: var(--success);
		margin-bottom: var(--space-2);
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		-webkit-text-fill-color: transparent;
	}

	.success-message {
		font-size: var(--text-lg);
		color: var(--neutral-600);
		margin: 0;
	}

	.date-range-display {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
		border: 2px solid var(--success);
		border-radius: var(--radius-xl);
		padding: var(--space-6);
		text-align: center;
		margin-bottom: var(--space-8);
		box-shadow: 0 10px 25px rgba(16, 185, 129, 0.1);
	}

	.date-range-display h4 {
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--success);
		margin-bottom: var(--space-4);
	}

	.reservation-info {
		background: white;
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		border-left: 4px solid var(--success);
	}

	.reservation-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--neutral-100);
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 600;
		color: var(--neutral-600);
		font-size: var(--text-base);
	}

	.value {
		font-weight: 500;
		color: var(--neutral-800);
		text-align: right;
		font-size: var(--text-base);
	}

	.action-buttons {
		display: flex;
		gap: var(--space-4);
		margin-bottom: var(--space-8);
	}

	.btn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4) var(--space-6);
		border: none;
		border-radius: var(--radius-lg);
		font-weight: 600;
		font-size: var(--text-base);
		cursor: pointer;
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		text-decoration: none;
		font-family: inherit;
		min-height: 50px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
	}

	.btn-primary:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.btn-secondary {
		background: var(--neutral-200);
		color: var(--neutral-700);
	}

	.btn-secondary:hover {
		background: var(--neutral-300);
		color: var(--neutral-800);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		color: var(--neutral-600);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--neutral-200);
		border-top-color: var(--success);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: var(--space-4);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 640px) {
		.completion-container {
			padding: var(--space-4);
		}

		.success-icon {
			font-size: 3rem;
		}

		.success-title {
			font-size: var(--text-2xl);
		}

		.action-buttons {
			flex-direction: column;
		}

		.date-range-display {
			padding: var(--space-4);
		}

		.reservation-info {
			padding: var(--space-4);
		}
	}
</style>