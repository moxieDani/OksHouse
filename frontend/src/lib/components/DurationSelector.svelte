<script>
	import { createEventDispatcher } from 'svelte';
	import { setDuration } from '$lib/stores/reservation.js';
	
	const dispatch = createEventDispatcher();
	
	export let selectedDuration = 0;
	export let isModificationMode = false;
	
	const durations = [
		{ days: 1, label: '1박 2일' },
		{ days: 2, label: '2박 3일' },
		{ days: 3, label: '3박 4일' },
		{ days: 4, label: '4박 5일' },
		{ days: 5, label: '5박 6일' },
		{ days: 6, label: '6박 7일' },
		{ days: 7, label: '7박 8일' },
		{ days: 8, label: '8박 9일' },
		{ days: 9, label: '9박 10일' },
		{ days: 10, label: '10박 11일' }
	];

	function selectDuration(days) {
		selectedDuration = days;
		setDuration(days);
		dispatch('select', days);
	}
</script>

<div class="form-group">
	<div class="duration-buttons">
		{#each durations as duration}
			<button 
				class="duration-btn"
				class:selected={selectedDuration === duration.days}
				class:modification={isModificationMode}
				type="button"
				on:click={() => selectDuration(duration.days)}
			>
				{duration.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.form-group {
		margin-bottom: var(--space-6);
	}

	label {
		display: block;
		font-weight: 500;
		color: var(--neutral-700);
		margin-bottom: var(--space-4);
		font-size: var(--text-base);
	}

	.duration-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: var(--space-3);
	}

	.duration-btn {
		padding: var(--space-3) var(--space-4);
		border: 2px solid var(--neutral-300);
		border-radius: var(--radius-lg);
		background: white;
		color: var(--neutral-700);
		font-size: var(--text-base);
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		font-family: inherit;
		min-height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.duration-btn:hover {
		border-color: var(--primary);
		color: var(--primary);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.duration-btn.selected {
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
		color: white;
		border-color: var(--primary);
		box-shadow: 0 4px 12px rgba(67, 56, 202, 0.3);
		transform: translateY(-1px);
	}

	/* Modification mode styling */
	.duration-btn.modification:hover {
		border-color: var(--warning);
		color: var(--warning);
	}

	.duration-btn.modification.selected {
		background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
		border-color: var(--warning);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
	}

	@media (max-width: 640px) {
		.duration-buttons {
			grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
			gap: var(--space-2);
		}

		.duration-btn {
			padding: var(--space-2) var(--space-3);
			min-height: 45px;
			font-size: var(--text-sm);
		}

		.duration-btn.selected {
			background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%) !important;
			color: white !important;
			border-color: var(--primary) !important;
			box-shadow: 0 4px 12px rgba(67, 56, 202, 0.3) !important;
			font-weight: 600 !important;
		}

		.duration-btn.modification.selected {
			background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%) !important;
			color: white !important;
			border-color: var(--warning) !important;
			box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3) !important;
			font-weight: 600 !important;
		}
	}

	@media (max-width: 480px) {
		.duration-buttons {
			grid-template-columns: 1fr 1fr;
		}

		.duration-btn.selected {
			background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%) !important;
			color: white !important;
			border-color: var(--primary) !important;
			box-shadow: 0 4px 12px rgba(67, 56, 202, 0.3) !important;
			font-weight: 600 !important;
		}

		.duration-btn.modification.selected {
			background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%) !important;
			color: white !important;
			border-color: var(--warning) !important;
			box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3) !important;
			font-weight: 600 !important;
		}
	}
</style>