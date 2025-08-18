/**
 * API Service Layer for Ok's House Admin System
 * Handles all backend API communications for admin interface
 */

import { apiRequest } from '../../../../shared/services/apiBase.js';

/**
 * Admin API Services - 관리자 전용 API
 */
export const adminAPI = {
	/**
	 * Get monthly reservations for admin view
	 */
	async getMonthlyReservations(year, month) {
		const formattedMonth = month.toString().padStart(2, '0');
		return await apiRequest(`/admin/reservations/monthly/${year}/${formattedMonth}`);
	},

	/**
	 * Get all reservations (admin privilege)
	 */
	async getAllReservations() {
		return await apiRequest('/admin/reservations/');
	},

	/**
	 * Get reservations by date range
	 */
	async getReservationsByDateRange(startDate, endDate) {
		return await apiRequest(`/admin/reservations/range?start_date=${startDate}&end_date=${endDate}`);
	},

	/**
	 * Update reservation status (admin privilege)
	 */
	async updateReservationStatus(reservationId, status, adminName) {
		return await apiRequest(`/admin/reservations/${reservationId}/status`, {
			method: 'PATCH',
			body: JSON.stringify({
				status,
				admin_name: adminName
			})
		});
	}
};

/**
 * User API Services - 관리자가 사용자 예약을 조회할 때 사용
 */
export const userAPI = {
	/**
	 * Get monthly reservations
	 */
	async getMonthlyReservations(year, month) {
		const formattedMonth = month.toString().padStart(2, '0');
		return await apiRequest(`/user/reservations/monthly/${year}/${formattedMonth}`);
	},

	/**
	 * Get all reservations for a user (by name and phone)
	 */
	async getUserReservations(name, phone) {
		return await apiRequest('/user/reservations/user', {
			method: 'POST',
			body: JSON.stringify({ name, phone })
		});
	}
};

