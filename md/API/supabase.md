# Supabase 연동 가이드

## 1. SQL Editor에서 스키마 등록

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **SQL Editor** → New query
3. 저장소의 `back/sql/001_init.sql` 전체 복사 → Run

생성 테이블: `profiles`, `account_book_transactions`, `spending_evaluations`, `financial_products`

## 2. Auth 설정 (로컬 테스트)

**Authentication → Providers → Email**

- Email provider: Enabled
- **Confirm email**: 로컬에서는 **OFF** 권장 (켜면 가입 직후 로그인 불가)

## 3. 로컬 환경변수 (`config/.env`)

`config/.env` 를 우선 로드합니다. (gitignore됨)

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...anon
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role
OPENAI_API_KEY=sk-...
```

| 키 | 용도 |
|----|------|
| `SUPABASE_URL` | 프로젝트 URL |
| `SUPABASE_ANON_KEY` | 공개(anon) JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role secret** (Publishable 금지) |
| `OPENAI_API_KEY` | LLM (없으면 `config/config.txt` 폴백) |

추가로 SQL Editor에서 `back/sql/002_auth_helpers.sql` 도 실행하세요.  
(service_role 없이 anon+유저 토큰으로 로그인 ID 조회가 가능해집니다.)

데모 계정·1달 시드·월간 평가:

```bash
cd back
npm run dev
# 다른 터미널
node scripts/seed-and-evaluate.js
```

로그인 화면 기본값: `demo01` / `pass1234`


## 4. 로컬 실행

```bash
cd back
npm install
npm run dev
```

프론트(Vite)는 API를 프록시하거나 `/api`를 백엔드로 보냅니다.

## 5. 배포 — Render (back) + Netlify (front)

로컬 시크릿은 커밋하지 않습니다. 대시보드 Environment에만 넣습니다.

### 5-1. GitHub에 푸시

`main`에 최신 코드가 있어야 Render/Netlify가 빌드합니다.

### 5-2. Render — API

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** (저장소의 `render.yaml`)  
   또는 **Web Service** 수동 생성:
   - Repository: `azure-B/dacon_project`
   - **Root Directory**: `back`
   - **Build**: `npm install`
   - **Start**: `npm start`
   - Health: `/api/health`
2. Environment:

| Key | 예시 / 값 |
|-----|-----------|
| `NODE_ENV` | `production` |
| `API_ONLY` | `true` |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** secret (`sb_publishable_` 금지) |
| `CORS_ORIGIN` | Netlify URL (예: `https://xxx.netlify.app`) 또는 일단 `true` |
| `AI_REQUIRED` | `false` |
| `EVALUATION_SCHEDULER_ENABLED` | `true` |
| `EVALUATION_TZ` | `Asia/Seoul` |

3. Deploy 후 URL 확인: `https://<service>.onrender.com`  
   → `GET /api/health` 가 200이면 OK.

Free 플랜은 유휴 시 슬립됩니다. 첫 요청이 느릴 수 있습니다.

### 5-3. Netlify — Front

1. [Netlify](https://app.netlify.com) → **Add new site** → Import from Git → 같은 저장소
2. Build settings:
   - **Base directory**: `front`
   - **Build command**: `npm run build` (`front/netlify.toml`과 동일)
   - **Publish directory**: `front/dist`
3. Environment (빌드 전 필수):

| Key | 값 |
|-----|-----|
| `VITE_API_BASE` | `https://<your-render-service>.onrender.com/api` |

4. Deploy. SPA는 `netlify.toml` redirects로 처리됩니다.
5. Netlify URL이 확정되면 Render의 `CORS_ORIGIN`을 그 URL로 맞추고 Render Redeploy.

### 5-4. 배포 후 확인

- Netlify 사이트 접속 → 로그인 (`demo01` 등)
- 가계부 / 빚 정리 / 만약에 API 호출이 Render로 가는지 Network 탭에서 확인
- Supabase Auth **Confirm email** 은 데모면 OFF 유지

로컬 검증 후 **Render → Netlify** 순으로 올리면 됩니다.

