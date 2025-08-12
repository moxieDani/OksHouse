/**
 * API Service Layer for Ok's House Reservation System
 * Handles all backend API communications
 */

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

/**
 * Generic API request handler with error management
 * @param {string} endpoint - API endpoint path
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} API response data
 */
async function apiRequest(endpoint, options = {}) {
	const url = `${API_BASE_URL}${endpoint}`;
	
	const defaultOptions = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
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
 * User API Services - 사용자 전용 API
 */
export const userAPI = {
	/**
	 * Create a new reservation
	 */
	async createReservation(reservationData) {
		return await apiRequest('/user/reservations/', {
			method: 'POST',
			body: JSON.stringify(reservationData)
		});
	},

	/**
	 * Get monthly reservations
	 */
	async getMonthlyReservations(year, month) {
		const formattedMonth = month.toString().padStart(2, '0');
		return await apiRequest(`/user/reservations/monthly/${year}/${formattedMonth}`);
	},

	/**
	 * Verify user authentication for reservation management
	 */
	async verifyReservation(authData) {
		return await apiRequest('/user/auth/verify', {
			method: 'POST',
			body: JSON.stringify(authData)
		});
	},

	/**
	 * Get all reservations for a user (by name and phone)
	 */
	async getUserReservations(name, phone) {
		return await apiRequest('/user/reservations/user', {
			method: 'POST',
			body: JSON.stringify({ name, phone })
		});
	},

	/**
	 * Delete a reservation with authentication
	 */
	async deleteReservation(reservationId, name, phone, password) {
		return await apiRequest('/user/reservations/', {
			method: 'DELETE',
			body: JSON.stringify({
				reservation_id: reservationId,
				name,
				phone,
				password
			})
		});
	},

	/**
	 * Update a reservation
	 */
	async updateReservation(reservationId, name, phone, startDate, endDate, duration) {
		return await apiRequest('/user/reservations/', {
			method: 'PUT',
			body: JSON.stringify({
				reservation_id: reservationId,
				name,
				phone,
				start_date: startDate,
				end_date: endDate,
				duration
			})
		});
	}
};

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