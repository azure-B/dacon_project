# 작업 요약

- 일시: 2026-09-02
- 영역: front

## 변경 요약

전체 페이지(Login, Signup, Dashboard, DebtAnalysis, Simulation, AiFeedback, AiReport)와 Header, Footer에 모바일 반응형 UI를 적용했습니다. 기존 Stitch 디자인·로그인 API·인증 저장·라우팅은 유지했습니다.

## 반응형 기준

- Desktop: 기존 레이아웃 유지
- Tablet: `md:` (768px) 전후
- Mobile: 360px ~ 430px (`sm:` 보조, 좌우 padding 12px)

## 주요 변경

### 공통 (`index.css`, `Layout.css`)
- `overflow-x: hidden`, `page-shell`, `financial-value`, `chart-responsive`, `table-scroll` 유틸 추가

### Header
- 모바일 가로 탭 네비 제거 → 햄버거 드로어 메뉴로 통합
- 오버레이·ESC 닫기·body 스크롤 잠금
- 로그인 상태 표시(모바일 상단 이름) 유지

### Footer
- 모바일 세로 배치, 터치 영역 44px

### 페이지별
- 다열 카드 → 모바일 1열 (`grid-cols-1`)
- 금융 수치 `financial-value`로 overflow 방지
- 차트 컨테이너 반응형 폭·Y축 라벨 겹침 수정 (Simulation, AiFeedback, AiReport)
- AiFeedback/AiReport: 모바일 가로 스크롤 탭 네비 추가 (사이드바 대체)
- AiReport 테이블: `table-scroll` 가로 스크롤

## 변경 파일

- `front/src/index.css`
- `front/src/components/layout/Layout/Layout.css`
- `front/src/components/layout/Header/Header.jsx`
- `front/src/components/layout/Header/Header.css`
- `front/src/components/layout/Footer/Footer.jsx`
- `front/src/pages/Login/Login.jsx`
- `front/src/pages/Signup/Signup.jsx`
- `front/src/pages/Dashboard/Dashboard.jsx`
- `front/src/pages/DebtAnalysis/DebtAnalysis.jsx`
- `front/src/pages/Simulation/Simulation.jsx`
- `front/src/pages/AiFeedback/AiFeedback.jsx`
- `front/src/pages/AiReport/AiReport.jsx`

## 사용 API

- 없음 (기존 로그인 API 연동 코드 변경 없음)

## 미변경 (의도적)

- `front/src/services/api.js`, `authStorage.js` — 로그인·인증 로직
- `front/src/App.jsx` — 라우팅
- 백엔드 코드

## 18:40 — 2차 점검 수정

- `chart-responsive--clip` 분리 (차트 가로 스크롤 충돌 해결)
- Header 드로어 `fixed` + z-index 조정
- Login/Signup/Simulation/AiFeedback/AiReport 터치·overflow 보강
