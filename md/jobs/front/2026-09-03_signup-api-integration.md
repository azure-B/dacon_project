# 작업 요약

- 일시: 2026-09-03
- 영역: front

## 변경 요약

회원가입 3단계 UI를 유지한 채 `POST /api/auth/signup`과 연동했습니다. 1단계에 `loginId`를 추가하고, 재무·목표 필드를 백엔드 DTO 이름(`monthlyIncome`, `assetList`, `loanList`, `targetPeriod`)으로 매핑해 전송합니다. 성공 시 토큰이 없으므로 자동 로그인 없이 성공 안내 후 로그인 화면으로 이동합니다.

## 변경 파일

- `front/src/pages/Signup/Signup.jsx` — loginId 필드, 검증, API 호출, 성공/에러 UI
- `front/src/data/signupFormData.js` — loginId·검증 헬퍼, `buildSignupPayload` DTO 매핑
- `front/src/services/api.js` — `api.signup()` 추가

## 사용 API

- `POST /api/auth/signup` — 회원가입 (인증 불필요, 응답에 accessToken 없음)

## Payload 구조

```javascript
{
  profile: {
    loginId: 'hong_gil',
    name: '홍길동',
    email: 'hong@example.com',
    password: 'pass1234',
  },
  financial: {
    monthlyIncome: 4200000,       // 폼 monthlySalary → monthlyIncome
    assetList: [ /* productId 유지 */ ],
    loanList: [ /* productId 유지 */ ],
  },
  goal: {
    targetAmount: 10000000,
    targetPeriod: 24,             // 폼 targetMonths → targetPeriod
  },
}
```

### 필드 매핑

| 폼 필드 | API payload |
|---------|-------------|
| `profile.loginId` | `profile.loginId` |
| `financial.monthlySalary` | `financial.monthlyIncome` |
| `financial.assets` | `financial.assetList` |
| `financial.loans` | `financial.loanList` |
| `goal.targetMonths` | `goal.targetPeriod` |

### 응답

- `201` `{ user: { id, loginId, email, name, createdAt, monthlyIncome, targetAmount, targetPeriod, assetList, loanList, productIds } }`
- `400` `{ error: "invalid loginId" | ... }`
- `409` `{ error: "loginId already exists" | "email already exists" }`

## 미수정 (의도적)

- 로그인 API / `authStorage` / Header / Footer / 라우팅 / 백엔드 코드
