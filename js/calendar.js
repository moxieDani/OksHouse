/**
 * OksHouse Calendar Module
 * Reusable calendar functionality for reservation system
 */
class OksCalendar {
    constructor(options = {}) {
        // Configuration
        this.options = {
            containerId: options.containerId || 'calendar-container',
            dateRangeDisplayId: options.dateRangeDisplayId || 'dateRangeDisplay',
            nextButtonId: options.nextButtonId || 'nextBtn2',
            primaryColor: options.primaryColor || '#3498db',
            rangeBgColor: options.rangeBgColor || '#e3f2fd',
            rangeTextColor: options.rangeTextColor || '#1976d2',
            weekdays: options.weekdays || ['일', '월', '화', '수', '목', '금', '토'],
            onDateSelect: options.onDateSelect || null,
            onMonthChange: options.onMonthChange || null,
            readOnly: options.readOnly || false,
            ...options
        };
        
        // Internal element IDs (generated)
        this.calendarId = `calendar-${Date.now()}`;
        this.monthDisplayId = `month-${this.calendarId}`;
        this.calendarGridId = `grid-${this.calendarId}`;

        // State
        this.selectedStartDate = null;
        this.selectedDuration = 0;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        // Constants
        this.monthNames = ["1월", "2월", "3월", "4월", "5월", "6월",
                          "7월", "8월", "9월", "10월", "11월", "12월"];
        this.dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        
        this.init();
    }

    init() {
        this.setCSSVariables();
        this.createCalendarHTML();
        this.render();
    }
    
    createCalendarHTML() {
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            console.error(`Calendar container with ID '${this.options.containerId}' not found`);
            return;
        }
        
        container.innerHTML = `
            <div class="calendar" id="${this.calendarId}">
                <div class="calendar-header">
                    <button class="calendar-nav" data-direction="-1">‹</button>
                    <span id="${this.monthDisplayId}"></span>
                    <button class="calendar-nav" data-direction="1">›</button>
                </div>
                <div class="calendar-weekdays">
                    ${this.options.weekdays.map(day => 
                        `<div class="calendar-weekday">${day}</div>`
                    ).join('')}
                </div>
                <div class="calendar-grid" id="${this.calendarGridId}"></div>
            </div>
        `;
        
