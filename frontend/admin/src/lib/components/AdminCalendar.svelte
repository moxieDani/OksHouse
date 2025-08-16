<script>
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	// Props
	export let currentMonth = new Date().getMonth();
	export let currentYear = new Date().getFullYear();
	export let existingReservations = [];
	
	// Constants
	const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
	const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
	
	let today = new Date().setHours(0, 0, 0, 0);
	
	// Reactive calendar days generation - existingReservations 변경시에도 업데이트
	$: calendarDays = generateCalendarDays(currentYear, currentMonth, existingReservations);
	
	/**
	 * 달력 날짜 생성
	 * @param {number} year - 년도
	 * @param {number} month - 월 (0-11)
	 * @param {Array} reservations - 예약 데이터 (리액티브 의존성을 위해)
	 * @returns {Array} 달력 날짜 배열
	 */
	function generateCalendarDays(year, month, reservations = []) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const firstDayOfWeek = firstDay.getDay();
		const daysInMonth = lastDay.getDate();
		
		const days = [];
		
		// Previous month's trailing days
		const prevMonth = new Date(year, month, 0);
		const prevMonthLastDay = prevMonth.getDate();
		const daysFromPrevMonth = firstDayOfWeek;
		for (let i = daysFromPrevMonth; i > 0; i--) {
			const day = prevMonthLastDay - i + 1;
			const dayDate = new Date(year, month - 1, day);
			days.push({
				day,
				date: dayDate,
				isCurrentMonth: false,
				isOtherMonth: true,
				...getReservationInfo(dayDate)
			});
		}
		
		// Current month days
		for (let day = 1; day <= daysInMonth; day++) {
			const dayDate = new Date(year, month, day);
			days.push({
				day,
				date: dayDate,
				isCurrentMonth: true,
				isOtherMonth: false,
				...getReservationInfo(dayDate)
			});
		}
		
		// Next month's leading days
		const totalCells = 42; // 6 weeks × 7 days
		const remainingCells = totalCells - days.length;
		for (let day = 1; day <= remainingCells; day++) {
			const dayDate = new Date(year, month + 1, day);
			days.push({
				day,
				date: dayDate,
				isCurrentMonth: false,
				isOtherMonth: true,
				...getReservationInfo(dayDate)
			});
		}
		
		return days;
	}

	/**
	 * 특정 날짜의 예약 정보 및 범위 위치 반환
	 * @param {Date} date - 확인할 날짜
	 * @returns {Object} 예약 정보 객체
	 */
	function getReservationInfo(date) {
		if (!existingReservations || existingReservations.length === 0) {
			return { hasReservation: false, reservationStatus: null, reservationPosition: null };
		}
		
		// 날짜 비교를 위해 시간을 00:00:00으로 설정
		const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const targetTime = targetDate.getTime();
		
		for (const reservation of existingReservations) {
			const startDate = new Date(reservation.startDate.getFullYear(), reservation.startDate.getMonth(), reservation.startDate.getDate());
			const endDate = new Date(reservation.endDate.getFullYear(), reservation.endDate.getMonth(), reservation.endDate.getDate());
			
			const startTime = startDate.getTime();
			const endTime = endDate.getTime();
			
			if (targetTime >= startTime && targetTime <= endTime) {
				// 예약 범위 내에서의 위치 결정
				let position = null;
				const isStart = targetTime === startTime;
				const isEnd = targetTime === endTime;
				const isSingle = startTime === endTime;
				
				if (isSingle) {
					position = 'single';
				} else if (isStart) {
					position = 'start';
				} else if (isEnd) {
					position = 'end';
				} else {
					position = 'middle';
				}
				
				return {
					hasReservation: true,
					reservationStatus: reservation.status,
					reservationPosition: position
				};
			}
		}
		
		return { hasReservation: false, reservationStatus: null, reservationPosition: null };
	}
	
	/**
	 * 날짜 클릭 처리 - 관리자 모드에서는 예약이 있는 날짜만 클릭 가능
	 * @param {Object} dayInfo - 클릭된 날짜 정보
	 */
	function handleDateClick(dayInfo) {
		// 다른 달의 날짜를 클릭한 경우 해당 달로 이동
		if (!dayInfo.isCurrentMonth) {
			currentMonth = dayInfo.date.getMonth();
			currentYear = dayInfo.date.getFullYear();
			dispatch('monthChange', { month: currentMonth, year: currentYear });
			return;
		}

		// 예약이 있는 날짜만 클릭 가능
		if (hasReservations(dayInfo.date)) {
			const reservationsOnDate = getReservationsOnDate(dayInfo.date);
			dispatch('reservationDateClick', { 
				date: dayInfo.date, 
				reservations: reservationsOnDate 
			});
		}
	}
	
	/**
	 * 달 변경
	 * @param {number} direction - 방향 (-1: 이전달, 1: 다음달)
	 */
	function changeMonth(direction) {
		if (direction > 0) {
			if (currentMonth === 11) {
				currentMonth = 0;
				currentYear += 1;
			} else {
				currentMonth += 1;
			}
		} else {
			if (currentMonth === 0) {
				currentMonth = 11;
				currentYear -= 1;
			} else {
				currentMonth -= 1;
			}
		}
		dispatch('monthChange', { month: currentMonth, year: currentYear });
	}
	
	/**
	 * 오늘인지 확인
	 * @param {Date} date - 확인할 날짜
	 * @returns {boolean} 오늘 여부
	 */
	function isToday(date) {
		return new Date(date).setHours(0, 0, 0, 0) === today;
	}
	
	/**
	 * 특정 날짜에 예약이 있는지 확인
	 * @param {Date} date - 확인할 날짜
	 * @returns {boolean} 예약 존재 여부
	 */
	function hasReservations(date) {
		if (!existingReservations || existingReservations.length === 0) return false;
		
		// 날짜 비교를 위해 시간을 00:00:00으로 설정
		const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const targetTime = targetDate.getTime();
		
		return existingReservations.some(reservation => {
			const startDate = new Date(reservation.startDate.getFullYear(), reservation.startDate.getMonth(), reservation.startDate.getDate());
			const endDate = new Date(reservation.endDate.getFullYear(), reservation.endDate.getMonth(), reservation.endDate.getDate());
			
			return targetTime >= startDate.getTime() && targetTime <= endDate.getTime();
		});
	}
	
	/**
	 * 특정 날짜의 예약 목록 반환
	 * @param {Date} date - 확인할 날짜
	 * @returns {Array} 해당 날짜의 예약 목록
	 */
	function getReservationsOnDate(date) {
		if (!existingReservations || existingReservations.length === 0) return [];
		
		const dateTime = date.getTime();
		
		return existingReservations.filter(reservation => {
			const startDate = reservation.startDate instanceof Date 
				? reservation.startDate 
				: new Date(reservation.start_date + 'T00:00:00');
			const endDate = reservation.endDate instanceof Date
				? reservation.endDate
				: new Date(reservation.end_date + 'T00:00:00');
			
			return dateTime >= startDate.getTime() && dateTime <= endDate.getTime();
		});
	}
	
	/**
	 * 과거 날짜인지 확인
	 * @param {Date} date - 확인할 날짜
	 * @returns {boolean} 과거 날짜 여부
	 */
	function isDisabled(date) {
		return date < today;
	}

	/**
	 * 날짜 CSS 클래스 생성
	 * @param {Object} dayInfo - 날짜 정보
	 * @returns {string} CSS 클래스 문자열
	 */
	function getDayClass(dayInfo) {
		const classes = ['calendar-day'];
		const { date, isCurrentMonth, isOtherMonth, hasReservation, reservationStatus, reservationPosition } = dayInfo;
		const dayOfWeek = date.getDay();
		
		if (isOtherMonth) classes.push('other-month');
		if (isToday(date)) classes.push('today');
		if (isDisabled(date)) classes.push('disabled');
		
		// 예약 상태별 스타일 추가
		if (hasReservation && reservationStatus) {
			classes.push('has-reservation');
			classes.push(`reserved-${reservationStatus}`);
			if (reservationPosition) {
				classes.push(`position-${reservationPosition}`);
			}
		} else if (hasReservations(date)) {
			// 기존 hasReservations 함수와의 호환성
			classes.push('has-reservation');
		}
		
		if (dayOfWeek === 0) classes.push('sunday');
		if (dayOfWeek === 6) classes.push('saturday');
		
		return classes.join(' ');
	}
