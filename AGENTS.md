# Dacon — Agent 가이드

Cursor 에이전트가 이 프로젝트에서 작업할 때 참조하는 진입점 문서입니다.

## 폴더 역할

| 폴더 | 역할 |
|------|------|
| `back/` | Express MVC 서버 |
| `front/` | React (Vite) 클라이언트 |
| `python/` | Python 스크립트 |
| `md/` | 문서 — API 명세, 작업 내역, 폴더 구조 |

## 작업 영역별 규칙

규칙은 `.cursor/rules/`에 영역별로 분리되어 있습니다. 해당 폴더 작업 시에만 로드됩니다.

| 규칙 파일 | 적용 범위 |
|-----------|-----------|
| `project-overview.mdc` | 전역 (최소 공통 사항) |
| `back-workflow.mdc` | `back/**` |
| `front-workflow.mdc` | `front/**` |
| `md-documentation.mdc` | `md/**` |

## 작업 완료 시 필수 행동

### back 작업 시

1. `md/API/README.md` — 변경된 엔드포인트 반영
2. `md/jobs/back/` — 작업 내역 기록
3. 폴더 구조 변경 시 `md/folder.md` 갱신

### front 작업 시

1. `md/jobs/front/` — 작업 내역 기록 (사용 API 엔드포인트·변경 파일명 포함)
2. 폴더 구조 변경 시 `md/folder.md` 갱신

### python 작업 시

- `python/` 코드만 수정. jobs 기록 없음.

## 문서 SSOT

- API 명세: `md/API/README.md`
- 폴더 구조: `md/folder.md`
- 작업 내역: `md/jobs/back/`, `md/jobs/front/`

작업을 종료하기 전 위 문서 갱신 여부를 반드시 확인하세요.
