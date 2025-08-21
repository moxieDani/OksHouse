<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	
	// SvelteKit automatically provides these props to layout components - declare them to avoid warnings
	export let data = {};
	export let params = {};
	
	/**
	 * 홈 페이지로 이동하는 함수
	 */
	function goHome() {
		goto('/');
	}
	
	// 현재 페이지가 홈 페이지이거나 로그인 페이지인지 확인 (홈 버튼 숨김)
	$: isHomePage = $page.url.pathname === '/' || $page.url.pathname === '/login';
	
	// 현재 페이지에 따른 홈 버튼 텍스트 결정
	$: homeButtonText = (() => {
		const pathname = $page.url.pathname;
		if (pathname.includes('/reservation')) return '🏠 홈으로';
		if (pathname.includes('/manage')) return '🏠 홈으로';
		return '🏠 처음으로';
	})();
</script>

{#if !isHomePage}
	<div class="home-button-container">
		<button 
			class="home-button" 
			on:click={goHome}
			aria-label="홈으로 돌아가기"
			title="홈으로 돌아가기"
		>
			🏠 처음으로
		</button>
	</div>
{/if}

<main class="container">
	<slot />
</main>

<style>
	.home-button-container {
		position: fixed;
		top: 20px;
		left: 20px;
		z-index: 1000;
	}
	
	.home-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: white;
		border: none;
		border-radius: 12px;
		color: var(--neutral-800);
		font-family: inherit;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		box-shadow: var(--shadow-md);
		text-decoration: none;
	}
	
	.home-button:hover {
		border-color: var(--primary);
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}
	
	.home-button:active {
		transform: translateY(0);
		box-shadow: var(--shadow-md);
	}
	
	/* 모바일 화면에서 크기 조정 */
	@media (max-width: 640px) {
		.home-button-container {
			top: 15px;
			left: 15px;
		}
		
		.home-button {
			padding: 10px 14px;
			font-size: 13px;
		}
	}
</style>