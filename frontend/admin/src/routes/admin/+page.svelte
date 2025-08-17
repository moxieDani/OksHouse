<script>
	import { administrators } from '$lib/constants/admins.js';
	import { goto } from '$app/navigation';
	
	// params prop을 받아서 경고 제거
	export let params = {};
	
	/**
	 * 관리자 선택 시 해당 관리자 페이지로 이동
	 */
	function selectAdmin(adminId) {
		goto(`/admin/${adminId}`);
	}
</script>

<svelte:head>
	<title>관리자 선택 - Ok's House 관리 시스템</title>
</svelte:head>

<div class="admin-selection">
	<h1>관리자 선택</h1>
	<p class="subtitle">관리할 계정을 선택해주세요</p>
	
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

<style>
	.admin-selection {
		min-height: 100vh;
		padding: var(--space-8) var(--space-4);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	}

	h1 {
		font-size: var(--text-4xl);
		font-weight: 800;
		background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		-webkit-text-fill-color: transparent;
		margin-bottom: var(--space-2);
		text-align: center;
	}

	.subtitle {
		font-size: var(--text-lg);
		color: var(--neutral-600);
		margin-bottom: var(--space-8);
		text-align: center;
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

	/* 모바일 대응 */
	@media (max-width: 640px) {
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

		h1 {
			font-size: var(--text-3xl);
		}

		.subtitle {
			font-size: var(--text-base);
		}
	}
</style>