# API 명세서

> back 작업 시 엔드포인트 변경마다 이 문서를 갱신한다.

- Base URL: `/api` (로컬 Express 기본 `http://localhost:3000`, `server.js` 엔트리는 `http://localhost:5000`)
- Content-Type: `application/json`
- 성공/실패 본문은 JSON
- 비밀번호, `passwordHash`는 응답에 포함하지 않음

인증 전체 설계(회원가입, 찾기 등)는 `md/auth-api.md`를 참고합니다. 아래 **구현된 REST API**는 `back/app.js` 기준입니다. `back/server.js` + `back/src/` 스캐폴드 엔드포인트는 문서 하단에 별도로 적습니다.

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
| 201 | 리소스 생성 성공 |
| 400 | 요청 값 누락/형식 오류 |
| 401 | 인증 실패 (로그인 정보 불일치) |
| 404 | 대상 없음 |
| 429 | 로그인 실패 횟수 초과 |

---

## 엔드포인트 목록 (`back/app.js`)

| 기능 | Method | Path | 구현 |
| --- | --- | --- | --- |
| 헬스 체크 | `GET` | `/api/health` | Y |
| 아이템 목록 | `GET` | `/api/items` | Y |
| 아이템 조회 | `GET` | `/api/items/:id` | Y |
| 아이템 생성 | `POST` | `/api/items` | Y |
| 아이템 전체 수정 | `PUT` | `/api/items/:id` | Y |
| 아이템 부분 수정 | `PATCH` | `/api/items/:id` | Y |
| 아이템 삭제 | `DELETE` | `/api/items/:id` | Y |
| 로그인 | `POST` | `/api/auth/login` | Y |
| 회원가입 | `POST` | `/api/auth/signup` | N |
| 로그아웃 | `POST` | `/api/auth/logout` | N |
| 내 정보 | `GET` | `/api/auth/me` | N |

---

## 1. 헬스 체크

`GET /api/health`

```json
{
  "ok": true,
  "message": "서버가 정상적으로 동작 중입니다."
}
```

---

## 2. 아이템

아이템 객체:

```json
{
  "id": 1,
  "title": "REST 문서 읽기",
  "done": true,
  "createdAt": "2026-08-31T04:00:00.000Z"
}
```

### 목록 `GET /api/items`

```json
{
  "count": 2,
  "items": []
}
```

### 단건 `GET /api/items/:id`

성공 시 아이템 객체. 없으면 `404` `{ "error": "Item not found" }`.

### 생성 `POST /api/items`

```json
{
  "title": "할 일",
  "done": false
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `title` | Y | 제목. 공백이면 `400` `title is required` |
| `done` | N | 완료 여부. 기본 `false` |

성공: `201` 생성된 아이템.

### 전체 수정 `PUT /api/items/:id`

`title` 필수. 없으면 `404`.

### 부분 수정 `PATCH /api/items/:id`

전달된 `title`, `done`만 갱신. 없으면 `404`.

### 삭제 `DELETE /api/items/:id`

```json
{
  "deleted": true,
  "item": {}
}
```

없으면 `404`.

---

## 3. 로그인

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

```json
{
  "userId": "user01",
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

| 필드 | 설명 |
| --- | --- |
| `accessToken` | HS256 JWT. 만료 1시간 |
| `tokenType` | 항상 `Bearer` |
| `expiresIn` | 만료 시간(초). `3600` |
| `user` | 공개 필드만 포함. 비밀번호 없음 |

### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `loginId is required` | `loginId`/`userId` 모두 없음 |
| 400 | `password is required` | 비밀번호 누락 |
| 401 | `invalid credentials` | 아이디 없음 또는 비밀번호 불일치 |
| 429 | `too many login attempts` | 같은 IP·아이디로 15분 내 실패 5회 초과 |

아이디가 없는 경우와 비밀번호가 틀린 경우를 구분하지 않습니다. 비밀번호는 `scrypt` 해시로 비교합니다.

### 시드 계정

인메모리 사용자입니다. 서버를 재시작하면 초기화됩니다.

| loginId | password |
| --- | --- |
| `user01` | `pass1234` |

### 예시

PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType "application/json" -Body '{"userId":"user01","password":"pass1234"}'
```

cURL:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"loginId\":\"user01\",\"password\":\"pass1234\"}"
```

---

## 구현 위치 (`back/app.js`)

- 라우트 등록: `back/routes/index.js` (`/auth`, `/items`, `/health`)
- 로그인 라우트: `back/routes/auth.routes.js`
- 로그인 컨트롤러: `back/controller/auth.controller.js`
- 사용자/토큰/실패 횟수: `back/models/user.model.js`

REST API Playground UI는 `front/playground.html` (`front/styles.css`, `front/app.js`)입니다. Vite React 앱 엔트리는 `front/index.html`입니다.

---

## 스캐폴드 엔드포인트 (`back/server.js`)

Base URL: `http://localhost:5000` (`npm run start:src`)

### GET /health

- 설명: 서버 상태 확인
- 요청: 없음
- 응답: `{ "status": "ok" }`
- 관련 파일: `back/src/app.js`

### GET /api/examples

- 설명: 예시 목록 조회
- 요청: 없음
- 응답: `{ "success": true, "data": [{ "id": number, "title": string, "description": string }] }`
- 관련 파일: `back/src/routes/example.routes.js`, `back/src/controllers/example.controller.js`, `back/src/models/example.model.js`

### GET /api/examples/:id

- 설명: 예시 단건 조회
- 요청: URL 파라미터 `id` (number)
- 응답: `{ "success": true, "data": { "id": number, "title": string, "description": string } }`
- 에러: 404 `{ "success": false, "message": "Item not found" }`
- 관련 파일: `back/src/routes/example.routes.js`, `back/src/controllers/example.controller.js`, `back/src/models/example.model.js`

### POST /api/examples

- 설명: 예시 생성
- 요청 body: `{ "title": string, "description"?: string }`
- 응답: `{ "success": true, "data": { "id": number, "title": string, "description": string } }` (201)
- 관련 파일: `back/src/routes/example.routes.js`, `back/src/controllers/example.controller.js`, `back/src/models/example.model.js`
