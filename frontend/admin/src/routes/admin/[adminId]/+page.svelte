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

	// 목업 데이터 (테스트용)
	const mockReservations = [
		{
			id: 1,
			name: '김영희',
			phone: '010-1234-5678',
			startDate: new Date(2025, 0, 15), // 1월 15일
			endDate: new Date(2025, 0, 17),   // 1월 17일
			duration: 2,
			status: 'confirmed',
			created_at: '2025-01-08T10:30:00Z',
			confirmed_by: 'choi-bunok',
			confirmed_at: '2025-01-09T09:15:00Z'
		},
		{
			id: 2,
			name: '박철수',
			phone: '010-9876-5432',
			startDate: new Date(2025, 0, 20), // 1월 20일
			endDate: new Date(2025, 0, 23),   // 1월 23일
			duration: 3,
			status: 'pending',
			created_at: '2025-01-12T14:15:00Z'
		},
		{
			id: 3,
			name: '이정민',
			phone: '010-5555-1234',
			startDate: new Date(2025, 0, 25), // 1월 25일
			endDate: new Date(2025, 0, 26),   // 1월 26일
			duration: 1,
			status: 'confirmed',
			created_at: '2025-01-18T09:45:00Z',
			confirmed_by: 'park-seoeun',
			confirmed_at: '2025-01-19T14:30:00Z'
		},
		{
			id: 4,
			name: '최미영',
			phone: '010-7777-8888',
			startDate: new Date(2025, 0, 28), // 1월 28일
			endDate: new Date(2025, 0, 31),   // 1월 31일
			duration: 3,
			status: 'pending',
			created_at: '2025-01-20T16:20:00Z'
		},
		{
			id: 5,
			name: '정호석',
			phone: '010-3333-9999',
			startDate: new Date(2025, 1, 3),  // 2월 3일
			endDate: new Date(2025, 1, 5),    // 2월 5일
			duration: 2,
			status: 'cancelled',
			created_at: '2025-01-22T11:10:00Z'
		}
	];

	// 예약 상세 모달 상태
	let showReservationModal = false;
	let selectedReservations = [];
	let selectedDate = null;

	// 카드 확장 상태 관리
	let expandedCards = new Set();
	
	// 필터링 상태 관리
	let selectedFilter = '전체';
	const filterOptions = ['전체', '확정', '대기', '내 지인'];

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
		// 실제 API 호출 대신 목업 데이터 사용 (테스트용)
		existingReservations = mockReservations;
		
		// 실제 운영시에는 아래 코드 사용
		// loadMonthlyReservations();
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

	/**
	 * 카드 확장/축소 토글
	 */
	function toggleCardExpansion(reservationId) {
		if (expandedCards.has(reservationId)) {
			expandedCards.delete(reservationId);
		} else {
			expandedCards.add(reservationId);
		}
		expandedCards = expandedCards; // 반응성 트리거
	}

	/**
	 * 필터 변경 처리
	 */
	function handleFilterChange(filter) {
		selectedFilter = filter;
	}

	/**
	 * 필터링된 예약 목록
	 */
	$: filteredReservations = mockReservations.filter(reservation => {
		switch (selectedFilter) {
			case '확정':
				return reservation.status === 'confirmed';
			case '대기':
				return reservation.status === 'pending';
			case '내 지인':
				// 특정 조건으로 필터링 (예: 특정 이름 패턴, 메모 등)
				// 여기서는 예시로 특정 이름들을 내 지인으로 가정
				const 지인명단 = ['김영희', '박철수', '이민정'];
				return 지인명단.includes(reservation.name);
			case '전체':
			default:
				return true;
		}
	});

	/**
	 * 관리자 ID로 관리자 이름 가져오기
	 */
	function getAdminName(adminId) {
		return administrators[adminId]?.name || '알 수 없음';
	}

	/**
	 * 관리자 ID로 관리자 이모지 가져오기
	 */
	function getAdminEmoji(adminId) {
		return administrators[adminId]?.emoji || '👤';
	}
