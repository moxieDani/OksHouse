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
            FeedbackManager.showError('⏰ 숙박 기간을 선택해주세요', '머물고 싶은 날짜 수를 위에서 선택해주세요.');
            return false;
        }
        return true;
    }

    static validateStep2(selectedStartDate) {
        if (!selectedStartDate) {
            FeedbackManager.showError('📅 날짜를 선택해주세요', '달력에서 체크인할 날짜를 클릭해주세요.');
            return false;
        }
        return true;
    }

    static validateReservationInfo(name, phone, password) {
        if (!name || name.trim() === '') {
            FeedbackManager.showError('👤 이름을 입력해주세요', '예약자 이름을 정확히 입력해주세요.');
            document.getElementById('name')?.focus();
            return false;
        }
        
        if (!phone || phone.trim() === '') {
            FeedbackManager.showError('📱 전화번호를 입력해주세요', '연락 가능한 전화번호를 입력해주세요.');
            document.getElementById('phone')?.focus();
            return false;
        }
        
        if (!password || password.trim() === '') {
            FeedbackManager.showError('🔐 비밀번호를 입력해주세요', '4자리 숫자 비밀번호를 입력해주세요.');
            document.getElementById('password')?.focus();
            return false;
        }
        
        if (!FormValidator.validatePhoneNumber(phone)) {
            FeedbackManager.showError('📱 전화번호 형식을 확인해주세요', '010-1234-5678 형식으로 입력해주세요.');
            document.getElementById('phone')?.focus();
            return false;
        }
        
        if (!FormValidator.validatePassword(password)) {
            FeedbackManager.showError('🔐 비밀번호는 4자리 숫자입니다', '숫자 4자리로만 입력해주세요. (예: 1234)');
            document.getElementById('password')?.focus();
            return false;
        }
        
        return true;
    }

    static validateAuthInfo(name, phone, password) {
        if (!name || name.trim() === '') {
            FeedbackManager.showError('👤 이름을 입력해주세요', '예약시 입력한 이름을 정확히 입력해주세요.');
            return false;
        }
        
        if (!phone || phone.trim() === '') {
            FeedbackManager.showError('📱 전화번호를 입력해주세요', '예약시 입력한 전화번호를 입력해주세요.');
            return false;
        }
        
        if (!password || password.trim() === '') {
            FeedbackManager.showError('🔐 비밀번호를 입력해주세요', '예약시 설정한 4자리 비밀번호를 입력해주세요.');
            return false;
        }
        
        if (!FormValidator.validatePhoneNumber(phone)) {
            FeedbackManager.showError('📱 전화번호 형식을 확인해주세요', '010-1234-5678 형식으로 입력해주세요.');
            return false;
        }
        
        if (!FormValidator.validatePassword(password)) {
            FeedbackManager.showError('🔐 비밀번호는 4자리 숫자입니다', '숫자 4자리로만 입력해주세요.');
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

// Enhanced feedback system for elderly users
class FeedbackManager {
    static showError(title, message) {
        this.createModal('error', '❌', title, message);
    }

    static showSuccess(title, message, onClose = null) {
        this.createModal('success', '✅', title, message, onClose);
    }

    static showWarning(title, message) {
        this.createModal('warning', '⚠️', title, message);
    }

    static showInfo(title, message) {
        this.createModal('info', 'ℹ️', title, message);
    }
    
    static getButtonStyleByType(type) {
        const styles = {
            'success': 'background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;',
            'error': 'background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;',
            'warning': 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;',
            'info': 'background: linear-gradient(135deg, #4338ca 0%, #312e81 100%) !important;'
        };
        return styles[type] || styles.info;
    }

    static showAlert(message, type = 'info') {
        // Simple alert wrapper for backwards compatibility
        const icons = {
            'info': 'ℹ️',
            'warning': '⚠️', 
            'error': '❌',
            'success': '✅'
        };
        
        const titles = {
            'info': '알림',
            'warning': '주의',
            'error': '오류', 
            'success': '성공'
        };
        
        this.createModal(type, icons[type] || 'ℹ️', titles[type] || '알림', message);
    }
    
    static showConfirm(title, message, onConfirm, onCancel) {
        // Remove existing modal
        const existingModal = document.getElementById('feedback-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create confirmation modal
        const modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.className = 'feedback-modal feedback-modal-confirm';
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 20px !important;
            animation: fadeIn 0.3s ease !important;
        `;
        
        modal.innerHTML = `
            <div class="feedback-modal-backdrop" style="
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.7) !important;
                backdrop-filter: blur(4px) !important;
                z-index: 1 !important;
            "></div>
            <div class="feedback-modal-content" style="
                position: relative !important;
                background: white !important;
                border-radius: 20px !important;
                max-width: 450px !important;
                width: 100% !important;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
                animation: slideUp 0.3s ease !important;
                z-index: 10 !important;
                border: 2px solid rgba(255, 255, 255, 0.8) !important;
            ">
                <div class="feedback-modal-header" style="
                    padding: 30px 30px 20px !important;
                    text-align: center !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                ">
                    <div class="feedback-modal-icon" style="
                        font-size: 3.5rem !important;
                        margin-bottom: 20px !important;
                        line-height: 1 !important;
                        color: #d97706 !important;
                    ">❓</div>
                    <h3 class="feedback-modal-title" style="
                        font-size: 1.5rem !important;
                        font-weight: 600 !important;
                        margin: 0 !important;
                        color: #1e293b !important;
                        line-height: 1.3 !important;
                    ">${title}</h3>
                </div>
                <div class="feedback-modal-body" style="
                    padding: 20px 30px 30px !important;
                    text-align: center !important;
                ">
                    <p class="feedback-modal-message" style="
                        font-size: 1.125rem !important;
                        color: #475569 !important;
                        margin: 0 !important;
                        line-height: 1.6 !important;
                    ">${message.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="feedback-modal-footer feedback-modal-footer-confirm" style="
                    padding: 0 30px 30px !important;
                    text-align: center !important;
                    display: flex !important;
                    gap: 12px !important;
                    justify-content: center !important;
                ">
                    <button class="feedback-modal-btn feedback-modal-btn-cancel" onclick="FeedbackManager.closeConfirm(false)" style="
                        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
                        color: white !important;
                        border: none !important;
                        border-radius: 12px !important;
                        padding: 16px 32px !important;
                        font-size: 1.125rem !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                        min-width: 120px !important;
                        flex: 1 !important;
                        max-width: 120px !important;
                    ">
                        취소
                    </button>
                    <button class="feedback-modal-btn feedback-modal-btn-confirm" onclick="FeedbackManager.closeConfirm(true)" style="
                        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
                        color: white !important;
                        border: none !important;
                        border-radius: 12px !important;
                        padding: 16px 32px !important;
                        font-size: 1.125rem !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                        min-width: 120px !important;
                        flex: 1 !important;
                        max-width: 120px !important;
                    ">
                        확인
                    </button>
                </div>
            </div>
        `;

        // Add confirm-specific styles
        if (!document.getElementById('feedback-confirm-styles')) {
            const styles = document.createElement('style');
            styles.id = 'feedback-confirm-styles';
            styles.innerHTML = `
                .feedback-modal-confirm .feedback-modal-icon {
                    color: #d97706;
                    font-size: 3.5rem;
                    margin-bottom: 20px;
                }
                
                .feedback-modal-footer-confirm {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                
                .feedback-modal-btn-cancel {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    flex: 1;
                    max-width: 120px;
                }
                
                .feedback-modal-btn-cancel:hover {
                    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
                    box-shadow: 0 10px 25px rgba(107, 114, 128, 0.4);
                }
                
                .feedback-modal-btn-confirm {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    flex: 1;
                    max-width: 120px;
                }
                
                .feedback-modal-btn-confirm:hover {
                    background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
                    box-shadow: 0 10px 25px rgba(220, 38, 38, 0.4);
                }
            `;
            document.head.appendChild(styles);
        }

        // Store callbacks
        this._confirmCallbacks = { onConfirm, onCancel };

        // Add to page
        document.body.appendChild(modal);

        // Close on backdrop click (calls cancel)
        modal.querySelector('.feedback-modal-backdrop').addEventListener('click', () => {
            this.closeConfirm(false);
        });

        // Close on Escape key (calls cancel)
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                FeedbackManager.closeConfirm(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        });

        // Auto-focus the confirm button for keyboard users
        setTimeout(() => {
            modal.querySelector('.feedback-modal-btn-confirm')?.focus();
        }, 100);
    }
    
    static closeConfirm(confirmed) {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                modal.remove();
                // Call appropriate callback
                if (this._confirmCallbacks) {
                    if (confirmed && this._confirmCallbacks.onConfirm) {
                        this._confirmCallbacks.onConfirm();
                    } else if (!confirmed && this._confirmCallbacks.onCancel) {
                        this._confirmCallbacks.onCancel();
                    }
                    this._confirmCallbacks = null;
                }
            }, 200);
        }
    }

    static createModal(type, icon, title, message, onClose = null) {
        // Remove existing modal
        const existingModal = document.getElementById('feedback-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.className = `feedback-modal feedback-modal-${type}`;
        modal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 20px !important;
            animation: fadeIn 0.3s ease !important;
        `;
        
        modal.innerHTML = `
            <div class="feedback-modal-backdrop" style="
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.7) !important;
                backdrop-filter: blur(4px) !important;
                z-index: 1 !important;
            "></div>
            <div class="feedback-modal-content" style="
                position: relative !important;
                background: white !important;
                border-radius: 20px !important;
                max-width: 450px !important;
                width: 100% !important;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
                animation: slideUp 0.3s ease !important;
                z-index: 10 !important;
                border: 2px solid rgba(255, 255, 255, 0.8) !important;
            ">
                <div class="feedback-modal-header" style="
                    padding: 30px 30px 20px !important;
                    text-align: center !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                ">
                    <div class="feedback-modal-icon" style="
                        font-size: 3rem !important;
                        margin-bottom: 15px !important;
                        line-height: 1 !important;
                    ">${icon}</div>
                    <h3 class="feedback-modal-title" style="
                        font-size: 1.5rem !important;
                        font-weight: 600 !important;
                        margin: 0 !important;
                        color: #1e293b !important;
                        line-height: 1.3 !important;
                    ">${title}</h3>
                </div>
                <div class="feedback-modal-body" style="
                    padding: 20px 30px 30px !important;
                    text-align: center !important;
                ">
                    <p class="feedback-modal-message" style="
                        font-size: 1.125rem !important;
                        color: #475569 !important;
                        margin: 0 !important;
                        line-height: 1.6 !important;
                    ">${message}</p>
                </div>
                <div class="feedback-modal-footer" style="
                    padding: 0 30px 30px !important;
                    text-align: center !important;
                ">
                    <button class="feedback-modal-btn feedback-modal-btn-${type}" onclick="FeedbackManager.closeModal(true)" style="
                        ${this.getButtonStyleByType(type)}
                        color: white !important;
                        border: none !important;
                        border-radius: 12px !important;
                        padding: 16px 32px !important;
                        font-size: 1.125rem !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                        min-width: 140px !important;
                    ">
                        확인했습니다
                    </button>
                </div>
            </div>
        `;

        // Add styles if not exists
        if (!document.getElementById('feedback-styles')) {
            const styles = document.createElement('style');
            styles.id = 'feedback-styles';
            styles.innerHTML = `
                .feedback-modal {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    z-index: 999999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 20px !important;
                    animation: fadeIn 0.3s ease !important;
                }

                .feedback-modal-backdrop {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.7) !important;
                    backdrop-filter: blur(4px) !important;
                    z-index: 1 !important;
                }

                .feedback-modal-content {
                    position: relative !important;
                    background: white !important;
                    border-radius: 20px !important;
                    max-width: 450px !important;
                    width: 100% !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    animation: slideUp 0.3s ease !important;
                    z-index: 10 !important;
                }

                .feedback-modal-header {
                    padding: 30px 30px 20px;
                    text-align: center;
                    border-bottom: 1px solid #f1f5f9;
                }

                .feedback-modal-icon {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    line-height: 1;
                }

                .feedback-modal-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                    color: #1e293b;
                    line-height: 1.3;
                }

                .feedback-modal-body {
                    padding: 20px 30px 30px;
                    text-align: center;
                }

                .feedback-modal-message {
                    font-size: 1.125rem;
                    color: #475569;
                    margin: 0;
                    line-height: 1.6;
                }

                .feedback-modal-footer {
                    padding: 0 30px 30px;
                    text-align: center;
                }

                .feedback-modal-btn {
                    background: linear-gradient(135deg, #4338ca 0%, #312e81 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 16px 32px;
                    font-size: 1.125rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 140px;
                }

                .feedback-modal-btn:hover {
                    background: linear-gradient(135deg, #312e81 0%, #4338ca 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 10px 25px rgba(67, 56, 202, 0.4);
                }

                .feedback-modal-error .feedback-modal-icon {
                    color: #dc2626;
                }

                .feedback-modal-success .feedback-modal-icon {
                    color: #059669;
                }

                .feedback-modal-warning .feedback-modal-icon {
                    color: #d97706;
                }

                .feedback-modal-info .feedback-modal-icon {
                    color: #0891b2;
                }

                .feedback-modal-error .feedback-modal-btn {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                }

                .feedback-modal-error .feedback-modal-btn:hover {
                    background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
                    box-shadow: 0 10px 25px rgba(220, 38, 38, 0.4);
                }

                .feedback-modal-success .feedback-modal-btn {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                }

                .feedback-modal-success .feedback-modal-btn:hover {
                    background: linear-gradient(135deg, #047857 0%, #059669 100%);
                    box-shadow: 0 10px 25px rgba(5, 150, 105, 0.4);
                }

                .feedback-modal-warning .feedback-modal-btn {
                    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                }

                .feedback-modal-warning .feedback-modal-btn:hover {
                    background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
                    box-shadow: 0 10px 25px rgba(217, 119, 6, 0.4);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @media (max-width: 480px) {
                    .feedback-modal {
                        padding: 15px;
                    }
                    
                    .feedback-modal-content {
                        margin: 0;
                        border-radius: 18px;
                        max-width: 100%;
                    }
                    
                    .feedback-modal-header {
                        padding: 30px 25px 20px;
                    }
                    
                    .feedback-modal-icon {
                        font-size: 3.5rem;  /* 더 큰 아이콘 */
                        margin-bottom: 15px;
                    }
                    
                    .feedback-modal-title {
                        font-size: 1.4rem;  /* 더 큰 제목 */
                        font-weight: 700;
                        line-height: 1.3;
                    }
                    
                    .feedback-modal-body {
                        padding: 20px 25px 30px;
                    }
                    
                    .feedback-modal-message {
                        font-size: 1.125rem;  /* 더 큰 메시지 */
                        line-height: 1.7;
                        font-weight: 500;
                    }
                    
                    .feedback-modal-footer {
                        padding: 0 25px 30px;
                    }
                    
                    .feedback-modal-btn {
                        font-size: 1.125rem;  /* 더 큰 버튼 텍스트 */
                        font-weight: 600;
                        padding: 18px 32px;
                        border-radius: 14px;
                        min-height: 56px;  /* 더 큰 터치 영역 */
                        min-width: 200px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(modal);

        // Store callback
        this._modalCallback = onClose;

        // Close on backdrop click
        modal.querySelector('.feedback-modal-backdrop').addEventListener('click', () => {
            this.closeModal(false);
        });

        // Close on Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                FeedbackManager.closeModal(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        });

        // Auto-focus the button for keyboard users
        setTimeout(() => {
            modal.querySelector('.feedback-modal-btn')?.focus();
        }, 100);
    }

    static closeModal(confirmed = false) {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                modal.remove();
                // Call callback if confirmed and exists
                if (confirmed && this._modalCallback) {
                    this._modalCallback();
                    this._modalCallback = null;
                }
            }, 200);
        }
    }

    static showLoadingMessage(message = '처리 중입니다...') {
        const existingLoading = document.getElementById('loading-message');
        if (existingLoading) {
            existingLoading.remove();
        }

        const loading = document.createElement('div');
        loading.id = 'loading-message';
        loading.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(67, 56, 202, 0.95);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease;
        `;
        loading.textContent = message;

        document.body.appendChild(loading);

        return loading;
    }

    static hideLoadingMessage() {
        const loading = document.getElementById('loading-message');
        if (loading) {
            loading.remove();
        }
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
        
        FeedbackManager.showSuccess(
            '🎉 예약이 완료되었습니다!',
            `${name}님의 예약이 성공적으로 저장되었습니다.`,
            () => {
                location.href = 'index.html';
            }
        );
        return true;
    }

    static completeModification() {
        // Get form values
        const name = document.getElementById('new-name')?.value;
        const phone = document.getElementById('new-phone')?.value;
        
        if (!name || !phone) {
            FeedbackManager.showError('📝 정보를 입력해주세요', '모든 정보를 입력해야 수정이 가능합니다.');
            return false;
        }
        
        FeedbackManager.showSuccess(
            '✅ 예약 수정이 완료되었습니다!',
            `${name}님의 예약 정보가 성공적으로 변경되었습니다.`,
            () => {
                location.href = 'index.html';
            }
        );
        return true;
    }

    static completeReservationManagement() {
        FeedbackManager.showSuccess(
            '✅ 예약 관리가 완료되었습니다!',
            '요청하신 작업이 성공적으로 처리되었습니다.',
            () => {
                location.href = 'index.html';
            }
        );
        return true;
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
    window.FeedbackManager = FeedbackManager;
    window.ThemeManager = ThemeManager;
    window.CompletionHandler = CompletionHandler;
    window.ReservationManager = ReservationManager;
    window.InputFormatter = InputFormatter;
}