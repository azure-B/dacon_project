# API 명세서

> back 작업 시 엔드포인트 변경마다 이 문서를 갱신한다.

Base URL: `http://localhost:5000`

---

## GET /health

- 설명: 서버 상태 확인
- 요청: 없음
- 응답: `{ "status": "ok" }`
- 관련 파일: `back/src/app.js`

---

## GET /api/examples

- 설명: 예시 목록 조회
- 요청: 없음
- 응답: `{ "success": true, "data": [{ "id": number, "title": string, "description": string }] }`
- 관련 파일: `back/src/routes/example.routes.js`, `back/src/controllers/example.controller.js`, `back/src/models/example.model.js`

---

## GET /api/examples/:id

- 설명: 예시 단건 조회
- 요청: URL 파라미터 `id` (number)
- 응답: `{ "success": true, "data": { "id": number, "title": string, "description": string } }`
- 에러: 404 `{ "success": false, "message": "Item not found" }`
- 관련 파일: `back/src/routes/example.routes.js`, `back/src/controllers/example.controller.js`, `back/src/models/example.model.js`

---

## POST /api/examples

- 설명: 예시 생성
- 요청 body: `{ "title": string, "description"?: string }`
- 응답: `{ "success": true, "data": { "id": number, "title": string, "description": string } }` (201)
- 관련 파일: `back/src/routes/example.routes.js`, `back/src/controllers/example.controller.js`, `back/src/models/example.model.js`
