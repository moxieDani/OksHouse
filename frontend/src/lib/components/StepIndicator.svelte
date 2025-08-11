<script>
	import { reservationState, stepNavigation } from '$lib/stores/reservation.js';

	export let isModificationMode = false;
	
	// Get current step from reservationState
	$: currentStep = $reservationState.currentStep;
	
	$: steps = [
		{ number: 1, label: '기간선택' },
		{ number: 2, label: '날짜선택' },
		{ number: 3, label: '정보입력' }
	];
</script>

<nav class="step-indicator" role="navigation" aria-label="예약 단계">
	<div class="step-indicator-container">
		{#each steps as step, index}
			<div class="step-indicator-item">
				<span 
					class="step-dot"
					class:active={currentStep === step.number}
					class:completed={currentStep > step.number}
					class:modification={isModificationMode}
					aria-label="{step.number}단계"
				>
					{#if currentStep > step.number}
						✓
					{:else}
						{step.number}
					{/if}
				</span>
				<div 
					class="step-label"
					class:active-label={currentStep === step.number}
					class:completed-label={currentStep > step.number}
					class:modification-label={isModificationMode && currentStep === step.number}
				>
					{step.label}
				</div>
			</div>
			{#if index < steps.length - 1}
				<div 
					class="step-arrow" 
					class:active-arrow={currentStep > step.number}
					aria-hidden="true"
				>
					→
				</div>
			{/if}
		{/each}
	</div>
</nav>

<style>
	.step-indicator {
		margin-bottom: var(--space-8);
		padding: var(--space-4) 0;
	}

	.step-indicator-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.step-indicator-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		min-width: 80px;
	}

	.step-dot {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: var(--text-base);
		transition: var(--transition-colors), var(--transition-shadow), var(--transition-transform);
		background: var(--neutral-300);
		color: var(--neutral-600);
		border: 2px solid var(--neutral-300);
	}

	.step-dot.active {
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
		box-shadow: 0 4px 15px rgba(67, 56, 202, 0.5);
		color: white;
		border: 2px solid var(--primary);
		transform: scale(1.2);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 4px 15px rgba(67, 56, 202, 0.5);
		}
		50% {
			box-shadow: 0 6px 20px rgba(67, 56, 202, 0.7);
		}
		100% {
			box-shadow: 0 4px 15px rgba(67, 56, 202, 0.5);
		}
	}

	.step-dot.completed {
		background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
		box-shadow: 0 2px 6px rgba(67, 56, 202, 0.4);
		color: white;
		border: 2px solid var(--primary-dark);
		opacity: 0.9;
	}

	/* Modification mode styling */
	.step-dot.modification.active {
		background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
		box-shadow: 0 4px 15px rgba(245, 158, 11, 0.5);
		border: 2px solid var(--warning);
		transform: scale(1.2);
		animation: pulseWarning 2s infinite;
	}

	@keyframes pulseWarning {
		0% {
			box-shadow: 0 4px 15px rgba(245, 158, 11, 0.5);
		}
		50% {
			box-shadow: 0 6px 20px rgba(245, 158, 11, 0.7);
		}
		100% {
			box-shadow: 0 4px 15px rgba(245, 158, 11, 0.5);
		}
	}

	.step-dot.modification.completed {
		background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
		box-shadow: 0 2px 6px rgba(180, 83, 9, 0.4);
		border: 2px solid #b45309;
	}

	.step-label {
		font-size: var(--text-sm);
		color: var(--neutral-600);
		font-weight: 500;
		text-align: center;
		transition: var(--transition-colors), var(--transition-transform);
	}

	.step-label.active-label {
		color: var(--primary);
		font-weight: 600;
		transform: scale(1.05);
	}

	.step-label.completed-label {
		color: var(--primary-dark);
		font-weight: 600;
	}

	.step-label.modification-label {
		color: var(--warning);
	}

	.step-arrow {
		font-size: var(--text-lg);
		color: var(--neutral-400);
		margin: 0 var(--space-2);
		transition: var(--transition-colors);
	}

	.step-arrow.active-arrow {
		color: var(--primary);
		font-weight: bold;
	}

	@media (max-width: 480px) {
		.step-indicator-container {
			gap: var(--space-1);
		}

		.step-indicator-item {
			min-width: 60px;
		}

		.step-dot {
			width: 32px;
			height: 32px;
			font-size: var(--text-sm);
		}

		.step-dot.active {
			transform: scale(1.15);
		}

		.step-dot.modification.active {
			transform: scale(1.15);
		}

		.step-label {
			font-size: var(--text-xs);
		}

		.step-label.active-label {
			transform: scale(1.02);
		}

		.step-arrow {
			font-size: var(--text-base);
			margin: 0 var(--space-1);
		}
	}
</style>