</script>

<svelte:head>
	<title>{currentAdmin?.name} 관리자 - Ok's House 관리 시스템</title>
</svelte:head>

<!-- 메인 콘텐츠 -->
<h1 class="page-title" style="margin-top: 27.5px; font-size: var(--text-3xl);">
	<span class="emoji-normal s-xe9m8xNPUuGQ">🗓️</span> 예약현황
</h1>

<div class="step">
	<div class="calendar-section">
	<!-- 날짜 범위 및 통계 표시 -->
	<div class="date-range-display">
		<div class="stats-summary">
			<div class="summary-item">
				<span class="summary-number">{existingReservations.length}</span>
				<span class="summary-label">전체</span>
			</div>
			<div class="summary-item">
				<span class="summary-number confirmed">{existingReservations.filter(r => r.status === 'confirmed').length}</span>
				<span class="summary-label">확정</span>
			</div>
			<div class="summary-item">
				<span class="summary-number pending">{existingReservations.filter(r => r.status === 'pending').length}</span>
				<span class="summary-label">대기</span>
			</div>
			<div class="summary-item">
				<span class="summary-number friend">{existingReservations.filter(r => ['김영희', '박철수', '이민정'].includes(r.name)).length}</span>
				<span class="summary-label">내 지인</span>
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

	<!-- 예약자 정보 상세 표시 영역 -->
	<div class="reservations-detail-section">
		<!-- 필터 버튼들 -->
		<div class="filter-controls">
			{#each filterOptions as filter}
				<button 
					class="filter-btn {selectedFilter === filter ? 'active' : ''}"
					data-filter={filter}
					on:click={() => handleFilterChange(filter)}
				>
					{filter}
				</button>
			{/each}
		</div>

		{#if filteredReservations.length > 0}
			<div class="reservations-grid">
				{#each filteredReservations as reservation}
					<div class="reservation-card {getStatusColor(reservation.status)} {expandedCards.has(reservation.id) ? 'expanded' : 'compact'}">
						<!-- 컴팩트 뷰 (항상 표시) -->
						<div class="card-compact">
							<div class="compact-info">
								<div class="guest-summary">
									<h3 class="guest-name">👤 {reservation.name}</h3>
									<p class="reservation-dates">{formatKoreanDate(reservation.startDate)} ~ {formatKoreanDate(reservation.endDate)}</p>
								</div>
								<div class="compact-right">
									<div class="status-badge {getStatusColor(reservation.status)}">
										{getReservationStatusText(reservation.status)}
									</div>
									<button 
										class="expand-button"
										on:click={() => toggleCardExpansion(reservation.id)}
										aria-label="{expandedCards.has(reservation.id) ? '접기' : '자세히 보기'}"
									>
										{expandedCards.has(reservation.id) ? '접기 ▲' : '자세히 ▼'}
									</button>
								</div>
							</div>
						</div>

						<!-- 확장 뷰 (버튼 클릭시에만 표시) -->
						{#if expandedCards.has(reservation.id)}
							<div class="card-expanded">
								<div class="expanded-details">
									{#if reservation.status === 'confirmed' && reservation.confirmed_by}
										<div class="detail-row confirmed-row admin-{reservation.confirmed_by}">
											<span class="detail-label">✅ 예약 확정자:</span>
											<span class="detail-value confirmed-admin">
												{getAdminEmoji(reservation.confirmed_by)} {getAdminName(reservation.confirmed_by)}
											</span>
										</div>
										{#if reservation.confirmed_at}
											<div class="detail-row admin-{reservation.confirmed_by}">
												<span class="detail-label">📋 확정일:</span>
												<span class="detail-value">{new Date(reservation.confirmed_at).toLocaleDateString('ko-KR')}</span>
											</div>
										{/if}
									{/if}

									<div class="detail-row">
										<span class="detail-label">📞 연락처:</span>
										<span class="detail-value">{reservation.phone}</span>
									</div>
									
									<div class="detail-row">
										<span class="detail-label">🏠 숙박기간:</span>
										<span class="detail-value">{reservation.duration}박 {reservation.duration + 1}일</span>
									</div>
									
									{#if reservation.created_at}
										<div class="detail-row">
											<span class="detail-label">⏰ 예약 신청일:</span>
											<span class="detail-value">{new Date(reservation.created_at).toLocaleDateString('ko-KR')}</span>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="no-reservations-message">
				<div class="empty-icon">📅</div>
				<h3>{selectedFilter === '전체' ? '이번 달 예약이 없습니다' : `'${selectedFilter}' 조건에 맞는 예약이 없습니다`}</h3>
				<p>{selectedFilter === '전체' ? '새로운 예약이 들어오면 여기에 표시됩니다.' : '다른 필터를 선택해보세요.'}</p>
			</div>
		{/if}
	</div>
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
	/* 페이지 제목 스타일 - 사용자 페이지와 동일한 스타일 적용 */
	h1 {
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%) !important;
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

	/* 사용자 페이지와 동일한 step 컨테이너 스타일 */
	.step {
		animation: fadeIn 0.3s ease-in-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
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
		padding: var(--space-6) var(--space-6);
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		border-bottom: 1px solid var(--neutral-200);
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		align-items: center;
	}

	.stats-summary {
		display: contents;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		justify-self: center;
	}

	.summary-number {
		font-size: var(--text-3xl);
		font-weight: 700;
		line-height: 1;
		margin-bottom: var(--space-2);
	}

	.summary-number.confirmed {
		color: #059669;
	}

	.summary-number.pending {
		color: #d97706;
	}

	.summary-number.friend {
		color: #ec4899;
	}

	.summary-number:not(.confirmed):not(.pending):not(.friend) {
		color: #6366f1;
	}

	.summary-label {
		font-size: var(--text-base);
		color: var(--neutral-600);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.summary-divider {
		display: none;
	}

	/* 예약자 정보 상세 표시 영역 */
	.reservations-detail-section {
		padding: var(--space-6);
		background: var(--neutral-50);
	}

	.section-subtitle {
		font-size: var(--text-lg);
		color: var(--neutral-600);
		margin: 0;
	}

	/* 필터 컨트롤 */
	.filter-controls {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.filter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-2);
		border: 2px solid var(--neutral-300);
		background: white;
		color: var(--neutral-600);
		border-radius: var(--radius-lg);
		font-size: var(--text-base);
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-all);
		position: relative;
		width: 100%;
		min-height: 44px;
	}

	.filter-btn:hover {
		border-color: var(--neutral-400);
		background: var(--neutral-50);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.filter-btn.active {
		color: white;
		font-weight: 600;
		box-shadow: var(--shadow-md);
	}

	/* 필터별 색상 설정 */
	.filter-btn.active[data-filter="전체"] {
		border-color: #6366f1;
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	}

	.filter-btn.active[data-filter="확정"] {
		border-color: #059669;
		background: linear-gradient(135deg, #059669 0%, #10b981 100%);
	}

	.filter-btn.active[data-filter="대기"] {
		border-color: #d97706;
		background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
	}

	.filter-btn.active[data-filter="내 지인"] {
		border-color: #ec4899;
		background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
	}

	.filter-btn.active:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.filter-btn.active[data-filter="전체"]:hover {
		background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
	}

	.filter-btn.active[data-filter="확정"]:hover {
		background: linear-gradient(135deg, #047857 0%, #059669 100%);
	}

	.filter-btn.active[data-filter="대기"]:hover {
		background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
	}

	.filter-btn.active[data-filter="내 지인"]:hover {
		background: linear-gradient(135deg, #db2777 0%, #ec4899 100%);
	}


	.reservations-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-2);
		max-width: 800px;
		margin: 0 auto;
	}

	.reservation-card {
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border: 2px solid transparent;
		overflow: hidden;
		transition: var(--transition-all);
	}

	.reservation-card:hover {
		box-shadow: var(--shadow-md);
	}

	.reservation-card.status-confirmed {
		border-left: 4px solid #10b981;
	}

	.reservation-card.status-pending {
		border-left: 4px solid #f59e0b;
	}

	.reservation-card.status-cancelled {
		border-left: 4px solid #ef4444;
	}

	/* 컴팩트 뷰 스타일 */
	.card-compact {
		padding: var(--space-2);
	}

	.compact-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-2);
	}

	.guest-summary {
		flex: 1;
		min-width: 0; /* 텍스트 오버플로우 방지 */
	}

	.guest-name {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--neutral-800);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.reservation-dates {
		font-size: var(--text-xs);
		color: var(--neutral-500);
		margin: 0;
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.compact-right {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.status-badge {
		padding: 2px var(--space-2);
		border-radius: var(--radius-md);
		font-size: 10px;
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
		min-width: 35px;
	}

	.status-badge.status-confirmed {
		background: #dcfce7;
		color: #166534;
	}

	.status-badge.status-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge.status-cancelled {
		background: #fee2e2;
		color: #991b1b;
	}

	.expand-button {
		background: var(--neutral-200);
		color: var(--neutral-700);
		border: none;
		padding: 2px var(--space-2);
		border-radius: var(--radius-sm);
		font-size: 10px;
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-colors);
		white-space: nowrap;
		min-width: 40px;
	}

	.expand-button:hover {
		background: var(--neutral-300);
		color: var(--neutral-800);
	}

	/* 확장 뷰 스타일 */
	.card-expanded {
		border-top: 1px solid var(--neutral-200);
		background: var(--neutral-50);
		padding: var(--space-2);
		animation: slideDown 0.15s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			max-height: 0;
			padding-top: 0;
			padding-bottom: 0;
		}
		to {
			opacity: 1;
			max-height: 150px;
			padding-top: var(--space-2);
			padding-bottom: var(--space-2);
		}
	}

	.expanded-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-1);
		background: white;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
	}

	.detail-label {
		color: var(--neutral-600);
		font-weight: 500;
		font-size: 11px;
	}

	.detail-value {
		color: var(--neutral-800);
		font-weight: 600;
		font-size: 11px;
	}

	/* 확정자 정보 특별 스타일 - 관리자별 색상 구분 */
	.confirmed-row {
		border: 1px solid;
		font-weight: 600;
	}

	.confirmed-admin {
		font-weight: 700;
	}

	/* 최분옥 관리자 - 보라색 계열 */
	.admin-choi-bunok.confirmed-row {
		background: linear-gradient(135deg, #ede9fe 0%, #f3f4f6 100%);
		border-color: #8b5cf6;
	}

	.admin-choi-bunok .confirmed-admin {
		color: #7c3aed;
	}

	.admin-choi-bunok:not(.confirmed-row) {
		background: linear-gradient(135deg, #faf5ff 0%, #f9fafb 100%);
		border-color: #a855f7;
	}

	.admin-choi-bunok:not(.confirmed-row) .detail-value {
		color: #7c3aed;
	}

	/* 최창환 관리자 - 청록색 계열 */
	.admin-choi-changhwan.confirmed-row {
		background: linear-gradient(135deg, #cffafe 0%, #f3f4f6 100%);
		border-color: #06b6d4;
	}

	.admin-choi-changhwan .confirmed-admin {
		color: #0891b2;
	}

	.admin-choi-changhwan:not(.confirmed-row) {
		background: linear-gradient(135deg, #ecfeff 0%, #f9fafb 100%);
		border-color: #22d3ee;
	}

	.admin-choi-changhwan:not(.confirmed-row) .detail-value {
		color: #0891b2;
	}

	/* 박서은 관리자 - 핑크색 계열 */
	.admin-park-seoeun.confirmed-row {
		background: linear-gradient(135deg, #fce7f3 0%, #f3f4f6 100%);
		border-color: #ec4899;
	}

	.admin-park-seoeun .confirmed-admin {
		color: #db2777;
	}

	.admin-park-seoeun:not(.confirmed-row) {
		background: linear-gradient(135deg, #fdf2f8 0%, #f9fafb 100%);
		border-color: #f472b6;
	}

	.admin-park-seoeun:not(.confirmed-row) .detail-value {
		color: #db2777;
	}

	/* 박지영 관리자 - 주황색 계열 */
	.admin-park-jiyoung.confirmed-row {
		background: linear-gradient(135deg, #fed7aa 0%, #f3f4f6 100%);
		border-color: #f97316;
	}

	.admin-park-jiyoung .confirmed-admin {
		color: #ea580c;
	}

	.admin-park-jiyoung:not(.confirmed-row) {
		background: linear-gradient(135deg, #fff7ed 0%, #f9fafb 100%);
		border-color: #fb923c;
	}

	.admin-park-jiyoung:not(.confirmed-row) .detail-value {
		color: #ea580c;
	}

	/* 박태현 관리자 - 남색 계열 */
	.admin-park-taehyun.confirmed-row {
		background: linear-gradient(135deg, #ddd6fe 0%, #f3f4f6 100%);
		border-color: #6366f1;
	}

	.admin-park-taehyun .confirmed-admin {
		color: #4f46e5;
	}

	.admin-park-taehyun:not(.confirmed-row) {
		background: linear-gradient(135deg, #eef2ff 0%, #f9fafb 100%);
		border-color: #818cf8;
	}

	.admin-park-taehyun:not(.confirmed-row) .detail-value {
		color: #4f46e5;
	}

	/* 예약이 없을 때 메시지 */
	.no-reservations-message {
		text-align: center;
		padding: var(--space-12);
		color: var(--neutral-500);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: var(--space-4);
	}

	.no-reservations-message h3 {
		font-size: var(--text-xl);
		color: var(--neutral-700);
		margin-bottom: var(--space-2);
	}

	.no-reservations-message p {
		font-size: var(--text-base);
		color: var(--neutral-500);
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
		.calendar-section {
			margin: 0;
			border-radius: 0;
		}

		.date-range-display {
			grid-template-columns: 1fr 1fr 1fr 1fr;
			gap: var(--space-1);
			padding: var(--space-3) var(--space-2);
			text-align: center;
		}

		.summary-item {
			min-width: 50px;
		}

		.summary-number {
			font-size: var(--text-2xl);
		}

		.summary-label {
			font-size: var(--text-xs);
		}

		/* 예약자 정보 모바일 스타일 */
		.reservations-detail-section {
			padding: var(--space-3);
		}

		.section-subtitle {
			font-size: var(--text-base);
		}

		/* 필터 컨트롤 모바일 스타일 */
		.filter-controls {
			grid-template-columns: 1fr 1fr 1fr 1fr;
			gap: var(--space-1);
			margin-bottom: var(--space-4);
			max-width: none;
		}

		.filter-btn {
			padding: var(--space-2) var(--space-1);
			font-size: var(--text-sm);
			min-height: 36px;
			gap: 2px;
		}


		.compact-info {
			gap: var(--space-1);
		}

		.guest-name {
			font-size: var(--text-sm);
		}

		.reservation-dates {
			font-size: 10px;
		}

		.status-badge {
			font-size: 9px;
			padding: 1px 6px;
			min-width: 30px;
		}

		.expand-button {
			font-size: 9px;
			padding: 1px 6px;
			min-width: 30px;
		}

		.card-expanded {
			padding: var(--space-1);
		}

		.detail-row {
			padding: 2px var(--space-1);
		}

		.detail-label,
		.detail-value {
			font-size: 10px;
		}

		.no-reservations-message {
			padding: var(--space-6);
		}

		.empty-icon {
			font-size: 3rem;
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