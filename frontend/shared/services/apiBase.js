/**
 * Shared API Base Service for Ok's House Applications
 * Provides common API functionality for both user and admin applications
 */

// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Generic API request handler with error management
 * @param {string} endpoint - API endpoint path
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} API response data
 */
export async function apiRequest(endpoint, options = {}) {
	const url = `${API_BASE_URL}${endpoint}`;
	
	const defaultOptions = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		credentials: 'include',  // Include cookies with requests
		...options
	};

	try {
		const response = await fetch(url, defaultOptions);
		
		if (response.status === 204) {
			return { success: true };
		}
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
			throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
		}
		
		return await response.json();
	} catch (error) {
		console.error(`API Request failed for ${endpoint}:`, error);
		throw error;
	}
}

/**
 * Format a Date object for API consumption (YYYY-MM-DD)
 */
export function formatDateForAPI(date) {
	if (!date) return null;
	
	const dateObj = date instanceof Date ? date : new Date(date);
	
	if (isNaN(dateObj.getTime())) {
		throw new Error('Invalid date provided to formatDateForAPI');
	}
	
	// Use local date to avoid timezone conversion issues
	const year = dateObj.getFullYear();
	const month = String(dateObj.getMonth() + 1).padStart(2, '0');
	const day = String(dateObj.getDate()).padStart(2, '0');
	
	return `${year}-${month}-${day}`;
}