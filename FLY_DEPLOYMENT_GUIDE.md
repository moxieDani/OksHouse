# Fly.io 배포 가이드 - Ok's House Backend

## 목차
1. [사전 준비](#사전-준비)
2. [Fly.io CLI 설치 및 로그인](#flyio-cli-설치-및-로그인)
3. [환경변수 설정](#환경변수-설정)
4. [FCM 서비스 계정 키 설정](#fcm-서비스-계정-키-설정)
5. [배포 실행](#배포-실행)
6. [배포 후 확인](#배포-후-확인)
7. [트러블슈팅](#트러블슈팅)

## 사전 준비

### 필수 파일 확인
- `Dockerfile` 존재 확인
- `fly.toml` 설정 파일 존재 확인
- FCM 서비스 계정 키 파일 준비 (`.json` 파일)

### 로컬 환경변수 파일
`.env` 파일이 프로젝트 루트에 있는지 확인하세요.

## Fly.io CLI 설치 및 로그인

### 1. Fly CLI 설치
```bash
# macOS (Homebrew)
brew install flyctl

# Linux/WSL
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### 2. Fly.io 로그인
```bash
flyctl auth login
```

### 3. 기존 앱 연결 (이미 생성된 경우)
```bash
flyctl apps list
flyctl apps open okshouse-backend
```

## 환경변수 설정

### 1. 필수 환경변수 일괄 설정

아래 명령어들을 순서대로 실행하여 모든 환경변수를 설정합니다:

```bash
# 애플리케이션 기본 설정
flyctl secrets set APP_NAME="Ok's House 별장 예약시스템"
flyctl secrets set APP_VERSION="1.0.0"

# CORS 설정 (프론트엔드 도메인)
flyctl secrets set ALLOWED_ORIGINS="[프론트엔드 도메인 URL]"

# 보안 설정 - .env 파일에서 값 복사하여 설정
flyctl secrets set SECRET_KEY="[.env 파일의 SECRET_KEY 값 복사]"
flyctl secrets set JWT_SECRET_KEY="[.env 파일의 JWT_SECRET_KEY 값 복사]"
flyctl secrets set JWT_ALGORITHM="HS256"

# 토큰 만료시간 설정
flyctl secrets set ACCESS_TOKEN_EXPIRE_SECONDS="300"
flyctl secrets set REFRESH_TOKEN_EXPIRE_SECONDS="31536000"

# AES 암호화 키 - .env 파일에서 복사
flyctl secrets set AES_KEY="[.env 파일의 AES_KEY 값 복사]"
flyctl secrets set AES_IV="[.env 파일의 AES_IV 값 복사]"

# 로그인 키 (사용자 페이지용) - .env 파일에서 복사
flyctl secrets set LOGIN_KEYS="[.env 파일의 LOGIN_KEYS 값 복사]"

# API 키 (Frontend 인증용) - .env 파일에서 복사
flyctl secrets set ALLOWED_API_KEYS="[.env 파일의 ALLOWED_API_KEYS 값 복사]"

# 로깅 설정
flyctl secrets set LOG_LEVEL="INFO"
flyctl secrets set LOG_FILE="./logs/app.log"

# 파일 업로드 설정
flyctl secrets set MAX_FILE_SIZE="10485760"
flyctl secrets set UPLOAD_PATH="./uploads"

# 백업 설정
flyctl secrets set BACKUP_PATH="./backups"
flyctl secrets set BACKUP_INTERVAL="24"

# 모니터링 설정
flyctl secrets set ENABLE_METRICS="false"
```

### 2. 환경변수 확인
```bash
flyctl secrets list
```

## FCM 서비스 계정 키 설정

FCM 서비스 계정 키는 JSON 파일의 내용 전체를 환경변수로 설정해야 합니다.

### 1. 서비스 계정 키 파일 내용 확인
```bash
# 로컬 환경에서 FCM 키 파일 경로 확인
cat /Users/kisoon/Downloads/service-account-key.json
```

### 2. JSON 내용을 환경변수로 설정
```bash
# 방법 1: 파일 내용을 직접 읽어서 설정
flyctl secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat /Users/kisoon/Downloads/service-account-key.json)"

# 방법 2: 파일 내용을 복사해서 설정 (따옴표 주의)
flyctl secrets set FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**⚠️ 주의사항:**
- JSON 내용을 설정할 때 작은따옴표(`'`)로 감싸거나 `$()` 명령 치환을 사용하세요
- JSON 내용에 개행문자나 특수문자가 있을 수 있으므로 파일에서 직접 읽는 방법을 권장합니다

### 3. FCM 환경변수 확인
```bash
flyctl secrets list | grep FCM
```

## 배포 실행

### 1. 배포 시작
```bash
flyctl deploy
```

### 2. 배포 상태 확인
```bash
flyctl status
flyctl logs
```

### 3. 볼륨 생성 (최초 배포시에만)
데이터베이스 파일 저장용 볼륨이 없다면 생성:
```bash
flyctl volumes create okshouse_data --size 1
```

## 배포 후 확인

### 1. 앱 상태 확인
```bash
flyctl status
flyctl apps open okshouse-backend
```

### 2. 로그 확인
```bash
# 실시간 로그 확인
flyctl logs -f

# 최근 로그 확인
flyctl logs
```

### 3. 헬스체크 확인
```bash
curl https://[your-app-name].fly.dev/api/v1/public/health
```

### 4. 관리자 인증 테스트
```bash
curl -X POST https://[your-app-name].fly.dev/api/v1/admin/auth/verify-phone \
  -H "Content-Type: application/json" \
  -H "X-API-Key: [설정한 API 키]" \
  -d '{"phone":"[등록된 관리자 전화번호]"}'
```

## 트러블슈팅

### 1. 환경변수 관련 오류

**문제:** 환경변수를 찾을 수 없다는 오류
```bash
# 모든 시크릿 확인
flyctl secrets list

# 특정 시크릿 다시 설정
flyctl secrets set VARIABLE_NAME="value"
```

### 2. FCM 키 관련 오류

**문제:** FCM 인증 실패
```bash
# FCM 키가 올바르게 설정되었는지 확인
flyctl secrets list | grep FCM

# FCM 키 다시 설정 (JSON 파일에서 직접 읽기)
flyctl secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat /path/to/service-account-key.json)"
```

### 3. 데이터베이스 오류

**문제:** 데이터베이스 파일에 접근할 수 없음
```bash
# 볼륨 상태 확인
flyctl volumes list

# 볼륨이 없다면 생성
flyctl volumes create okshouse_data --size 1

# 앱 재시작
flyctl apps restart okshouse-backend
```

### 4. CORS 오류

**문제:** 프론트엔드에서 API 호출 시 CORS 오류
```bash
# ALLOWED_ORIGINS 확인
flyctl secrets list | grep ALLOWED_ORIGINS

# 올바른 프론트엔드 URL로 설정
flyctl secrets set ALLOWED_ORIGINS="[프론트엔드 도메인 URL]"
```

### 5. 로그 확인 명령어
```bash
# 실시간 로그 (배포 중 문제 확인용)
flyctl logs -f

# 최근 100줄 로그
flyctl logs --lines 100

# 특정 시간대 로그
flyctl logs --since 1h
```

### 6. 앱 재시작
```bash
# 앱 재시작 (환경변수 변경 후)
flyctl apps restart okshouse-backend

# 강제 재배포
flyctl deploy --force
```

## 유용한 명령어 모음

```bash
# 앱 정보 확인
flyctl apps list
flyctl status
flyctl info

# 환경변수 관리
flyctl secrets list
flyctl secrets set KEY=VALUE
flyctl secrets unset KEY

# 로그 확인
flyctl logs
flyctl logs -f
flyctl logs --since 1h

# 앱 관리
flyctl apps restart
flyctl deploy
flyctl deploy --force

# 볼륨 관리
flyctl volumes list
flyctl volumes create NAME --size SIZE

# 터미널 접속 (디버깅용)
flyctl ssh console
```

## 주의사항

1. **환경변수 보안**: 
   - 모든 보안 관련 환경변수는 `.env` 파일에서 실제 값을 복사해서 설정하세요
   - 프로덕션 환경용 강력한 키가 이미 `.env` 파일에 설정되어 있는지 확인하세요

2. **FCM 키 관리**: 
   - FCM 서비스 계정 키는 민감한 정보이므로 절대 Git에 커밋하지 마세요
   - 로컬의 실제 키 파일 경로를 확인하고 `cat` 명령어로 읽어서 설정하세요

3. **데이터베이스 백업**: 중요한 데이터가 있다면 정기적으로 백업하세요.

4. **모니터링**: 로그와 상태를 정기적으로 확인하여 서비스가 정상 작동하는지 확인하세요.

5. **보안 키 관리**:
   - 가이드의 `[.env 파일의 XXX 값 복사]` 부분은 실제 `.env` 파일에서 해당 값을 찾아서 대체하세요
   - 보안상 민감한 정보는 문서에 직접 기록하지 말고 안전한 방법으로 관리하세요

---

배포 과정에서 문제가 발생하면 위의 트러블슈팅 섹션을 참조하거나 `flyctl logs`를 통해 자세한 오류 정보를 확인하세요.