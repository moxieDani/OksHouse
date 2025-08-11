<svelte:options accessors={true} />

<script>
	import { createEventDispatcher } from 'svelte';
	import { setStartDate } from '$lib/stores/reservation.js';
	
	const dispatch = createEventDispatcher();
	
	export let selectedDate = null;
	export let duration = 0;
	export let isModificationMode = false;
	export let readOnly = false;
	export let currentMonth = new Date().getMonth();
	export let currentYear = new Date().getFullYear();
	export let existingReservations = [];
	
	
	
	const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
	const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
	
	let today = new Date().setHours(0, 0, 0, 0);
	$: calendarDays = generateCalendarDays(currentYear, currentMonth);
	$: endDate = selectedDate && duration ? new Date(selectedDate.getTime() + (duration * 24 * 60 * 60 * 1000)) : null;
	
	
	function generateCalendarDays(year, month) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const firstDayOfWeek = firstDay.getDay();
		const daysInMonth = lastDay.getDate();
		
		const days = [];
		
		// Previous month's trailing days
		const prevMonth = new Date(year, month, 0);  // Last day of previous month (correct calculation)
		const prevMonthLastDay = prevMonth.getDate();
		const daysFromPrevMonth = firstDayOfWeek;
		for (let i = daysFromPrevMonth; i > 0; i--) {
			const day = prevMonthLastDay - i + 1;
			days.push({
				day,
				date: new Date(year, month - 1, day),
				isCurrentMonth: false,
				isOtherMonth: true
			});
		}
		
		// Current month days
		for (let day = 1; day <= daysInMonth; day++) {
			days.push({
				day,
				date: new Date(year, month, day),
				isCurrentMonth: true,
				isOtherMonth: false
			});
		}
		
		// Next month's leading days
		const totalCells = 42; // 6 weeks × 7 days
		const remainingCells = totalCells - days.length;
		for (let day = 1; day <= remainingCells; day++) {
			days.push({
				day,
				date: new Date(year, month + 1, day),
				isCurrentMonth: false,
				isOtherMonth: true
			});
		}
		
		return days;
	}
	
	function handleDateClick(dayInfo) {
		if (readOnly) {
			return;
		}
		
		// Don't allow past dates
		if (dayInfo.date < today) {
			return;
		}

		// Don't allow blocked dates
		if (isBlocked(dayInfo.date)) {
			dispatch('blockedDateClick', { date: dayInfo.date, message: '이미 예약된 날짜입니다.' });
			return;
		}

		// Check if proposed range would conflict with existing reservations
		if (duration > 0 && wouldConflictWithExisting(dayInfo.date, duration)) {
			dispatch('conflictDetected', { 
				date: dayInfo.date, 
				duration: duration,
				message: '선택하신 기간에 이미 예약된 날짜가 포함되어 있습니다.' 
			});
			return;
		}
		
		// Handle other-month dates - navigate to that month and select the date
		if (!dayInfo.isCurrentMonth) {
			// Navigate to the month of the clicked date first
			currentMonth = dayInfo.date.getMonth();
			currentYear = dayInfo.date.getFullYear();
			
			// Then select the date after month change
			selectedDate = dayInfo.date;
			setStartDate(dayInfo.date);
			
			// Calculate end date for highlighting
			if (duration > 0) {
				endDate = new Date(dayInfo.date.getTime() + (duration * 24 * 60 * 60 * 1000));
			}
			
			// Dispatch events
			dispatch('monthChange', { month: currentMonth, year: currentYear });
			dispatch('dateSelect', dayInfo.date);
			return;
		}
		
		// Check for same date reselection
		if (selectedDate && selectedDate.getTime() === dayInfo.date.getTime()) {
			selectedDate = null;
			setStartDate(null);
			dispatch('dateSelect', null);
			return;
		}
		
		selectedDate = dayInfo.date;
		setStartDate(dayInfo.date);
		
		// 자동으로 날짜 범위 표시 업데이트
		if (duration > 0) {
			endDate = new Date(dayInfo.date.getTime() + (duration * 24 * 60 * 60 * 1000));
		}
		
		dispatch('dateSelect', dayInfo.date);
	}
	
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
	
	function isToday(date) {
		return new Date(date).setHours(0, 0, 0, 0) === today;
	}
	
	function isSelected(date) {
		return selectedDate && selectedDate.getTime() === date.getTime();
	}
	
	function isInRange(date) {
		if (!selectedDate || !duration) return false;
		const dateTime = date.getTime();
		const startTime = selectedDate.getTime();
		const endTime = selectedDate.getTime() + (duration * 24 * 60 * 60 * 1000);
		// Include both checkin and checkout days in the range
		return dateTime >= startTime && dateTime <= endTime;
	}
	
	function isDisabled(date) {
		return date < today;
	}

	// Check if a date is blocked by existing reservations
	function isBlocked(date) {
		if (!existingReservations || existingReservations.length === 0) return false;
		
		const dateTime = date.getTime();
		
		return existingReservations.some(reservation => {
			const startDate = reservation.startDate instanceof Date 
				? reservation.startDate 
				: new Date(reservation.start_date + 'T00:00:00');
			const endDate = reservation.endDate instanceof Date
				? reservation.endDate
				: new Date(reservation.end_date + 'T00:00:00');
			
			
			// Check if date falls within existing reservation period (inclusive)
			return dateTime >= startDate.getTime() && dateTime <= endDate.getTime();
		});
	}

	// Check if a proposed date range would conflict with existing reservations
	function wouldConflictWithExisting(startDate, duration) {
		if (!startDate || !duration || !existingReservations || existingReservations.length === 0) {
			return false;
		}
		
		// Check each day in the proposed range (including checkout day)
		for (let i = 0; i <= duration; i++) {
			const checkDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
			if (isBlocked(checkDate)) {
				return true;
			}
		}
		
		return false;
	}
	
	// 통합된 날짜 클래스 생성 함수 - 성능 최적화를 위해 단일 함수로 통합
	function getDayClass(dayInfo, currentSelectedDate = selectedDate, currentDuration = duration) {
		const classes = ['calendar-day'];
		const { date, isCurrentMonth, isOtherMonth } = dayInfo;
		const dayOfWeek = date.getDay();
		
		if (isOtherMonth) classes.push('other-month');
		if (isToday(date)) classes.push('today');
		if (currentSelectedDate && currentSelectedDate.getTime() === date.getTime()) classes.push('selected');
		if (isInRange(date)) classes.push('in-range');
		if (isDisabled(date)) classes.push('disabled');
		if (isBlocked(date)) classes.push('blocked');
		if (dayOfWeek === 0) classes.push('sunday');
		if (dayOfWeek === 6) classes.push('saturday');
		if (isModificationMode) classes.push('modification');
		
		return classes.join(' ');
	}
	
	export function navigateToDate(date) {
		currentMonth = date.getMonth();
		currentYear = date.getFullYear();
	}
