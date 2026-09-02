# 작업 요약

- 일시: 2026-09-02
- 영역: front

## 변경 요약

로그인 화면에 `POST /api/auth/login` API를 연동했습니다. 아이디·비밀번호 입력 후 로그인 성공 시 토큰과 사용자 정보를 `localStorage`에 저장하고 대시보드(`/`)로 이동합니다.

## 변경 파일

- `front/src/pages/Login/Login.jsx` — 로그인 API 호출, 로딩·에러 처리, 아이디 필드 변경
- `front/src/services/authStorage.js` — 액세스 토큰·사용자 정보 저장/조회 (신규)
- `front/src/components/common/Input/Input.jsx` — `disabled` prop 지원 추가

## 사용 API

- `POST /api/auth/login` — 로그인 요청 (`api.login({ loginId, password })`)

## 동작

- 성공: `accessToken`, `tokenType`, `expiresIn`, `user`를 `localStorage`에 저장 후 `/` 이동
- 에러 메시지: 400/401/429 응답을 한국어 안내 문구로 표시
- 로딩 중: 버튼 비활성화 및 "로그인 중..." 표시

## 미구현 (의도적)

- 회원가입, 로그아웃, 아이디/비밀번호 찾기 API 연동
- AuthContext, ProtectedRoute 등 전역 인증 구조

---

## 18:15 — Header 로그인 상태 반영

### 변경 요약

Header에서 `authStorage`의 토큰·사용자 정보로 로그인 상태를 판단하고, 로그인 후 계정 아이콘이 `/login`으로 이동하지 않도록 수정했습니다.

### 변경 파일

- `front/src/components/layout/Header/Header.jsx` — 로그인 상태별 계정 UI 분기

### 동작

- 미로그인: 기존과 동일하게 계정 아이콘·모바일 메뉴가 `/login`으로 이동
- 로그인: 사용자 이름 표시, 계정 아이콘 클릭 불가(링크 없음), 모바일 메뉴에 사용자 이름 표시

### 사용 API

- 없음 (`authStorage` 로컬 조회만 사용)

### 미구현 (의도적)

- `/profile` 페이지, 로그아웃 기능
