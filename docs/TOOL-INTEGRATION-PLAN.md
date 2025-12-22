# 이룸 도구 통합 계획 (2025년 12월)

> **작성일**: 2025-12-22
> **목표**: 최신 AI 개발 도구 활용으로 개발 효율성 극대화
> **기준**: 이룸 프로젝트 현재 단계 (Phase F-6 보안, 배포 준비)

---

## 도구별 통합 계획

### 1. Cursor IDE (v2.2) - UI 개발 가속화

**핵심 기능**: Visual Editor, Background Agents, Debug Mode

#### 즉시 적용 가능

| 기능 | 활용 방안 | 우선순위 |
|------|----------|---------|
| **Visual Editor** | 컴포넌트 스타일 실시간 조정 | ⭐⭐⭐ |
| Point-and-Prompt | 요소 클릭 → 자연어 수정 요청 | ⭐⭐⭐ |
| React Props 인스펙션 | 컴포넌트 props 사이드바 조작 | ⭐⭐ |
| Debug Mode | 버그 원인 자동 분석 | ⭐⭐ |

#### 적용 대상 작업

```yaml
Step 4b 브랜딩 중립화:
  - 새 로고 컴포넌트 스타일 조정 (Visual Editor)
  - 색상 팔레트 실시간 테스트
  - 그라데이션/애니메이션 미세 조정

다크모드 개선:
  - 다크모드 색상 Visual Editor로 즉시 확인
  - 모듈별 색상 변수 조정

반응형 개선:
  - 모바일/태블릿 레이아웃 드래그 조정
  - padding/margin 슬라이더로 조정
```

#### 설정 방법

```json
// .vscode/settings.json (Cursor 호환)
{
  "cursor.visualEditor.enabled": true,
  "cursor.backgroundAgents.maxParallel": 4
}
```

---

### 2. Claude Code CLI - 개발 자동화

**핵심 기능**: Plugins, MCP, Hooks, Background Agents

#### 현재 사용 중인 기능

- 슬래시 커맨드: `/qplan`, `/qcode`, `/qcheck`, `/test`, `/review`
- 세션 관리: Named sessions

#### 신규 적용 계획

| 기능 | 활용 방안 | 구현 방법 |
|------|----------|----------|
| **Plugins** | 커스텀 명령 패키징 | `.claude/plugins/` |
| **MCP project 스코프** | 팀 MCP 설정 공유 | `.mcp.json` 커밋 |
| **Hooks** | 빌드/테스트 자동화 | `.claude/hooks/` |
| **.claude/rules/** | 프로젝트별 규칙 | 디렉토리 생성 |

#### 플러그인 구조 제안

```
.claude/
├── plugins/
│   └── yiroom/
│       ├── commands/
│       │   ├── deploy-check.md   # 배포 전 체크리스트
│       │   ├── db-migrate.md     # DB 마이그레이션 가이드
│       │   └── component-gen.md  # 컴포넌트 생성 템플릿
│       └── agents/
│           ├── code-reviewer.md
│           └── test-writer.md
├── hooks/
│   ├── pre-commit.sh            # 커밋 전 typecheck
│   └── post-build.sh            # 빌드 후 알림
├── rules/
│   └── coding-standards.md      # 코딩 표준
└── settings.json
```

#### MCP 서버 설정

**CLI 명령어로 추가 (권장)**:
```bash
# Figma - 공식 리모트 MCP (브라우저 사용 시)
claude mcp add --transport http figma-remote-mcp https://mcp.figma.com/mcp

# Figma - 로컬 데스크탑 앱 (Figma 앱 실행 필요)
claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse

# Supabase - 공식 패키지 (개발 전용!)
npx @supabase/mcp-server-supabase --project-ref <PROJECT_REF>
```

> **⚠️ 보안 경고**: Supabase MCP는 **개발/테스트 전용**입니다.
> 프로덕션 DB에 연결하지 마세요!

**설정 파일 (.mcp.json) - 로컬 전용**:
```json
{
  "mcpServers": {
    "figma-desktop": {
      "transport": "sse",
      "url": "http://127.0.0.1:3845/sse"
    }
  }
}
```

> **참고**: `.mcp.json`은 `.gitignore`에 추가하여 API 키 노출 방지

---

### 3. Figma Dev Mode MCP Server - 디자인 → 코드

**핵심 기능**: 디자인 파일 직접 연결, 코드 생성

#### 적용 조건

```yaml
전제조건:
  - Figma 디자인 시스템 구축 (컴포넌트 정의)
  - Design tokens 설정 (globals.css 연동)
  - figma.config.json 설정

현재 상태:
  - ✅ Stitch 디자인 에셋 확보
  - ✅ globals.css 토큰 정의
  - ⏳ Figma 컴포넌트 라이브러리 구축 필요
```

#### 단계별 도입

| 단계 | 내용 | 시기 |
|------|------|------|
| 1단계 | Figma → 디자인 토큰 추출 | 즉시 가능 |
| 2단계 | Code Connect 설정 (React 컴포넌트 연결) | 1주 |
| 3단계 | MCP 서버 연동 (Cursor/Claude Code) | 2주 |

#### figma.config.json 예시

```json
{
  "codeConnect": {
    "include": ["components/**/*.tsx"],
    "parser": "react"
  },
  "tokens": {
    "output": "lib/design-tokens.ts"
  }
}
```

#### 예상 효과

- UI 컴포넌트 초기 구현 시간 **50-70% 단축**
- 디자인-코드 불일치 최소화
- 디자이너-개발자 협업 개선

---

### 4. Google Gemini - AI 분석 업그레이드

**현재**: Gemini 2.5 Flash 사용 중 (lib/gemini.ts:47)

#### 모델 비교

| 모델 | 상태 | 무료 티어 | 유료 (입력/1M) | 권장 |
|------|------|----------|---------------|------|
| **gemini-2.5-flash** | ✅ 안정 | ⚠️ 일 20회 제한 | $0.30 | 현재 사용 |
| **gemini-3-flash-preview** | ⚠️ Preview | ✅ 무료 (AI Studio) | $0.50 | ⭐ 전환 권장 |
| gemini-2.0-pro-exp | ⚠️ Experimental | - | - | 복잡한 분석용 |

> **✅ 수정**: Gemini 3 Flash는 **Google AI Studio에서 무료** 사용 가능!
> - 2.5 Flash: 2025-12-06 무료 티어 92% 축소 (일 250회 → 20회)
> - 3 Flash: 무료 티어 제공 + 컨텍스트 캐싱으로 90% 비용 절감 가능

#### 권장 전략

```typescript
// 권장: Gemini 3 Flash로 전환 (무료 티어 + 성능 향상)
model: process.env.GEMINI_MODEL || "gemini-3-flash-preview"

