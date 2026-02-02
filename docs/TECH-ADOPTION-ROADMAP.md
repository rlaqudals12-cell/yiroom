# 기술 채택 로드맵 (Tech Adoption Roadmap)

> **작성일**: 2026-02-01
> **목표**: 2026년 AI 개발 도구 및 인프라 채택 우선순위 정의
> **원칙**: P0 (요구사항 의심) - 각 기술의 ROI 검증 후 도입

---

## 우선순위 매트릭스

| 순위 | 기술 | 중요도 | 도입 시점 | 상태 | 관련 문서 |
|------|------|--------|----------|------|-----------|
| 🥇 | Claude Code Headless + CI | ⭐⭐⭐⭐⭐ | 즉시 | 보류 | [ADR-060](adr/ADR-060-claude-code-headless-mode.md) |
| 🥈 | OpenAI PostgreSQL 패턴 | ⭐⭐⭐⭐⭐ | 즉시 | 검토중 | 본 문서 |
| 🥉 | 에이전틱 베스트 프랙티스 | ⭐⭐⭐⭐⭐ | 즉시 | 80% 적용 | [.claude/rules/](../.claude/rules/) |
| 4 | MCP Apps | ⭐⭐⭐⭐ | 1개월 | 부분 적용 | [TOOL-INTEGRATION-PLAN](TOOL-INTEGRATION-PLAN.md) |
| 5 | Cursor 평가 | ⭐⭐⭐⭐ | 1개월 | 검토중 | 본 문서 |
| 6 | Devin 파일럿 | ⭐⭐⭐ | 3개월 | 미착수 | 본 문서 |
| 7 | OpenClaw 참고 | ⭐⭐ | 참고만 | 보류 | 본 문서 |

---

## 1. Claude Code Headless + CI (🥇 즉시)

### 현재 상태

**ADR-060에서 보류 결정** (2026-01-31)

```
근거:
1. 기존 CI/CD가 충분히 강력함 (Turbo, Vitest 3샤드, axe-core)
2. 런칭 마일스톤 집중 필요 (D-11 비공개 테스트)
3. 도구 성숙도 부족 (Task tools 미지원, OAuth 이슈)
```

### 재검토 시점

- 정식 런칭 완료 후 (2026년 3월)
- MAU 1만+ 달성 시

### 예상 활용

```yaml
PR 자동 리뷰:
  trigger: pull_request
  command: claude -p "코드 리뷰" --tools "Read,Grep"

테스트 자동 생성:
  trigger: push (new files)
  command: claude -p "테스트 작성" --tools "Read,Write"
```

### 관련 문서

- [ADR-060: Claude Code Headless Mode 도입 보류](adr/ADR-060-claude-code-headless-mode.md)

---

## 2. OpenAI PostgreSQL 패턴 (🥈 즉시)

### 개요

OpenAI가 공개한 PostgreSQL 최적화 패턴 적용 검토

### 핵심 패턴

#### 2.1 인덱스 최적화

```sql
-- 복합 인덱스: 선택도 높은 컬럼 먼저
CREATE INDEX CONCURRENTLY idx_analytics_user_type_date
  ON analytics_events (clerk_user_id, event_type, created_at DESC);

-- 부분 인덱스: 자주 쿼리되는 조건
CREATE INDEX CONCURRENTLY idx_products_active_category
  ON products (category, match_score DESC)
  WHERE is_active = true;
```

#### 2.2 JSONB 최적화

```sql
-- GIN 인덱스 (JSONB 검색용)
CREATE INDEX idx_user_preferences_affinity
  ON user_preferences_learned USING GIN (brand_affinity jsonb_path_ops);

-- 특정 키 인덱스
CREATE INDEX idx_products_external_coupang
  ON product_master ((external_ids->>'coupang'));
```

#### 2.3 쿼리 최적화

```sql
-- EXPLAIN ANALYZE로 실행 계획 확인
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM analytics_events
WHERE clerk_user_id = 'user_123'
  AND event_type = 'product.click'
ORDER BY created_at DESC
LIMIT 100;
```

### 이룸 적용 계획

