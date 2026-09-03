# 작업 요약

- 일시: 2026-09-03
- 영역: front

## 변경 요약

`/ai-feedback`(AI 가계부) 화면에 가계부 조회 API 1차 연동을 적용했습니다. 현재 월 기준 목록·월별 요약·카테고리 요약을 표시하며, 등록/수정/삭제는 포함하지 않습니다.

## 변경 파일

- `front/src/services/api.js` — `getAccountBook`, `getAccountBookSummary`, `getAccountBookCategorySummary` (+ query 헬퍼)
- `front/src/pages/AiFeedback/AiFeedback.jsx` — API 연동, 로딩/빈 상태/401·500 처리
- `md/jobs/front/2026-09-03_account-book-read-api.md` — 본 문서

## 사용 API

| Method | Path | 인증 | Query |
|--------|------|------|-------|
| `GET` | `/api/account-book` | Bearer | `year`, `month` (서울 기준 현재 월) |
| `GET` | `/api/account-book/summary` | Bearer | 동일 |
| `GET` | `/api/account-book/category-summary` | Bearer | 동일 |

공통 `request()`의 Bearer 자동 첨부 재사용.

## 응답 필드 사용

### summary
- `totalIncome`, `totalExpense`, `balance`, `count` → 상단 요약 카드
- `year`, `month` → 월 라벨

### category-summary
- `items[]` (`type`, `category`, `amount`, `count`, `ratio`) → 막대 차트·도넛·범례
- `totalExpense` → 도넛 중앙 총 지출

### account-book list
- `transactions[]` (`type`, `amount`, `category`, `memo`, `date`) → 상세 거래 내역
- `count` → 목록 헤더 건수

## 미구현 (의도적)

- 거래 등록/수정/삭제 UI
- 일간·주간 조회 (UI는 비활성, 월간만)

## 미수정 (의도적)

- 로그인 / 회원가입 / 채무조정 코드
- 백엔드
