<script>
	import '../app.css';
	
	// SvelteKit automatically provides these props to layout components - declare them to avoid warnings
	export let data = {};
	export let params = {};
</script>

<main class="container">
	<slot />
</main>