| 테이블 | 현재 인덱스 | 추가 필요 | 우선순위 |
|--------|------------|----------|---------|
| `analytics_events` | user_id | event_type, created_at 복합 | P0 |
| `product_master` | id | external_ids GIN, category | P0 |
| `user_preferences_learned` | user_id | affinity GIN | P1 |

### 실행 계획

```bash
# 1. 현재 쿼리 성능 측정
npm run db:analyze

# 2. 인덱스 추가 마이그레이션
npx supabase migration new add_performance_indexes

# 3. CONCURRENTLY로 무중단 적용
# (프로덕션에서 테이블 락 방지)
```

---

## 3. 에이전틱 베스트 프랙티스 (🥉 즉시)

### 현재 적용 현황: 80%

| 영역 | 적용률 | 파일 |
|------|--------|------|
| **제1원칙 (P0-P8)** | 100% | `.claude/rules/00-first-principles.md` |
| **모듈 경계 (P8)** | 95% | `.claude/rules/encapsulation.md` |
| **에러 처리** | 90% | `.claude/rules/error-handling-patterns.md` |
| **AI 코드 리뷰** | 85% | `.claude/rules/ai-code-review.md` |
| **시지푸스 오케스트레이터** | 80% | `.claude/agents/sisyphus-adaptive.md` |
| **전문 에이전트** | 75% | `.claude/agents/*.md` |

### 미적용 항목

```yaml
멀티 에이전트 병렬 실행:
  현재: 순차 실행
  목표: 독립 작업 병렬화
  예상 효과: 30% 시간 단축

자동 롤백 메커니즘:
  현재: 수동 git revert
  목표: 에러 임계치 초과 시 자동 롤백
  관련: feature-flags.md의 rollbackThreshold
```

### 관련 문서

- [.claude/rules/README.md](../.claude/rules/README.md) - 규칙 인덱스
- [.claude/agents/README.md](../.claude/agents/README.md) - 에이전트 인덱스

---

## 4. MCP Apps (4위, 1개월)

### 현재 상태

**TOOL-INTEGRATION-PLAN.md에 부분 문서화**

| MCP 서버 | 상태 | 용도 |
|----------|------|------|
| Figma Remote MCP | 미연결 | 디자인 → 코드 |
| Figma Desktop MCP | 미연결 | 로컬 개발 |
| Supabase MCP | ⚠️ 주의 | 개발 DB 전용 |

### 추가 검토 MCP

```yaml
GitHub MCP:
  용도: PR/이슈 자동화
  우선순위: 높음 (Headless 대안)

Slack MCP:
  용도: 알림/리포트 전송
  우선순위: 중간

Vercel MCP:
  용도: 배포 상태 모니터링
  우선순위: 낮음
```

### 실행 계획

```bash
# 1. Figma MCP 연결 테스트
claude mcp add --transport http figma-remote https://mcp.figma.com/mcp

# 2. 디자인 토큰 추출 테스트
claude -p "Button 컴포넌트 스타일 추출" --tools "figma"
```

### 관련 문서

- [TOOL-INTEGRATION-PLAN.md](TOOL-INTEGRATION-PLAN.md) - MCP 설정 상세

---

## 5. Cursor 평가 (5위, 1개월)

### 평가 목적

팀 생산성 향상 도구로서의 가치 검증

### 평가 항목

| 기능 | Cursor v2.2 | VS Code + Claude Code | 승자 |
|------|-------------|----------------------|------|
| **Visual Editor** | ✅ 네이티브 | ❌ 미지원 | Cursor |
| **AI 코드 생성** | ✅ 내장 | ✅ Claude Code CLI | 동등 |
| **Debug Mode** | ✅ 자동 분석 | ⚠️ 수동 | Cursor |
| **Background Agents** | ✅ 네이티브 | ✅ Task tool | 동등 |
| **터미널 통합** | ⚠️ 제한적 | ✅ 네이티브 | Claude Code |
| **커스텀 에이전트** | ❌ 미지원 | ✅ .claude/agents/ | Claude Code |

### 평가 기준

```yaml
정량 지표:
  - 컴포넌트 생성 시간 비교
  - 버그 수정 시간 비교
  - 일일 커밋 수

정성 지표:
  - 개발자 만족도
  - 학습 곡선
  - 워크플로우 적합성
```

