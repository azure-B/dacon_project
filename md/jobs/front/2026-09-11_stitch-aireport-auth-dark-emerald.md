# Stitch dark-emerald — AiReport · Login · Signup

- 일시: 2026-09-11
- 영역: front

## 변경 요약

AI 리포트·로그인·회원가입 페이지를 Stitch dark emerald UI로 리팩토링했다. Dashboard 등에서 쓰던 PageContainer / AuthShell / Card(architectural·frosted) / Button extruded / Input passwordToggle / useCountUp / section-reveal 패턴을 적용했고, 퍼블리시 HTML·더미 금액은 실데이터로 쓰지 않았다.

## 변경 파일

- front/src/pages/AiReport/AiReport.jsx
- front/src/pages/AiReport/AiReport.css (기존 차트 애니메이션 유지)
- front/src/pages/Login/Login.jsx
- front/src/pages/Login/Login.css
- front/src/pages/Signup/Signup.jsx
- front/src/pages/Signup/Signup.css
- md/jobs/front/2026-09-11_stitch-aireport-auth-dark-emerald.md

## 사용 API

- POST /api/spending-evaluation — 지출 평가 (`api.runSpendingEvaluation`) — AiReport, 호출 방식 변경 없음
- POST /api/auth/login — 로그인 (`api.login`) — Login, 자동 DEMO 로그인 제거 → 폼 제출 시 호출
- POST /api/auth/signup — 회원가입 (`api.signup`) — Signup, 3단계·payload·검증 유지

## 비고

- `ensureDemoSession()`은 Login에서 「게스트로 계속」 명시 클릭 시에만 사용 (마운트 자동 로그인 제거)
- AiReport 차트: `CHART_MONTHS` 하드코딩 제거 → `evaluation.summary.topCategories` 또는 recommendations 기반 막대, 없으면 empty state
- PDF/공유·목표 카드·사이드 WIP 항목은 비활성 + WipBadge 유지
- `md/folder.md` 미갱신 — AuthShell / PageContainer 등 새 폴더 없음
