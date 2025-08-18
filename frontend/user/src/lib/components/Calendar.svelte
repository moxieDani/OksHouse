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
	export let originalReservation = null; // 수정 중인 원본 예약 정보
	export let selectedReservation = null; // manage 페이지에서 선택된 예약 정보
	export let isRefreshing = false;
	export let onRefresh = null;
	
	
	
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

		// In modification mode, prevent selecting the same dates as original
		if (isModificationMode && duration > 0 && isSameDatesAsOriginal(dayInfo.date, duration)) {
			dispatch('sameDatesSelected', { 
				date: dayInfo.date, 
				duration: duration,
				message: '기존 예약과 동일한 날짜입니다. 다른 날짜를 선택해주세요.' 
			});
			return;
		}
		
		// Handle other-month dates - navigate to that month and select the date
		if (!dayInfo.isCurrentMonth) {
			// Navigate to the month of the clicked date first
			currentMonth = dayInfo.date.getMonth();
			currentYear = dayInfo.date.getFullYear();
			
			// Dispatch month change event first to load new data
			dispatch('monthChange', { month: currentMonth, year: currentYear });
			
			// Then select the date after month change
			selectedDate = dayInfo.date;
			setStartDate(dayInfo.date);
			
			// Calculate end date for highlighting
			if (duration > 0) {
				endDate = new Date(dayInfo.date.getTime() + (duration * 24 * 60 * 60 * 1000));
			}
			
			// Dispatch date select event
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

	// Check if a date is part of the original reservation being modified
	function isOriginalReservation(date) {
		if (!isModificationMode || !originalReservation) return false;
		
		const dateTime = date.getTime();
		const originalStartDate = originalReservation.startDate instanceof Date 
			? originalReservation.startDate 
			: new Date(originalReservation.start_date + 'T00:00:00');
		const originalEndDate = originalReservation.endDate instanceof Date
			? originalReservation.endDate
			: new Date(originalReservation.end_date + 'T00:00:00');
		
		return dateTime >= originalStartDate.getTime() && dateTime <= originalEndDate.getTime();
	}

	// Get the status of the original reservation for styling
	function getOriginalReservationStatus() {
		if (!isModificationMode || !originalReservation) return null;
		return originalReservation.status || 'pending';
	}

	// Check if a date is part of the selected reservation (for manage page)
	function isSelectedReservation(date) {
		if (!readOnly || !selectedReservation) return false;
		
		const dateTime = date.getTime();
		const selectedStartDate = selectedReservation.startDate instanceof Date 
			? selectedReservation.startDate 
			: new Date(selectedReservation.start_date + 'T00:00:00');
		const selectedEndDate = selectedReservation.endDate instanceof Date
			? selectedReservation.endDate
			: new Date(selectedReservation.end_date + 'T00:00:00');
		
		return dateTime >= selectedStartDate.getTime() && dateTime <= selectedEndDate.getTime();
	}

	// Get the status of the selected reservation for styling
	function getSelectedReservationStatus() {
		if (!readOnly || !selectedReservation) return null;
		return selectedReservation.status || 'pending';
	}

	// Check if the selected dates are identical to original reservation
	function isSameDatesAsOriginal(startDate, duration) {
		if (!isModificationMode || !originalReservation || !startDate || !duration) return false;
		
		const newStartTime = startDate.getTime();
		const newEndTime = startDate.getTime() + (duration * 24 * 60 * 60 * 1000);
		
		const originalStartDate = originalReservation.startDate instanceof Date 
			? originalReservation.startDate 
			: new Date(originalReservation.start_date + 'T00:00:00');
		const originalEndDate = originalReservation.endDate instanceof Date
			? originalReservation.endDate
			: new Date(originalReservation.end_date + 'T00:00:00');
		
		return newStartTime === originalStartDate.getTime() && newEndTime === originalEndDate.getTime();
	}

	// Check if a date is blocked by existing reservations
	function isBlocked(date) {
		if (!existingReservations || existingReservations.length === 0) return false;
		
		// In modification mode, original reservation dates should not be blocked
		if (isModificationMode && isOriginalReservation(date)) {
			return false;
		}
		
		const dateTime = date.getTime();
		const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
		
		const blocked = existingReservations.some(reservation => {
			// Skip the original reservation being modified
			if (isModificationMode && originalReservation && 
				reservation.id === originalReservation.id) {
				return false;
			}
			
			const startDate = reservation.startDate instanceof Date 
				? reservation.startDate 
				: new Date(reservation.start_date + 'T00:00:00');
			const endDate = reservation.endDate instanceof Date
				? reservation.endDate
				: new Date(reservation.end_date + 'T00:00:00');
			
			const isBlocked = dateTime >= startDate.getTime() && dateTime <= endDate.getTime();
			
			return isBlocked;
		});
		
		return blocked;
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
		if (!readOnly && currentSelectedDate && currentSelectedDate.getTime() === date.getTime()) classes.push('selected');
		if (isInRange(date)) classes.push('in-range');
		if (isDisabled(date)) classes.push('disabled');
		if (isBlocked(date)) classes.push('blocked');
		if (isOriginalReservation(date)) {
			classes.push('original-reservation');
			const status = getOriginalReservationStatus();
			if (status) classes.push(`original-reservation-${status}`);
		}
		if (isSelectedReservation(date)) {
			classes.push('selected-reservation');
			const status = getSelectedReservationStatus();
			if (status) classes.push(`selected-reservation-${status}`);
		}
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
		<div class="header-center">
			<span class="month-display">
				{currentYear}년 {monthNames[currentMonth]}
			</span>
			{#if onRefresh}
				<button 
					class="refresh-button"
					on:click={onRefresh}
					disabled={isRefreshing}
					title="예약 정보 새로고침"
				>
					<span class="refresh-icon {isRefreshing ? 'spinning' : ''}">🔄</span>
				</button>
			{/if}
		</div>
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
				{#if isOriginalReservation(dayInfo.date)}
					<span class="original-date-content">
						<span class="original-indicator">📝</span>
						<span class="original-day">{dayInfo.day}</span>
					</span>
				{:else if isBlocked(dayInfo.date)}
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

	.header-center {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.month-display {
		font-size: var(--text-lg);
		font-weight: 600;
	}

	.refresh-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: var(--radius-md);
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 0.2s ease;
		backdrop-filter: blur(4px);
	}

	.refresh-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.refresh-button:disabled {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
		cursor: not-allowed;
		transform: none;
		opacity: 0.7;
	}

	.refresh-icon {
		font-size: var(--text-base);
		transition: transform 0.3s ease;
	}

	.refresh-icon.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
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

	/* Modification mode styling - use same colors as normal reservation */
	.calendar-day.modification.selected {
		background: var(--primary);
		color: white !important;
		box-shadow: inset 0 0 0 2px var(--primary-dark);
	}

	.calendar-day.modification.in-range {
		background: rgba(67, 56, 202, 0.2);
		color: var(--primary);
	}

	.calendar-day.modification:not(.disabled):not(.other-month):not(.readonly):hover {
		background: var(--primary-light);
		color: white !important;
	}

	.calendar-header.modification {
		background: var(--primary);
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

	/* Original reservation styling - match reservation status colors */
	.calendar-day.original-reservation {
		position: relative;
	}

	/* Confirmed reservation styling (예약확정) - green */
	.calendar-day.original-reservation-confirmed {
		background: rgba(5, 150, 105, 0.15);
		border-color: #059669;
		color: #047857;
	}

	.calendar-day.original-reservation-confirmed:hover {
		background: rgba(5, 150, 105, 0.25);
		color: #047857;
		transform: none;
	}

	/* Pending reservation styling (예약대기) - orange */
	.calendar-day.original-reservation-pending {
		background: rgba(245, 158, 11, 0.15);
		border-color: #f59e0b;
		color: #d97706;
	}

	.calendar-day.original-reservation-pending:hover {
		background: rgba(245, 158, 11, 0.25);
		color: #d97706;
		transform: none;
	}

	/* Cancelled reservation styling (예약거부) - red */
	.calendar-day.original-reservation-cancelled {
		background: rgba(220, 38, 38, 0.15);
		border-color: #dc2626;
		color: #b91c1c;
	}

	.calendar-day.original-reservation-cancelled:hover {
		background: rgba(220, 38, 38, 0.25);
		color: #b91c1c;
		transform: none;
	}

	/* Original reservation + Today styling */
	.calendar-day.today.original-reservation-confirmed {
		background: var(--accent) !important;
		border-color: #059669;
		color: #047857;
		position: relative;
	}

	.calendar-day.today.original-reservation-confirmed:hover {
		background: var(--accent) !important;
		color: #047857;
		transform: none;
	}

	.calendar-day.today.original-reservation-pending {
		background: var(--accent) !important;
		border-color: #f59e0b;
		color: #d97706;
		position: relative;
	}

	.calendar-day.today.original-reservation-pending:hover {
		background: var(--accent) !important;
		color: #d97706;
		transform: none;
	}

	.calendar-day.today.original-reservation-cancelled {
		background: var(--accent) !important;
		border-color: #dc2626;
		color: #b91c1c;
		position: relative;
	}

	.calendar-day.today.original-reservation-cancelled:hover {
		background: var(--accent) !important;
		color: #b91c1c;
		transform: none;
	}

	.original-date-content {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.original-indicator {
		position: absolute;
		font-size: var(--text-sm);
		line-height: 1;
		z-index: 2;
		top: 2px;
		right: 2px;
	}

	.original-day {
		font-size: var(--text-base);
		font-weight: 600;
		z-index: 1;
	}

	/* Status-specific text colors for original reservation day numbers */
	.calendar-day.original-reservation-confirmed .original-day {
		color: #047857;
	}

	.calendar-day.original-reservation-pending .original-day {
		color: #d97706;
	}

	.calendar-day.original-reservation-cancelled .original-day {
		color: #b91c1c;
	}

	/* Selected reservation styling (for manage page readonly calendar) */
	.calendar-day.selected-reservation {
		position: relative;
	}

	/* Confirmed selected reservation styling - green */
	.calendar-day.selected-reservation-confirmed {
		background: rgba(5, 150, 105, 0.15);
		border-color: #059669;
		color: #047857;
	}

	.calendar-day.selected-reservation-confirmed:hover {
		background: rgba(5, 150, 105, 0.25);
		color: #047857;
		transform: none;
	}

	/* Pending selected reservation styling - orange */
	.calendar-day.selected-reservation-pending {
		background: rgba(245, 158, 11, 0.15);
		border-color: #f59e0b;
		color: #d97706;
	}

	.calendar-day.selected-reservation-pending:hover {
		background: rgba(245, 158, 11, 0.25);
		color: #d97706;
		transform: none;
	}

	/* Cancelled selected reservation styling - red */
	.calendar-day.selected-reservation-cancelled {
		background: rgba(220, 38, 38, 0.15);
		border-color: #dc2626;
		color: #b91c1c;
	}

	.calendar-day.selected-reservation-cancelled:hover {
		background: rgba(220, 38, 38, 0.25);
		color: #b91c1c;
		transform: none;
	}

	/* Selected reservation + Today styling */
	.calendar-day.today.selected-reservation-confirmed {
		background: var(--accent) !important;
		border-color: #059669;
		color: #047857;
		position: relative;
	}

	.calendar-day.today.selected-reservation-confirmed:hover {
		background: var(--accent) !important;
		color: #047857;
		transform: none;
	}

	.calendar-day.today.selected-reservation-pending {
		background: var(--accent) !important;
		border-color: #f59e0b;
		color: #d97706;
		position: relative;
	}

	.calendar-day.today.selected-reservation-pending:hover {
		background: var(--accent) !important;
		color: #d97706;
		transform: none;
	}

	.calendar-day.today.selected-reservation-cancelled {
		background: var(--accent) !important;
		border-color: #dc2626;
		color: #b91c1c;
		position: relative;
	}

	.calendar-day.today.selected-reservation-cancelled:hover {
		background: var(--accent) !important;
		color: #b91c1c;
		transform: none;
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

		.original-indicator {
			font-size: var(--text-xs);
		}

		.original-day {
			font-size: var(--text-sm);
		}
	}
</style>