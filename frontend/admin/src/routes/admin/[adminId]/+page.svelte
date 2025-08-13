<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import AdminCalendar from '$lib/components/AdminCalendar.svelte';
	import FeedbackManager from '../../../../../shared/components/FeedbackManager.svelte';
	import { adminAPI } from '$lib/services/api.js';
	import { formatDateForAPI } from '../../../../../shared/services/apiBase.js';
	import { formatKoreanDate } from '../../../../../shared/utils/dateUtils.js';
	import { showErrorFeedback, showSuccessFeedback } from '../../../../../shared/utils/errorUtils.js';

	// 관리자 정보 설정
	const administrators = {
		'choi-bunok': { name: '최분옥', emoji: '👩‍💼' },
		'choi-changhwan': { name: '최창환', emoji: '👨‍💻' },
		'park-seoeun': { name: '박서은', emoji: '👩‍💻' },
		'park-jiyoung': { name: '박지영', emoji: '👩‍🏫' },
		'park-taehyun': { name: '박태현', emoji: '👨‍💼' }
	};

	// 현재 관리자 정보
	$: adminId = $page.params.adminId;
	$: currentAdmin = administrators[adminId];

	// 달력 상태
	let currentMonth = new Date().getMonth();
	let currentYear = new Date().getFullYear();
	let existingReservations = [];
	let isLoading = false;

	// 예약 상세 모달 상태
	let showReservationModal = false;
	let selectedReservations = [];
	let selectedDate = null;

	// 피드백 관리자 상태
	let feedbackManager = {
		show: false,
		type: 'info',
		title: '',
		message: ''
	};

	/**
	 * 컴포넌트 마운트 시 초기 데이터 로드
	 */
	onMount(() => {
		loadMonthlyReservations();
	});

	/**
	 * 월별 예약 데이터 로드
	 */
	async function loadMonthlyReservations() {
		if (isLoading) return;
		
		isLoading = true;
		try {
			const reservations = await adminAPI.getMonthlyReservations(currentYear, currentMonth + 1);
			
			// 예약 데이터를 Date 객체로 변환
			existingReservations = reservations.map(reservation => ({
				...reservation,
				startDate: new Date(reservation.start_date + 'T00:00:00'),
				endDate: new Date(reservation.end_date + 'T00:00:00')
			}));

			console.log(`${currentYear}년 ${currentMonth + 1}월 예약 로드 완료:`, existingReservations.length, '건');
			
		} catch (error) {
			console.error('월별 예약 로드 실패:', error);
			showErrorFeedback(
				feedbackManager,
				'데이터 로드 오류',
				'예약 정보를 불러오는 중 오류가 발생했습니다.'
			);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 달 변경 이벤트 처리
	 */
	function handleMonthChange(event) {
		currentMonth = event.detail.month;
		currentYear = event.detail.year;
		loadMonthlyReservations();
	}

	/**
	 * 예약이 있는 날짜 클릭 이벤트 처리
	 */
	function handleReservationDateClick(event) {
		const { date, reservations } = event.detail;
		selectedDate = date;
		selectedReservations = reservations;
		showReservationModal = true;
	}

	/**
	 * 예약 상세 모달 닫기
	 */
	function closeReservationModal() {
		showReservationModal = false;
		selectedReservations = [];
		selectedDate = null;
	}

	/**
	 * 예약 기간 포맷팅
	 */
	function formatReservationPeriod(reservation) {
		const startStr = formatKoreanDate(reservation.startDate);
		const endStr = formatKoreanDate(reservation.endDate);
		return `${startStr} ~ ${endStr} (${reservation.duration}박)`;
	}

	/**
	 * 예약 상태 한글 변환
	 */
	function getReservationStatusText(status) {
		const statusMap = {
			'pending': '예약 대기',
			'confirmed': '예약 확정',
			'cancelled': '예약 취소',
			'completed': '이용 완료'
		};
		return statusMap[status] || status;
	}

	/**
	 * 예약 상태별 색상 클래스
	 */
	function getStatusColor(status) {
		const colorMap = {
			'pending': 'status-pending',
			'confirmed': 'status-confirmed',
			'cancelled': 'status-cancelled',
			'completed': 'status-completed'
		};
		return colorMap[status] || 'status-default';
	}
</script>

<svelte:head>
	<title>{currentAdmin?.name} 관리자 - Ok's House 관리 시스템</title>
</svelte:head>

<div class="admin-dashboard">
	<!-- 헤더 -->
	<header class="dashboard-header">
		<div class="header-content">
			<a href="/" class="home-button">
				🏠 홈
			</a>
			<div class="admin-info">
				<span class="admin-emoji">{currentAdmin?.emoji}</span>
				<h1 class="admin-name">{currentAdmin?.name}</h1>
			</div>
			<div class="header-spacer"></div>
		</div>
	</header>

	<!-- 메인 콘텐츠 -->
	<main class="dashboard-main">
		<div class="calendar-section">
			<div class="section-header">
				<h4>🗓️ 예약현황</h4>
			</div>

			<!-- 날짜 범위 및 통계 표시 -->
			<div class="date-range-display">
				<div class="stats-summary">
					<div class="summary-item">
						<span class="summary-number">{existingReservations.length}</span>
						<span class="summary-label">총 예약</span>
					</div>
					<div class="summary-divider">|</div>
					<div class="summary-item">
						<span class="summary-number confirmed">{existingReservations.filter(r => r.status === 'confirmed').length}</span>
						<span class="summary-label">확정</span>
					</div>
					<div class="summary-divider">|</div>
					<div class="summary-item">
						<span class="summary-number pending">{existingReservations.filter(r => r.status === 'pending').length}</span>
						<span class="summary-label">대기</span>
					</div>
				</div>
			</div>

			{#if isLoading}
				<div class="loading-state">
					<div class="loading-spinner"></div>
					<p>예약 정보를 불러오는 중...</p>
				</div>
			{:else}
				<AdminCalendar
					{currentMonth}
					{currentYear}
					{existingReservations}
					on:monthChange={handleMonthChange}
					on:reservationDateClick={handleReservationDateClick}
				/>
			{/if}

		</div>
	</main>
</div>

<!-- 예약 상세 모달 -->
{#if showReservationModal}
	<div class="reservation-modal">
		<div class="modal-backdrop" on:click={closeReservationModal} role="presentation"></div>
		<div class="modal-content">
			<div class="modal-header">
				<h3>예약 상세 정보</h3>
				<button class="modal-close" on:click={closeReservationModal} aria-label="닫기">×</button>
			</div>
			
			<div class="modal-body">
				<div class="selected-date">
					📅 {formatKoreanDate(selectedDate)}
				</div>
				
				<div class="reservations-list">
					{#each selectedReservations as reservation}
						<div class="reservation-item">
							<div class="reservation-header">
								<span class="guest-name">👤 {reservation.name}</span>
								<span class="status-badge {getStatusColor(reservation.status)}">
									{getReservationStatusText(reservation.status)}
								</span>
							</div>
							
							<div class="reservation-details">
								<div class="detail-row">
									<span class="detail-label">📞 연락처:</span>
									<span class="detail-value">{reservation.phone}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">📅 예약 기간:</span>
									<span class="detail-value">{formatReservationPeriod(reservation)}</span>
								</div>
								{#if reservation.created_at}
									<div class="detail-row">
										<span class="detail-label">⏰ 예약 신청:</span>
										<span class="detail-value">{new Date(reservation.created_at).toLocaleString('ko-KR')}</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
			
			<div class="modal-footer">
				<button class="modal-button" on:click={closeReservationModal}>
					확인
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- 피드백 매니저 -->
<FeedbackManager
	bind:show={feedbackManager.show}
	bind:type={feedbackManager.type}
	bind:title={feedbackManager.title}
	bind:message={feedbackManager.message}
/>

<style>
	.admin-dashboard {
		min-height: 100vh;
		background: linear-gradient(135deg, var(--neutral-50) 0%, var(--neutral-100) 100%);
	}

	.dashboard-header {
		background: white;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-4) var(--space-6);
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.home-button {
		background: white;
		color: var(--neutral-700);
		text-decoration: none;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-lg);
		font-weight: 600;
		transition: var(--transition-all);
		box-shadow: var(--shadow-md);
		border: 1px solid var(--neutral-200);
		font-size: var(--text-sm);
	}

	.home-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		background: var(--neutral-50);
	}

	.admin-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: 1;
		justify-content: center;
	}

	.admin-emoji {
		font-size: 2rem;
	}

	.admin-name {
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--neutral-800);
		margin: 0;
	}

	.header-spacer {
		width: 80px; /* home-button과 같은 너비 */
	}

	.dashboard-main {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-6);
	}

	.calendar-section {
		background: white;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
	}

	.section-header {
		padding: var(--space-4) var(--space-6);
		background: var(--neutral-50);
		border-bottom: 1px solid var(--neutral-200);
	}

	.section-header h4 {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--neutral-700);
		margin: 0;
	}

	.loading-state {
		padding: var(--space-12);
		text-align: center;
		color: var(--neutral-600);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--neutral-200);
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto var(--space-4);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* 날짜 범위 표시 */
	.date-range-display {
		padding: var(--space-4) var(--space-6);
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		border-bottom: 1px solid var(--neutral-200);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stats-summary {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.summary-number {
		font-size: var(--text-2xl);
		font-weight: 700;
		line-height: 1;
		margin-bottom: var(--space-1);
	}

	.summary-number.confirmed {
		color: #059669;
	}

	.summary-number.pending {
		color: #d97706;
	}

	.summary-number:not(.confirmed):not(.pending) {
		color: #6366f1;
	}

	.summary-label {
		font-size: var(--text-xs);
		color: var(--neutral-600);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.summary-divider {
		color: var(--neutral-300);
		font-weight: 300;
		font-size: var(--text-lg);
	}

	/* 예약 상세 모달 */
	.reservation-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
	}

	.modal-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
	}

	.modal-content {
		position: relative;
		background: white;
		border-radius: var(--radius-xl);
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: var(--shadow-2xl);
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		padding: var(--space-6);
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
		color: white;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		font-size: var(--text-xl);
		font-weight: 700;
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		color: white;
		font-size: var(--text-2xl);
		cursor: pointer;
		padding: var(--space-1);
		border-radius: var(--radius-md);
		transition: var(--transition-colors);
	}

	.modal-close:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-body {
		padding: var(--space-6);
		max-height: 60vh;
		overflow-y: auto;
	}

	.selected-date {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--neutral-700);
		text-align: center;
		margin-bottom: var(--space-6);
		padding: var(--space-3);
		background: var(--neutral-50);
		border-radius: var(--radius-lg);
	}

	.reservations-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.reservation-item {
		border: 1px solid var(--neutral-200);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		background: white;
	}

	.reservation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-3);
	}

	.guest-name {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--neutral-800);
	}

	.status-badge {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-confirmed {
		background: #d1fae5;
		color: #065f46;
	}

	.status-cancelled {
		background: #fee2e2;
		color: #991b1b;
	}

	.status-completed {
		background: #e0e7ff;
		color: #3730a3;
	}

	.reservation-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.detail-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.detail-label {
		font-weight: 600;
		color: var(--neutral-600);
		min-width: 100px;
	}

	.detail-value {
		color: var(--neutral-800);
	}

	.modal-footer {
		padding: var(--space-6);
		text-align: center;
		background: var(--neutral-50);
	}

	.modal-button {
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
		color: white;
		border: none;
		padding: var(--space-3) var(--space-8);
		border-radius: var(--radius-lg);
		font-size: var(--text-base);
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition-all);
	}

	.modal-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	@media (max-width: 768px) {
		.dashboard-main {
			padding: var(--space-4);
		}

		.header-content {
			padding: var(--space-3) var(--space-4);
		}

		.admin-name {
			font-size: var(--text-xl);
		}

		.section-header {
			padding: var(--space-3) var(--space-4);
		}

		.section-header h4 {
			font-size: var(--text-base);
		}

		.date-range-display {
			flex-direction: column;
			gap: var(--space-3);
			padding: var(--space-3) var(--space-4);
			text-align: center;
		}

		.stats-summary {
			gap: var(--space-3);
		}

		.summary-item {
			min-width: 60px;
		}

		.summary-number {
			font-size: var(--text-xl);
		}

		.modal-content {
			margin: var(--space-4);
			max-height: 90vh;
		}

		.reservation-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-2);
		}
	}
</style>