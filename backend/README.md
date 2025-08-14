# Ok's House 별장 예약시스템 Backend API

FastAPI를 기반으로 한 별장 예약 관리 시스템 백엔드 API입니다.

## 프로젝트 구조

```
backend/
├── app/
│   ├── api/v1/               # API 엔드포인트 (v1)
│   │   ├── __init__.py
│   │   └── reservations.py   # 예약 관련 API
│   ├── core/                 # 핵심 설정
│   │   ├── __init__.py
│   │   └── config.py         # 앱 설정
│   ├── db/                   # 데이터베이스 설정
│   │   ├── __init__.py
│   │   └── database.py       # DB 연결 및 세션
│   ├── models/               # SQLAlchemy 모델
│   │   ├── __init__.py
│   │   └── reservation.py    # 예약 모델
│   ├── schemas/              # Pydantic 스키마
│   │   ├── __init__.py
│   │   └── reservation.py    # 예약 스키마
│   ├── services/             # 비즈니스 로직
│   │   ├── __init__.py
│   │   └── reservation_service.py
│   ├── __init__.py
│   └── main.py              # FastAPI 앱 진입점
├── tests/                   # 테스트 파일
│   ├── __init__.py
│   └── test_reservations.py
├── .env.example            # 환경변수 예시
├── pyproject.toml          # 프로젝트 설정
├── requirements.txt        # 의존성 목록
└── README.md              # 프로젝트 문서
```

## 기능

- **예약 관리**: 예약 생성, 조회, 상태 업데이트, 삭제
- **예약 상태**: pending(예약대기), confirmed(예약확정), denied(예약거부)
- **예약 충돌 확인**: 날짜 중복 예약 방지
- **RESTful API**: REST 표준을 따르는 API 설계
- **자동 문서화**: FastAPI 기본 제공 Swagger UI

## 설치 및 실행

### 1. 의존성 설치

```bash
# pip 사용
pip install -r requirements.txt

# 또는 pyproject.toml 사용 (권장)
pip install -e .
```

### 2. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정 변경
```

### 3. 개발 서버 실행

```bash
# uvicorn 직접 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는 Python 모듈로 실행
python -m uvicorn app.main:app --reload
```

### 4. API 문서 확인

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### 구조화된 API 엔드포인트

#### 사용자 API (`/api/v1/user/`)
- `POST /api/v1/user/reservations/` - 비밀번호를 포함한 예약 생성 (2번 기능)
- `GET /api/v1/user/reservations/monthly/{year}/{month}` - 특정 년/월 예약 조회 (1번 기능)
- `DELETE /api/v1/user/reservations/` - 인증을 통한 예약 삭제 (5번 기능)
- `POST /api/v1/user/auth/verify` - 오늘 날짜 기준 예약자 인증 (3번 기능)

#### 관리자 API (`/api/v1/admin/`)
- `PATCH /api/v1/admin/reservations/{id}/status` - 관리자 예약 상태 변경 (6번 기능)
- `POST /api/v1/admin/admins/` - 새 관리자 생성
- `GET /api/v1/admin/admins/{name}` - 관리자 정보 조회
- `GET /api/v1/admin/admins/exists/{name}` - 관리자 존재 여부 확인 (7번 기능)

#### 공개 API (`/api/v1/public/`)
- `GET /api/v1/public/` - 기본 정보
- `GET /api/v1/public/health` - 헬스 체크


## 테스트 실행

```bash
# 전체 테스트 실행
pytest

# 특정 테스트 파일 실행
pytest tests/test_reservations.py

# 커버리지와 함께 실행
pytest --cov=app tests/
```

## 확장 기능 (test.py 기반)

이 FastAPI 구현은 `test.py`의 1,2,3,5,6,7번 기능을 포함합니다:

1. **특정 년/월 예약 조회**: 해당 월에 시작되거나 종료되는 예약, 또는 해당 월을 포함하는 예약 조회
2. **비밀번호를 포함한 예약 추가**: AES 암호화된 비밀번호로 예약 생성
3. **예약자 인증**: 오늘 날짜 기준으로 체크인/체크아웃 기간에 해당하는 예약자 인증
4. ~~예약 변경 시 다른 예약 조회~~ (제외)
5. **인증을 통한 예약 삭제**: 예약자 정보와 비밀번호로 인증 후 삭제
6. **관리자 예약 상태 변경**: 관리자가 예약 상태를 변경하고 확정자 정보 업데이트
7. **관리자 존재 여부 확인**: 관리자명으로 존재 여부 확인

### 보안 기능

- **AES 암호화**: 예약자 비밀번호는 AES-256-CBC로 암호화 저장
- **인증 기반 삭제**: 예약 삭제 시 예약자 정보와 비밀번호 검증 필요
- **관리자 추적**: 예약 상태 변경 시 관리자 정보 기록

## 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `APP_NAME` | 애플리케이션 이름 | Ok's House 별장 예약시스템 |
| `APP_VERSION` | 버전 | 1.0.0 |
| `DEBUG` | 디버그 모드 | false |
| `DATABASE_URL` | 데이터베이스 URL | sqlite:///./reservations.db |
| `SECRET_KEY` | 보안 키 | your-secret-key-here |
| `AES_KEY` | AES 암호화 키 (Base64) | **필수 설정** |
| `AES_IV` | AES 초기화 벡터 (Base64) | **필수 설정** |
| `ALLOWED_ORIGINS` | CORS 허용 오리진 | ["http://localhost:5173", "http://localhost:3000"] |

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `app/schemas/` 에 Pydantic 스키마 정의
2. `app/models/` 에 SQLAlchemy 모델 정의 (필요한 경우)
3. `app/services/` 에 비즈니스 로직 구현
4. `app/api/v1/` 에 API 라우터 구현
5. `tests/` 에 테스트 코드 작성

### 코드 스타일

- Python PEP 8 스타일 가이드 준수
- 타입 힌트 사용 권장
- Docstring을 통한 함수/클래스 문서화

## 배포

### 프로덕션 실행

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker 배포 (추후 추가 예정)

```bash
docker build -t okshouse-backend .
docker run -p 8000:8000 okshouse-backend
```

## 라이선스

이 프로젝트는 개인 프로젝트용으로 제작되었습니다.