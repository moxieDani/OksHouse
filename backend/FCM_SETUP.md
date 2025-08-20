# FCM 푸시 알림 설정 가이드

## 1. Firebase 프로젝트 설정

### Firebase 콘솔에서 해야 할 일:
1. [Firebase 콘솔](https://console.firebase.google.com/) 접속
2. "okshouse" 프로젝트 선택
3. **Project Settings > Service accounts > Generate new private key** 클릭하여 서비스 계정 키 다운로드
4. **Project Settings > Cloud Messaging > Web push certificates**에서 VAPID 키 생성

### 필요한 환경변수 설정:
```bash
# .env 파일에 추가 (서비스 계정 키 방식만 사용)
FCM_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json
```

## 2. 백엔드 설정

### 의존성 설치:
```bash
pip install google-auth google-auth-oauthlib httpx
```

### FCM 서비스 계정 키 설정:
1. Firebase 콘솔에서 다운로드한 서비스 계정 키 파일을 백엔드 루트에 저장
2. 환경변수 또는 기본 경로 중 하나를 선택:

**방법 1: 환경변수 사용 (권장)**
```bash
# .env 파일에 추가
FCM_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account-key.json
```

**방법 2: 기본 경로 사용**
백엔드 루트 디렉토리에 다음 중 하나의 이름으로 저장:
- `service-account-key.json` (권장)
- `firebase-service-account.json`

## 3. 프론트엔드 설정

### VAPID 키 설정:
`frontend/admin/src/lib/services/firebase.js`에서 VAPID 키 업데이트:

```javascript
const token = await getToken(messaging, {
    vapidKey: 'YOUR-VAPID-KEY-FROM-FIREBASE-CONSOLE'
});
```

### 아이콘 파일 추가:
다음 아이콘 파일들을 `frontend/admin/static/icons/` 디렉토리에 추가:
- `icon-192x192.png`
- `badge-72x72.png`

## 4. 테스트 방법

### 1. 백엔드 API 테스트:
```bash
# FCM 토큰 등록 테스트
curl -X POST http://localhost:8000/api/v1/admin/fcm/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"fcm_token": "test_token"}'

# 테스트 알림 전송
curl -X POST http://localhost:8000/api/v1/admin/fcm/test-notification \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. 예약 생성/업데이트 테스트:
- 사용자 페이지에서 새로운 예약 생성
- 예약 정보 수정
- 관리자 페이지에서 실시간 알림 확인

## 5. 배포 시 주의사항

### HTTPS 필수:
- FCM은 HTTPS 환경에서만 작동
- 로컬 개발 시에는 localhost에서 가능

### Service Worker 경로:
- `firebase-messaging-sw.js`가 웹사이트 루트에 위치해야 함
- SvelteKit의 경우 `static/` 폴더에 위치

### 도메인 검증:
- Firebase 콘솔에서 웹사이트 도메인을 승인된 도메인에 추가

## 6. 현재 구현된 기능

✅ **백엔드:**
- FCM 서비스 구현
- 관리자 FCM 토큰 관리
- 예약 생성/업데이트 시 자동 알림 전송
- 테스트 알림 API

✅ **프론트엔드:**
- Firebase SDK 초기화
- FCM 토큰 자동 등록
- 포그라운드/백그라운드 알림 처리
- 관리자 페이지에서 자동 데이터 새로고침

## 7. 알림 종류

- **예약 생성**: "🔔 새로운 예약이 등록되었습니다"
- **예약 수정**: "📝 예약 정보가 수정되었습니다"
- **클릭 동작**: 관리자 페이지(/)로 자동 이동

## 8. 보안 고려사항

- FCM 토큰은 메모리에만 저장 (실제로는 데이터베이스에 저장 권장)
- 서비스 계정 키는 환경변수로 관리
- 관리자 인증된 사용자만 FCM 토큰 등록 가능