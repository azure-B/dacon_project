# Stitch dark-emerald — DebtAnalysis · Simulation

- 일시: 2026-09-11
- 영역: front

## 변경 요약

Dashboard에 적용된 Stitch dark emerald 디자인·공통 컴포넌트로 부채 분석·시뮬레이션 페이지 UI를 리팩토링했다. API 호출·기존 기능(정렬·차트·체크박스 절감 합산 등)은 유지하고 퍼블리시 HTML은 복사하지 않았다.

## 변경 파일

- front/src/pages/DebtAnalysis/DebtAnalysis.jsx
- front/src/pages/DebtAnalysis/DebtAnalysis.css
- front/src/pages/Simulation/Simulation.jsx
- front/src/pages/Simulation/Simulation.css

## 사용 API

- POST /api/debt-adjustment — 부채 분석 (`api.analyzeDebt`) — 호출 방식 변경 없음
- POST /api/simulation — 시나리오 시뮬레이션 (`api.runSimulation`) — 호출 방식 변경 없음
