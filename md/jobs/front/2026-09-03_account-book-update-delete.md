# 작업 요약

- 일시: 2026-09-03
- 영역: front

## 변경 요약

`/ai-feedback` 거래 목록에 수정(PATCH)·삭제(DELETE) 기능을 추가했습니다. 성공 시 목록·요약·카테고리 통계를 즉시 재조회합니다.

## 변경 파일

- `front/src/services/api.js` — `updateAccountBook`, `deleteAccountBook`
- `front/src/pages/AiFeedback/AiFeedback.jsx` — 행별 수정 폼·삭제 확인·오류 처리
- `md/jobs/front/2026-09-03_account-book-update-delete.md` — 본 문서

## 사용 API

| Method | Path | 인증 |
|--------|------|------|
| `PATCH` | `/api/account-book/:id` | Bearer |
| `DELETE` | `/api/account-book/:id` | Bearer |

### PATCH body

```json
{
  "type": "expense",
  "amount": 12000,
  "category": "식비",
  "date": "2026-09-03",
  "memo": "점심 수정"
}
```

### 오류

- `400` 검증 실패
- `401` 미인증/토큰 무효
- `404` `transaction not found`
- `500` 서버 오류

## 미수정 (의도적)

- 로그인 / 회원가입 / 채무조정
- 백엔드
