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
			created_at: '2025-01-22T11:10:00Z',
			confirmed_by: 'choi-bunok',
			confirmed_at: '2025-01-19T14:30:00Z'
		}
	];

	// 예약 상세 모달 상태
	let showReservationModal = false;
	let selectedReservations = [];
	let selectedDate = null;

	// 필터링 상태 관리
	let selectedFilter = '전체';
	const filterOptions = ['전체', '확정', '대기', '거절', '내 결정'];
	
	// 상세보기 팝업 상태
	let showDetailModal = false;
	let selectedDetailReservation = null;
	


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
			'pending': '예약대기',
			'confirmed': '예약확정',
			'cancelled': '예약거절',
			'completed': '이용완료'
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
	 * 필터 변경 처리
	 */
	function handleFilterChange(filter) {
		selectedFilter = filter;
	}

	/**
	 * 상세보기 팝업 열기
	 */
	function openDetailModal(reservation) {
		selectedDetailReservation = reservation;
		showDetailModal = true;
	}

	/**
	 * 상세보기 팝업 닫기
	 */
	function closeDetailModal() {
		selectedDetailReservation = null;
		showDetailModal = false;
	}



	/**
	 * 카테고리별 예약 그룹화
	 */
	$: groupedReservations = {
		'확정': mockReservations.filter(r => r.status === 'confirmed'),
		'대기': mockReservations.filter(r => r.status === 'pending'), 
		'거절': mockReservations.filter(r => r.status === 'cancelled'),
		'내 결정': mockReservations.filter(r => r.confirmed_by === adminId)
	};

	/**
	 * 필터링된 예약 목록
	 */
	$: filteredReservations = selectedFilter === '전체' 
		? mockReservations 
		: groupedReservations[selectedFilter] || [];

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
			<button 
				class="summary-item {selectedFilter === '전체' ? 'active' : ''}"
				on:click={() => handleFilterChange('전체')}
				aria-label="전체 예약 보기"
			>
				<span class="summary-number">{existingReservations.length}</span>
				<span class="summary-label">전체</span>
			</button>
			<button 
				class="summary-item {selectedFilter === '확정' ? 'active' : ''}"
				on:click={() => handleFilterChange('확정')}
				aria-label="확정된 예약 보기"
			>
				<span class="summary-number confirmed">{existingReservations.filter(r => r.status === 'confirmed').length}</span>
				<span class="summary-label">확정</span>
			</button>
			<button 
				class="summary-item {selectedFilter === '대기' ? 'active' : ''}"
				on:click={() => handleFilterChange('대기')}
				aria-label="대기 중인 예약 보기"
			>
				<span class="summary-number pending">{existingReservations.filter(r => r.status === 'pending').length}</span>
				<span class="summary-label">대기</span>
			</button>
			<button 
				class="summary-item {selectedFilter === '거절' ? 'active' : ''}"
				on:click={() => handleFilterChange('거절')}
				aria-label="거절된 예약 보기"
			>
				<span class="summary-number cancelled">{existingReservations.filter(r => r.status === 'cancelled').length}</span>
				<span class="summary-label">거절</span>
			</button>
			<button 
				class="summary-item {selectedFilter === '내 결정' ? 'active' : ''} admin-{adminId}"
				on:click={() => handleFilterChange('내 결정')}
				aria-label="내 결정 예약 보기"
			>
				<span class="summary-number friend admin-{adminId}">{existingReservations.filter(r => r.confirmed_by === adminId).length}</span>
				<span class="summary-label">내 결정</span>
			</button>
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

	<!-- 예약 목록 타이틀 -->
	<div class="reservation-list-title">
		<h4>📝 예약목록</h4>
	</div>

	<!-- 예약자 정보 상세 표시 영역 -->
	{#if filteredReservations.length > 0}
		<div class="reservations-list">
			{#each filteredReservations as reservation}
				<div 
					class="reservation-card clickable {getStatusColor(reservation.status)}"
					on:click={() => openDetailModal(reservation)}
					on:keydown={(e) => e.key === 'Enter' && openDetailModal(reservation)}
					role="button"
					tabindex="0"
					aria-label="{reservation.name} 예약 상세보기"
				>
					<div class="card-content">
						<!-- 첫번째 줄: 이름과 날짜 -->
						<div class="card-row-1">
							<span class="guest-name">👤 {reservation.name}</span>
							<span class="period-dates">{formatKoreanDate(reservation.startDate)} - {formatKoreanDate(reservation.endDate)}</span>
						</div>
						
						<!-- 두번째 줄: 뱃지들 -->
						<div class="card-row-2">
							<div class="status-badge {getStatusColor(reservation.status)}">
								{getReservationStatusText(reservation.status)}
							</div>
							<div class="duration-badge">
								{reservation.duration}박{reservation.duration + 1}일
							</div>
							{#if reservation.confirmed_by}
								<div class="admin-badge admin-theme-{reservation.confirmed_by}">
									{getAdminEmoji(reservation.confirmed_by)} {getAdminName(reservation.confirmed_by)}
								</div>
							{/if}
						</div>
					</div>
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

<!-- 예약 상세 모달 (달력에서 날짜 클릭 시) -->
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

<!-- 예약 상세보기 팝업 모달 (상세보기 버튼 클릭 시) -->
{#if showDetailModal && selectedDetailReservation}
	<div class="detail-modal">
		<div class="modal-backdrop" on:click={closeDetailModal} role="presentation"></div>
		<div class="modal-content detail-modal-content">
			<div class="modal-header">
				<h3>📋 예약 상세 정보</h3>
				<button class="modal-close" on:click={closeDetailModal} aria-label="닫기">×</button>
			</div>
			
			<div class="modal-body">
				<div class="guest-info-header">
					<h4>👤 {selectedDetailReservation.name}</h4>
					<div class="status-badge large {getStatusColor(selectedDetailReservation.status)}">
						{getReservationStatusText(selectedDetailReservation.status)}
					</div>
				</div>
				
				<div class="detail-sections">
					{#if selectedDetailReservation.status === 'confirmed' && selectedDetailReservation.confirmed_by}
						<div class="detail-section highlight admin-{selectedDetailReservation.confirmed_by}">
							<div class="section-title">✅ 예약 확정 정보</div>
							<div class="detail-content">
								<div class="detail-item">
									<span class="detail-label">확정자:</span>
									<span class="detail-value confirmed-admin">
										{getAdminEmoji(selectedDetailReservation.confirmed_by)} {getAdminName(selectedDetailReservation.confirmed_by)}
									</span>
								</div>
								{#if selectedDetailReservation.confirmed_at}
									<div class="detail-item">
										<span class="detail-label">확정일:</span>
										<span class="detail-value">{new Date(selectedDetailReservation.confirmed_at).toLocaleString('ko-KR')}</span>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<div class="detail-section">
						<div class="section-title">📞 연락처 정보</div>
						<div class="detail-content">
							<div class="detail-item">
								<span class="detail-label">전화번호:</span>
								<span class="detail-value">{selectedDetailReservation.phone}</span>
							</div>
						</div>
					</div>

					<div class="detail-section">
						<div class="section-title">📅 예약 기간 정보</div>
						<div class="detail-content">
							<div class="detail-item">
								<span class="detail-label">체크인:</span>
								<span class="detail-value">{formatKoreanDate(selectedDetailReservation.startDate)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">체크아웃:</span>
								<span class="detail-value">{formatKoreanDate(selectedDetailReservation.endDate)}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">숙박기간:</span>
								<span class="detail-value">{selectedDetailReservation.duration}박 {selectedDetailReservation.duration + 1}일</span>
							</div>
						</div>
					</div>

					{#if selectedDetailReservation.created_at}
						<div class="detail-section">
							<div class="section-title">⏰ 예약 신청 정보</div>
							<div class="detail-content">
								<div class="detail-item">
									<span class="detail-label">신청일시:</span>
									<span class="detail-value">{new Date(selectedDetailReservation.created_at).toLocaleString('ko-KR')}</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="modal-footer">
				<button class="modal-button" on:click={closeDetailModal}>
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
	/* 관리자별 테마 컬러 변수 정의 */
	:root {
		/* 최분옥 - 보라 계열 */
		--admin-choi-bunok-primary: #8b5cf6;
		--admin-choi-bunok-light: #faf5ff;
		--admin-choi-bunok-medium: #ede9fe;
		--admin-choi-bunok-dark: #7c3aed;

		/* 최창환 - 청록 계열 */
		--admin-choi-changhwan-primary: #06b6d4;
		--admin-choi-changhwan-light: #ecfeff;
		--admin-choi-changhwan-medium: #cffafe;
		--admin-choi-changhwan-dark: #0891b2;

		/* 박서은 - 밝은 노란색 계열 (텍스트는 어둡게) */
		--admin-park-seoeun-primary: #1249ff;
		--admin-park-seoeun-light: #12fffb;
		--admin-park-seoeun-medium: #fef3c7;
		--admin-park-seoeun-dark: #000282;

		/* 박지영 - 로즈 계열 (확정/대기 색상과 구분) */
		--admin-park-jiyoung-primary: #e11d48;
		--admin-park-jiyoung-light: #fff1f2;
		--admin-park-jiyoung-medium: #fecdd3;
		--admin-park-jiyoung-dark: #be123c;

		/* 박태현 - 인디고 계열 */
		--admin-park-taehyun-primary: #6366f1;
		--admin-park-taehyun-light: #eef2ff;
		--admin-park-taehyun-medium: #ddd6fe;
		--admin-park-taehyun-dark: #4f46e5;
	}

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
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
		align-items: center;
	}

	.stats-summary {
		display: contents;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		background: rgba(255, 255, 255, 0.8);
		border: 2px solid rgba(255, 255, 255, 0.3);
		cursor: pointer;
		padding: var(--space-4);
		border-radius: var(--radius-xl);
		transition: var(--transition-all);
		position: relative;
		font-family: inherit;
		width: 100%;
		min-height: 100px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.summary-item:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(255, 255, 255, 0.8);
		transform: translateY(-3px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
	}

	.summary-item.active {
		border-width: 3px;
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
	}

	/* 활성화된 버튼의 색상별 스타일 */
	.summary-item.active:nth-child(1) {
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: #6366f1;
	}

	.summary-item.active:nth-child(2) {
		background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: #059669;
	}

	.summary-item.active:nth-child(3) {
		background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: #d97706;
	}

	.summary-item.active:nth-child(4) {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: #ef4444;
	}

	/* 내 결정 버튼 - 관리자별 테마 색상 적용 */
	.summary-item.active:nth-child(5).admin-choi-bunok {
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: var(--admin-choi-bunok-primary);
	}

	.summary-item.active:nth-child(5).admin-choi-changhwan {
		background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: var(--admin-choi-changhwan-primary);
	}

	.summary-item.active:nth-child(5).admin-park-seoeun {
		background: linear-gradient(135deg, rgba(255, 246, 18, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: var(--admin-park-seoeun-primary);
	}

	.summary-item.active:nth-child(5).admin-park-jiyoung {
		background: linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: var(--admin-park-jiyoung-primary);
	}

	.summary-item.active:nth-child(5).admin-park-taehyun {
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-color: var(--admin-park-taehyun-primary);
	}

	/* 호버 시 색상별 스타일 */
	.summary-item:nth-child(1):hover {
		border-color: rgba(99, 102, 241, 0.5);
	}

	.summary-item:nth-child(2):hover {
		border-color: rgba(5, 150, 105, 0.5);
	}

	.summary-item:nth-child(3):hover {
		border-color: rgba(217, 119, 6, 0.5);
	}

	.summary-item:nth-child(4):hover {
		border-color: rgba(239, 68, 68, 0.5);
	}

	/* 내 결정 버튼 호버 - 관리자별 테마 색상 */
	.summary-item:nth-child(5).admin-choi-bunok:hover {
		border-color: rgba(139, 92, 246, 0.5);
	}

	.summary-item:nth-child(5).admin-choi-changhwan:hover {
		border-color: rgba(6, 182, 212, 0.5);
	}

	.summary-item:nth-child(5).admin-park-seoeun:hover {
		border-color: rgba(255, 246, 18, 0.7);
	}

	.summary-item:nth-child(5).admin-park-jiyoung:hover {
		border-color: rgba(225, 29, 72, 0.5);
	}

	.summary-item:nth-child(5).admin-park-taehyun:hover {
		border-color: rgba(99, 102, 241, 0.5);
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

	.summary-number.cancelled {
		color: #ef4444;
	}

	/* 내 결정 숫자 색상 - 관리자별 테마 색상 */
	.summary-number.friend.admin-choi-bunok {
		color: var(--admin-choi-bunok-primary);
	}

	.summary-number.friend.admin-choi-changhwan {
		color: var(--admin-choi-changhwan-primary);
	}

	.summary-number.friend.admin-park-seoeun {
		color: var(--admin-park-seoeun-primary);
	}

	.summary-number.friend.admin-park-jiyoung {
		color: var(--admin-park-jiyoung-primary);
	}

	.summary-number.friend.admin-park-taehyun {
		color: var(--admin-park-taehyun-primary);
	}

	.summary-number:not(.confirmed):not(.pending):not(.cancelled):not(.friend) {
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
		background: white;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		margin-top: var(--space-6);
		padding: var(--space-6);
	}

	.section-subtitle {
		font-size: var(--text-lg);
		color: var(--neutral-600);
		margin: 0;
	}

	/* 예약 목록 타이틀 스타일 - 사용자 페이지 progress-guide와 동일 */
	.reservation-list-title {
		text-align: left;
		margin-top: var(--space-4);
	}

	.reservation-list-title h4 {
		font-size: var(--text-xl);
		color: var(--primary);
	}

	/* 예약 목록 스타일 */
	.reservations-list {
		display: flex;
		flex-direction: column;
		margin: 5px 0;
		padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
	}

	.reservation-card {
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border: 2px solid transparent;
		transition: var(--transition-all);
		position: relative;
		overflow: hidden;
		margin-bottom: -15px; /* 아래쪽 negative margin으로 간격 조정 */
	}

	.reservation-card:last-child {
		margin-bottom: calc(var(--space-6) + env(safe-area-inset-bottom, 0px)); /* 마지막 카드에 적당한 하단 마진 */
	}

	.reservation-card.clickable {
		cursor: pointer;
		border: 2px solid var(--neutral-200);
	}

	.reservation-card.clickable:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		border-color: #6366f1;
		background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	}

	.reservation-card.clickable:active {
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.reservation-card.status-confirmed {
		border-left: 6px solid #10b981;
	}

	.reservation-card.status-confirmed:hover {
		border-left: 6px solid #10b981;
		border-color: #10b981;
		background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
	}

	.reservation-card.status-pending {
		border-left: 6px solid #f59e0b;
	}

	.reservation-card.status-pending:hover {
		border-left: 6px solid #f59e0b;
		border-color: #f59e0b;
		background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
	}

	.reservation-card.status-cancelled {
		border-left: 6px solid #ef4444;
	}

	.reservation-card.status-cancelled:hover {
		border-left: 6px solid #ef4444;
		border-color: #ef4444;
		background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
	}

	/* 2줄 레이아웃 */
	.card-content {
		padding: var(--space-1) var(--space-3);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.card-row-1 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.card-row-2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.guest-name {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--neutral-800);
		flex-shrink: 0;
	}

	.guest-phone {
		font-size: var(--text-sm);
		color: var(--neutral-600);
		font-weight: 500;
		min-width: 120px;
		flex-shrink: 0;
	}

	.period-dates {
		font-size: var(--text-sm);
		color: var(--neutral-700);
		font-weight: 500;
		flex: 1;
	}

	.status-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.duration-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
		flex-shrink: 0;
		background: #fef3c7;
		color: #ff7621;
		border: 1px solid #f59e0b;
	}

	.admin-badge {
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: 600;
		text-align: center;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* 관리자별 테마 컬러 적용 */
	.admin-theme-choi-bunok {
		background: var(--admin-choi-bunok-light);
		color: var(--admin-choi-bunok-dark);
		border: 1px solid var(--admin-choi-bunok-primary);
	}

	.admin-theme-choi-changhwan {
		background: var(--admin-choi-changhwan-light);
		color: var(--admin-choi-changhwan-dark);
		border: 1px solid var(--admin-choi-changhwan-primary);
	}

	.admin-theme-park-seoeun {
		background: var(--admin-park-seoeun-light);
		color: var(--admin-park-seoeun-dark);
		border: 1px solid var(--admin-park-seoeun-primary);
	}

	.admin-theme-park-jiyoung {
		background: var(--admin-park-jiyoung-light);
		color: var(--admin-park-jiyoung-dark);
		border: 1px solid var(--admin-park-jiyoung-primary);
	}

	.admin-theme-park-taehyun {
		background: var(--admin-park-taehyun-light);
		color: var(--admin-park-taehyun-dark);
		border: 1px solid var(--admin-park-taehyun-primary);
	}

	.status-badge.status-confirmed {
		background: rgb(0, 215, 75);
		color: #005c20;
		border: 1px solid #10b981;
	}

	.status-badge.status-pending {
		background: #ff7621;
		color: #fef3c7;
		border: 1px solid #f59e0b;
	}

	.status-badge.status-cancelled {
		background: #ef4444;
		color: #fee2e2;
		border: 1px solid #991b1b;
	}

	.click-arrow {
		font-size: var(--text-sm);
		color: #4f46e5;
		font-weight: 700;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.8;
		}
	}

	.reservation-card.clickable:hover .click-arrow {
		color: white;
		animation: bounce 0.6s ease-in-out;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: translateX(0);
		}
		40% {
			transform: translateX(3px);
		}
		60% {
			transform: translateX(1px);
		}
	}

	/* 상세보기 팝업 모달 스타일 */
	.detail-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1001;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
	}

	.detail-modal-content {
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.guest-info-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-6);
		padding: var(--space-4);
		background: var(--neutral-50);
		border-radius: var(--radius-lg);
	}

	.guest-info-header h4 {
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--neutral-800);
		margin: 0;
	}

	.status-badge.large {
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-base);
		font-weight: 700;
	}

	.detail-sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.detail-section {
		background: white;
		border: 1px solid var(--neutral-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.detail-section.highlight {
		border-width: 2px;
	}

	.section-title {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--neutral-700);
		border-bottom: 1px solid var(--neutral-200);
	}

	.detail-content {
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2);
		background: var(--neutral-50);
		border-radius: var(--radius-md);
	}

	.detail-label {
		color: var(--neutral-600);
		font-weight: 500;
		font-size: var(--text-sm);
		flex-shrink: 0;
		margin-right: var(--space-4);
	}

	.detail-value {
		color: var(--neutral-800);
		font-weight: 600;
		font-size: var(--text-sm);
		text-align: right;
	}

	.confirmed-admin {
		font-weight: 700;
		font-size: var(--text-base);
	}

	/* 관리자별 색상 구분 - 상세 모달용 */
	.admin-choi-bunok.highlight {
		border-color: var(--admin-choi-bunok-primary);
		background: linear-gradient(135deg, var(--admin-choi-bunok-light) 0%, #ffffff 100%);
	}

	.admin-choi-bunok .section-title {
		background: linear-gradient(135deg, var(--admin-choi-bunok-medium) 0%, #f3f4f6 100%);
		color: var(--admin-choi-bunok-dark);
	}

	.admin-choi-bunok .confirmed-admin {
		color: var(--admin-choi-bunok-dark);
	}

	.admin-choi-changhwan.highlight {
		border-color: var(--admin-choi-changhwan-primary);
		background: linear-gradient(135deg, var(--admin-choi-changhwan-light) 0%, #ffffff 100%);
	}

	.admin-choi-changhwan .section-title {
		background: linear-gradient(135deg, var(--admin-choi-changhwan-medium) 0%, #f3f4f6 100%);
		color: var(--admin-choi-changhwan-dark);
	}

	.admin-choi-changhwan .confirmed-admin {
		color: var(--admin-choi-changhwan-dark);
	}

	.admin-park-seoeun.highlight {
		border-color: var(--admin-park-seoeun-primary);
		background: linear-gradient(135deg, var(--admin-park-seoeun-light) 0%, #ffffff 100%);
	}

	.admin-park-seoeun .section-title {
		background: linear-gradient(135deg, var(--admin-park-seoeun-medium) 0%, #f3f4f6 100%);
		color: var(--admin-park-seoeun-dark);
	}

	.admin-park-seoeun .confirmed-admin {
		color: var(--admin-park-seoeun-dark);
	}

	.admin-park-jiyoung.highlight {
		border-color: var(--admin-park-jiyoung-primary);
		background: linear-gradient(135deg, var(--admin-park-jiyoung-light) 0%, #ffffff 100%);
	}

	.admin-park-jiyoung .section-title {
		background: linear-gradient(135deg, var(--admin-park-jiyoung-medium) 0%, #f3f4f6 100%);
		color: var(--admin-park-jiyoung-dark);
	}

	.admin-park-jiyoung .confirmed-admin {
		color: var(--admin-park-jiyoung-dark);
	}

	.admin-park-taehyun.highlight {
		border-color: var(--admin-park-taehyun-primary);
		background: linear-gradient(135deg, var(--admin-park-taehyun-light) 0%, #ffffff 100%);
	}

	.admin-park-taehyun .section-title {
		background: linear-gradient(135deg, var(--admin-park-taehyun-medium) 0%, #f3f4f6 100%);
		color: var(--admin-park-taehyun-dark);
	}

	.admin-park-taehyun .confirmed-admin {
		color: var(--admin-park-taehyun-dark);
	}

	/* 예약이 없을 때 메시지 */
	.no-reservations-message {
		text-align: center;
		padding: var(--space-12);
		padding-bottom: calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
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
		color: #ff7621;
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
		padding: var(--space-3) var(--space-4);
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
		h1.page-title {
			margin: var(--space-2) 0 var(--space-2) 0 !important;
			font-size: var(--text-2xl) !important;
		}

		.step {
			display: flex;
			flex-direction: column;
			padding-bottom: calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
		}

		.calendar-section {
			margin: 0;
			border-radius: 0;
			flex-shrink: 0;
		}

		.date-range-display {
			grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
			gap: var(--space-1);
			padding: var(--space-2) var(--space-2);
			text-align: center;
		}

		.summary-item {
			min-height: 70px;
			padding: var(--space-1);
		}

		.summary-number {
			font-size: var(--text-xl);
			margin-bottom: var(--space-1);
		}

		.summary-label {
			font-size: var(--text-xs);
		}

		/* 예약자 정보 모바일 스타일 */
		.reservations-detail-section {
			margin-top: var(--space-4);
			padding: var(--space-4);
			border-radius: var(--radius-lg);
		}

		.section-subtitle {
			font-size: var(--text-base);
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

		/* 모바일 2줄 카드 스타일 */
		.card-content {
			padding: var(--space-1) var(--space-2);
			gap: 2px;
		}

		.card-row-1, .card-row-2 {
			gap: var(--space-1);
		}

		.guest-name {
			font-size: var(--text-sm);
			font-weight: 700;
		}

		.period-dates {
			font-size: var(--text-xs);
		}

		.status-badge, .duration-badge, .admin-badge {
			font-size: 10px;
			padding: 2px var(--space-1);
		}

		.click-arrow {
			font-size: 11px;
		}

		.reservations-list {
			padding-bottom: calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
		}

		.reservation-card:last-child {
			margin-bottom: calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
		}

		.no-reservations-message {
			padding: var(--space-6);
			padding-bottom: calc(var(--space-12) + env(safe-area-inset-bottom, 0px));
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

		.detail-modal-content {
			margin: var(--space-2);
			max-height: 95vh;
		}

		.guest-info-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-2);
		}

		.detail-content {
			padding: var(--space-3);
		}

		.detail-item {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-1);
		}

		.detail-label {
			margin-right: 0;
		}

		.detail-value {
			text-align: left;
		}
	}

</style>