        // Attach event listeners to navigation buttons
        const navButtons = container.querySelectorAll('.calendar-nav');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const direction = parseInt(button.getAttribute('data-direction'));
                this.changeMonth(direction);
            });
        });
    }

    setCSSVariables() {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', this.options.primaryColor);
        root.style.setProperty('--range-bg-color', this.options.rangeBgColor);
        root.style.setProperty('--range-text-color', this.options.rangeTextColor);
    }

    // Public API Methods
    setDuration(days) {
        this.selectedDuration = days;
        if (this.selectedStartDate) {
            this.updateDateRangeDisplay();
            this.highlightDateRange();
        }
    }
    
    // Method to get the calendar HTML structure (for documentation)
    getRequiredHTML() {
        return `
<!-- Container where calendar will be rendered -->
<div id="${this.options.containerId}"></div>

<!-- Date range display (optional, place where you want it) -->
<div class="date-range-display" id="${this.options.dateRangeDisplayId}">
    날짜를 선택해주세요
</div>`;
    }

    selectDate(date) {
        this.selectedStartDate = date;
        this.updateDateRangeDisplay();
        this.highlightDateRange();
        this.enableNextButton();
    }

    reset() {
        this.selectedStartDate = null;
        this.clearSelection();
        this.restoreTodayHighlight();
        this.updateDateRangeDisplay();
        this.disableNextButton();
    }

    navigateToDate(date) {
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();
        this.render();
        
        setTimeout(() => {
            if (this.selectedStartDate && this.selectedDuration > 0) {
                this.highlightDateRange();
            }
        }, 50);
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
        
        if (this.options.onMonthChange) {
            this.options.onMonthChange(this.currentMonth, this.currentYear);
        }
        
        // Restore selection after navigation
        if (this.selectedStartDate && this.selectedDuration > 0) {
            setTimeout(() => this.highlightDateRange(), 50);
        }
    }

    // Core rendering methods
    render() {
        this.updateMonthDisplay();
        this.renderCalendarGrid();
    }

    updateMonthDisplay() {
        const monthElement = document.getElementById(this.monthDisplayId);
        if (monthElement) {
            monthElement.textContent = `${this.currentYear}년 ${this.monthNames[this.currentMonth]}`;
        }
    }

    renderCalendarGrid() {
        const container = document.getElementById(this.calendarGridId);
        if (!container) return;

        container.innerHTML = '';
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Render previous month days
        this.renderPreviousMonthDays(container, firstDayOfWeek);
        
        // Render current month days
        this.renderCurrentMonthDays(container, daysInMonth);
        
        // Render next month days
        this.renderNextMonthDays(container, firstDayOfWeek, daysInMonth);
    }

    renderPreviousMonthDays(container, firstDayOfWeek) {
        const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
        
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const prevDate = prevMonthLastDay - i;
            const dayElement = this.createDayElement(prevDate, 'other-month');
            const prevMonthDate = new Date(this.currentYear, this.currentMonth - 1, prevDate);
            
            this.configureDayElement(dayElement, prevMonthDate);
            container.appendChild(dayElement);
        }
    }

    renderCurrentMonthDays(container, daysInMonth) {
        const today = new Date();
        const todayStr = today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(day);
            const dayDate = new Date(this.currentYear, this.currentMonth, day);
            const dayStr = dayDate.setHours(0, 0, 0, 0);
            
            // Mark today
            if (dayStr === todayStr) {
                dayElement.classList.add('today');
            }
            
            this.configureDayElement(dayElement, dayDate);
            container.appendChild(dayElement);
        }
    }

    renderNextMonthDays(container, firstDayOfWeek, daysInMonth) {
        const totalCells = 42; // 6 weeks × 7 days
        const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, 'other-month');
            const nextMonthDate = new Date(this.currentYear, this.currentMonth + 1, day);
            
            this.configureDayElement(dayElement, nextMonthDate);
            container.appendChild(dayElement);
        }
    }

    createDayElement(day, additionalClass = '') {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${additionalClass}`.trim();
        dayElement.textContent = day;
        return dayElement;
    }

    configureDayElement(dayElement, date) {
        const today = new Date().setHours(0, 0, 0, 0);
        const dayOfWeek = date.getDay();
        
        if (date < today) {
            dayElement.classList.add('disabled');
        } else {
            // Apply weekend colors
            if (dayOfWeek === 0) dayElement.classList.add('sunday');
            if (dayOfWeek === 6) dayElement.classList.add('saturday');
            
            // Add click handler only if not in read-only mode
            if (!this.options.readOnly) {
                dayElement.onclick = () => this.handleDateClick(date, dayElement);
            }
        }
    }

    handleDateClick(date, element) {
        // Check for same date reselection
        if (this.selectedStartDate && this.selectedStartDate.getTime() === date.getTime()) {
            this.reset();
            return;
        }

        this.clearSelection();
        this.restoreTodayHighlight();
        
        this.selectedStartDate = date;
        element.classList.add('selected');
        element.classList.remove('today'); // Selected state takes priority
        
        this.enableNextButton();
        
        if (this.selectedDuration > 0) {
            const endDate = new Date(date);
            endDate.setDate(date.getDate() + this.selectedDuration);
            
            this.updateDateRangeDisplay();
            this.navigateToOptimalView(date, endDate);
        }
        
        // Callback for custom handling
        if (this.options.onDateSelect) {
            this.options.onDateSelect(date, this.selectedDuration);
        }
    }

    navigateToOptimalView(startDate, endDate) {
        // Navigate to start date month if different
        if (startDate.getMonth() !== this.currentMonth || startDate.getFullYear() !== this.currentYear) {
            this.navigateToDate(startDate);
            return;
        }
        
        // Navigate to end date month if range extends too far
        if (endDate.getMonth() !== this.currentMonth || endDate.getFullYear() !== this.currentYear) {
            const currentMonthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);
            const daysFromMonthEnd = Math.ceil((endDate - currentMonthEnd) / (1000 * 60 * 60 * 24));
            
            if (daysFromMonthEnd > 7) {
                this.navigateToDate(endDate);
                return;
            }
        }
        
        // Display range in current view
        this.highlightDateRange();
    }

    // Selection and display methods
    clearSelection() {
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected', 'in-range');
        });
    }

    restoreTodayHighlight() {
        const today = new Date();
        const todayStr = today.setHours(0, 0, 0, 0);
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            if (day.textContent && !day.classList.contains('disabled')) {
                const dayDate = this.parseDayElementDate(day);
                if (dayDate && dayDate.setHours(0, 0, 0, 0) === todayStr) {
                    day.classList.add('today');
                }
            }
        });
    }

    parseDayElementDate(dayElement) {
        const dayNum = parseInt(dayElement.textContent);
        
        if (dayElement.classList.contains('other-month')) {
            return dayNum > 15 
                ? new Date(this.currentYear, this.currentMonth - 1, dayNum)
                : new Date(this.currentYear, this.currentMonth + 1, dayNum);
        } else {
            return new Date(this.currentYear, this.currentMonth, dayNum);
        }
    }

    highlightDateRange() {
        if (!this.selectedStartDate || this.selectedDuration <= 0) return;
        
        const endDate = new Date(this.selectedStartDate);
        endDate.setDate(this.selectedStartDate.getDate() + this.selectedDuration);
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            if (day.textContent && !day.classList.contains('disabled')) {
                const dayDate = this.parseDayElementDate(day);
                
                if (dayDate.getTime() === this.selectedStartDate.getTime()) {
                    day.classList.add('selected');
                } else if (dayDate > this.selectedStartDate && dayDate <= endDate) {
                    day.classList.add('in-range');
                }
            }
        });
    }

    updateDateRangeDisplay() {
        const displayElement = document.getElementById(this.options.dateRangeDisplayId);
        if (!displayElement) return;
        
        if (!this.selectedStartDate) {
            displayElement.textContent = '날짜를 선택해주세요';
            displayElement.classList.remove('selected');
            return;
        }
        
        if (this.selectedDuration > 0) {
            const endDate = new Date(this.selectedStartDate);
            endDate.setDate(this.selectedStartDate.getDate() + this.selectedDuration);
            
            const startStr = this.formatKoreanDate(this.selectedStartDate);
            const endStr = this.formatKoreanDate(endDate);
            displayElement.textContent = `${startStr} - ${endStr}`;
            displayElement.classList.add('selected');
        }
    }

    // Button control methods
    enableNextButton() {
        const nextBtn = document.getElementById(this.options.nextButtonId);
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }

    disableNextButton() {
        const nextBtn = document.getElementById(this.options.nextButtonId);
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        }
    }

    // Utility methods
    formatKoreanDate(date) {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }

    formatDayOfWeek(date) {
        return this.dayNames[date.getDay()];
    }

    // Reservation info formatting
    formatReservationInfo(title, primaryColor) {
        if (!this.selectedStartDate || this.selectedDuration <= 0) return '';
        
        const endDate = new Date(this.selectedStartDate);
        endDate.setDate(this.selectedStartDate.getDate() + this.selectedDuration);
        
        const startStr = this.formatKoreanDate(this.selectedStartDate);
        const endStr = this.formatKoreanDate(endDate);
        const durationText = `${this.selectedDuration}박 ${this.selectedDuration + 1}일`;
        const startDay = this.formatDayOfWeek(this.selectedStartDate);
        const endDay = this.formatDayOfWeek(endDate);
        
        return `
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 15px;">
                    📅 ${title}
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid ${primaryColor};">
                    <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 5px;">
                        <strong style="color: #2c3e50; white-space: nowrap;">체크인:</strong> 
                        <span style="color: ${primaryColor}; font-weight: bold; font-size: 14px; word-break: keep-all;">${startStr} (${startDay})</span>
                    </div>
                    <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 5px;">
                        <strong style="color: #2c3e50; white-space: nowrap;">체크아웃:</strong> 
                        <span style="color: #e74c3c; font-weight: bold; font-size: 14px; word-break: keep-all;">${endStr} (${endDay})</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 5px;">
                        <strong style="color: #2c3e50; white-space: nowrap;">숙박 기간:</strong> 
                        <span style="color: #27ae60; font-weight: bold; font-size: 14px; white-space: nowrap;">${durationText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Getters for current state
    getSelectedDate() {
        return this.selectedStartDate;
    }

    getDuration() {
        return this.selectedDuration;
    }

    getCurrentMonth() {
        return { month: this.currentMonth, year: this.currentYear };
    }
}