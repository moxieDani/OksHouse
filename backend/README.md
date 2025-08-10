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
- **예약 상태**: pending(예약신청), confirmed(예약확정), denied(예약거부)
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

### 예약 관리

- `POST /api/v1/reservations/` - 새 예약 생성
- `GET /api/v1/reservations/` - 예약 목록 조회
- `GET /api/v1/reservations/{id}` - 특정 예약 조회
- `PATCH /api/v1/reservations/{id}/status` - 예약 상태 업데이트
- `DELETE /api/v1/reservations/{id}` - 예약 삭제

### 헬스 체크

- `GET /` - 기본 정보
- `GET /health` - 헬스 체크

## 테스트 실행

```bash
# 전체 테스트 실행
pytest

# 특정 테스트 파일 실행
pytest tests/test_reservations.py

# 커버리지와 함께 실행
pytest --cov=app tests/
```

## 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `APP_NAME` | 애플리케이션 이름 | Ok's House 별장 예약시스템 |
| `APP_VERSION` | 버전 | 1.0.0 |
| `DEBUG` | 디버그 모드 | false |
| `DATABASE_URL` | 데이터베이스 URL | sqlite:///./reservations.db |
| `SECRET_KEY` | 보안 키 | your-secret-key-here |
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