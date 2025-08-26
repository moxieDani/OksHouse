# 🏡 Ok's House Backend API

별장 예약시스템 백엔드 API 서버입니다.

## 📱 관련 프로젝트

- **사용자 프론트엔드**: [OksHouse-User](https://github.com/moxieDani/OksHouse-User)
- **관리자 프론트엔드**: [OksHouse-Admin](https://github.com/moxieDani/OksHouse-Admin)
- **백엔드 API** (현재 저장소): [OksHouse-Backend](https://github.com/moxieDani/OksHouse-Backend)

## 🚀 빠른 시작

### 1. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정 변경
```

### 2. 의존성 설치 및 서버 실행
```bash
# 방법 1: pip 사용
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 방법 2: uv 사용 (권장 - 더 빠름)
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```


## 📁 프로젝트 구조

```
app/
├── api/v1/              # API 라우터
│   ├── admin/           # 관리자 API (인증, 예약관리, FCM)
│   ├── user/            # 사용자 API (예약, 인증)
│   └── public/          # 공개 API (헬스체크)
├── core/                # 설정 및 보안 (JWT, AES 암호화)
├── db/                  # 데이터베이스 연결
├── middleware/          # 미들웨어 (Origin, API Key 보안)
├── models/              # 데이터 모델 (예약, 관리자, FCM)
├── schemas/             # API 스키마 (요청/응답 모델)
└── services/            # 비즈니스 로직 (인증, 예약, FCM)
```

## ✨ 주요 기능

### 예약 시스템
- **예약 생성**: AES 암호화된 비밀번호로 보안 예약 생성
- **예약 조회**: 월별 예약 조회, 사용자별 예약 조회
- **예약 상태**: pending(예약대기), confirmed(예약확정), denied(예약거부)
- **예약 충돌 방지**: 날짜 중복 예약 자동 확인 및 차단

### 관리자 시스템
- **전화번호 인증**: JWT 기반 관리자 인증 시스템
- **예약 관리**: 예약 상태 변경, 승인/거부 처리
- **FCM 푸시 알림**: 새 예약 알림, 상태 변경 알림
- **토큰 관리**: Access/Refresh 토큰 자동 갱신

### 보안 기능
- **AES-256 암호화**: 예약자 비밀번호 암호화 저장
- **JWT 인증**: 관리자 세션 및 토큰 관리
- **Origin 기반 보안**: CORS 및 API Key 검증
- **세션 관리**: 메모리 기반 관리자 세션 추적

## 설치 및 실행

### 1. 의존성 설치

```bash
# pip 사용
pip install -r requirements.txt

# 또는 pyproject.toml 사용 (권장)
pip install -e .
```


## 📋 API 엔드포인트

### 사용자 API (`/api/v1/user/`)
#### 예약 관리
- `POST /reservations/` - 예약 생성 (AES 암호화된 비밀번호)
- `GET /reservations/monthly/{year}/{month}` - 월별 예약 조회
- `DELETE /reservations/` - 예약 삭제 (인증 필요)
- `POST /reservations/user` - 사용자 예약 조회 (인증)
- `PUT /reservations/` - 예약 수정 (인증)

#### 사용자 인증
- `POST /auth/login` - 로그인 키 인증
- `POST /auth/verify` - 예약자 인증 (체크인/체크아웃 기간 확인)

### 관리자 API (`/api/v1/admin/`)
#### 관리자 인증
- `POST /auth/verify-phone` - 전화번호 인증 및 JWT 토큰 발급
- `POST /auth/refresh` - Access 토큰 갱신
- `GET /auth/me` - 현재 관리자 정보 조회
- `POST /auth/logout` - 로그아웃

#### 예약 관리
- `GET /reservations/` - 전체 예약 조회
- `GET /reservations/monthly/{year}/{month}` - 월별 예약 조회 (관리자)
- `PATCH /reservations/{id}/status` - 예약 상태 변경
- `DELETE /reservations/{id}` - 예약 삭제 (관리자)

#### 관리자 관리
- `POST /admins/` - 새 관리자 생성
- `GET /admins/exists/{name}` - 관리자 존재 여부 확인
- `GET /admins/{name}` - 관리자 정보 조회
- `PUT /admins/{name}` - 관리자 정보 수정

#### FCM 푸시 알림
- `POST /fcm/register-token` - FCM 토큰 등록
- `DELETE /fcm/unregister-token` - FCM 토큰 해제
- `POST /fcm/test-notification` - 테스트 알림 전송

### 공개 API (`/api/v1/public/`)
- `GET /health` - 서버 상태 확인



## 🔒 보안 아키텍처

### 다층 보안 구조
1. **API Key 인증**: Frontend별 API 키 검증
2. **Origin 검증**: CORS 기반 도메인 접근 제어
3. **JWT 인증**: 관리자 세션 및 토큰 관리
4. **AES 암호화**: 민감 데이터 암호화 저장
5. **세션 관리**: 메모리 기반 활성 세션 추적

### 인증 플로우
#### 관리자 인증
1. 전화번호로 관리자 확인
2. JWT Access/Refresh 토큰 발급
3. HttpOnly 쿠키로 Refresh 토큰 저장
4. 세션 메모리에 관리자 등록

#### 사용자 인증
1. 로그인 키 또는 예약 정보로 인증
2. 체크인/체크아웃 날짜 기반 접근 제어
3. AES 암호화된 비밀번호 검증

## ⚙️ 환경변수 설정

### 필수 환경변수
| 변수명 | 설명 | 개발환경 예시 |
|--------|------|---------|
| `SECRET_KEY` | 애플리케이션 보안 키 | `change-this-secret-key` |
| `JWT_SECRET_KEY` | JWT 토큰 서명 키 | `change-this-jwt-key` |
| `AES_KEY` | AES 암호화 키 (Base64) | `your-base64-aes-key` |
| `AES_IV` | AES 초기화 벡터 (Base64) | `your-base64-aes-iv` |
| `LOGIN_KEYS` | 사용자 로그인 키 (암호화) | `key1\|key2` |
| `ALLOWED_API_KEYS` | Frontend API 키 | `dev-user-key,dev-admin-key` |
| `FCM_SERVICE_ACCOUNT_PATH` | FCM 서비스 키 파일 경로 | `./service-account-key.json` |

### 선택적 환경변수
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `APP_NAME` | 애플리케이션 이름 | Ok's House 별장 예약시스템 |
| `DEBUG` | 디버그 모드 | false |
| `ENVIRONMENT` | 환경 구분 | development |
| `DATABASE_URL` | 데이터베이스 URL | sqlite:///./reservations.db |
| `ALLOWED_ORIGINS` | CORS 허용 오리진 | localhost:3000,localhost:5173 |
| `ACCESS_TOKEN_EXPIRE_SECONDS` | Access 토큰 만료시간 | 300 (5분) |
| `REFRESH_TOKEN_EXPIRE_SECONDS` | Refresh 토큰 만료시간 | 31536000 (1년) |

> ⚠️ **보안 주의사항**: 프로덕션에서는 모든 키를 강력한 값으로 변경하세요.

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `app/schemas/` 에 Pydantic 스키마 정의
2. `app/models/` 에 SQLAlchemy 모델 정의 (필요한 경우)
3. `app/services/` 에 비즈니스 로직 구현
4. `app/api/v1/` 에 API 라우터 구현

### 코드 스타일

- Python PEP 8 스타일 가이드 준수
- 타입 힌트 사용 권장
- Docstring을 통한 함수/클래스 문서화

## 🚀 배포 가이드

### Fly.io 배포 (권장)
상세한 배포 가이드는 [FLY_DEPLOYMENT_GUIDE.md](./FLY_DEPLOYMENT_GUIDE.md)를 참조하세요.

```bash
# Fly CLI 설치 및 로그인
flyctl auth login

# 환경변수 설정 (.env 파일에서 복사)
flyctl secrets set SECRET_KEY="[.env 파일의 값]"
flyctl secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat service-account-key.json)"

# 배포 실행
flyctl deploy
```

### 로컬 프로덕션 실행

```bash
# 방법 1: pip 환경에서 실행
ENVIRONMENT=production uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# 방법 2: uv 환경에서 실행 (권장)
ENVIRONMENT=production uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 라이선스

이 프로젝트는 개인 프로젝트용으로 제작되었습니다.