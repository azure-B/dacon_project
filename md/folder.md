# 프로젝트 폴더 구조

> 폴더·파일이 추가·삭제·이동될 때 이 문서를 갱신한다.

```
dacon/
├── AGENTS.md                 # 에이전트 진입점
├── README.md                 # 팀 협업 안내
├── .cursor/
│   └── rules/                # 영역별 Cursor 규칙
├── back/                     # Express 서버
│   ├── app.js                # 진입점 (API + front 정적 서빙)
│   ├── controller/           # 요청 처리
│   ├── models/               # 데이터 로직
│   └── routes/               # URL 매핑
├── front/                    # React (Vite) 클라이언트
│   ├── publish/              # 퍼블리시 HTML
│   └── src/
│       ├── components/
│       │   ├── common/       # 공통 UI (Button, Input, Card 등)
│       │   └── layout/       # Header, Footer, Layout
│       ├── pages/            # 페이지 (Dashboard, Login 등)
│       └── services/         # API 호출
├── python/                   # Python 스크립트
└── md/
    ├── folder.md             # 이 문서
    ├── auth-api.md           # 인증 API 설계 (전체)
    ├── API/
    │   └── README.md         # 구현된 API 명세서
    └── jobs/
        ├── back/             # back 작업 내역
        └── front/            # front 작업 내역
```
