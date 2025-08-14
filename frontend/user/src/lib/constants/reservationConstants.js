/**
 * 예약 시스템 관련 상수 정의
 */

// 예약 단계 정의
export const RESERVATION_STEPS = {
	DURATION_SELECT: 1,  // 숙박 기간 선택
	DATE_SELECT: 2,      // 체크인 날짜 선택
	GUEST_INFO: 3        // 예약자 정보 입력
};

// 관리 페이지 단계 정의
export const MANAGE_STEPS = {
	AUTH: 1,             // 사용자 인증
	RESERVATION_LIST: 2  // 예약 목록 확인
};

// 예약 상태 정의
export const RESERVATION_STATUS = {
	PENDING: 'pending',     // 예약 신청
	CONFIRMED: 'confirmed', // 예약 확정
	DENIED: 'denied'        // 예약 거부
};

// 예약 상태별 한국어 텍스트
export const RESERVATION_STATUS_TEXT = {
	[RESERVATION_STATUS.PENDING]: '예약대기',
	[RESERVATION_STATUS.CONFIRMED]: '예약확정',
	[RESERVATION_STATUS.DENIED]: '예약거부'
};

// 피드백 메시지 타입
export const FEEDBACK_TYPES = {
	INFO: 'info',
	WARNING: 'warning',
	ERROR: 'error',
	SUCCESS: 'success',
	CONFIRM: 'confirm'
};

// 기본 메시지
export const DEFAULT_MESSAGES = {
	SELECT_DATE: '날짜를 선택해주세요',
	SELECT_DURATION: '숙박 기간을 선택해주세요',
	SELECT_CHECKIN: '체크인 날짜를 선택해주세요',
	BLOCKED_DATE: '이미 예약된 날짜입니다.',
	CONFLICT_DETECTED: '선택하신 기간에 이미 예약된 날짜가 포함되어 있습니다.',
	SAME_DATES_SELECTED: '기존 예약과 동일한 날짜입니다. 다른 날짜를 선택해주세요.',
	AUTH_FAILED: '입력하신 정보와 일치하는 예약을 찾을 수 없습니다. 이름, 전화번호, 비밀번호를 다시 확인해주세요.',
	LOADING_RESERVATIONS: '🔄 예약 정보를 불러오는 중...',
	RESERVATION_SUCCESS: '🎉 예약 완료!',
	MODIFICATION_SUCCESS: '🎉 예약 변경 완료!',
	CANCELLATION_SUCCESS: '👌🏻 예약 취소 완료!'
};

// 입력 플레이스홀더
export const PLACEHOLDERS = {
	NAME: '이름을 입력하세요',
	PHONE: '010-1234-5678',
	PASSWORD: '4자리 숫자 비밀번호'
};

// 버튼 텍스트
export const BUTTON_TEXTS = {
	PREV: '이전',
	NEXT: '다음',
	CONFIRM: '확인',
	COMPLETE: '예약 완료',
	MODIFY_COMPLETE: '예약 변경 완료',
	CANCEL: '예약 취소',
	MODIFY: '예약 변경'
};