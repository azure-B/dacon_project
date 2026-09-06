# 프로젝트 폴더 구조

> 폴더·파일이 추가·삭제·이동될 때 이 문서를 갱신한다.

```
dacon/
├── AGENTS.md                 # 에이전트 진입점
├── README.md                 # 팀 협업 안내
├── render.yaml               # Render Blueprint (back API)
├── config/                   # 로컬 시크릿 (.env 권장, 실키는 gitignore)
│   ├── .env.example          # OpenAI·Supabase 예시 (커밋 OK)
│   └── .env                  # 실키 (커밋 금지)
├── .cursor/
│   └── rules/                # 영역별 Cursor 규칙
├── back/                     # Express 서버
│   ├── app.js                # 진입점 (API + front 정적 서빙)
│   ├── config/               # ai·supabase 설정
│   ├── controller/           # 요청 처리
│   ├── models/               # 데이터 로직 (Supabase)
│   ├── routes/               # URL 매핑
│   ├── services/             # aiClient, supabase 클라이언트
│   ├── scripts/              # 로컬 시드·평가 스크립트
│   └── sql/                  # Supabase SQL Editor용 스키마
│       ├── 001_init.sql
│       └── 002_auth_helpers.sql
├── front/                    # React (Vite) 클라이언트
│   ├── netlify.toml          # Netlify 빌드·SPA 리다이렉트
│   ├── publish/              # 퍼블리시 HTML
│   └── src/
│       ├── components/
│       │   ├── common/       # 공통 UI (Button, Input, Card, WipBadge 등)
│       │   └── layout/       # Header, Footer, Layout
│       ├── pages/            # 페이지 (Dashboard, Login 등)
│       └── services/         # API 호출 (VITE_API_BASE)
├── python/                   # Python 스크립트·데이터
│   └── api/
│       └── product.json      # 웹 검색 기반 금융 상품 데이터
└── md/
    ├── folder.md             # 이 문서
    ├── auth-api.md           # 인증 API 설계 (전체)
    ├── API/
    │   ├── README.md         # 구현된 API 명세서
    │   ├── product-data.md   # product.json 연동 가이드 (back)
    │   └── supabase.md       # Supabase 스키마·환경변수·배포
    └── jobs/
        ├── back/             # back 작업 내역
        └── front/            # front 작업 내역
```
