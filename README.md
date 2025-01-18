# Auth API

사용자 인증 및 권한 관리를 위한 RESTful API 서버입니다.

## 기술 스택

- Node.js
- Express.js
- MongoDB Atlas
- JWT
- Jest
- Swagger UI

## 주요 기능

- 사용자 회원가입/로그인
- JWT 기반 인증
- 토큰 갱신
- 권한 기반 접근 제어
- Rate Limiting
- Token Blacklist 관리

## 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- MongoDB Atlas 계정
- PM2 (프로덕션 환경)

### 설치

```bash
# 저장소 복제
git clone [repository-url]

# 프로젝트 디렉토리로 이동
cd [project-name]

# 의존성 설치
npm install
```

### 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 설정합니다:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=your_mongodb_atlas_uri
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

### 실행

개발 환경:

```bash
npm run dev
```

프로덕션 환경:

```bash
pm2 start src/app.js --name "auth-api"
```

테스트:

```bash
npm test
```

## API 문서

API 문서는 Swagger UI를 통해 제공됩니다.
서버 실행 후 다음 주소에서 확인할 수 있습니다:

```
http://localhost:3000/api-docs
```

### 주요 엔드포인트

#### 인증 API

- POST `/auth/signup`: 회원가입
- POST `/auth/login`: 로그인
- POST `/auth/refresh`: 토큰 갱신
- POST `/auth/logout`: 로그아웃
- POST `/auth/admin`: 관리자 계정 생성 (관리자 권한 필요)

## 보안 기능

- Rate Limiting을 통한 요청 제한
- Token Blacklist를 통한 토큰 무효화 관리
- 비밀번호 해싱
- JWT 기반 인증

## 테스트

Jest를 사용한 통합 테스트가 구현되어 있습니다:

- 회원가입/로그인 테스트
- 토큰 갱신 테스트
- 권한 관리 테스트
- Rate Limiting 테스트

## 프로젝트 구조

```
src/
├── config/         # 설정 파일
├── controllers/    # 컨트롤러
├── middleware/     # 미들웨어
├── models/         # MongoDB 모델
├── routes/         # 라우터
└── __tests__/      # 테스트 파일
```

## 에러 처리

- 400: 잘못된 요청
- 401: 인증 실패
- 403: 권한 없음
- 409: 중복된 사용자
- 429: 요청 횟수 초과
- 500: 서버 오류

## 모니터링

PM2를 통한 프로세스 모니터링:

```bash
pm2 monit
pm2 logs auth-api
```
