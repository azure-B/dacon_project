# Stitch dark-emerald — Dashboard 1차 적용

- 일시: 2026-09-11
- 영역: front

## 변경 요약

`front/publish/dashboard.html`을 기준으로 design tokens·공통 컴포넌트·Header/Layout을 dark emerald로 정리하고, Dashboard만 Stitch 레이아웃으로 리팩토링했다. API·auth·라우팅은 유지.

## 변경 파일

- front/src/styles/tokens.css (신규)
- front/src/styles/typography.css (신규)
- front/src/hooks/useCountUp.js (신규)
- front/src/components/common/ProgressBar/ProgressBar.jsx (신규)
- front/src/components/common/ProgressBar/ProgressBar.css (신규)
- front/src/components/common/Button/Button.jsx
- front/src/components/common/Button/Button.css
- front/src/components/common/Card/Card.jsx
- front/src/components/common/index.js
- front/src/components/common/WipBadge/WipBadge.jsx
- front/src/components/layout/Header/Header.jsx
- front/src/components/layout/Header/Header.css
- front/src/components/layout/Footer/Footer.jsx
- front/src/components/layout/Footer/Footer.css
- front/src/components/layout/Layout/Layout.jsx
- front/src/pages/Dashboard/Dashboard.jsx
- front/src/pages/Dashboard/Dashboard.css
- front/src/index.css
- front/tailwind.config.js
- front/index.html
- md/folder.md

## 사용 API

- POST /api/debt-adjustment — 대시보드 자산·부채·수입·목표 요약 (`api.analyzeDebt`)
- GET /api/account-book/summary — 이번 달 지출 합계 (`api.getAccountBookSummary`)
