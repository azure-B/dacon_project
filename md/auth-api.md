# 인증 REST API 명세서

기존 Express 서버 규칙과 맞춥니다.

- Base URL: `/api`
- Content-Type: `application/json`
- 성공/실패 본문은 JSON
- 비밀번호는 응답에 포함하지 않음
- 아이디/비밀번호 찾기는 계정 존재 여부를 공격자에게 드러내지 않도록, 가능한 한 동일한 성공 메시지를 반환

구현 시 권장 구조:

- `server/models/user.model.js`
- `server/controller/auth.controller.js`
- `server/routes/auth.routes.js`
- `server/routes/index.js`에서 `router.use("/auth", authRoutes)`

---

## 공통

### 사용자 객체 (공개 필드)

비밀번호, 인증코드, 리셋 토큰은 절대 포함하지 않습니다.

```json
{
  "id": 1,
  "loginId": "user01",
  "email": "user01@example.com",
  "name": "홍길동",
  "createdAt": "2026-08-31T04:00:00.000Z"
}
```

### 공통 에러 본문

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
| 401 | 인증 실패 (로그인 정보 불일치, 토큰 만료) |
| 404 | 대상 없음 (내부 조회용. 찾기 API는 계정 존재 노출을 피함) |
| 409 | 중복 (아이디/이메일) |
| 429 | 인증 시도/메일 발송 횟수 초과 |

### 유효성 규칙

| 필드 | 규칙 |
| --- | --- |
| `loginId` | 4~20자, 영문/숫자/`_` |
| `password` | 8~64자, 영문+숫자 포함 |
| `email` | 일반 이메일 형식 |
| `name` | 1~30자 |
| `code` | 6자리 숫자 |
| `resetToken` | 서버가 발급한 일회용 토큰 |

---

## 엔드포인트 목록

| 기능 | Method | Path |
| --- | --- | --- |
| 회원가입 | `POST` | `/api/auth/signup` |
| 로그인 | `POST` | `/api/auth/login` |
| 로그아웃 | `POST` | `/api/auth/logout` |
| 내 정보 | `GET` | `/api/auth/me` |
| 아이디 찾기 요청 | `POST` | `/api/auth/find-id` |
| 아이디 찾기 확인 | `POST` | `/api/auth/find-id/verify` |
| 비밀번호 찾기 요청 | `POST` | `/api/auth/find-password` |
| 비밀번호 재설정 | `POST` | `/api/auth/reset-password` |

인증이 필요한 API는 `Authorization: Bearer <accessToken>` 헤더를 사용합니다.

---

## 1. 회원가입

`POST /api/auth/signup`

계정을 생성합니다.

### Request

