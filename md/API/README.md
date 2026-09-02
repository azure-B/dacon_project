# API 명세서

> back 작업 시 엔드포인트 변경마다 이 문서를 갱신한다.

- Base URL: `/api` (로컬 Express `http://localhost:3000`)
- Content-Type: `application/json`
- 성공/실패 본문은 JSON
- 비밀번호, `passwordHash`는 응답에 포함하지 않음

인증 전체 설계(회원가입, 찾기 등)는 `md/auth-api.md`를 참고합니다.  
금융 상품 정적 데이터(`python/api/product.json`) 연동은 **`md/API/product-data.md`** 를 참고합니다.  
아래 **구현된 REST API**는 `back/app.js` 기준입니다.

---

## 공통

### 에러 본문

```json
{
  "error": "에러 메시지"
}
```

| HTTP 상태 | 의미 |
| --- | --- |
| 200 | 조회/처리 성공 |
| 400 | 요청 값 누락/형식 오류 |
| 401 | 인증 실패 (로그인 정보 불일치) |
| 429 | 로그인 실패 횟수 초과 |

---

## 엔드포인트 목록

| 기능 | Method | Path | 구현 |
| --- | --- | --- | --- |
| 헬스 체크 | `GET` | `/api/health` | Y |
| 로그인 | `POST` | `/api/auth/login` | Y |
| 회원가입 | `POST` | `/api/auth/signup` | N |
| 로그아웃 | `POST` | `/api/auth/logout` | N |
| 내 정보 | `GET` | `/api/auth/me` | N |
| 상품 목록 | `GET` | `/api/products` | N |
| 상품 단건 | `GET` | `/api/products/:id` | N |

> 상품 API 상세·데이터 스키마·고지 문구: [`product-data.md`](./product-data.md)

---

## 1. 헬스 체크

`GET /api/health`

```json
{
  "ok": true,
  "message": "서버가 정상적으로 동작 중입니다."
}
```

- 관련 파일: `back/routes/health.routes.js`, `back/controller/health.controller.js`, `back/models/health.model.js`

---

## 2. 로그인

`POST /api/auth/login`

아이디/비밀번호를 검증하고 액세스 토큰을 발급합니다.

### Request

`loginId` 또는 `userId` 중 하나를 사용할 수 있습니다. 둘 다 있으면 `loginId`를 사용합니다.

```json
{
  "loginId": "user01",
  "password": "pass1234"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `loginId` | Y* | 로그인 아이디 |
| `userId` | Y* | `loginId` 별칭 |
| `password` | Y | 비밀번호 |

\* `loginId`와 `userId` 중 하나는 필수입니다.

### Response `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "loginId": "user01",
    "email": "user01@example.com",
    "name": "홍길동",
    "createdAt": "2026-08-31"
  }
}
```

### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `loginId is required` | `loginId`/`userId` 모두 없음 |
| 400 | `password is required` | 비밀번호 누락 |
| 401 | `invalid credentials` | 아이디 없음 또는 비밀번호 불일치 |
| 429 | `too many login attempts` | 같은 IP·아이디로 15분 내 실패 5회 초과 |

### 시드 계정

인메모리 사용자입니다. 서버를 재시작하면 초기화됩니다.

| loginId | password |
| --- | --- |
| `user01` | `pass1234` |

---

## 구현 위치

- 진입점: `back/app.js`
- 라우트 등록: `back/routes/index.js`
- 로그인: `back/routes/auth.routes.js`, `back/controller/auth.controller.js`, `back/models/user.model.js`
- 헬스 체크: `back/routes/health.routes.js`, `back/controller/health.controller.js`, `back/models/health.model.js`

React 앱 엔트리: `front/index.html` 
