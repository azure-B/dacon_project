# 작업 요약

- 일시: 2026-09-03
- 영역: front

## 변경 요약

`/ai-feedback`에 가계부 거래 등록(`POST /api/account-book`) UI를 추가했습니다. 등록 성공 시 목록·요약·카테고리 통계를 다시 불러와 화면을 갱신합니다.

## 변경 파일

- `front/src/services/api.js` — `api.createAccountBook()`
- `front/src/pages/AiFeedback/AiFeedback.jsx` — 등록 폼, 검증, 로딩/오류/성공 처리
- `md/jobs/front/2026-09-03_account-book-create.md` — 본 문서

## 사용 API

- `POST /api/account-book` (Bearer 인증)

### Request

```json
{
  "type": "expense",
  "amount": 15000,
  "category": "식비",
  "date": "2026-09-03",
  "memo": "점심"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `type` | Y | `income` \| `expense` |
| `amount` | Y | 0보다 큰 숫자 |
| `category` | Y | 스키마 카테고리 선택 (최대 30자) |
| `date` | Y | `YYYY-MM-DD` |
| `memo` | N | 최대 200자 |

### Response

- `201` `{ transaction: { id, userId, type, amount, category, memo, date, createdAt, updatedAt } }`
- `400` / `401` / `500` → 사용자용 한국어 메시지

## 미수정 (의도적)

- 로그인 / 회원가입 / 채무조정
- 수정·삭제 UI
- 백엔드
