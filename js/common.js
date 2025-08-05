/**
 * Common utilities for OksHouse Reservation System
 */

// Step navigation utilities
class StepNavigator {
    constructor(totalSteps) {
        this.totalSteps = totalSteps;
    }

    nextStep(currentStep, validationCallback = null) {
        // Validation if provided
        if (validationCallback && !validationCallback(currentStep)) {
            return false;
        }
        
        // Hide current step
        this.hideStep(currentStep);
        this.markStepCompleted(currentStep);
        
        // Show next step
        const nextStepNum = currentStep + 1;
        this.showStep(nextStepNum);
        this.markStepActive(nextStepNum);
        
        return nextStepNum;
    }

    prevStep(currentStep, customCallback = null) {
        // Hide current step
        this.hideStep(currentStep);
        this.markStepInactive(currentStep);
        
        // Show previous step
        const prevStepNum = currentStep - 1;
        this.showStep(prevStepNum);
        this.markStepActive(prevStepNum);
        this.markStepIncomplete(prevStepNum);
        
        // Custom callback for step-specific logic
        if (customCallback) {
            customCallback(currentStep, prevStepNum);
        }
        
        return prevStepNum;
    }

    hideStep(stepNum) {
        const stepElement = document.getElementById('step' + stepNum);
        if (stepElement) {
            stepElement.classList.add('hidden');
        }
    }

    showStep(stepNum) {
        const stepElement = document.getElementById('step' + stepNum);
        if (stepElement) {
            stepElement.classList.remove('hidden');
        }
    }

    markStepActive(stepNum) {
        const dotElement = document.getElementById('dot' + stepNum);
        if (dotElement) {
            dotElement.classList.add('active');
        }
    }

    markStepInactive(stepNum) {
        const dotElement = document.getElementById('dot' + stepNum);
        if (dotElement) {
            dotElement.classList.remove('active');
        }
    }

    markStepCompleted(stepNum) {
        const dotElement = document.getElementById('dot' + stepNum);
        if (dotElement) {
            dotElement.classList.remove('active');
            dotElement.classList.add('completed');
        }
    }

    markStepIncomplete(stepNum) {
        const dotElement = document.getElementById('dot' + stepNum);
        if (dotElement) {
            dotElement.classList.remove('completed');
        }
    }
}

// Duration selection utilities
class DurationSelector {
    constructor() {
        this.selectedDuration = 0;
    }

    selectDuration(days, buttonElement) {
        // Remove selection from all buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked button
        buttonElement.classList.add('selected');
        this.selectedDuration = days;
        
        return days;
    }

    getDuration() {
        return this.selectedDuration;
    }

    setDuration(days) {
        this.selectedDuration = days;
        
        // Update UI if buttons exist
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Find and select the correct button
        const targetButton = Array.from(document.querySelectorAll('.duration-btn'))
            .find(btn => btn.textContent.includes(`${days}박`));
        
        if (targetButton) {
            targetButton.classList.add('selected');
        }
    }

    reset() {
        this.selectedDuration = 0;
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
}

// Form validation utilities
class FormValidator {
    static validateStep1(selectedDuration) {
        if (selectedDuration === 0) {
            alert('숙박 기간을 선택해주세요.');
            return false;
        }
        return true;
    }

    static validateStep2(selectedStartDate) {
        if (!selectedStartDate) {
            alert('시작일을 선택해주세요.');
            return false;
        }
        return true;
    }

    static validateReservationInfo(name, phone, password) {
        if (!name || !phone || !password) {
            alert('모든 정보를 입력해주세요.');
            return false;
        }
        
        if (!FormValidator.validatePhoneNumber(phone)) {
            alert('올바른 전화번호를 입력해주세요. (예: 010-1234-5678)');
            return false;
        }
        
        if (!FormValidator.validatePassword(password)) {
            alert('비밀번호는 4자리 숫자로 입력해주세요.');
            return false;
        }
        
        return true;
    }

    static validateAuthInfo(name, phone, password) {
        if (!name || !phone || !password) {
            alert('이름, 전화번호, 비밀번호를 모두 입력해주세요.');
            return false;
        }
        
        if (!FormValidator.validatePhoneNumber(phone)) {
            alert('올바른 전화번호를 입력해주세요. (예: 010-1234-5678)');
            return false;
        }
        
        if (!FormValidator.validatePassword(password)) {
            alert('비밀번호는 4자리 숫자로 입력해주세요.');
            return false;
        }
        
        return true;
    }

    static validatePhoneNumber(phone) {
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        // Check if it's 11 digits starting with 010
        return /^010\d{8}$/.test(digits);
    }

