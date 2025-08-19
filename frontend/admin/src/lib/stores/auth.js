import { writable } from 'svelte/store';
import { adminAPI } from '../services/api.js';

/**
 * Authentication Store for Admin System
 * Manages admin authentication state and tokens
 */

// Authentication state
export const isAuthenticated = writable(false);
export const currentAdmin = writable(null);
export const accessToken = writable(null);
export const isLoading = writable(false);

// Private token storage
let currentAccessToken = null;

/**
 * Set access token and update session storage
 */
export function setAccessToken(token) {
	currentAccessToken = token;
	accessToken.set(token);
	
	if (token) {
		sessionStorage.setItem('admin_access_token', token);
	} else {
		sessionStorage.removeItem('admin_access_token');
	}
}

/**
 * Get current access token
 */
export function getAccessToken() {
	if (!currentAccessToken) {
		currentAccessToken = sessionStorage.getItem('admin_access_token');
	}
	return currentAccessToken;
}

/**
 * Admin phone verification and login
 */
export async function verifyPhoneAndLogin(phone) {
	isLoading.set(true);
	
	try {
		const response = await adminAPI.verifyPhone(phone);
		
		// Set access token
		setAccessToken(response.access_token);
		
		// Set admin info
		const adminInfo = {
			admin_id: response.admin_id,
			name: response.admin_name,
			phone: phone
		};
		
		currentAdmin.set(adminInfo);
		isAuthenticated.set(true);
		
		return {
			success: true,
			admin: adminInfo
		};
		
	} catch (error) {
		console.error('Phone verification failed:', error);
		return {
			success: false,
			error: error.message || '전화번호 인증에 실패했습니다.'
		};
	} finally {
		isLoading.set(false);
	}
}

/**
 * Refresh access token using refresh token (from httponly cookie)
 */
export async function refreshAccessToken() {
	try {
		const response = await adminAPI.refreshToken();
		
		// Set new access token
		setAccessToken(response.access_token);
		
		// Update admin info
		const adminInfo = {
			admin_id: response.admin_id,
			name: response.admin_name
		};
		
		currentAdmin.set(adminInfo);
		isAuthenticated.set(true);
		
		return {
			success: true,
			admin: adminInfo
		};
		
	} catch (error) {
		console.error('Token refresh failed:', error);
		// Clear authentication state on refresh failure
		await logout();
		return {
			success: false,
			error: error.message || '토큰 갱신에 실패했습니다.'
		};
	}
}

/**
 * Get current admin info using access token
 */
export async function getCurrentAdminInfo() {
	const token = getAccessToken();
	if (!token) {
		return { success: false, error: '액세스 토큰이 없습니다.' };
	}
	
	try {
		const adminInfo = await adminAPI.getCurrentAdmin(token);
		
		currentAdmin.set(adminInfo);
		isAuthenticated.set(true);
		
		return {
			success: true,
			admin: adminInfo
		};
		
	} catch (error) {
		console.error('Get admin info failed:', error);
		// Try to refresh token on failure
		return await refreshAccessToken();
	}
}

/**
 * Check authentication status and auto-login
 */
export async function checkAuthStatus() {
	isLoading.set(true);
	
	try {
		// First, try with existing access token
		const token = getAccessToken();
		if (token) {
			const result = await getCurrentAdminInfo();
			if (result.success) {
				return result;
			}
		}
		
		// If access token doesn't work, try refresh token
		const refreshResult = await refreshAccessToken();
		return refreshResult;
		
	} catch (error) {
		console.error('Auth check failed:', error);
		await logout();
		return { success: false };
	} finally {
		isLoading.set(false);
	}
}

/**
 * Logout admin
 */
export async function logout() {
	const token = getAccessToken();
	
	try {
		// Call logout API
		await adminAPI.logout(token);
	} catch (error) {
		console.error('Logout API failed:', error);
		// Continue with local cleanup even if API fails
	}
	
	// Clear local state
	setAccessToken(null);
	currentAdmin.set(null);
	isAuthenticated.set(false);
	
	// Clear session storage
	sessionStorage.removeItem('admin_access_token');
}

/**
 * Auto token refresh utility
 * Should be called periodically to refresh tokens before they expire
 */
export async function autoRefreshToken() {
	const token = getAccessToken();
	if (!token) return;
	
	// Try to refresh token silently
	try {
		await refreshAccessToken();
	} catch (error) {
		console.error('Auto refresh failed:', error);
		// Don't throw error for auto refresh failures
	}
}

// Auto refresh every 4 minutes (tokens expire in 5 minutes)
if (typeof window !== 'undefined') {
	setInterval(autoRefreshToken, 4 * 60 * 1000);
}