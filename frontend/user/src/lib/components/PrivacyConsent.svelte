<script>
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	let isAgreed = false;

	function handleConsent() {
		if (isAgreed) {
			dispatch('consent');
		}
	}

	function handleDecline() {
		dispatch('decline');
	}

	function handleOverlayClick(e) {
		// Prevent closing on overlay click
		e.preventDefault();
	}

	function handleKeydown(e) {
		// Prevent closing on escape
		if (e.key === 'Escape') {
			e.preventDefault();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="privacy-modal">
	<div class="privacy-overlay" on:click={handleOverlayClick} role="presentation"></div>
	<div class="privacy-content" role="dialog" aria-labelledby="privacy-title" aria-modal="true">
		<div class="privacy-header">
			<h2 id="privacy-title">🔒 개인정보 수집·이용 동의서</h2>
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
				전자상거래법상 '거래 기록 보관 5년' 의무는 <strong>적용되지 않음</strong>을 사전 안내드립니다.</p>
				<h3>⚠️ 동의 거부권 및 불이익 안내</h3>
				<p>개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
				다만 동의하지 않을 경우, 예약 진행이 제한될 수 있습니다.</p>
			</div>
		</div>
		
		<div class="privacy-footer">
			<div class="consent-checkbox">
				<label for="privacy-agree">
					<input type="checkbox" id="privacy-agree" bind:checked={isAgreed}>
					<span class="checkbox-custom"></span>
					<span class="checkbox-text">위 개인정보 수집·이용에 동의합니다.</span>
				</label>
			</div>
			<div class="privacy-buttons">
				<button 
					class="btn-consent" 
					class:enabled={isAgreed}
					disabled={!isAgreed}
					on:click={handleConsent}
				>
					동의하고 예약 진행
				</button>
				<button class="btn-decline" on:click={handleDecline}>
					동의하지 않음
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.privacy-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
	}

	.privacy-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
	}

	.privacy-content {
		position: relative;
		background: white;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.privacy-header {
		padding: var(--space-6) var(--space-6) var(--space-4);
		border-bottom: 1px solid var(--neutral-200);
	}

	.privacy-header h2 {
		font-size: var(--text-xl);
		color: var(--primary);
		margin: 0;
		text-align: center;
	}

	.privacy-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4) var(--space-6);
	}

	.privacy-section {
		margin-bottom: var(--space-6);
	}

	.privacy-section h3 {
		font-size: var(--text-lg);
		color: var(--neutral-700);
		margin-bottom: var(--space-3);
	}

	.privacy-section p {
		margin-bottom: var(--space-3);
		line-height: 1.6;
		color: var(--neutral-600);
	}

	.privacy-section ul {
		margin-left: var(--space-4);
		margin-bottom: var(--space-3);
	}

	.privacy-section li {
		margin-bottom: var(--space-2);
		color: var(--neutral-600);
	}

	.info-table {
		background: var(--neutral-50);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		margin-bottom: var(--space-3);
	}

	.info-row {
		display: flex;
		gap: var(--space-4);
	}

	.info-label {
		font-weight: 600;
		color: var(--neutral-700);
		min-width: 80px;
	}

	.info-value {
		color: var(--neutral-600);
	}

	.small-note {
		font-size: var(--text-sm);
		color: var(--neutral-500);
	}

	.small-note a {
		color: var(--primary);
		text-decoration: underline;
	}

	.contact-info {
		background: var(--neutral-50);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		border-left: 4px solid var(--primary);
	}

	.important {
		background: rgba(245, 158, 11, 0.1);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		border-left: 4px solid var(--warning);
	}

	.important h3 {
		color: var(--warning);
	}

	.privacy-footer {
		padding: var(--space-6);
		border-top: 1px solid var(--neutral-200);
		background: var(--neutral-50);
	}

	.consent-checkbox {
		margin-bottom: var(--space-4);
	}

	.consent-checkbox label {
		display: flex;
		align-items: center;
		cursor: pointer;
		font-size: var(--text-base);
		color: var(--neutral-700);
	}

	.consent-checkbox input[type="checkbox"] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 2px solid var(--neutral-300);
		border-radius: var(--radius-sm);
		margin-right: var(--space-3);
		position: relative;
		transition: var(--transition-colors);
		flex-shrink: 0;
	}

	.consent-checkbox input[type="checkbox"]:checked + .checkbox-custom {
		background: var(--primary);
		border-color: var(--primary);
	}

	.consent-checkbox input[type="checkbox"]:checked + .checkbox-custom::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 14px;
		font-weight: bold;
	}

	.checkbox-text {
		flex: 1;
	}

	.privacy-buttons {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn-consent, .btn-decline {
		padding: var(--space-4) var(--space-6);
		border: none;
		border-radius: var(--radius-lg);
		font-size: var(--text-base);
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		font-family: inherit;
		min-height: 50px;
	}

	.btn-consent {
		background: var(--neutral-300);
		color: var(--neutral-600);
		cursor: not-allowed;
	}

	.btn-consent.enabled {
		background: linear-gradient(135deg, var(--success) 0%, #047857 100%);
		color: white;
		cursor: pointer;
		box-shadow: var(--shadow-md);
	}

	.btn-consent.enabled:hover {
		background: linear-gradient(135deg, #047857 0%, var(--success) 100%);
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	.btn-decline {
		background: linear-gradient(135deg, var(--neutral-500) 0%, var(--neutral-600) 100%);
		color: white;
		box-shadow: var(--shadow-md);
	}

	.btn-decline:hover {
		background: linear-gradient(135deg, var(--neutral-600) 0%, var(--neutral-700) 100%);
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	@media (max-width: 640px) {
		.privacy-modal {
			padding: var(--space-2);
		}

		.privacy-content {
			max-height: 95vh;
		}

		.privacy-header {
			padding: var(--space-4);
		}

		.privacy-body {
			padding: var(--space-3) var(--space-4);
		}

		.privacy-footer {
			padding: var(--space-4);
		}

		.privacy-buttons {
			flex-direction: column;
		}

		.btn-consent, .btn-decline {
			width: 100%;
		}
	}
</style>