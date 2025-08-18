/**
 * 관리자 정보 상수 및 유틸리티 함수
 * 관리자 데이터와 관련된 헬퍼 함수들을 제공합니다.
 */

/**
 * 관리자 정보 데이터
 * 각 관리자의 이름과 이모지를 포함합니다.
 */
export const administrators = {
	'choi-bunok': { name: '최분옥', emoji: '👩‍💼' },
	'choi-changhwan': { name: '최창환', emoji: '👨‍💻' },
	'park-seoeun': { name: '박서은', emoji: '👩‍💻' },
	'park-jiyoung': { name: '박지영', emoji: '👩‍🏫' },
	'park-taehyun': { name: '박태현', emoji: '👨‍💼' }
};

/**
 * 관리자 ID로 이름 조회
 * @param {string} adminId - 관리자 ID
 * @returns {string} 관리자 이름
 */
export function getAdminName(adminId) {
	return administrators[adminId]?.name || '알 수 없음';
}

/**
 * 관리자 ID로 이모지 조회
 * @param {string} adminId - 관리자 ID
 * @returns {string} 관리자 이모지
 */
export function getAdminEmoji(adminId) {
	return administrators[adminId]?.emoji || '👤';
}

/**
 * 현재 관리자 정보 조회
 * @param {string} adminId - 관리자 ID
 * @returns {Object|null} 관리자 정보 객체
 */
export function getCurrentAdmin(adminId) {
	return administrators[adminId] || null;
}

/**
 * 관리자 이름으로 ID 조회
 * @param {string} adminName - 관리자 이름
 * @returns {string|null} 관리자 ID
 */
export function getAdminIdByName(adminName) {
	for (const [id, admin] of Object.entries(administrators)) {
		if (admin.name === adminName) {
			return id;
		}
	}
	return null;
}