/**
 * API Service Layer for Ok's House Reservation System
 * Handles all backend API communications
 */

import { apiRequest, formatDateForAPI } from '../../../../shared/services/apiBase.js';

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

