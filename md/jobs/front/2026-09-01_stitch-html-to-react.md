# 작업 요약

- 일시: 2026-09-01
- 영역: front

## 변경 요약

`front/publish/` Stitch HTML 디자인을 React 페이지·공통 컴포넌트로 변환하고, `react-router-dom` 기반 라우팅을 연결했습니다. 로그인·회원가입은 Header/Footer 없이 단독 렌더링합니다.

## 변경 파일

### 신규
- `front/src/pages/AiReport/AiReport.jsx`
- `front/src/pages/AiReport/AiReport.css`

### 수정
- `front/src/App.jsx` — BrowserRouter 및 페이지 라우트 설정
- `front/src/pages/index.js` — 페이지 export 정리

### 기존 변환 페이지 (publish HTML 대응)
- `front/src/pages/Dashboard/Dashboard.jsx` ← `dashboard.html`
- `front/src/pages/DebtAnalysis/DebtAnalysis.jsx` ← `debt-analysis.html`
- `front/src/pages/Simulation/Simulation.jsx` ← `simulation.html`
- `front/src/pages/AiFeedback/AiFeedback.jsx` ← `ai-feedback.html`
- `front/src/pages/Login/Login.jsx` ← `login.html`
- `front/src/pages/Signup/Signup.jsx` ← `signup.html`

### 공통 컴포넌트
- `front/src/components/layout/Header/Header.jsx`
- `front/src/components/layout/Footer/Footer.jsx`
- `front/src/components/layout/Layout/Layout.jsx`
- `front/src/components/common/Button/Button.jsx`
- `front/src/components/common/Input/Input.jsx`
- `front/src/components/common/Card/Card.jsx`
- `front/src/components/common/MaterialIcon/MaterialIcon.jsx`

### 스타일·설정
- `front/tailwind.config.js`
- `front/postcss.config.js`
- `front/src/index.css`

## 라우트

| 경로 | 페이지 | Layout |
|------|--------|--------|
| `/` | Dashboard | O |
| `/debt-analysis` | DebtAnalysis | O |
| `/simulation` | Simulation | O |
| `/ai-feedback` | AiFeedback | O |
| `/ai-report` | AiReport | O |
| `/login` | Login | X |
| `/signup` | Signup | X |

## 사용 API

- 없음 (화면 변환 단계, API 연동 미구현)
