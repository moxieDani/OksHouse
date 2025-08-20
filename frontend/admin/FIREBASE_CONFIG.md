# Firebase FCM 설정 가이드

## ⚠️ 현재 상태
FCM 기본 구조는 완성되었지만, 실제 동작을 위해서는 Firebase 콘솔에서 추가 설정이 필요합니다.

## 🔧 Firebase 콘솔 설정

### 1. VAPID 키 생성
1. [Firebase 콘솔](https://console.firebase.google.com/) → "okshouse" 프로젝트
2. **Project Settings** → **Cloud Messaging** 탭
3. **Web configuration** → **Generate key pair** 클릭
4. 생성된 키를 복사

### 2. 프론트엔드 VAPID 키 설정
`frontend/admin/src/lib/services/firebase.js` 파일에서:

```javascript
// 이 부분을 수정
const token = await getToken(messaging, {
    vapidKey: 'YOUR-GENERATED-VAPID-KEY-HERE'
});
```

### 3. 백엔드 서비스 계정 키 설정
1. Firebase 콘솔 → **Project Settings** → **Service accounts**
2. **Generate new private key** 클릭하여 JSON 파일 다운로드
3. 백엔드 루트 폴더에 `service-account-key.json`으로 저장
4. `.env` 파일에 경로 설정 (선택사항):

```bash
# 환경변수로 경로 지정 (선택사항)
FCM_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json
```

**자동 경로 탐색**: 환경변수를 설정하지 않아도 다음 경로를 자동으로 찾습니다:
- `service-account-key.json`
- `firebase-service-account.json`

## 📱 테스트 방법

### 1. 기본 FCM 토큰 생성 테스트
브라우저에서 관리자 페이지(http://localhost:5175) 접속 후 콘솔 확인:
```
FCM 토큰 획득: [긴 토큰 문자열]
```

### 2. 알림 권한 확인
브라우저에서 알림 권한을 허용했는지 확인

### 3. 예약 생성/수정 테스트
- 사용자 페이지에서 새 예약 생성
- 관리자 페이지에서 실시간 알림 확인

## 🚧 임시 우회 방법

VAPID 키 설정 전에도 기본 FCM 초기화는 작동합니다:
- FCM 토큰 생성 ✅
- 포그라운드 메시지 리스너 설정 ✅
- 실제 푸시 알림 전송은 VAPID 키 설정 후 가능

## 🔄 현재 구현된 기능

✅ **완성된 부분:**
- FCM 서비스 기본 구조
- 브라우저 호환성 처리 (SSR 문제 해결)
- 토큰 생성 및 관리 시스템
- 예약 생성/수정 시 알림 전송 로직

⚠️ **추가 설정 필요:**
- Firebase VAPID 키 설정
- 서비스 계정 키 파일 설정
- 실제 푸시 알림 테스트

## 📝 다음 단계

1. Firebase 콘솔에서 VAPID 키 생성
2. 프론트엔드에 VAPID 키 설정
3. 백엔드에 서비스 계정 키 설정
4. 실제 푸시 알림 테스트

설정 완료 후 예약 생성/수정 시 관리자에게 실시간 푸시 알림이 전송됩니다!