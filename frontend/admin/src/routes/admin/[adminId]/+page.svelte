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


	// 필터링 상태 관리
	let selectedFilter = '전체';
	const filterOptions = ['전체', '확정', '대기', '거절', '내 결정'];
	
	// 상세보기 팝업 상태
	let showDetailModal = false;
	let selectedDetailReservation = null;

	// 상태 변경 확인 모달 상태
	let showConfirmModal = false;
	let confirmAction = null;
	let confirmActionText = '';
	let confirmActionType = '';

	// 유효하지 않은 상태 모달 상태
	let showInvalidStateModal = false;
	let invalidStateMessage = '';
	
	// 동적 높이 관리 상태
	let dynamicHeightEnabled = false;
	


	// 피드백 관리자 상태
	let feedbackManager = {
		show: false,
		type: 'info',
		title: '',
		message: ''
	};

	/**
	 * step 영역의 하단을 reservations-list 하단과 일치시키기
	 */
	function adjustHeightToLastCard() {
		if (typeof window === 'undefined') return;
		
		setTimeout(() => {
			const reservationsList = document.querySelector('.reservations-list');
			const stepElement = document.querySelector('.step');
			
			if (reservationsList && stepElement) {
				// reservations-list의 하단 위치 (뷰포트 기준)
				const reservationsListRect = reservationsList.getBoundingClientRect();
				const reservationsListBottom = reservationsListRect.bottom;
				
				// step의 상단 위치 (뷰포트 기준)  
				const stepTop = stepElement.getBoundingClientRect().top;
				
				// step의 필요한 높이 = reservations-list 하단 - step 상단
				const requiredStepHeight = reservationsListBottom - stepTop;
				
				// step 높이 설정
				if (stepElement instanceof HTMLElement) {
					stepElement.style.minHeight = `${requiredStepHeight}px`;
				}
				
				dynamicHeightEnabled = true;
			}
		}, 150);
	}

	/**
	 * 컴포넌트 마운트 시 초기 데이터 로드
	 */
	onMount(() => {
		// 실제 API 호출 대신 목업 데이터 사용 (테스트용)
		existingReservations = mockReservations;
		
		// 실제 운영시에는 아래 코드 사용
		// loadMonthlyReservations();
		
		// 초기 높이 조정
		adjustHeightToLastCard();
		
		// 윈도우 리사이즈 시 높이 재조정
		window.addEventListener('resize', adjustHeightToLastCard);
		
		// 정리
		return () => {
			window.removeEventListener('resize', adjustHeightToLastCard);
		};
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
		// 해당 날짜에 예약이 하나만 있으면 바로 상세보기, 여러 개면 첫 번째 예약 상세보기
		if (reservations && reservations.length > 0) {
			openDetailModal(reservations[0]);
		}
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
		// 필터 변경 후 마지막 카드 하단에 맞춰 높이 재조정
		setTimeout(() => {
			adjustHeightToLastCard();
		}, 100);
		// DOM 완전히 업데이트 후 한 번 더 실행
		setTimeout(() => {
			adjustHeightToLastCard();
		}, 300);
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
	 * 필터링된 예약 목록이 변경될 때마다 높이 재조정
	 */
	$: if (filteredReservations && typeof window !== 'undefined') {
		// 데이터 변경 시 즉시 높이 조정
		setTimeout(() => {
			adjustHeightToLastCard();
		}, 100);
		// 렌더링 완료 후 한 번 더 정확히 조정
		setTimeout(() => {
			adjustHeightToLastCard();
		}, 250);
	}

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

	/**
	 * 예약 기간에 해당하는 달력 생성
	 */
	function generateReservationCalendar(reservation) {
		const start = new Date(reservation.startDate);
		const end = new Date(reservation.endDate);
		const calendar = [];
		
		// 시작 날짜의 월 첫째 날부터 계산
		const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
		const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
		
		// 첫 주의 빈 공간 채우기
		const startDayOfWeek = firstDay.getDay();
		for (let i = 0; i < startDayOfWeek; i++) {
			calendar.push({ date: null, isReserved: false, isToday: false });
		}
		
		// 달력 날짜 채우기
		for (let date = 1; date <= lastDay.getDate(); date++) {
			const currentDate = new Date(start.getFullYear(), start.getMonth(), date);
			const isReserved = currentDate >= start && currentDate <= end;
			const isToday = currentDate.toDateString() === new Date().toDateString();
			
			calendar.push({
				date: date,
				isReserved: isReserved,
				isToday: isToday
			});
		}
		
		return calendar;
	}

	/**
	 * 예약 상태 변경 시도
	 */
	function attemptStatusChange(newStatus) {
		const currentStatus = selectedDetailReservation.status;
		
		// 현재 상태와 동일한 상태로 변경하려는 경우
		if (currentStatus === newStatus) {
			const statusNames = {
				'confirmed': '승인',
				'pending': '대기',
				'cancelled': '거절'
			};
			invalidStateMessage = `이미 ${statusNames[newStatus]} 상태입니다.`;
			showInvalidStateModal = true;
			return;
		}
		
		// 확인 모달 표시
		const actionNames = {
			'confirmed': '승인',
			'pending': '대기',
			'cancelled': '거절'
		};
		confirmActionText = actionNames[newStatus];
		confirmActionType = newStatus;
		confirmAction = () => changeReservationStatus(newStatus);
		showConfirmModal = true;
	}

	/**
	 * 예약 상태 변경 실행
	 */
	function changeReservationStatus(newStatus) {
		if (selectedDetailReservation) {
			selectedDetailReservation.status = newStatus;
			if (newStatus === 'confirmed') {
				selectedDetailReservation.confirmed_by = adminId;
				selectedDetailReservation.confirmed_at = new Date().toISOString();
			}
			
			// 목록 업데이트
			const index = existingReservations.findIndex(r => r.id === selectedDetailReservation.id);
			if (index !== -1) {
				existingReservations[index] = { ...selectedDetailReservation };
			}
			
			showSuccessFeedback(feedbackManager, '상태 변경 완료', `예약이 ${confirmActionText} 상태로 변경되었습니다.`);
		}
		closeConfirmModal();
	}

	/**
	 * 확인 모달 닫기
	 */
	function closeConfirmModal() {
		showConfirmModal = false;
		confirmAction = null;
		confirmActionText = '';
		confirmActionType = '';
	}

	/**
	 * 유효하지 않은 상태 모달 닫기
	 */
	function closeInvalidStateModal() {
		showInvalidStateModal = false;
		invalidStateMessage = '';
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


<!-- 예약 상세보기 팝업 모달 (상세보기 버튼 클릭 시) -->
{#if showDetailModal && selectedDetailReservation}
	{@const calendarDays = generateReservationCalendar(selectedDetailReservation)}
	<div class="detail-modal">
		<div class="modal-backdrop" on:click={closeDetailModal} role="presentation"></div>
		<div class="modal-content detail-modal-content">
			<div class="modal-header">
				<h3>📋 예약 상세 정보</h3>
				<button class="modal-close" on:click={closeDetailModal} aria-label="닫기">×</button>
			</div>
			
			<div class="modal-body compact">
				<!-- 게스트 정보와 상태 -->
				<div class="guest-status-row">
					<div class="guest-info">
						<h4>👤 {selectedDetailReservation.name}</h4>
						<div class="phone-row">
							<span class="phone-text">📞 {selectedDetailReservation.phone}</span>
						</div>
					</div>
					<div class="status-badge large {getStatusColor(selectedDetailReservation.status)}">
						{getReservationStatusText(selectedDetailReservation.status)}
					</div>
				</div>

				<!-- 달력과 기본 정보를 나란히 배치 -->
				<div class="calendar-info-row">
					<!-- 달력 섹션 -->
					<div class="calendar-section-small">
						<div class="calendar-header">
							<h5>📅 {selectedDetailReservation.startDate.getFullYear()}년 {selectedDetailReservation.startDate.getMonth() + 1}월</h5>
						</div>
						<div class="mini-calendar">
							<div class="calendar-weekdays">
								<div class="weekday">일</div>
								<div class="weekday">월</div>
								<div class="weekday">화</div>
								<div class="weekday">수</div>
								<div class="weekday">목</div>
								<div class="weekday">금</div>
								<div class="weekday">토</div>
							</div>
							<div class="calendar-days">
								{#each calendarDays as day}
									<div class="calendar-day {day.isReserved ? 'reserved' : ''} {day.isToday ? 'today' : ''}">
										{day.date || ''}
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- 기본 정보 섹션 -->
					<div class="basic-info-section">
						<div class="info-item">
							<span class="info-label">체크인</span>
							<span class="info-value">{formatKoreanDate(selectedDetailReservation.startDate)}</span>
						</div>
						<div class="info-item">
							<span class="info-label">체크아웃</span>
							<span class="info-value">{formatKoreanDate(selectedDetailReservation.endDate)}</span>
						</div>
						<div class="info-item">
							<span class="info-label">숙박기간</span>
							<span class="info-value">{selectedDetailReservation.duration}박 {selectedDetailReservation.duration + 1}일</span>
						</div>
						<div class="info-item">
							<span class="info-label">신청일시</span>
							<span class="info-value">{new Date(selectedDetailReservation.created_at).toLocaleDateString('ko-KR')}</span>
						</div>
						<!-- 확정/거절 정보 (있는 경우만) -->
						{#if (selectedDetailReservation.status === 'confirmed' || selectedDetailReservation.status === 'cancelled') && selectedDetailReservation.confirmed_by}
							<div class="confirmed-info admin-{selectedDetailReservation.confirmed_by} {selectedDetailReservation.status === 'cancelled' ? 'rejected-theme' : ''}">
								<span class="confirmed-label">
									{#if selectedDetailReservation.status === 'confirmed'}
										✅ 확정자:
									{:else if selectedDetailReservation.status === 'cancelled'}
										❌ 거절자:
									{/if}
								</span>
								<span class="confirmed-admin">
									{getAdminEmoji(selectedDetailReservation.confirmed_by)} {getAdminName(selectedDetailReservation.confirmed_by)}
								</span>
								{#if selectedDetailReservation.confirmed_at}
									<span class="confirmed-date">
										({new Date(selectedDetailReservation.confirmed_at).toLocaleDateString('ko-KR')})
									</span>
								{/if}
							</div>
						{/if}
					</div>
				</div>

			</div>
			
			<div class="modal-footer action-footer">
				<button class="action-button approve-btn" on:click={() => attemptStatusChange('confirmed')}>
					✅ 승인하기
				</button>
				<button class="action-button pending-btn" on:click={() => attemptStatusChange('pending')}>
					⏳ 대기하기
				</button>
				<button class="action-button reject-btn" on:click={() => attemptStatusChange('cancelled')}>
					❌ 거절하기
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- 상태 변경 확인 모달 -->
{#if showConfirmModal}
	<div class="confirm-modal">
		<div class="modal-backdrop" on:click={closeConfirmModal} role="presentation"></div>
		<div class="modal-content confirm-modal-content">
			<div class="modal-header confirm-header confirm-header-{confirmActionType}">
				<h3>⚠️ 예약 상태 변경</h3>
				<button class="modal-close" on:click={closeConfirmModal} aria-label="닫기">×</button>
			</div>
			
			<div class="modal-body confirm-body">
				<div class="confirm-message">
					<p><strong>{selectedDetailReservation?.name}</strong>님의 예약을</p>
					<p class="action-text"><strong>'{confirmActionText}'</strong> 상태로 변경하시겠습니까?</p>
				</div>
			</div>
			
			<div class="modal-footer confirm-footer">
				<button class="modal-button cancel-btn" on:click={closeConfirmModal}>
					취소
				</button>
				<button class="modal-button confirm-btn" on:click={confirmAction}>
					확인
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- 유효하지 않은 상태 모달 -->
{#if showInvalidStateModal}
	<div class="invalid-modal">
		<div class="modal-backdrop" on:click={closeInvalidStateModal} role="presentation"></div>
		<div class="modal-content invalid-modal-content">
			<div class="modal-header invalid-header">
				<h3>ℹ️ 알림</h3>
				<button class="modal-close" on:click={closeInvalidStateModal} aria-label="닫기">×</button>
			</div>
			
			<div class="modal-body invalid-body">
				<div class="invalid-message">
					<p>{invalidStateMessage}</p>
				</div>
			</div>
			
			<div class="modal-footer invalid-footer">
				<button class="modal-button" on:click={closeInvalidStateModal}>
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
		max-width: 700px;
		margin: 0 auto;
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
		padding: var(--space-2);
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
		border-bottom: 1px solid var(--neutral-200);
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
		gap: var(--space-2);
		align-items: stretch;
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-4);
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
		padding: var(--space-2) var(--space-1);
		border-radius: var(--radius-lg);
		transition: var(--transition-all);
		position: relative;
		font-family: inherit;
		width: 100%;
		min-height: 80px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		margin: 0;
		overflow: hidden;
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
		font-size: var(--text-sm);
		color: var(--neutral-600);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		line-height: 1.2;
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
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}

	.reservation-list-title h4 {
		font-size: var(--text-xl);
		color: var(--primary);
	}

	/* 예약 목록 스타일 */
	.reservations-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin: 5px auto;
		padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom, 0px));
		max-width: 700px;
	}

	.reservation-card {
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border: 2px solid transparent;
		transition: var(--transition-all);
		position: relative;
		overflow: hidden;
	}

	.reservation-card:last-child {
		margin-bottom: calc(var(--space-2) + env(safe-area-inset-bottom, 0px));
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
		padding: var(--space-2);
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
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 1000;
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
		z-index: 1001;
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
		padding: var(--space-2) var(--space-4);
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
		color: white;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		font-size: var(--text-lg);
		font-weight: 700;
		color: white;
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
		gap: var(--space--4);
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
		padding: var(--space-3);
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

	/* 개선된 상세 모달창 스타일 */
	.detail-modal-content {
		max-height: 98vh;
		height: auto;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
	}

	.modal-body.compact {
		padding: var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		flex: 1 1 auto;
		overflow: visible;
		padding-bottom: 0;
		min-height: 0;
	}

	.guest-status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2);
		background: var(--neutral-50);
		border-radius: var(--radius-md);
		border: 1px solid var(--neutral-200);
		flex-shrink: 0;
	}

	.guest-info h4 {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--neutral-800);
		margin: 0 0 var(--space-1) 0;
	}

	.phone-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}

	.phone-text {
		font-size: var(--text-s);
		color: var(--neutral-600);
		flex: 1;
	}

	.call-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		text-decoration: none;
		border-radius: var(--radius-full);
		font-size: 12px;
		transition: var(--transition-all);
		cursor: pointer;
		user-select: none;
		border: 1px solid #059669;
		box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
		flex-shrink: 0;
	}

	.call-button:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		transform: translateY(-1px) scale(1.05);
		box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);
		border-color: #047857;
	}

	.call-button:active {
		background: linear-gradient(135deg, #047857 0%, #065f46 100%);
		transform: translateY(0) scale(0.95);
		box-shadow: 0 1px 3px rgba(5, 150, 105, 0.4);
	}

	.calendar-info-row {
		display: grid;
		grid-template-columns: 1.4fr 0.8fr;
		gap: var(--space-2);
		align-items: start;
		flex-shrink: 0;
	}

	.calendar-section-small {
		background: white;
		border: 1px solid var(--neutral-200);
		border-radius: var(--radius-md);
		padding: var(--space-2);
		width: 100%;
		max-width: 320px;
	}

	.calendar-header h5 {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--neutral-700);
		margin: 0 0 4px 0;
		text-align: center;
	}

	.mini-calendar {
		width: 100%;
	}

	.calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		margin-bottom: 4px;
	}

	.weekday {
		font-size: 12px;
		font-weight: 600;
		color: var(--neutral-500);
		text-align: center;
		padding: 3px;
	}

	.calendar-days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.calendar-day {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		color: var(--neutral-600);
		border-radius: var(--radius-sm);
		transition: var(--transition-colors);
		min-height: 32px;
		background: white;
		border: 1px solid var(--neutral-100);
	}

	.calendar-day.reserved {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
	}

	.calendar-day.today {
		border: 2px solid #6366f1;
		font-weight: 700;
	}

	.calendar-day.today.reserved {
		border: 2px solid #ffffff;
	}

	.basic-info-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px var(--space-1);
		background: var(--neutral-50);
		border-radius: var(--radius-sm);
		border: 1px solid var(--neutral-200);
	}

	.info-label {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--neutral-600);
	}

	.info-value {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--neutral-800);
	}

	.confirmed-info {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1);
		background: var(--neutral-50);
		border: 2px solid var(--success);
		border-radius: var(--radius-md);
		flex-wrap: wrap;
		flex-shrink: 0;
	}

	.confirmed-info.rejected-theme {
		border: 2px solid #ef4444;
		background: rgba(239, 68, 68, 0.05);
	}

	.confirmed-label {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--success);
	}

	.confirmed-admin {
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--neutral-800);
	}

	.confirmed-date {
		font-size: 10px;
		color: var(--neutral-500);
	}

	/* 액션 버튼 스타일 */
	.action-footer {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-2);
		background: var(--neutral-50);
		border-top: 1px solid var(--neutral-200);
		flex-shrink: 0;
		margin-top: 0;
	}

	.action-button {
		padding: var(--space-1);
		border: none;
		border-radius: var(--radius-md);
		font-size: 10px;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition-all);
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 36px;
	}

	.approve-btn {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
	}

	.approve-btn:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg);
	}

	.pending-btn {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
	}

	.pending-btn:hover {
		background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg);
	}

	.reject-btn {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
	}

	.reject-btn:hover {
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg);
	}

	/* 확인 모달 스타일 */
	.confirm-modal, .invalid-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1002;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
	}

	.confirm-modal-content, .invalid-modal-content {
		background: white;
		border-radius: var(--radius-xl);
		max-width: 400px;
		width: 100%;
		box-shadow: var(--shadow-2xl);
		animation: slideUp 0.3s ease;
	}

	.confirm-header, .invalid-header {
		padding: var(--space-4);
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
	}

	/* 액션별 헤더 색상 */
	.confirm-header-confirmed {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
	}

	.confirm-header-pending {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
	}

	.confirm-header-cancelled {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
	}

	.invalid-header {
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
	}

	.confirm-body, .invalid-body {
		padding: var(--space-6);
		text-align: center;
	}

	.confirm-message {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.confirm-message p {
		margin: 0;
		color: var(--neutral-700);
	}

	.action-text {
		color: var(--primary) !important;
		font-size: var(--text-lg);
	}

	.confirm-footer, .invalid-footer {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--neutral-50);
	}

	.confirm-footer {
		justify-content: stretch;
	}
	
	.confirm-footer .modal-button {
		flex: 1;
	}

	.invalid-footer {
		justify-content: center;
	}

	.cancel-btn {
		background: var(--neutral-200);
		color: var(--neutral-700);
	}

	.cancel-btn:hover {
		background: var(--neutral-300);
		color: var(--neutral-800);
	}

	.confirm-btn {
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
		color: white;
	}

	.confirm-btn:hover {
		background: linear-gradient(135deg, #5153c7 0%, #2a5eb3 100%);
	}

	/* 태블릿 및 중간 화면 (651px ~ 1024px) */
	@media (max-width: 1024px) and (min-width: 651px) {
		.detail-modal-content {
			height: auto;
			max-height: 85vh;
			overflow: hidden;
		}

		.calendar-info-row {
			grid-template-columns: 1.2fr 1.3fr;
			gap: var(--space-2);
			margin-bottom: 0;
		}

		.calendar-section-small {
			padding: var(--space-2);
			max-width: 280px;
			margin-bottom: 0;
		}

		.calendar-day {
			min-height: 30px;
			font-size: 12px;
		}

		.calendar-weekday {
			font-size: 11px;
			min-height: 22px;
		}
	}

	/* 모바일 (650px 이하) */
	@media (max-width: 650px) {
		h1.page-title {
			margin: var(--space-2) 0 var(--space-2) 0 !important;
			font-size: var(--text-2xl) !important;
		}
		
		/* 모바일에서는 전체 너비 사용 */
		.reservation-list-title,
		.reservations-list {
			max-width: none;
			margin-left: var(--space-2);
			margin-right: var(--space-2);
		}

		.step {
			display: flex;
			flex-direction: column;
			min-height: 100vh;
			transition: min-height 0.4s ease-out, height 0.4s ease-out;
		}

		.calendar-section {
			margin: 0;
			border-radius: 0;
		}

		.date-range-display {
			grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
			gap: var(--space-1);
			padding: var(--space-1);
			text-align: center;
			border-radius: var(--radius-md);
			margin-bottom: var(--space-3);
		}

		.summary-item {
			padding: var(--space-1);
			border-radius: var(--radius-sm);
			min-height: 70px;
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
			transition: height 0.4s ease-out;
			overflow: visible;
		}

		.reservation-card:last-child {
			margin-bottom: calc(var(--space-2) + env(safe-area-inset-bottom, 0px));
		}

		.no-reservations-message {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			padding: var(--space-4);
			padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
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
			height: calc(100vh - var(--space-8));
			width: calc(100vw - var(--space-8));
			max-width: calc(100vw - var(--space-8));
			display: flex;
			flex-direction: column;
			border-radius: var(--radius-lg);
			margin: 0;
			overflow: hidden;
		}

		.detail-modal {
			padding: var(--space-4);
			align-items: center;
			justify-content: center;
		}

		/* 모바일 상세 모달 스타일 */
		.guest-status-row {
			margin-bottom: var(--space-1);
			padding: var(--space-2);
		}

		.calendar-info-row {
			grid-template-columns: 1fr;
			gap: var(--space-2);
			margin: 0;
		}

		.calendar-section-small {
			order: 2;
			max-width: 100%;
			width: 100%;
			margin: 0 auto;
			padding: var(--space-1);
			margin-bottom: var(--space-1);
		}

		.calendar-day {
			min-height: 24px;
			font-size: 11px;
		}

		.calendar-weekday {
			font-size: 11px;
			padding: 2px;
			min-height: 20px;
		}

		.basic-info-section {
			order: 1;
		}

		/* Basic info section 텍스트 크기 증가 */
		.guest-info h4 {
			font-size: var(--text-lg) !important;
		}

		.phone-text {
			font-size: var(--text-base) !important;
		}

		.detail-item {
			padding: var(--space-3);
		}

		.detail-label {
			font-size: var(--text-base) !important;
		}

		.detail-value {
			font-size: var(--text-base) !important;
		}

		/* Calendar section 텍스트 크기 증가 */
		.calendar-header h5 {
			font-size: var(--text-base) !important;
		}

		.weekday {
			font-size: 13px !important;
			padding: 4px;
		}

		.modal-header {
			flex-shrink: 0;
			padding: var(--space-3) var(--space-4);
			padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
		}

		.modal-body.compact {
			flex: 1;
			overflow: visible;
			padding: var(--space-2) var(--space-3) 0 var(--space-3);
			display: flex;
			flex-direction: column;
			gap: var(--space-2);
			min-height: 0;
			margin-bottom: 0;
		}

		.action-footer {
			flex-shrink: 0;
			grid-template-columns: 1fr;
			gap: var(--space-2);
			padding: var(--space-2) var(--space-3);
			padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom, 15px));
			background: var(--neutral-50);
			border-top: 1px solid var(--neutral-200);
			position: relative;
			margin-top: auto;
		}

		.action-button {
			min-height: 52px;
			font-size: var(--text-base);
		}

		.confirm-modal-content, .invalid-modal-content {
			margin: var(--space-3);
			max-width: calc(100vw - var(--space-6));
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