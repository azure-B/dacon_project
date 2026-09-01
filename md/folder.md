# 프로젝트 폴더 구조

> 폴더·파일이 추가·삭제·이동될 때 이 문서를 갱신한다.

```
dacon/
├── AGENTS.md                 # 에이전트 진입점
├── .cursor/
│   └── rules/                # 영역별 Cursor 규칙
├── back/                     # Express MVC 서버
│   ├── server.js             # 진입점
│   └── src/
│       ├── app.js
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       └── routes/
├── front/                    # React (Vite) 클라이언트
│   ├── publish/              # 퍼블리시 HTML
│   └── src/
│       ├── components/
│       │   ├── common/       # 공통 UI
│       │   ├── layout/     # Header, Footer, Layout
│       │   └── features/   # 기능별 컴포넌트
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       └── services/         # API 호출
├── python/                   # Python 스크립트
└── md/
    ├── folder.md             # 이 문서
    ├── API/
    │   └── README.md         # API 명세서
    └── jobs/
        ├── back/             # back 작업 내역
        └── front/            # front 작업 내역
```
