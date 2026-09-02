# 작업 요약

- 일시: 2026-09-02
- 영역: front

## 변경 요약

회원가입 3단계 구조는 유지하고, **2단계 재무정보**의 자산·대출 입력만 금융상품 카탈로그(`python/api/product.json`) 기준으로 정렬했습니다. `GET /api/products`는 미구현이므로 API 호출 없이 프론트 더미 카탈로그를 사용합니다.

## 변경 파일

| 파일 | 변경 |
|------|------|
| `front/src/data/productCatalog.js` | **신규** — product.json 래퍼, 상품 조회·표시 헬퍼 |
| `front/src/data/signupFormData.js` | 카탈로그 연동 필드·payload 구조 갱신 |
| `front/src/pages/Signup/Signup.jsx` | 2단계 상품 선택 UI, 고지 문구, 검증·요약 반영 |

## 미수정 (의도적)

- 로그인 API, `authStorage`, Header/Footer, 라우팅, 모바일 반응형 베이스

## 사용 API

- 없음 (`GET /api/products` 호출하지 않음)

## 2단계 UI 변경

### 대출

- 자유입력 `name`/`interestRate` 제거
- 카탈로그에서 `productId` 선택 → 은행명·상품명·금융권_구분·상품_유형·금리범위·한도·대출_기간 표시
- 사용자 입력: `balance`, `monthlyPayment`만

### 자산

- **금융상품 선택**: 예·적금류 카탈로그 선택 (`productId`, 은행명, 상품명, 상품_유형, 금리·만기·최소_금액 표시)
- **직접 입력** (`isManual: true`): 현금 / 투자자산 / 기타 — `manualType`, `manualName`, `amount`
- 사용자 입력: `amount` (보유 금액)

### 고지

- 2단계 상단에 `PRODUCT_DISCLAIMER` 문구 표시 (일부 상품·개인별 조건 상이 안내)

## 카탈로그 구조 (`productCatalog.js`)

```javascript
// python/api/product.json → id는 배열 index
getLoanProducts()    // 대출 55건
getDepositProducts() // 예·적금 75건
getProductById(id)
formatProductOption(product)  // "은행명 — 상품명 (유형)"
formatRateRange(product)      // "3.0% ~ 3.2%"
```

## 최종 더미 payload 예시

`buildSignupPayload(form)` / `SIGNUP_DUMMY_EXAMPLE` 기준:

```javascript
{
  profile: {
    name: '홍길동',
    email: 'hong@example.com',
  },
  financial: {
    monthlySalary: 4200000,
    assets: [
      {
        id: 'holding-asset-1',
        productId: 12,
        isManual: false,
        amount: 1500000,
        금융권_구분: '1금융권',
        은행명: 'KB국민은행',
        상품명: 'KB특별정기예금',
        상품_유형: '정기예금',
        이자율_최저: 3.0,
        이자율_최고: 3.2,
        만기: '12개월',
        최소_금액: '100만원',
      },
      {
        id: 'holding-asset-2',
        productId: null,
        isManual: true,
        amount: 500000,
        상품_유형: '현금',
        상품명: '비상금 통장',
        은행명: null,
        금융권_구분: null,
      },
    ],
    loans: [
      {
        id: 'holding-loan-1',
        productId: 0,
        balance: 65000000,
        monthlyPayment: 1245000,
        금융권_구분: '1금융권',
        은행명: 'KB국민은행',
        상품명: 'KB직장인대출',
        상품_유형: '신용대출',
        이자율_최저: 4.78,
        이자율_최고: 5.98,
        한도: '최대 3.5억원',
        대출_기간: '1년~5년',
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

### FK 연동 설계 포인트

| 구분 | 사용자 보유 | 카탈로그 스냅샷 |
|------|-------------|-----------------|
| 대출 | `productId`, `balance`, `monthlyPayment` | 은행명, 상품명, 상품_유형, 금융권_구분, 이자율_최저/최고, 한도, 대출_기간 |
| 자산(카탈로그) | `productId`, `amount`, `isManual: false` | 동일 + 만기, 최소_금액 |
| 자산(수동) | `productId: null`, `isManual: true`, `amount` | `상품_유형`(manualType), `상품명`(manualName) |

## 테스트 방법

1. `cd front && npm run dev`
2. `/signup` 접속
3. 1단계 기본정보 입력 후 다음
4. 2단계:
   - 고지 문구 확인
   - 자산: 「금융상품 선택」→ 예금 상품 선택 → 상품 정보 박스·보유 금액 입력
   - 자산: 「직접 입력」→ 현금/투자/기타 + 이름 + 금액
   - 대출: 상품 선택 → 금리·한도·기간 표시 → 잔액·월 상환액 입력
5. 3단계 목표 설정 후 완료
6. 브라우저 콘솔에서 `[Signup] 임시 저장 payload:` 로그 확인 — `productId`와 보유 금액 분리 여부 검증
7. `npm run build` — product.json import 빌드 성공 확인
