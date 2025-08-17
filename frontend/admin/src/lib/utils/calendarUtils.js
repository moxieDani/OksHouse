/**
 * 달력 관련 유틸리티 함수들
 * 달력 생성, 날짜 계산 등의 기능을 제공합니다.
 */

/**
 * 예약 기간에 해당하는 달력 생성
 * @param {Object} reservation - 예약 객체
 * @returns {Array} 달력 데이터 배열
 */
export function generateReservationCalendar(reservation) {
	const start = new Date(reservation.startDate);
	const end = new Date(reservation.endDate);
	const calendar = [];
	
	// 시작 날짜의 월 첫째 날부터 계산
	const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
	const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
	
	// 첫 주의 빈 공간 채우기
	const startDayOfWeek = firstDay.getDay();
	for (let i = 0; i < startDayOfWeek; i++) {
		calendar.push({ 
			date: null, 
			isReserved: false, 
			isToday: false, 
			reservationPosition: null 
		});
	}
	
	// 달력 날짜 채우기
	for (let date = 1; date <= lastDay.getDate(); date++) {
		const currentDate = new Date(start.getFullYear(), start.getMonth(), date);
		const isReserved = currentDate >= start && currentDate <= end;
		const isToday = currentDate.toDateString() === new Date().toDateString();
		
		// 예약 범위 내에서의 위치 결정
		let reservationPosition = null;
		if (isReserved) {
			const isStart = currentDate.getTime() === start.getTime();
			const isEnd = currentDate.getTime() === end.getTime();
			const isSingle = start.getTime() === end.getTime();
			
			if (isSingle) {
				reservationPosition = 'single';
			} else if (isStart) {
				reservationPosition = 'start';
			} else if (isEnd) {
				reservationPosition = 'end';
			} else {
				reservationPosition = 'middle';
			}
		}
		
		calendar.push({
			date: date,
			isReserved: isReserved,
			isToday: isToday,
			reservationPosition: reservationPosition
		});
	}
	
	return calendar;
}

/**
 * 달력 높이 자동 조정을 위한 헬퍼 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Promise} Promise 객체
 */
export function scheduleHeightAdjustment(delay = 100) {
	return new Promise(resolve => {
		setTimeout(resolve, delay);
	});
}

/**
 * 현재 날짜가 오늘인지 확인
 * @param {Date} date - 확인할 날짜
 * @returns {boolean} 오늘 여부
 */
export function isToday(date) {
	return date.toDateString() === new Date().toDateString();
}

/**
 * 두 날짜가 같은 날짜인지 확인
 * @param {Date} date1 - 첫 번째 날짜
 * @param {Date} date2 - 두 번째 날짜
 * @returns {boolean} 같은 날짜 여부
 */
export function isSameDate(date1, date2) {
	return date1.getTime() === date2.getTime();
}