### 결론 예상

**하이브리드 사용 권장**
- Cursor: UI 작업, 시각적 디버깅
- Claude Code: CLI 작업, 복잡한 리팩토링, 에이전트 파이프라인

---

## 6. Devin 파일럿 (6위, 3개월)

### 개요

Cognition AI의 자율 AI 개발자 에이전트

### 적용 검토 영역

```yaml
적합한 작업:
  - 반복적 테스트 작성
  - 보일러플레이트 코드 생성
  - 문서화 작업
  - 의존성 업데이트

부적합한 작업:
  - 아키텍처 결정
  - 보안 관련 코드
  - 핵심 비즈니스 로직
```

### 파일럿 계획

| 단계 | 기간 | 범위 | 성공 기준 |
|------|------|------|----------|
| 1단계 | 2주 | 테스트 파일 생성 | 80% 품질 합격 |
| 2단계 | 2주 | 문서 동기화 | 수동 대비 50% 시간 절감 |
| 3단계 | 2주 | 의존성 PR | 자동 머지 가능 |

### 비용 고려

```
예상 비용: $500/월 (팀 플랜)
ROI 검증 필요: 개발자 시간 절감 > 비용
```

### 보류 사유

- 런칭 마일스톤 우선
- 충분한 평가 시간 필요
- 보안 검토 필요 (코드베이스 접근)

---

## 7. OpenClaw 참고 (7위, 참고만)

### 개요

오픈소스 Claude Code 대안

### 참고만 하는 이유

```yaml
장점:
  - 오픈소스 (커스터마이징 가능)
  - 자체 호스팅 가능
  - 비용 절감 가능성

단점:
  - 보안 리스크 (코드 유출 가능성)
  - 유지보수 부담
  - Claude Code 대비 기능 부족
  - 커뮤니티 지원 불확실
```

### 결론

```
현재 Claude Code Max ($100/월) 사용 중
→ 안정성과 보안이 더 중요
→ OpenClaw는 참고만 (벤치마크용)
```

---

## 통합 로드맵 타임라인

```
2026년 2월 (런칭 집중)
├── Week 1-2: OpenAI PostgreSQL 패턴 적용
├── Week 2: 에이전틱 베스트 프랙티스 보완
└── Week 3-4: 비공개 테스트/정식 출시

2026년 3월 (안정화)
├── Week 1-2: MCP Apps 연결 (Figma, GitHub)
├── Week 2-3: Cursor 평가 시작
└── Week 3-4: Claude Code Headless 재검토

2026년 4-5월 (확장)
├── Devin 파일럿 시작
├── MCP 추가 연동 (Slack)
└── 자동화 파이프라인 강화
```

---

## 의사결정 체크리스트

새 기술 도입 전 확인:

```markdown
## 기술 도입 체크리스트

### P0: 요구사항 의심
- [ ] 이 기술이 정말 필요한가?
- [ ] 기존 도구로 해결 불가능한가?
- [ ] ROI가 명확한가?

### 보안
- [ ] 코드베이스 접근 범위는?
- [ ] 데이터 유출 위험은?
- [ ] 인증/권한 관리는?

### 비용
- [ ] 월간/연간 비용은?
- [ ] 숨겨진 비용 (학습, 마이그레이션)은?
- [ ] 대안 대비 비용 효율은?

### 통합
- [ ] 기존 워크플로우와 충돌은?
- [ ] 팀 학습 곡선은?
- [ ] 롤백 계획은?
```

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [ADR-060](adr/ADR-060-claude-code-headless-mode.md) | Claude Code Headless 보류 결정 |
| [TOOL-INTEGRATION-PLAN.md](TOOL-INTEGRATION-PLAN.md) | MCP/Cursor 통합 계획 |
| [.claude/rules/](../.claude/rules/) | 에이전틱 베스트 프랙티스 |
| [ADR-061](adr/ADR-061-data-platform-architecture.md) | 데이터 플랫폼 (기술 활용처) |

---

**Version**: 1.0 | **Created**: 2026-02-01
**다음 검토일**: 2026-03-01 (런칭 후)