```json
{
  "loginId": "user01",
  "password": "pass1234",
  "email": "user01@example.com",
  "name": "홍길동"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `loginId` | Y | 로그인 아이디 |
| `password` | Y | 비밀번호 |
| `email` | Y | 아이디/비밀번호 찾기용 이메일 |
| `name` | Y | 표시 이름 |

### Response `201 Created`

```json
{
  "user": {
    "id": 1,
    "loginId": "user01",
    "email": "user01@example.com",
    "name": "홍길동",
    "createdAt": "2026-08-31T04:00:00.000Z"
  }
}
```

### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `loginId is required` | 아이디 누락 |
| 400 | `password is required` | 비밀번호 누락 |
| 400 | `email is required` | 이메일 누락 |
| 400 | `name is required` | 이름 누락 |
| 400 | `invalid loginId` | 아이디 형식 오류 |
| 400 | `invalid password` | 비밀번호 형식 오류 |
| 400 | `invalid email` | 이메일 형식 오류 |
| 409 | `loginId already exists` | 아이디 중복 |
| 409 | `email already exists` | 이메일 중복 |

---

## 2. 로그인

`POST /api/auth/login`

아이디/비밀번호로 세션 토큰을 발급합니다.

### Request

```json
{
  "loginId": "user01",
  "password": "pass1234"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `loginId` | Y | 로그인 아이디 |
| `password` | Y | 비밀번호 |

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
    "createdAt": "2026-08-31T04:00:00.000Z"
  }
}
```

| 필드 | 설명 |
| --- | --- |
| `accessToken` | API 인증 토큰 |
| `tokenType` | 항상 `Bearer` |
| `expiresIn` | 만료 시간(초) |
| `user` | 로그인한 사용자 공개 정보 |

### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `loginId is required` | 아이디 누락 |
| 400 | `password is required` | 비밀번호 누락 |
| 401 | `invalid credentials` | 아이디 없음 또는 비밀번호 불일치 |
| 429 | `too many login attempts` | 짧은 시간 내 실패 횟수 초과 |

보안: 아이디가 없는 경우와 비밀번호가 틀린 경우를 구분하지 않습니다.

---

## 3. 로그아웃

`POST /api/auth/logout`

현재 액세스 토큰을 무효화합니다. 서버가 토큰 블랙리스트/세션 저장소를 쓰는 경우를 전제로 합니다.

### Headers

```
Authorization: Bearer <accessToken>
```

### Request

본문 없음.

### Response `200 OK`

```json
{
  "loggedOut": true
}
```

### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 401 | `unauthorized` | 토큰 없음/만료/위조 |

---

## 4. 내 정보 조회

`GET /api/auth/me`

로그인 상태 확인용입니다.

### Headers

```
Authorization: Bearer <accessToken>
```

### Response `200 OK`

```json
{
  "user": {
    "id": 1,
    "loginId": "user01",
    "email": "user01@example.com",
    "name": "홍길동",
    "createdAt": "2026-08-31T04:00:00.000Z"
  }
}
```

### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 401 | `unauthorized` | 토큰 없음/만료/위조 |

---

## 5. 아이디 찾기

이메일을 받은 사용자만 아이디를 확인할 수 있게 2단계로 나눕니다.

1. 이메일로 인증코드 발송
2. 코드 확인 후 마스킹된 아이디 반환

### 5-1. 아이디 찾기 요청

`POST /api/auth/find-id`

#### Request

```json
{
  "email": "user01@example.com",
  "name": "홍길동"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `email` | Y | 가입 이메일 |
| `name` | Y | 가입 이름 (일치 확인) |

#### Response `200 OK`

계정이 없어도 같은 메시지를 반환합니다.

```json
{
  "sent": true,
  "message": "일치하는 계정이 있으면 이메일로 인증코드를 보냈습니다.",
  "expiresIn": 300
}
```

| 필드 | 설명 |
| --- | --- |
| `expiresIn` | 인증코드 유효 시간(초). 기본 300 |

#### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `email is required` | 이메일 누락 |
| 400 | `name is required` | 이름 누락 |
| 400 | `invalid email` | 이메일 형식 오류 |
| 429 | `too many requests` | 발송 횟수 초과 |

실제 메일 발송은 이메일+이름이 모두 일치할 때만 수행합니다.

### 5-2. 아이디 찾기 확인

`POST /api/auth/find-id/verify`

#### Request

```json
{
  "email": "user01@example.com",
  "code": "123456"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `email` | Y | 인증코드를 받은 이메일 |
| `code` | Y | 6자리 인증코드 |

#### Response `200 OK`

```json
{
  "loginId": "use***1"
}
```

마스킹 규칙: 앞 3자와 마지막 1자만 남기고 나머지는 `*`입니다. 아이디가 4자 이하면 첫 글자만 남깁니다.

예:

- `user01` → `use***1`
- `abcd` → `a***`

#### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `email is required` | 이메일 누락 |
| 400 | `code is required` | 코드 누락 |
| 400 | `invalid code` | 코드 형식 오류 |
| 401 | `invalid or expired code` | 코드 불일치/만료 |

코드가 틀려도 계정 존재 여부는 따로 알려주지 않습니다.

---

## 6. 비밀번호 찾기 / 재설정

아이디와 이메일이 일치하면 재설정 메일을 보내고, 토큰으로 새 비밀번호를 저장합니다.

### 6-1. 비밀번호 찾기 요청

`POST /api/auth/find-password`

#### Request

```json
{
  "loginId": "user01",
  "email": "user01@example.com"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `loginId` | Y | 로그인 아이디 |
| `email` | Y | 가입 이메일 |

#### Response `200 OK`

계정이 없어도 같은 메시지를 반환합니다.

```json
{
  "sent": true,
  "message": "일치하는 계정이 있으면 비밀번호 재설정 안내를 보냈습니다.",
  "expiresIn": 1800
}
```

| 필드 | 설명 |
| --- | --- |
| `expiresIn` | 재설정 토큰 유효 시간(초). 기본 1800 (30분) |

메일에는 일회용 `resetToken`이 포함된 링크를 넣습니다.

예: `https://example.com/reset-password?token=<resetToken>`

#### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `loginId is required` | 아이디 누락 |
| 400 | `email is required` | 이메일 누락 |
| 400 | `invalid email` | 이메일 형식 오류 |
| 429 | `too many requests` | 발송 횟수 초과 |

### 6-2. 비밀번호 재설정

`POST /api/auth/reset-password`

#### Request

```json
{
  "resetToken": "d9f1c2a0-4b7e-4c1a-9f33-8e2b1a0c7d55",
  "newPassword": "newpass1234"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `resetToken` | Y | 메일로 받은 일회용 토큰 |
| `newPassword` | Y | 새 비밀번호 |

#### Response `200 OK`

```json
{
  "reset": true,
  "message": "비밀번호가 변경되었습니다. 다시 로그인하세요."
}
```

재설정이 끝나면 해당 `resetToken`은 즉시 폐기합니다. 기존 액세스 토큰도 모두 무효화하는 것을 권장합니다.

#### Errors

| 상태 | `error` | 조건 |
| --- | --- | --- |
| 400 | `resetToken is required` | 토큰 누락 |
| 400 | `newPassword is required` | 새 비밀번호 누락 |
| 400 | `invalid password` | 새 비밀번호 형식 오류 |
| 401 | `invalid or expired token` | 토큰 없음/만료/재사용 |

---

## 처리 흐름

### 회원가입 → 로그인

```
Client                         Server
  |  POST /api/auth/signup        |
  |  { loginId, password, ... }   |
  | ----------------------------> |
  |  201 { user }                 |
  | <---------------------------- |
  |  POST /api/auth/login         |
  |  { loginId, password }        |
  | ----------------------------> |
  |  200 { accessToken, user }    |
  | <---------------------------- |
```

### 아이디 찾기

```
Client                         Server
  |  POST /api/auth/find-id       |
  |  { email, name }              |
  | ----------------------------> |
  |  200 { sent: true }           |
  | <---------------------------- |
  |  (이메일로 6자리 코드 수신)     |
  |  POST /api/auth/find-id/verify|
  |  { email, code }              |
  | ----------------------------> |
  |  200 { loginId: "use***1" }   |
  | <---------------------------- |
```

### 비밀번호 찾기

```
Client                         Server
  |  POST /api/auth/find-password |
  |  { loginId, email }           |
  | ----------------------------> |
  |  200 { sent: true }           |
  | <---------------------------- |
  |  (메일에서 resetToken 수신)    |
  |  POST /api/auth/reset-password|
  |  { resetToken, newPassword }  |
  | ----------------------------> |
  |  200 { reset: true }          |
  | <---------------------------- |
  |  POST /api/auth/login         |
  |  { loginId, newPassword }     |
  | ----------------------------> |
```

---

## 보안 요구사항

- 비밀번호는 해시 저장 (예: bcrypt). 평문 저장 금지
- 로그인 실패 원인(아이디 없음 / 비밀번호 오류)을 구분하지 않음
- 아이디 찾기·비밀번호 찾기 요청은 계정 존재 여부를 응답으로 노출하지 않음
- 인증코드·재설정 토큰은 짧은 TTL과 1회용
- 인증코드/로그인 실패는 rate limit 적용
- HTTPS 사용을 전제
- 응답 JSON에 `password`, `passwordHash`, `code`, `resetToken`을 넣지 않음 (`reset-password` 요청 본문의 `resetToken`은 예외)

---

## 예시 cURL

회원가입:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"loginId\":\"user01\",\"password\":\"pass1234\",\"email\":\"user01@example.com\",\"name\":\"홍길동\"}"
```

로그인:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"loginId\":\"user01\",\"password\":\"pass1234\"}"
```

아이디 찾기 요청:

```bash
curl -X POST http://localhost:3000/api/auth/find-id \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user01@example.com\",\"name\":\"홍길동\"}"
```

비밀번호 재설정:

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"resetToken\":\"d9f1c2a0-4b7e-4c1a-9f33-8e2b1a0c7d55\",\"newPassword\":\"newpass1234\"}"
```