    static validatePassword(password) {
        // Check if it's exactly 4 digits
        return /^\d{4}$/.test(password);
    }

    static formatPhoneNumber(input) {
        // Remove all non-digits
        const digits = input.replace(/\D/g, '');
        
        // Limit to 11 digits
        const limited = digits.slice(0, 11);
        
        // Format as 010-1234-5678
        if (limited.length <= 3) {
            return limited;
        } else if (limited.length <= 7) {
            return `${limited.slice(0, 3)}-${limited.slice(3)}`;
        } else {
            return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
        }
    }

    static formatPassword(input) {
        // Remove all non-digits and limit to 4 digits
        return input.replace(/\D/g, '').slice(0, 4);
    }
}

// CSS variable utilities
class ThemeManager {
    static setTheme(primaryColor, rangeBgColor, rangeTextColor) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', primaryColor);
        root.style.setProperty('--range-bg-color', rangeBgColor);
        root.style.setProperty('--range-text-color', rangeTextColor);
    }

    static setReservationTheme() {
        this.setTheme('#3498db', '#e3f2fd', '#1976d2');
    }

    static setModifyTheme() {
        this.setTheme('#e67e22', '#fdeaa7', '#d35400');
    }

    static setInquiryTheme() {
        this.setTheme('#27ae60', '#d5f4e6', '#219a52');
    }
}

// Page completion utilities
class CompletionHandler {
    static completeReservation() {
        // Validate privacy consent first
        if (!CompletionHandler.validatePrivacyConsent()) {
            alert('개인정보 수집·이용 동의가 필요합니다. 메인 페이지에서 다시 시작해 주세요.');
            location.href = 'index.html';
            return false;
        }
        
        // Get form values
        const name = document.getElementById('name')?.value;
        const phone = document.getElementById('phone')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!FormValidator.validateReservationInfo(name, phone, password)) {
            return false;
        }
        
        alert('예약이 완료되었습니다!');
        location.href = 'index.html';
        return true;
    }

    static completeModification() {
        // Get form values
        const name = document.getElementById('new-name')?.value;
        const phone = document.getElementById('new-phone')?.value;
        
        if (!name || !phone) {
            alert('모든 정보를 입력해주세요.');
            return false;
        }
        
        alert('예약 수정이 완료되었습니다!');
        location.href = 'index.html';
        return true;
    }

    static completeReservationManagement() {
        alert('예약 관리가 완료되었습니다!');
        location.href = 'index.html';
        return true;
    }

    static validatePrivacyConsent() {
        try {
            const storageKey = 'okshouse_privacy_consent';
            const stored = localStorage.getItem(storageKey);
            
            if (!stored) return false;
            
            const consentData = JSON.parse(stored);
            if (!consentData.consented) return false;
            
            // Check expiration (365 days default)
            const consentDate = new Date(consentData.timestamp);
            const expirationDate = new Date(consentDate.getTime() + (365 * 24 * 60 * 60 * 1000));
            
            return new Date() < expirationDate;
        } catch (error) {
            console.error('Error validating privacy consent:', error);
            return false;
        }
    }
}

// Reservation management utilities
class ReservationManager {
    static formatKoreanDate(date) {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayOfWeek = days[date.getDay()];
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일(${dayOfWeek})`;
    }

    static formatKoreanDateTime(date) {
        const formattedDate = this.formatKoreanDate(date);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${formattedDate} ${hours}:${minutes}`;
    }

    static getReservationStatus(startDate, duration) {
        const today = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration);
        
