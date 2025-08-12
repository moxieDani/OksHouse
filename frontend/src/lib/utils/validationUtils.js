/**
 * 입력 검증 관련 유틸리티 함수들
 * 폼 입력값의 검증 및 포맷팅 함수
 */

// 상수 정의
export const VALIDATION_CONSTANTS = {
	PASSWORD_LENGTH: 4,
	PHONE_MAX_LENGTH: 13,
	PHONE_MIN_LENGTH: 13, // 010-1234-5678 형태
};

/**
 * 전화번호 자동 포맷팅
 * @param {string} value - 입력된 전화번호
 * @returns {string} 포맷팅된 전화번호 (010-1234-5678)
 */
export function formatPhoneNumber(value) {
	// 숫자만 추출
	let cleanValue = value.replace(/[^0-9]/g, '');
	
	// 길이 제한
	if (cleanValue.length > 11) {
		cleanValue = cleanValue.substring(0, 11);
	}
	
	// 포맷팅 적용
	if (cleanValue.length > 3 && cleanValue.length <= 7) {
		return cleanValue.replace(/(\d{3})(\d+)/, '$1-$2');
	} else if (cleanValue.length > 7) {
		return cleanValue.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
	}
	
	return cleanValue;
}

/**
 * 비밀번호 포맷팅 (숫자만 허용, 4자리 제한)
 * @param {string} value - 입력된 비밀번호
 * @returns {string} 포맷팅된 비밀번호
 */
export function formatPassword(value) {
	let cleanValue = value.replace(/[^0-9]/g, '');
	if (cleanValue.length > VALIDATION_CONSTANTS.PASSWORD_LENGTH) {
		cleanValue = cleanValue.substring(0, VALIDATION_CONSTANTS.PASSWORD_LENGTH);
	}
	return cleanValue;
}

/**
 * 사용자 인증 정보 유효성 검사
 * @param {string} name - 이름
 * @param {string} phone - 전화번호
 * @param {string} password - 비밀번호
 * @returns {{isValid: boolean, message: string}} 검증 결과
 */
export function validateAuthInfo(name, phone, password) {
	if (!name.trim()) {
		return { isValid: false, message: '이름을 입력해주세요.' };
	}
	
	if (!phone.trim()) {
		return { isValid: false, message: '전화번호를 입력해주세요.' };
	}
	
	if (!password.trim()) {
		return { isValid: false, message: '비밀번호를 입력해주세요.' };
	}
	
	if (password.length !== VALIDATION_CONSTANTS.PASSWORD_LENGTH || !/^\d{4}$/.test(password)) {
		return { isValid: false, message: '비밀번호는 4자리 숫자여야 합니다.' };
	}
	
	return { isValid: true, message: '' };
}

/**
 * 예약 정보 유효성 검사
 * @param {Date | null} startDate - 시작일
 * @param {number} duration - 숙박 기간
 * @param {Object} guestInfo - 게스트 정보
 * @returns {{isValid: boolean, message: string}} 검증 결과
 */
export function validateReservationInfo(startDate, duration, guestInfo) {
	if (!duration) {
		return { isValid: false, message: '숙박 기간을 선택해주세요.' };
	}
	
	if (!startDate) {
		return { isValid: false, message: '체크인 날짜를 선택해주세요.' };
	}
	
	// 게스트 정보 검증 (수정 모드가 아닌 경우에만)
	if (guestInfo) {
		const authValidation = validateAuthInfo(guestInfo.name, guestInfo.phone, guestInfo.password);
		if (!authValidation.isValid) {
			return authValidation;
		}
	}
	
	return { isValid: true, message: '' };
}