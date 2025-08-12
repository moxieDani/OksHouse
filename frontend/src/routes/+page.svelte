<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import PrivacyConsent from '$lib/components/PrivacyConsent.svelte';
	
	// SvelteKit automatically provides these props - declare them to avoid warnings
	export let data = {};
	export let params = {};

	let showPrivacyModal = false;

	function handleReservationClick() {
		showPrivacyModal = true;
	}

	function handlePrivacyConsent() {
		showPrivacyModal = false;
		goto('/reservation');
	}

	function handlePrivacyDecline() {
		showPrivacyModal = false;
	}
</script>

<svelte:head>
	<title>Ok's House - 별장 예약시스템</title>
</svelte:head>

<div class="main-container">
	<div class="content-wrapper">
		<header class="page-header">
			<h1><span class="emoji-normal">🏡</span> Ok's 러브하우스</h1>
			<h2>장사 별장 예약시스템</h2>
		</header>

		<nav class="menu" role="navigation" aria-label="예약 메뉴">
			<button 
				class="menu-btn" 
				on:click={handleReservationClick}
				role="button" 
				aria-label="새로운 예약하기"
				style="text-align: left;"
			>
				<span class="emoji" aria-hidden="true">🕰️</span>
				<div class="text">
					<div class="main-text">새로운 예약하기</div>
				</div>
				<span class="arrow" aria-hidden="true">→</span>
			</button>
			
			<a href="/manage" class="menu-btn modify" role="button" aria-label="예약 확인하기">
				<span class="emoji" aria-hidden="true">📝</span>
				<div class="text">
					<div class="main-text">예약 확인·변경하기</div>
				</div>
				<span class="arrow" aria-hidden="true">→</span>
			</a>
		</nav>
	</div>
	
	<footer class="footer">
		<div class="welcome-message">
			Ok's 러브하우스에서 특별한 휴식을 🌟
		</div>
	</footer>
</div>

{#if showPrivacyModal}
	<PrivacyConsent 
		on:consent={handlePrivacyConsent}
		on:decline={handlePrivacyDecline}
	/>
{/if}

<style>
	.main-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.content-wrapper {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
		padding: var(--space-6);
		min-height: 0;
	}

	.page-header {
		text-align: center;
		margin-bottom: var(--space-10);
	}

	.page-header h2 {
		font-size: var(--text-xl);
		color: var(--neutral-600);
		font-weight: 400;
		margin-top: var(--space-4);
	}

	.menu {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		max-width: 400px;
	}

	.menu-btn {
		display: flex;
		align-items: center;
		padding: var(--space-6);
		background: white;
		border: 2px solid var(--neutral-200);
		border-radius: var(--radius-xl);
		text-decoration: none;
		color: var(--neutral-800);
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		cursor: pointer;
		font-family: inherit;
		font-size: var(--text-base);
		box-shadow: var(--shadow-md);
		min-height: 80px;
	}

	.menu-btn:hover {
		border-color: var(--primary);
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	.menu-btn.modify:hover {
		border-color: var(--warning);
	}

	.emoji {
		font-size: 2.5rem;
		margin-right: var(--space-4);
		flex-shrink: 0;
	}

	.text {
		flex: 1;
	}

	.main-text {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--neutral-800);
	}

	.arrow {
		font-size: var(--text-xl);
		color: var(--neutral-400);
		margin-left: var(--space-4);
		flex-shrink: 0;
	}

	.footer {
		padding: var(--space-6) var(--space-6) var(--space-8);
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		color: var(--neutral-500);
		font-size: 0.875rem;
		opacity: 0.8;
		font-weight: 400;
		letter-spacing: -0.025em;
		line-height: 1.5;
	}

	.welcome-message {
		text-align: center;
		font-size: 1.125rem;
		font-weight: 500;
		margin: 0;
		color: var(--neutral-700);
	}

	/* 이모지는 정상 색상으로 표시 */
	.emoji-normal {
		background: none !important;
		background-clip: initial !important;
		-webkit-background-clip: initial !important;
		color: initial !important;
		-webkit-text-fill-color: initial !important;
	}

	@media (max-width: 640px) {
		.content-wrapper {
			padding: var(--space-4);
		}

		.menu {
			max-width: 100%;
		}

		.menu-btn {
			padding: var(--space-4);
			min-height: 70px;
		}

		.emoji {
			font-size: 2rem;
			margin-right: var(--space-3);
		}

		.main-text {
			font-size: var(--text-base);
		}

		.footer {
			padding: var(--space-4) var(--space-4) var(--space-6);
		}

		.welcome-message {
			font-size: var(--text-base);
		}
	}
</style>