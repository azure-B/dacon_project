# 금융 상품 데이터 (`product.json`) — back 연동 가이드

> **데이터 파일:** `python/api/product.json`  
> **대상:** back 작업 시 Cursor에서 이 문서와 JSON을 함께 참고한다.  
> **API 구현 후:** `md/API/README.md`에 엔드포인트를 추가한다.

---

## 1. 한 줄 요약

웹 검색으로 수집한 **일부** 금융 상품(대출·예적금 등) 정적 JSON이다.  
back에서는 이 파일을 읽어 API로 제공하고, **응답마다 아래 고지 문구를 반드시 포함**한다.

---

## 2. 필수 고지 (API·화면 공통)

상품 목록/상세 API 응답 또는 프론트 UI에 **항상** 노출할 문구:

| 키 | 노출 문구 (권장) |
|----|------------------|
| `dataSource` | 본 데이터는 **웹 검색 기반**으로 수집되었습니다. (금융감독원 공시, 은행연합회, 각 금융사 홈페이지 등) |
| `partialResults` | **일부 상품만** 검색·수집된 결과이며, 시중 전체 상품을 대표하지 않습니다. |
| `variableConditions` | **대출 상품**의 금리·한도·승인 여부는 **신용점수, 소득, 부채, 재직 기간** 등 개인 상황에 따라 달라질 수 있습니다. |
| `confirmBeforeApply` | 실제 가입·대출 실행 전 해당 금융사에서 최신 조건을 반드시 확인하세요. |

### API 응답에 넣을 `disclaimer` 예시

```json
{
  "disclaimer": {
    "dataSource": "본 데이터는 웹 검색 기반으로 수집되었습니다.",
    "partialResults": "일부 상품만 검색된 결과이며, 전체 시장을 대표하지 않습니다.",
    "variableConditions": "대출 상품은 신용점수·소득 등 개인 상황에 따라 금리·한도·승인 여부가 달라질 수 있습니다.",
    "confirmBeforeApply": "가입·대출 전 금융사 공식 채널에서 최신 조건을 확인하세요."
  },
  "metadata": { "...": "product.json의 metadata 그대로 또는 요약" },
  "products": []
}
```

---

## 3. 파일 구조

```
python/api/product.json
├── metadata          # 수집 정보·출처·범위
└── products[]        # 상품 배열 (130건, 2026-09-02 기준)
```

### 3.1 `metadata`

| 필드 | 타입 | 설명 |
|------|------|------|
| `created_date` | string | 데이터 작성일 (`YYYY-MM-DD`) |
| `data_source` | string | 웹 검색 출처 설명 |
| `note` | string | 변동 가능성 안내 |
| `coverage` | string | 수집 범위 (은행·저축은행 개수 등) |

### 3.2 `products[]` — 공통 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `금융권_구분` | string | `1금융권` \| `2금융권` \| `대부업체` |
| `은행명` | string | 금융사명 |
| `상품명` | string | 상품명 |
| `상품_유형` | string | 아래 「상품 유형」 참고 |
| `이자율_최저` | number | 최저 금리 (%) |
| `이자율_최고` | number | 최고 금리 (%) |
| `조건_및_특징` | string | 상품 요약 |
| `우대_조건` | string | 우대 조건 |
| `중도상환수수료` | string | 수수료 또는 `해당없음` |
| `연체_이자율` | string | 연체 시 또는 `해당없음` |
| `담보_유무` | string | 담보 여부 |
| `공시_기준일` | string | 공시 기준일 |
| `신청자_자격` | string | 자격 조건 (**신용점수 등 포함**) |

### 3.3 대출 상품 추가 필드

`상품_유형`이 대출류일 때 존재:

| 필드 | 설명 |
|------|------|
| `대출_기간` | 예) `1년~5년`, `최대 30년` |
| `한도` | 예) `최대 3.5억원` |

**대출 `상품_유형` (55건):**  
`신용대출`, `사업자신용대출`, `주택담보대출`, `전세자금대출`, `자동차담보대출`, `마이너스대출`, `연금담보대출`, `학자금대출`, `보증부대출`

### 3.4 예·적금·입출금 상품 추가 필드

| 필드 | 설명 |
|------|------|
| `만기` | 예) `12개월`, `수시입출금` |
| `최소_금액` | 가입 최소 금액 |

**예적금 등 `상품_유형` (75건):**  
`정기예금`, `정기적금`, `자유적금`, `주택청약적금`, `파킹통장`

---

## 4. 데이터 통계 (2026-09-02)

| 구분 | 건수 |
|------|------|
| 전체 상품 | 130 |
| 1금융권 | 95 |
| 2금융권 | 33 |
| 대부업체 | 2 |

---

## 5. back에서 파일 읽기

### 5.1 경로

Express(`back/app.js`) 기준 **프로젝트 루트 상대**:

```js
const path = require("path");
const PRODUCT_PATH = path.join(__dirname, "..", "python", "api", "product.json");
```

### 5.2 모델 예시 (`back/models/product.model.js`)

