<script>
	import { goto } from '$app/navigation';
	
	// 관리자 목록 정의
	const administrators = [
		{ id: 'choi-bunok', name: '최분옥', emoji: '👩‍💼' },
		{ id: 'choi-changhwan', name: '최창환', emoji: '👨‍💻' },
		{ id: 'park-seoeun', name: '박서은', emoji: '👩‍💻' },
		{ id: 'park-jiyoung', name: '박지영', emoji: '👩‍🏫' },
		{ id: 'park-taehyun', name: '박태현', emoji: '👨‍💼' }
	];
	
	/**
	 * 관리자 선택 시 해당 관리자의 달력 화면으로 이동
	 * @param {Object} admin - 선택된 관리자 정보
	 */
	function selectAdministrator(admin) {
		goto(`/admin/${admin.id}`);
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

		<nav class="admin-menu">
			{#each administrators as admin (admin.id)}
				<button 
					class="admin-btn" 
					on:click={() => selectAdministrator(admin)}
				>
					<span class="emoji">{admin.emoji}</span>
					<div class="text">
						<div class="main-text">{admin.name}</div>
						<div class="sub-text">관리자</div>
					</div>
					<span class="arrow">→</span>
				</button>
			{/each}
		</nav>
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

	.admin-menu {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		max-width: 400px;
	}

	.admin-btn {
		display: flex;
		align-items: center;
		padding: var(--space-6);
		background: white;
		border: none;
		border-radius: var(--radius-xl);
		color: var(--neutral-800);
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		cursor: pointer;
		font-family: inherit;
		font-size: var(--text-base);
		box-shadow: var(--shadow-md);
		min-height: 80px;
		text-align: left;
		width: 100%;
	}

	.admin-btn:hover {
		border-color: #6366f1;
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
	}

	.emoji {
		font-size: 2.5rem;
		margin-right: var(--space-4);
		flex-shrink: 0;
	}

	.text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.main-text {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--neutral-800);
	}

	.sub-text {
		font-size: var(--text-sm);
		color: var(--neutral-500);
		font-weight: 400;
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

		.admin-menu {
			max-width: 100%;
		}

		.admin-btn {
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