</script>

<div class="calendar">
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
				class="{getDayClass(dayInfo, selectedDate, duration)}"
				class:readonly={readOnly}
				disabled={isDisabled(dayInfo.date) || readOnly}
				on:click={() => handleDateClick(dayInfo)}
				aria-label="{currentYear}년 {currentMonth + 1}월 {dayInfo.day}일"
			>
				{#if isBlocked(dayInfo.date)}
					<span class="blocked-date-content">
						<span class="blocked-x">✕</span>
						<span class="blocked-day">{dayInfo.day}</span>
					</span>
				{:else}
					{dayInfo.day}
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.calendar {
		background: white;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		margin-bottom: var(--space-6);
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		background: var(--primary);
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
		padding: var(--space-2);
		text-align: center;
		font-weight: 600;
		color: var(--neutral-600);
		font-size: var(--text-sm);
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.calendar-day {
		aspect-ratio: 1;
		border: none;
		background: white;
		color: var(--neutral-700);
		font-size: var(--text-base);
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-colors);
		font-family: inherit;
		border: 1px solid var(--neutral-200);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 45px;
	}

	.calendar-day:not(.disabled):not(.other-month):not(.readonly):hover {
		background: var(--primary-light);
		color: white !important;
	}

	.calendar-day.other-month {
		color: var(--neutral-400);
		background: var(--neutral-50);
	}

	.calendar-day.today {
		background: var(--accent);
		color: white !important;
		font-weight: 700;
	}

	.calendar-day.selected {
		background: var(--primary);
		color: white !important;
		font-weight: 700;
		box-shadow: inset 0 0 0 2px var(--primary-dark);
	}

	.calendar-day.in-range {
		background: rgba(67, 56, 202, 0.2);
		color: var(--primary);
		border-color: rgba(67, 56, 202, 0.3);
		font-weight: 600;
	}

	.calendar-day.disabled {
		color: var(--neutral-400);
		cursor: not-allowed;
		background: var(--neutral-100);
	}

	.calendar-day.readonly {
		cursor: default !important;
		pointer-events: none;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

	.calendar-day.sunday {
		color: var(--error);
	}

	.calendar-day.saturday {
		color: var(--primary);
	}

	/* Modification mode styling */
	.calendar-day.modification.selected {
		background: var(--warning);
		color: white !important;
		box-shadow: inset 0 0 0 2px #d97706;
	}

	.calendar-day.modification.in-range {
		background: rgba(245, 158, 11, 0.2);
		color: var(--warning);
	}

	.calendar-day.modification:not(.disabled):not(.other-month):not(.readonly):hover {
		background: var(--warning);
		color: white !important;
	}

	.calendar-header.modification {
		background: var(--warning);
	}

	/* Blocked dates styling */
	.calendar-day.blocked {
		background: rgba(239, 68, 68, 0.1);
		border-color: var(--error);
		color: var(--error);
		cursor: not-allowed;
		position: relative;
	}

	.calendar-day.blocked:hover {
		background: rgba(239, 68, 68, 0.2);
		color: var(--error);
		transform: none;
	}

	/* Today + Blocked styling - preserve only today background color */
	.calendar-day.today.blocked {
		background: var(--accent) !important;
		border-color: var(--error);
		color: var(--error);
		cursor: not-allowed;
		position: relative;
	}

	.calendar-day.today.blocked:hover {
		background: var(--accent) !important;
		color: var(--error);
		transform: none;
	}

	.blocked-date-content {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.blocked-x {
		position: absolute;
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--error);
		line-height: 1;
		z-index: 2;
		text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
	}

	.blocked-day {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--error);
		opacity: 0.7;
		z-index: 1;
	}

	/* Override disabled state for blocked dates */
	.calendar-day.blocked:disabled {
		opacity: 1;
		background: rgba(239, 68, 68, 0.1);
		color: var(--error);
		border-color: var(--error);
	}

	@media (max-width: 640px) {
		.calendar-day {
			font-size: var(--text-sm);
			min-height: 40px;
		}

		.calendar-day.readonly {
			cursor: default !important;
			pointer-events: none !important;
			-webkit-tap-highlight-color: transparent !important;
			touch-action: none;
		}

		.calendar-weekday {
			font-size: var(--text-xs);
			padding: var(--space-1);
		}

		.month-display {
			font-size: var(--text-base);
		}

		.blocked-x {
			font-size: var(--text-base);
		}

		.blocked-day {
			font-size: var(--text-sm);
		}
	}
</style>