        if (startDate > today) return 'upcoming';
        if (endDate > today) return 'current';
        return 'past';
    }

    static getStatusText(status) {
        const statusMap = {
            'upcoming': '예약 확정',
            'current': '이용 중',
            'past': '완료'
        };
        return statusMap[status] || '알 수 없음';
    }

    static validateReservationDates(startDate, duration) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate < today) {
            return { valid: false, message: '과거 날짜는 예약할 수 없습니다.' };
        }
        
        if (duration < 1 || duration > 30) {
            return { valid: false, message: '숙박 기간은 1일 이상 30일 이하로 설정해주세요.' };
        }
        
        return { valid: true };
    }

    static calculateTotalNights(startDate, endDate) {
        const timeDiff = endDate.getTime() - startDate.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    static highlightReservationDates(calendar, reservations) {
        if (!calendar || !reservations) return;
        
        // Clear existing highlights
        document.querySelectorAll('.reservation-highlight').forEach(el => {
            el.classList.remove('reservation-highlight');
        });
        
        // Add highlights for each reservation
        reservations.forEach(reservation => {
            for (let i = 0; i < reservation.duration; i++) {
                const date = new Date(reservation.startDate);
                date.setDate(reservation.startDate.getDate() + i);
                this.highlightDateOnCalendar(date);
            }
        });
    }

    static highlightDateOnCalendar(date) {
        const dateString = date.getDate().toString();
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();
        const calendarDays = document.querySelectorAll('.calendar-day');
        
        calendarDays.forEach(day => {
            if (day.textContent === dateString && !day.classList.contains('other-month')) {
                // Get the calendar's current displayed month/year
                const calendar = document.querySelector('.calendar');
                if (calendar) {
                    const monthDisplay = calendar.querySelector('[id*="month-"]');
                    if (monthDisplay) {
                        const displayText = monthDisplay.textContent;
                        const currentYear = parseInt(displayText.match(/(\d{4})년/)?.[1]);
                        const currentMonth = displayText.includes('1월') ? 0 :
                                          displayText.includes('2월') ? 1 :
                                          displayText.includes('3월') ? 2 :
                                          displayText.includes('4월') ? 3 :
                                          displayText.includes('5월') ? 4 :
                                          displayText.includes('6월') ? 5 :
                                          displayText.includes('7월') ? 6 :
                                          displayText.includes('8월') ? 7 :
                                          displayText.includes('9월') ? 8 :
                                          displayText.includes('10월') ? 9 :
                                          displayText.includes('11월') ? 10 :
                                          displayText.includes('12월') ? 11 : -1;
                        
                        // Only highlight if the date matches the currently displayed month/year
                        if (currentYear === targetYear && currentMonth === targetMonth) {
                            if (!day.classList.contains('disabled')) {
                                day.classList.add('reservation-highlight');
                            }
                        }
                    }
                }
            }
        });
    }

    static createReservationCard(reservation) {
        const endDate = new Date(reservation.startDate);
        endDate.setDate(reservation.startDate.getDate() + reservation.duration);
        
        const status = this.getReservationStatus(reservation.startDate, reservation.duration);
        const statusText = this.getStatusText(status);
        
        return `
            <div class="reservation-card" data-reservation-id="${reservation.id}" onclick="selectReservation(${reservation.id})">
                <div class="reservation-info">
                    <div class="reservation-details">
                        <h4>${this.formatKoreanDate(reservation.startDate)} ~ ${this.formatKoreanDate(endDate)}</h4>
                        <p>${reservation.duration}박 ${reservation.duration + 1}일 | ${reservation.name}</p>
                        <p>📞 ${reservation.phone}</p>
                    </div>
                    <div class="reservation-status ${status}">${statusText}</div>
                </div>
            </div>
        `;
    }

    static findConflictingReservations(newStartDate, newDuration, existingReservations, excludeId = null) {
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + newDuration);
        
        return existingReservations.filter(reservation => {
            if (excludeId && reservation.id === excludeId) return false;
            
            const existingEndDate = new Date(reservation.startDate);
            existingEndDate.setDate(reservation.startDate.getDate() + reservation.duration);
            
            // Check for date overlap
            return (newStartDate < existingEndDate && newEndDate > reservation.startDate);
        });
    }
}

// Input formatting utilities
class InputFormatter {
    static setupPhoneFormatting(inputElement) {
        if (!inputElement) return;
        
        inputElement.addEventListener('input', function(e) {
            const formatted = FormValidator.formatPhoneNumber(e.target.value);
            e.target.value = formatted;
        });
        
        // Prevent non-numeric input
        inputElement.addEventListener('keypress', function(e) {
            if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    static setupPasswordFormatting(inputElement) {
        if (!inputElement) return;
        
        inputElement.addEventListener('input', function(e) {
            const formatted = FormValidator.formatPassword(e.target.value);
            e.target.value = formatted;
        });
        
        // Prevent non-numeric input
        inputElement.addEventListener('keypress', function(e) {
            if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Set maxlength
        inputElement.setAttribute('maxlength', '4');
    }

    static initializeAllFormatters() {
        // Setup phone number formatting for all phone inputs
        document.querySelectorAll('input[type="tel"], input[id*="phone"]').forEach(input => {
            InputFormatter.setupPhoneFormatting(input);
        });
        
        // Setup password formatting for all password inputs
        document.querySelectorAll('input[type="password"], input[id*="password"]').forEach(input => {
            InputFormatter.setupPasswordFormatting(input);
        });
    }
}

// Export utilities to global scope for inline event handlers
if (typeof window !== 'undefined') {
    window.StepNavigator = StepNavigator;
    window.DurationSelector = DurationSelector;
    window.FormValidator = FormValidator;
    window.ThemeManager = ThemeManager;
    window.CompletionHandler = CompletionHandler;
    window.ReservationManager = ReservationManager;
    window.InputFormatter = InputFormatter;
}