<script>
	import '../app.css';
	
	// SvelteKit이 자동으로 전달하는 params prop을 받아서 경고 제거
	export let params = {};
</script>

<main class="container">
	<slot />
</main>