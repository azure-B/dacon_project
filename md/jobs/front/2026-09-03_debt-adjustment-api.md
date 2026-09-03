# 작업 요약

- 일시: 2026-09-03
- 영역: front

## 변경 요약

1. `api.js` 공통 `request`에 토큰이 있을 때 `Authorization: Bearer <accessToken>` 자동 첨부
2. `/debt-analysis`를 `POST /api/debt-adjustment`와 연동 (하드코딩 제거)

## 변경 파일

- `front/src/services/api.js` — Bearer 자동 첨부, `error.status`/`error.code`, `api.analyzeDebt()`
- `front/src/pages/DebtAnalysis/DebtAnalysis.jsx` — 채무조정 API 연동 UI
- `md/jobs/front/2026-09-03_debt-adjustment-api.md` — 본 문서

## 사용 API

- `POST /api/debt-adjustment` — 인증 필요 (`Authorization: Bearer`)
- Request body: `{}` (선택적으로 `{ note }` 또는 `{ question }` — 대출/자산은 body에 넣지 않음)
- Response 사용 필드:
  - `summary.totalDebt`, `totalAssets`, `monthlyIncome`, `monthlyPayment`, `dsrPercent`
  - `summary.targetAmount`, `targetPeriod`, `riskLevel`, `insight`, `comment`
  - `loans`, `assets`, `recommendations`, `productsUsed`, `disclaimer`
  - `provider`, `model` (표시용)

## 인증 클라이언트

- `getAccessToken()` (`authStorage.js`) 재사용
- 토큰 없으면 Authorization 헤더 미첨부 → 로그인/회원가입 기존 동작 유지

## 미수정 (의도적)

- Login / Signup UI·라우팅
- authStorage 저장 로직
- Header / Footer
- 가계부 관련 코드
- 백엔드