```js
const fs = require("fs");
const path = require("path");

const PRODUCT_PATH = path.join(__dirname, "..", "..", "python", "api", "product.json");

let cache = null;

function load() {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(PRODUCT_PATH, "utf-8"));
  }
  return cache;
}

function getDisclaimer() {
  return {
    dataSource: "본 데이터는 웹 검색 기반으로 수집되었습니다.",
    partialResults: "일부 상품만 검색된 결과이며, 전체 시장을 대표하지 않습니다.",
    variableConditions:
      "대출 상품은 신용점수·소득 등 개인 상황에 따라 금리·한도·승인 여부가 달라질 수 있습니다.",
    confirmBeforeApply: "가입·대출 전 금융사 공식 채널에서 최신 조건을 확인하세요.",
  };
}

function findAll(filters = {}) {
  const { products } = load();
  let list = [...products];

  if (filters.금융권_구분) {
    list = list.filter((p) => p.금융권_구분 === filters.금융권_구분);
  }
  if (filters.상품_유형) {
    list = list.filter((p) => p.상품_유형 === filters.상품_유형);
  }
  if (filters.은행명) {
    list = list.filter((p) => p.은행명.includes(filters.은행명));
  }

  return list.map((p, index) => ({ id: index, ...p }));
}

function isLoanType(상품_유형) {
  return [
    "신용대출", "사업자신용대출", "주택담보대출", "전세자금대출",
    "자동차담보대출", "마이너스대출", "연금담보대출", "학자금대출", "보증부대출",
  ].includes(상품_유형);
}

module.exports = { load, getDisclaimer, findAll, isLoanType };
```

> **ID:** JSON에 `id` 없음 → API 응답 시 **배열 인덱스**를 `id`로 부여하거나, `은행명|상품명` 복합키 사용.

---

## 6. 신용점수·상황별 필터 (권장)

`신청자_자격`은 **자유 텍스트**이므로 정규식으로 신용점수 하한을 추출한다.

```js
function parseMinCreditScore(자격문자열) {
  const m = String(자격문자열).match(/신용점수\s*(\d+)\s*이상/);
  return m ? Number(m[1]) : null;
}

function filterByCreditScore(products, userScore) {
  if (userScore == null) return products;
  return products.filter((p) => {
    const min = parseMinCreditScore(p.신청자_자격);
    return min == null || userScore >= min;
  });
}
```

- `신용점수` 문구가 **없는** 상품 → 점수 조건 미명시로 간주, 필터에서 **포함**
- 대출 상품 응답 시 `variableConditions` 고지 **필수**
- 필터 결과가 0건이어도 `partialResults` 고지는 유지

### 쿼리 파라미터 예시 (구현 권장)

| 파라미터 | 설명 |
|----------|------|
| `금융권_구분` | `1금융권`, `2금융권`, `대부업체` |
| `상품_유형` | `신용대출`, `정기예금` 등 |
| `은행명` | 부분 일치 검색 |
| `creditScore` | 사용자 신용점수 (대출 필터용, optional) |
| `category` | `loan` \| `deposit` — 대출/예적금 묶음 필터 |

---

## 7. REST API 설계 (구현 예정)

| Method | Path | 설명 | 구현 |
|--------|------|------|------|
| `GET` | `/api/products` | 상품 목록 (+ 쿼리 필터) | N |
| `GET` | `/api/products/:id` | 상품 단건 (인덱스 id) | N |
| `GET` | `/api/products/meta` | metadata + disclaimer | N |

### `GET /api/products` 응답 예시

```json
{
  "disclaimer": {
    "dataSource": "본 데이터는 웹 검색 기반으로 수집되었습니다.",
    "partialResults": "일부 상품만 검색된 결과이며, 전체 시장을 대표하지 않습니다.",
    "variableConditions": "대출 상품은 신용점수·소득 등 개인 상황에 따라 금리·한도·승인 여부가 달라질 수 있습니다.",
    "confirmBeforeApply": "가입·대출 전 금융사 공식 채널에서 최신 조건을 확인하세요."
  },
  "metadata": {
    "created_date": "2026-09-02",
    "data_source": "웹 검색 기반 (...)",
    "coverage": "1 금융권 6개 은행 ..."
  },
  "count": 19,
  "products": [
    {
      "id": 0,
      "금융권_구분": "1금융권",
      "은행명": "KB국민은행",
      "상품명": "KB직장인대출",
      "상품_유형": "신용대출",
      "이자율_최저": 4.78,
      "이자율_최고": 5.98,
      "대출_기간": "1년~5년",
      "한도": "최대 3.5억원",
      "신청자_자격": "만 19세 이상 직장인, 재직 1년 이상, 신용점수 700 이상"
    }
  ]
}
```

---

## 8. back 작업 체크리스트

1. `python/api/product.json` — **수정하지 않음** (python 담당 데이터). back은 **읽기만**
2. `back/models/product.model.js` — JSON 로드·필터·disclaimer
3. `back/controller/product.controller.js` — 요청/응답, 고지 포함
4. `back/routes/product.routes.js` + `routes/index.js` 등록
5. **`md/API/README.md`** — 엔드포인트 추가
6. **`md/jobs/back/`** — 작업 내역

---

## 9. front 연동 참고

- front는 `md/API/README.md`의 products API만 호출
- UI 상단/하단에 `disclaimer.partialResults`, `disclaimer.variableConditions` **고정 표시** 권장
- 대출 목록 카드에 `이자율_최저`~`이자율_최고`는 **참고용**임을 명시 (실제 금리는 개인별 상이)

---

## 10. 관련 파일

| 파일 | 역할 |
|------|------|
| `python/api/product.json` | 원본 데이터 (130건) |
| `md/API/product-data.md` | 이 문서 |
| `md/API/README.md` | 구현된 REST API 명세 |
