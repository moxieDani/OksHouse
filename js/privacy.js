/**
 * Privacy Policy Consent Component for OksHouse Reservation System
 * Handles privacy policy display and user consent management
 */
class PrivacyConsent {
    constructor(options = {}) {
        this.options = {
            onConsent: options.onConsent || null,
            onDecline: options.onDecline || null,
            storageKey: options.storageKey || 'okshouse_privacy_consent',
            expirationDays: options.expirationDays || 365,
            ...options
        };
        
        this.modalId = 'privacy-consent-modal';
        this.init();
    }

    init() {
        this.createModalHTML();
        this.attachEventListeners();
    }

    createModalHTML() {
        const modalHTML = `
            <div id="${this.modalId}" class="privacy-modal" style="display: none;">
                <div class="privacy-overlay"></div>
                <div class="privacy-content">
                    <div class="privacy-header">
                    <h2>🔒 개인정보 수집·이용 동의서</h2>
                    </div>
                    <div class="privacy-body">

                    <div class="privacy-section">
                        <h3>1. 개인정보 수집·이용 목적</h3>
                        <p>Ok's House는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                        <ul>
                        <li>별장 예약 접수 및 예약 확인 안내</li>
                        <li>예약 변경/취소 등 예약 이행</li>
                        </ul>
                    </div>

                    <div class="privacy-section">
                        <h3>2. 수집하는 개인정보 항목</h3>
                        <div class="info-table">
                        <div class="info-row">
                            <div class="info-label">필수정보</div>
                            <div class="info-value">성명, 휴대폰번호, 예약 비밀번호</div>
                        </div>
                        </div>
                        <p><em>※ 별도의 자동수집(Log/IP, 쿠키 등)은 <strong>수집하지 않습니다</strong>.</em></p>
                    </div>

                    <div class="privacy-section">
                        <h3>3. 개인정보 보유 및 이용 기간</h3>
                        <ul>
                        <li><strong>예약자 정보:</strong> 수집일로부터 <strong>1년간 보유 후 즉시 파기</strong></li>
                        </ul>
                        <p class="small-note"><em>『개인정보 처리방침 작성지침(2025.4.)』</em>에 따라 "수집 목적 및 최소 보유 기간"을 명확히 기재하였습니다</p>
                        <p class="small-note"><a href="https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=G010030000&nttId=11134&utm_source=chatgpt.com#LINK">개인정보보호위원회 참조</a></p>
                    </div>

                    <div class="privacy-section">
                        <h3>4. 개인정보 제3자 제공</h3>
                        <p>Ok's House는 고객의 개인정보를 제3자에게 제공하지 않습니다.</p>
                    </div>

                    <div class="privacy-section">
                        <h3>5. 개인정보 처리 위탁</h3>
                        <p>현재 개인정보 처리 관련 외부 위탁은 없습니다.</p>
                    </div>

                    <div class="privacy-section">
                        <h3>6. 정보주체의 권리 및 행사 방법</h3>
                        <p>정보주체는 언제든지 아래 권리를 행사할 수 있습니다:</p>
                        <ul>
                        <li>개인정보 열람 요청</li>
                        <li>개인정보 정정·삭제 요청</li>
                        <li>처리정지 요청</li>
                        </ul>
                        <p class="contact-info">
                        <strong>문의처:</strong> Ok's House 운영자<br>
                        <strong>이메일:</strong> moxie2ks@gmail.com
                        </p>
                    </div>

                    <div class="privacy-section important">
                        <h3>⚠️ 운영 안내</h3>
                        <p>본 숙소는 <strong>친인척 또는 소수 지인</strong>을 대상으로 제공되는 비영리적 개인 운영입니다.
                        전자상거래법상 ‘거래 기록 보관 5년’ 의무는 <strong>적용되지 않음</strong>을 사전 안내드립니다.</p>
                        <h3>⚠️ 동의 거부권 및 불이익 안내</h3>
                        <p>개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
                        다만 동의하지 않을 경우, 예약 진행이 제한될 수 있습니다.</p>
                    </div>
                    </div>
                    <div class="privacy-footer">
                    <div class="consent-checkbox">
                        <label for="privacy-agree">
                        <input type="checkbox" id="privacy-agree">
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-text">위의 개인정보 수집·이용에 동의합니다</span>
                        </label>
                    </div>
                    <div class="privacy-buttons">
                        <button class="btn-decline" id="privacy-decline">동의하지 않음</button>
                        <button class="btn-consent" id="privacy-consent" disabled>동의하고 예약 진행</button>
                    </div>
                    </div>
                </div>
                </div>
        `;

        // Insert modal into document body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEventListeners() {
        const modal = document.getElementById(this.modalId);
        const agreeCheckbox = document.getElementById('privacy-agree');
        const consentBtn = document.getElementById('privacy-consent');
        const declineBtn = document.getElementById('privacy-decline');
        const overlay = modal.querySelector('.privacy-overlay');

        // Checkbox toggle
        agreeCheckbox.addEventListener('change', () => {
            consentBtn.disabled = !agreeCheckbox.checked;
            consentBtn.classList.toggle('enabled', agreeCheckbox.checked);
        });

        // Consent button
        consentBtn.addEventListener('click', () => {
            if (agreeCheckbox.checked) {
                this.handleConsent();
            }
        });

        // Decline button
        declineBtn.addEventListener('click', () => {
            this.handleDecline();
        });

        // Overlay click (prevent close)
        overlay.addEventListener('click', (e) => {
            e.preventDefault(); // Don't allow closing by clicking overlay
        });

        // Prevent modal close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalVisible()) {
                e.preventDefault();
            }
        });
    }

    showModal() {
        const modal = document.getElementById(this.modalId);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Animate in
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    hideModal() {
        const modal = document.getElementById(this.modalId);
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    isModalVisible() {
        const modal = document.getElementById(this.modalId);
        return modal && modal.style.display !== 'none';
    }

    handleConsent() {
        // Store consent with timestamp
        const consentData = {
            consented: true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem(this.options.storageKey, JSON.stringify(consentData));
        
        this.hideModal();
        
        if (this.options.onConsent) {
            this.options.onConsent(consentData);
        }
    }

    handleDecline() {
        this.hideModal();
        
        if (this.options.onDecline) {
            this.options.onDecline();
        } else {
            // Default behavior: show message and stay on index
            alert('개인정보 수집·이용에 동의하지 않으시면 예약 서비스를 이용할 수 없습니다.');
        }
    }

    hasValidConsent() {
        try {
            const stored = localStorage.getItem(this.options.storageKey);
            if (!stored) return false;
            
            const consentData = JSON.parse(stored);
            if (!consentData.consented) return false;
            
            // Check expiration
            const consentDate = new Date(consentData.timestamp);
            const expirationDate = new Date(consentDate.getTime() + (this.options.expirationDays * 24 * 60 * 60 * 1000));
            
            return new Date() < expirationDate;
        } catch (error) {
            console.error('Error checking consent:', error);
            return false;
        }
    }

    checkConsentBeforeAction(action) {
        if (this.hasValidConsent()) {
            // Already consented, proceed with action
            if (typeof action === 'function') {
                action();
            } else if (typeof action === 'string') {
                window.location.href = action;
            }
        } else {
            // Show consent modal
            this.showModal();
        }
    }

    // Static method for easy integration
    static requireConsent(action, options = {}) {
        const privacy = new PrivacyConsent({
            ...options,
            onConsent: () => {
                if (typeof action === 'function') {
                    action();
                } else if (typeof action === 'string') {
                    window.location.href = action;
                }
            }
        });
        
        privacy.checkConsentBeforeAction(action);
        return privacy;
    }
}

// Export to global scope
if (typeof window !== 'undefined') {
    window.PrivacyConsent = PrivacyConsent;
}