// .env.local
GEMINI_MODEL=gemini-3-flash-preview
```

> **⚠️ 주의**: Preview 상태이므로 GA 전까지 API 변경 가능성 있음

#### 모델 선택 전략

```yaml
gemini-3-flash (기본):
  - PC-1 퍼스널 컬러 분석
  - S-1 피부 분석
  - C-1 체형 분석
  - N-1 음식 인식
  - 일반 RAG 응답

gemini-2.0-pro (선택적):
  - 복잡한 운동 플랜 생성
  - 월간 리포트 AI 인사이트
  - 성분 상호작용 분석
```

---

### 5. Anthropic Claude - 개발 지원

**현재**: Claude Code (Opus 4.5) 사용 중

#### 모델 활용 전략

| 모델 | 용도 | 비용 |
|------|------|------|
| **Claude Sonnet 4.5** | 일상 코딩, 빠른 응답 | $3/$15 per 1M |
| **Claude Opus 4.5** | 복잡한 리팩토링, 아키텍처 | $5/$25 per 1M |

#### 작업별 모델 선택

```yaml
Sonnet 4.5 (빠른 작업):
  - 단위 테스트 작성
  - 버그 수정
  - 간단한 컴포넌트 생성
  - 문서 작성

Opus 4.5 (복잡한 작업):
  - 대규모 리팩토링
  - 아키텍처 설계
  - 복잡한 비즈니스 로직
  - 보안 검토
```

#### Claude Code 신기능 활용

```yaml
Checkpoints:
  - 대규모 리팩토링 전 체크포인트 저장
  - 문제 발생 시 롤백

Agent Skills:
  - Excel/PDF 처리 (관리자 리포트)
  - 문서 자동 생성

Structured Outputs:
  - API 응답 스키마 생성
  - 타입 정의 자동화
```

---

## 통합 워크플로우

### 신규 기능 개발 플로우

```
1. 기획/스펙 작성
   └─ Claude Code (Opus) + /qplan

2. 디자인
   └─ Figma + Design Tokens

3. 코드 생성
   ├─ Figma MCP → 초기 컴포넌트 생성
   └─ Claude Code → 비즈니스 로직

