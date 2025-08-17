<script>
	import { administrators } from '$lib/constants/admins.js';
	import { goto } from '$app/navigation';
	
	// SvelteKit이 자동으로 전달하는 params prop을 받아서 경고 제거
	export let params = {};
	
	/**
	 * 관리자 선택 시 해당 관리자 페이지로 이동
	 */
	function selectAdmin(adminId) {
		goto(`/${adminId}`);
	}
</script>

<svelte:head>
	<title>Ok's House 관리자 시스템</title>
</svelte:head>

<div class="admin-container">
	<div class="content-wrapper">
		<header class="page-header">
			<h1><span class="emoji-normal">🔐</span> Ok's House 관리자</h1>
			<h2>관리자를 선택하여 예약 현황을 확인하세요</h2>
		</header>

		<div class="admin-grid">
			{#each Object.entries(administrators) as [adminId, admin]}
				<button 
					class="admin-card"
					on:click={() => selectAdmin(adminId)}
					aria-label="{admin.name} 관리자 페이지로 이동"
				>
					<div class="admin-emoji">{admin.emoji}</div>
					<div class="admin-name">{admin.name}</div>
					<div class="admin-subtitle">관리자</div>
				</button>
			{/each}
		</div>
	</div>
	
	<footer class="footer">
		<div class="welcome-message">
			Ok's House 관리자 전용 시스템 🛡️
		</div>
	</footer>
</div>

<style>
	.admin-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
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

	.page-header h1 {
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%) !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
		color: transparent !important;
		-webkit-text-fill-color: transparent !important;
	}

	.page-header h2 {
		font-size: var(--text-xl);
		color: var(--neutral-600);
		font-weight: 400;
		margin-top: var(--space-4);
	}

	.admin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-6);
		max-width: 800px;
		width: 100%;
	}

	.admin-card {
		background: white;
		border: 2px solid var(--neutral-200);
		border-radius: var(--radius-xl);
		padding: var(--space-8) var(--space-6);
		text-align: center;
		cursor: pointer;
		transition: var(--transition-all);
		box-shadow: var(--shadow-sm);
		font-family: inherit;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
	}

	.admin-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-xl);
		border-color: #6366f1;
		background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	}

	.admin-card:active {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.admin-emoji {
		font-size: 4rem;
		line-height: 1;
	}

	.admin-name {
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--neutral-800);
	}

	.admin-subtitle {
		font-size: var(--text-sm);
		color: var(--neutral-500);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
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

		.admin-grid {
			grid-template-columns: 1fr 1fr;
			gap: var(--space-4);
		}

		.admin-card {
			padding: var(--space-6) var(--space-4);
			min-height: 160px;
		}

		.admin-emoji {
			font-size: 3rem;
		}

		.admin-name {
			font-size: var(--text-lg);
		}

		.page-header h1 {
			font-size: var(--text-3xl);
		}

		.page-header h2 {
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