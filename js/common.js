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
        return true;
    }

    static validateAuthInfo(name, phone, password) {
        if (!name || !phone || !password) {
            alert('이름, 전화번호, 비밀번호를 모두 입력해주세요.');
            return false;
        }
        return true;
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
}

// Export utilities to global scope for inline event handlers
if (typeof window !== 'undefined') {
    window.StepNavigator = StepNavigator;
    window.DurationSelector = DurationSelector;
    window.FormValidator = FormValidator;
    window.ThemeManager = ThemeManager;
    window.CompletionHandler = CompletionHandler;
}