4. UI 조정
   └─ Cursor Visual Editor → 실시간 스타일링

5. 테스트
   ├─ Claude Code → 테스트 코드 생성
   └─ /test → 실행

6. 검토
   ├─ /review → 코드 리뷰
   └─ /qcheck → 품질 검사

7. 배포
   └─ /deploy-check → 배포 전 체크리스트
```

### 버그 수정 플로우

```
1. 버그 발견
   └─ Cursor Debug Mode → 원인 분석

2. 수정
   └─ Claude Code (Sonnet) → 빠른 수정

3. 검증
   └─ /test → 관련 테스트 실행

4. 커밋
   └─ Hooks → 자동 typecheck/lint
```

---

## 우선순위 체크리스트

> **현재 상태**: Phase F-6 보안 진행 중, 2026/01/17 배포 예정
> **원칙**: 배포 준비 > 도구 통합

### 1순위: 배포 준비 (즉시)

```yaml
[ ] F-6 보안 체크리스트 완료
    - npm audit 실행 및 취약점 수정
    - HTTPS 강제 확인
    - CORS 설정 검토

[ ] 프로덕션 환경변수 점검
    - Clerk 프로덕션 키 교체 (2026/01 배포 전)
    - Sentry DSN 설정
    - Supabase 프로덕션 URL 확인

[ ] Gemini 3 Flash 전환 (권장)
    - 무료 티어 제공 (AI Studio)
    - 2.5 Flash 무료 티어 축소됨 (일 20회)
    - lib/gemini.ts 모델 ID 변경: gemini-3-flash-preview
```

### 2순위: 개발 효율화 (배포 후 1주)

```yaml
[ ] Cursor Visual Editor 활용
    - 다크모드 색상 미세 조정
    - 브랜딩 중립화 UI 작업

[ ] .claude/rules/ 생성
    - coding-standards.md 작성
    - 프로젝트 컨벤션 문서화

[ ] Figma MCP 테스트 (로컬 개발)
    - 리모트 MCP 연결: https://mcp.figma.com/mcp
    - 디자인 토큰 추출 테스트
```

### 3순위: 고급 통합 (안정화 후 1개월)

```yaml
[ ] Gemini 3 Flash 전환 검토
    - GA 출시 여부 확인
    - 테스트 환경에서 성능 비교
    - 비용 대비 효과 분석

[ ] Claude Code Plugins 패키징
    - 슬래시 커맨드 플러그인화
    - 팀 공유 구조

[ ] MCP 자동화
    - Figma → 코드 파이프라인
    - (주의) Supabase MCP는 개발 DB만
```

---

## 비용 최적화

### 현재 월간 비용 추정

| 항목 | 비용 | 비고 |
|------|------|------|
| **Gemini 3 Flash** | **$0** | ✅ AI Studio 무료 티어 |
| Claude Code (Max) | $100/월 | 구독 플랜 |
| Cursor Pro | $20/월 | 구독 플랜 |
| Figma | $0 | 무료 플랜 가능 |
| **합계** | **~$120** | Gemini 비용 절감! |

### Gemini 무료 티어 비교

```yaml
gemini-2.5-flash:
  무료: ⚠️ 일 20회 (2025-12-06 축소됨)
  유료: $0.30/1M 입력

gemini-3-flash-preview:
  무료: ✅ AI Studio에서 무료 사용 가능
  유료: $0.50/1M 입력
  추가: 컨텍스트 캐싱으로 90% 비용 절감

결론:
  - 무료 티어 사용 시: 3 Flash가 유리
  - 유료 사용 시: 2.5 Flash가 저렴 (단, 무료 티어 제한 심함)
  - 이룸 규모: 무료 티어로 충분 → 3 Flash 전환 권장
```

### 최적화 전략

1. **Gemini 3 Flash 전환**: 무료 티어 + 성능 향상
2. **Claude 작업별 분기**: 간단한 작업은 haiku 모델 (내부 agent)
3. **RAG 캐싱**: 자주 묻는 질문 응답 캐싱

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [DESIGN-WORKFLOW.md](DESIGN-WORKFLOW.md) | 디자인 작업 워크플로우 |
| [CLAUDE.md](../CLAUDE.md) | Claude Code 프로젝트 가이드 |
| [ROADMAP-PHASE-NEXT.md](ROADMAP-PHASE-NEXT.md) | 전체 로드맵 |

---

**Version**: 1.2 (Gemini 3 Flash 무료 티어 반영) | **Updated**: 2025-12-22
