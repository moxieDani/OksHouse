/**
 * 목업 예약 데이터
 * 개발 및 테스트 목적으로 사용되는 샘플 예약 데이터입니다.
 * 2025년 8-10월 데이터를 포함합니다.
 */

export const mockReservations = [
	// 8월 예약
	{
		id: 1,
		name: '김영희',
		phone: '010-1234-5678',
		startDate: new Date(2025, 7, 5),  // 8월 5일
		endDate: new Date(2025, 7, 8),    // 8월 8일
		duration: 3,
		status: 'confirmed',
		created_at: '2025-07-28T10:30:00Z',
		confirmed_by: 'choi-bunok',
		confirmed_at: '2025-07-29T09:15:00Z'
	},
	{
		id: 2,
		name: '박철수',
		phone: '010-9876-5432',
		startDate: new Date(2025, 7, 15), // 8월 15일
		endDate: new Date(2025, 7, 17),   // 8월 17일
		duration: 2,
		status: 'pending',
		created_at: '2025-08-10T14:15:00Z'
	},
	{
		id: 3,
		name: '이정민',
		phone: '010-5555-1234',
		startDate: new Date(2025, 7, 22), // 8월 22일
		endDate: new Date(2025, 7, 25),   // 8월 25일
		duration: 3,
		status: 'confirmed',
		created_at: '2025-08-15T09:45:00Z',
		confirmed_by: 'park-seoeun',
		confirmed_at: '2025-08-16T14:30:00Z'
	},
	{
		id: 4,
		name: '최미영',
		phone: '010-7777-8888',
		startDate: new Date(2025, 7, 28), // 8월 28일
		endDate: new Date(2025, 7, 31),   // 8월 31일
		duration: 3,
		status: 'cancelled',
		created_at: '2025-08-20T16:20:00Z',
		confirmed_by: 'choi-bunok',
		confirmed_at: '2025-08-21T10:00:00Z'
	},
	// 9월 예약
	{
		id: 5,
		name: '정호석',
		phone: '010-3333-9999',
		startDate: new Date(2025, 8, 3),  // 9월 3일
		endDate: new Date(2025, 8, 6),    // 9월 6일
		duration: 3,
		status: 'confirmed',
		created_at: '2025-08-25T11:10:00Z',
		confirmed_by: 'park-jiyoung',
		confirmed_at: '2025-08-26T15:20:00Z'
	},
	{
		id: 6,
		name: '강지윤',
		phone: '010-4444-5555',
		startDate: new Date(2025, 8, 12), // 9월 12일
		endDate: new Date(2025, 8, 14),   // 9월 14일
		duration: 2,
		status: 'pending',
		created_at: '2025-09-08T13:30:00Z'
	},
	{
		id: 7,
		name: '조민준',
		phone: '010-6666-7777',
		startDate: new Date(2025, 8, 20), // 9월 20일
		endDate: new Date(2025, 8, 22),   // 9월 22일
		duration: 2,
		status: 'confirmed',
		created_at: '2025-09-15T16:45:00Z',
		confirmed_by: 'park-taehyun',
		confirmed_at: '2025-09-16T11:30:00Z'
	},
	{
		id: 8,
		name: '윤서아',
		phone: '010-8888-9999',
		startDate: new Date(2025, 8, 27), // 9월 27일
		endDate: new Date(2025, 8, 29),   // 9월 29일
		duration: 2,
		status: 'cancelled',
		created_at: '2025-09-20T12:15:00Z',
		confirmed_by: 'choi-bunok',
		confirmed_at: '2025-09-21T09:45:00Z'
	},
	// 10월 예약
	{
		id: 9,
		name: '한동훈',
		phone: '010-1111-2222',
		startDate: new Date(2025, 9, 5),  // 10월 5일
		endDate: new Date(2025, 9, 8),    // 10월 8일
		duration: 3,
		status: 'confirmed',
		created_at: '2025-09-28T14:20:00Z',
		confirmed_by: 'park-seoeun',
		confirmed_at: '2025-09-29T10:15:00Z'
	},
	{
		id: 10,
		name: '오예진',
		phone: '010-2222-3333',
		startDate: new Date(2025, 9, 15), // 10월 15일
		endDate: new Date(2025, 9, 17),   // 10월 17일
		duration: 2,
		status: 'pending',
		created_at: '2025-10-10T11:00:00Z'
	},
	{
		id: 11,
		name: '임연수',
		phone: '010-3333-4444',
		startDate: new Date(2025, 9, 22), // 10월 22일
		endDate: new Date(2025, 9, 25),   // 10월 25일
		duration: 3,
		status: 'confirmed',
		created_at: '2025-10-18T15:30:00Z',
		confirmed_by: 'park-jiyoung',
		confirmed_at: '2025-10-19T13:45:00Z'
	},
	{
		id: 12,
		name: '송지훈',
		phone: '010-4444-5555',
		startDate: new Date(2025, 9, 28), // 10월 28일
		endDate: new Date(2025, 9, 31),   // 10월 31일
		duration: 3,
		status: 'pending',
		created_at: '2025-10-25T17:00:00Z'
	}
];