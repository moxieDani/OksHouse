<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { login, checkAuth } from '$lib/stores/auth.js';

	let password = '';
	let attemptCount = 0;
	let maxAttempts = 3;
	let errorMessage = '';
	let isLoading = false;

	onMount(() => {
		// 이미 로그인된 경우 메인 페이지로 리다이렉트
		if (browser) {
			const authStatus = checkAuth();
			if (authStatus) {
				goto('/');
			}
		}
	});

	function formatPassword(value) {
		// 숫자만 허용
		let numericValue = value.replace(/\D/g, '');
		
		return numericValue;
	}

	function handleInput(event) {
		password = formatPassword(event.target.value);
	}

	async function handleLogin() {
		if (!password) {
			errorMessage = '비밀번호를 입력해주세요.';
			return;
		}

		if (attemptCount >= maxAttempts) {
			errorMessage = `최대 ${maxAttempts}회 시도할 수 있습니다. 페이지를 새로고침하여 다시 시도하세요.`;
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('/api/v1/user/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ password })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				// 로그인 성공 - 스토어에 저장
				login();
				goto('/');
			} else {
				attemptCount++;
				const remainingAttempts = maxAttempts - attemptCount;
				if (remainingAttempts > 0) {
					errorMessage = `비밀번호가 틀렸습니다. (${remainingAttempts}회 남음)`;
				} else {
					errorMessage = `최대 ${maxAttempts}회 시도했습니다. 페이지를 새로고침하여 다시 시도하세요.`;
				}
			}
		} catch (error) {
			console.error('로그인 오류:', error);
			errorMessage = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>로그인 - Ok's House</title>
</svelte:head>

<div class="login-container">
	<div class="login-wrapper">
		<header class="login-header">
			<h1><span class="emoji-normal">🏡</span> Ok's 러브하우스</h1>
			<h2>로그인이 필요합니다</h2>
		</header>

		<div class="login-form">
			<div class="form-group">
				<label for="password">로그인 비밀번호를 입력하세요</label>
				<input
					id="password"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					placeholder="숫자만 입력"
					bind:value={password}
					on:input={handleInput}
					on:keypress={handleKeyPress}
					disabled={isLoading || attemptCount >= maxAttempts}
					class="password-input"
					autocomplete="off"
				/>
				<div class="hint">힌트: 식당전화번호</div>
			</div>

			{#if errorMessage}
				<div class="error-message" role="alert">
					{errorMessage}
				</div>
			{/if}

			<button
				type="button"
				on:click={handleLogin}
				disabled={isLoading || attemptCount >= maxAttempts || !password}
				class="login-btn"
			>
				{#if isLoading}
					로그인 중...
				{:else}
					로그인
				{/if}
			</button>

			<div class="attempt-info">
				{#if attemptCount > 0}
					<span class="attempt-count">
						시도 횟수: {attemptCount}/{maxAttempts}
					</span>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-6);
	}

	.login-wrapper {
		background: white;
		border-radius: var(--radius-xl);
		padding: var(--space-8);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 400px;
	}

	.login-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.login-header h1 {
		font-size: var(--text-2xl);
		color: var(--neutral-800);
		margin-bottom: var(--space-2);
	}

	.login-header h2 {
		font-size: var(--text-lg);
		color: var(--neutral-600);
		font-weight: 400;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	label {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--neutral-700);
	}

	.password-input {
		padding: var(--space-4);
		border: 2px solid var(--neutral-200);
		border-radius: var(--radius-lg);
		font-size: var(--text-lg);
		text-align: center;
		letter-spacing: 0.1em;
		transition: var(--transition-colors);
	}

	.password-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--primary-100);
	}

	.password-input:disabled {
		background-color: var(--neutral-100);
		color: var(--neutral-400);
		cursor: not-allowed;
	}

	.hint {
		font-size: var(--text-sm);
		color: var(--neutral-500);
		text-align: center;
		font-style: italic;
	}

	.login-btn {
		padding: var(--space-4);
		background: var(--primary);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-size: var(--text-lg);
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition-colors);
	}

	.login-btn:hover:not(:disabled) {
		background: var(--primary-dark);
	}

	.login-btn:disabled {
		background: var(--neutral-300);
		cursor: not-allowed;
	}

	.error-message {
		padding: var(--space-3);
		background: var(--error-100);
		color: var(--error-700);
		border-radius: var(--radius-md);
		text-align: center;
		font-size: var(--text-sm);
		border: 1px solid var(--error-200);
	}

	.attempt-info {
		text-align: center;
	}

	.attempt-count {
		font-size: var(--text-sm);
		color: var(--warning-600);
		font-weight: 500;
	}

	.emoji-normal {
		background: none !important;
		background-clip: initial !important;
		-webkit-background-clip: initial !important;
		color: initial !important;
		-webkit-text-fill-color: initial !important;
	}

	@media (max-width: 640px) {
		.login-container {
			padding: var(--space-4);
		}

		.login-wrapper {
			padding: var(--space-6);
		}

		.login-header h1 {
			font-size: var(--text-xl);
		}

		.login-header h2 {
			font-size: var(--text-base);
		}
	}
</style>