</script>

<div class="admin-calendar">
	<div class="calendar-header">
		<button 
			class="calendar-nav" 
			on:click={() => changeMonth(-1)}
			aria-label="이전 달"
		>
			‹
		</button>
		<span class="month-display">
			{currentYear}년 {monthNames[currentMonth]}
		</span>
		<button 
			class="calendar-nav" 
			on:click={() => changeMonth(1)}
			aria-label="다음 달"
		>
			›
		</button>
	</div>
	
	<div class="calendar-weekdays">
		{#each weekdays as day}
			<div class="calendar-weekday">{day}</div>
		{/each}
	</div>
	
	<div class="calendar-grid">
		{#each calendarDays as dayInfo}
			<button 
				class="{getDayClass(dayInfo)}"
				disabled={isDisabled(dayInfo.date) && dayInfo.isCurrentMonth}
				on:click={() => handleDateClick(dayInfo)}
				aria-label="{currentYear}년 {currentMonth + 1}월 {dayInfo.day}일"
			>
				{dayInfo.day}
				{#if dayInfo.hasReservation}
					<span class="reservation-indicator" style="color: {dayInfo.reservationStatus === 'confirmed' ? '#10b981' : dayInfo.reservationStatus === 'pending' ? '#f59e0b' : '#ef4444'}">●</span>
				{:else if hasReservations(dayInfo.date)}
					<span class="reservation-indicator">●</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.admin-calendar {
		/* 부모 calendar-section에서 스타일링 담당 */
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
		color: white;
	}

	.calendar-nav {
		background: none;
		border: none;
		color: white;
		font-size: var(--text-xl);
		cursor: pointer;
		padding: var(--space-2);
		border-radius: var(--radius-md);
		transition: var(--transition-colors);
		font-family: inherit;
	}

	.calendar-nav:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.month-display {
		font-size: var(--text-lg);
		font-weight: 600;
	}

	.calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: var(--neutral-100);
	}

	.calendar-weekday {
		padding: var(--space-3) var(--space-2);
		text-align: center;
		font-weight: 600;
		color: var(--neutral-600);
		font-size: clamp(0.75rem, 2vw, 1.125rem);
		min-height: clamp(32px, 5vw, 50px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.calendar-day {
		aspect-ratio: 1;
		background: white;
		color: var(--neutral-700);
		font-size: clamp(0.875rem, 2.5vw, 1.375rem);
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-colors);
		font-family: inherit;
		border: 1px solid var(--neutral-200);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: clamp(42px, 6vw, 60px);
		position: relative;
		border-radius: var(--radius-sm);
	}

	.calendar-day.other-month {
		color: var(--neutral-400);
		background: var(--neutral-50);
		cursor: pointer;
	}

	.calendar-day.other-month:hover {
		background: var(--neutral-200);
		color: var(--neutral-600);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.calendar-day.today {
		background: var(--accent);
		color: white !important;
		font-weight: 700;
		position: relative;
	}

	.calendar-day.disabled {
		color: var(--neutral-400);
		cursor: not-allowed;
		background: var(--neutral-100);
		opacity: 0.6;
	}

	.calendar-day.disabled:hover {
		background: var(--neutral-100);
		color: var(--neutral-400);
		transform: none;
		box-shadow: none;
	}

	.calendar-day.sunday {
		color: var(--error);
	}

	.calendar-day.saturday {
		color: #6366f1;
	}

	/* Today + disabled 상태 */
	.calendar-day.today.disabled {
		background: var(--accent) !important;
		color: white !important;
		opacity: 0.7;
		cursor: not-allowed;
	}

	.calendar-day.today.disabled:hover {
		background: var(--accent) !important;
		color: white !important;
		transform: none;
		box-shadow: none;
	}

	/* 기본 예약 스타일 (호환성을 위해 유지) */
	.calendar-day.has-reservation {
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
		border-color: #6366f1;
		color: #4f46e5;
		font-weight: 600;
		cursor: pointer;
	}

	/* 상태별 예약 스타일 */
	.calendar-day.reserved-confirmed {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
		border: 3px solid #047857; /* 테두리 두께 증가 */
	}

	.calendar-day.reserved-pending {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
		border: 3px solid #b45309; /* 테두리 두께 증가 */
	}

	.calendar-day.reserved-cancelled {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		font-weight: 600;
		box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
		border: 3px solid #b91c1c; /* 테두리 두께 증가 */
	}

	/* 예약 범위 연속 사각형 스타일 */
	.calendar-day.position-start {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		position: relative;
		border-right: none !important; /* 중간 세로 테두리 제거 */
	}

	.calendar-day.position-middle {
		border-radius: 0;
		position: relative;
		border-left: none !important; /* 중간 세로 테두리 제거 */
		border-right: none !important; /* 중간 세로 테두리 제거 */
	}

	.calendar-day.position-end {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		position: relative;
		border-left: none !important; /* 중간 세로 테두리 제거 */
	}

	.calendar-day.position-single {
		/* 단일 날짜는 기본 border-radius 유지 */
		border-radius: var(--radius-sm);
	}

	.calendar-day:hover {
		background: var(--neutral-50);
		border-color: var(--neutral-300);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.calendar-day.has-reservation:hover {
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%);
		color: #4338ca;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(99, 102, 241, 0.2);
	}

	/* 예약된 날짜 hover 효과 */
	.calendar-day.reserved-confirmed:hover,
	.calendar-day.reserved-pending:hover,
	.calendar-day.reserved-cancelled:hover {
		transform: translateY(-1px);
		filter: brightness(1.1);
		box-shadow: 0 4px 8px rgba(0,0,0,0.2);
	}

	/* 오늘 + 예약이 있는 날짜 */
	.calendar-day.today.has-reservation {
		background: var(--accent) !important;
		border-color: #6366f1;
		color: #4f46e5;
	}

	.calendar-day.today.has-reservation:hover {
		background: var(--accent) !important;
		color: #4338ca;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(99, 102, 241, 0.2);
	}

	/* 오늘 + 예약 상태별 스타일 */
	.calendar-day.today.reserved-confirmed,
	.calendar-day.today.reserved-pending,
	.calendar-day.today.reserved-cancelled {
		border: 2px solid #ffffff;
		box-shadow: 0 0 0 2px currentColor;
	}

	.reservation-indicator {
		position: absolute;
		top: clamp(2px, 0.8vw, 6px);
		right: clamp(2px, 0.8vw, 6px);
		font-size: clamp(6px, 1.2vw, 14px);
		color: #6366f1;
		line-height: 1;
	}

	.calendar-day.today .reservation-indicator {
		color: #4f46e5;
	}

	/* 극소형 모바일에서는 최소값 보장 */
	@media (max-width: 480px) {
		.calendar-weekday {
			font-size: 0.75rem;
			min-height: 30px;
		}
		
		.calendar-day {
			font-size: 0.875rem;
			min-height: 40px;
		}

		.reservation-indicator {
			font-size: 6px;
			top: 2px;
			right: 2px;
		}
	}

	/* 대형 화면에서는 최대값 보장 */
	@media (min-width: 1400px) {
		.calendar-weekday {
			font-size: 1.125rem;
			min-height: 50px;
		}
		
		.calendar-day {
			font-size: 1.375rem;
			min-height: 60px;
		}

		.reservation-indicator {
			font-size: 14px;
			top: 6px;
			right: 6px;
		}
	}
</style>