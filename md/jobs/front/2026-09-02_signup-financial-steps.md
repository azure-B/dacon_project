# 작업 요약

- 일시: 2026-09-02
- 영역: front

## 변경 요약

회원가입 페이지를 3단계 스텝 방식으로 확장했습니다. 기본정보 → 재무정보(자산·대출·월급) → 목표설정(목표 금액·기간) 순으로 입력받으며, Supabase 연동 전까지는 JavaScript object 형태로만 저장합니다.

## 변경 파일

- `front/src/pages/Signup/Signup.jsx` — 3단계 회원가입 UI
- `front/src/data/signupFormData.js` — 더미 데이터 구조·헬퍼·예시 (신규)

## 사용 API

- 없음 (백엔드 회원가입 API 미구현, API 호출 없음)

## 스텝 구성

| 단계 | 내용 |
|------|------|
| 1. 기본정보 | 이름, 이메일, 비밀번호, 약관 동의 |
| 2. 재무정보 | 월급, 자산 목록(추가/삭제), 대출 목록(추가/삭제) |
| 3. 목표설정 | 목표 금액, 목표 기간(6개월~5년 선택) |

## 더미 데이터 구조 (Supabase 연동용)

완료 시 `buildSignupPayload(form)`이 아래 형태의 object를 반환합니다.

```javascript
{
  profile: {
    name: '홍길동',
    email: 'hong@example.com',
  },
  financial: {
    monthlySalary: 4200000,
    assets: [
      { id: 'asset-...', type: 'deposit', name: 'KB 정기예금', amount: 1500000 },
    ],
    loans: [
      {
        id: 'loan-...',
        name: '신한 직장인 신용대출',
        balance: 65000000,
        interestRate: 5.8,
        monthlyPayment: 1245000,
      },
    ],
  },
  goal: {
    targetAmount: 10000000,
    targetMonths: 24,
  },
  meta: {
    submittedAt: '2026-09-02T09:00:00.000Z',
    source: 'signup-wizard',
  },
}
```

### 필드 설명

| 경로 | 타입 | 설명 |
|------|------|------|
| `profile.name` | string | 사용자 이름 |
| `profile.email` | string | 이메일 |
| `financial.monthlySalary` | number | 월급 (원) |
| `financial.assets[]` | array | 자산 목록 |
| `financial.assets[].type` | string | `deposit` \| `savings` \| `cash` \| `investment` \| `other` |
| `financial.assets[].name` | string | 자산명 |
| `financial.assets[].amount` | number | 금액 (원) |
| `financial.loans[]` | array | 대출 목록 |
| `financial.loans[].name` | string | 대출명 |
| `financial.loans[].balance` | number | 잔액 (원) |
| `financial.loans[].interestRate` | number | 금리 (%) |
| `financial.loans[].monthlyPayment` | number | 월 상환액 (원) |
| `goal.targetAmount` | number | 목표 금액 (원) |
| `goal.targetMonths` | number | 목표 기간 (개월) |

예시 상수: `front/src/data/signupFormData.js` → `SIGNUP_DUMMY_EXAMPLE`

## 저장 방식 (현재)

- React state (`submittedPayload`)에 보관
- `console.log('[Signup] 임시 저장 payload:', payload)` 출력
- 완료 화면에서 요약 표시 후 로그인 링크 제공

## 미구현 (의도적)

- 백엔드/Supabase API 연동
- 로그인 API·authStorage 수정
