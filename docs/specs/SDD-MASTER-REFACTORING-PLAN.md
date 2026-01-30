# SDD: 이룸 리팩토링 가이드 (간소화)

> Quick Start Guide + 상세 문서 링크
> **Version**: 2.0 | **Created**: 2026-01-13 | **Updated**: 2026-01-28
> **Status**: Active (간소화됨 - 기존 3,400줄 → 200줄)

---

## 1. Quick Start Guide

### 1.1 상황별 시작점

| 상황 | 참조 문서 | 위치 |
|------|----------|------|
| 🚨 **500 에러 발생** | DB-API 동기화 규칙 | [db-migration-rules.md](../../.claude/rules/db-migration-rules.md) |
| 🔐 **인증 문제** | Clerk proxy.ts 설정 | [server-debugging.md](../../.claude/rules/server-debugging.md) |
| 🎨 **UI 색상 통일** | 디자인 시스템 | [design-system.md](../principles/design-system.md) |
| 🌍 **다국어 추가** | i18n 아키텍처 | [ADR-018](../adr/ADR-018-i18n-architecture.md) |
| 🔗 **모듈간 연동** | 크로스 모듈 프로토콜 | [SDD-CROSS-MODULE-PROTOCOL.md](./SDD-CROSS-MODULE-PROTOCOL.md) |
| ✅ **테스트 추가** | 테스트 패턴 | [testing-patterns.md](../../.claude/rules/testing-patterns.md) |
| 🔒 **보안 점검** | OWASP 체크리스트 | [security-checklist.md](../../.claude/rules/security-checklist.md) |
| ⚡ **성능 개선** | 성능 가이드라인 | [performance-guidelines.md](../../.claude/rules/performance-guidelines.md) |
| ♿ **접근성** | 접근성 가이드 | [SDD-ACCESSIBILITY.md](./SDD-ACCESSIBILITY.md) |
| 🤖 **AI 분석 오류** | AI 통합 규칙 | [ai-integration.md](../../.claude/rules/ai-integration.md) |

### 1.2 빠른 실행 체크리스트

**Phase 1: 기반 안정화**
```
☐ proxy.ts 공개 라우트 확인 → server-debugging.md
☐ 환경변수 검증 → scripts/check-env.js
☐ OWASP 보안 점검 → security-checklist.md
☐ typecheck + lint 통과 확인
```

**Phase 2: UI/UX + 기능**
```
☐ 디자인 토큰 적용 → design-system.md
☐ 다국어 키 추가 → ADR-018
☐ 모듈 연동 → SDD-CROSS-MODULE-PROTOCOL.md
```

**Phase 3: 품질 보증**
```
☐ 테스트 작성 → testing-patterns.md
☐ 접근성 검증 → SDD-ACCESSIBILITY.md
☐ 성능 측정 → performance-guidelines.md (Lighthouse 90+)
```

---

## 2. 주제별 상세 문서 링크

### 2.1 오류 예방 & 안정화

| 주제 | 문서 | 설명 |
|------|------|------|
| DB-API 동기화 | [db-migration-rules.md](../../.claude/rules/db-migration-rules.md) | 마이그레이션 워크플로우 |
| Clerk 인증 | [server-debugging.md](../../.claude/rules/server-debugging.md) | proxy.ts, 공개 라우트 |
| 에러 처리 | [error-handling-patterns.md](../../.claude/rules/error-handling-patterns.md) | 3단계 폴백 전략 |
| Mock Fallback | [hybrid-data-pattern.md](../../.claude/rules/hybrid-data-pattern.md) | AI 타임아웃 처리 |

### 2.2 UI/UX & 디자인

| 주제 | 문서 | 설명 |
|------|------|------|
| 디자인 시스템 | [design-system.md](../principles/design-system.md) | 색상 토큰, 타이포그래피 |
| React 패턴 | [react-patterns.md](../../.claude/rules/react-patterns.md) | 컴포넌트 구조 |
| 모바일 패턴 | [mobile-patterns.md](../../.claude/rules/mobile-patterns.md) | Expo, React Native |
| 2026 UX 트렌드 | [SDD-2026-UX-TRENDS.md](./SDD-2026-UX-TRENDS.md) | 최신 UX 반영 |

### 2.3 분석 모듈

| 주제 | 문서 | 설명 |
|------|------|------|
| 이미지 엔진 | [SDD-CIE-1~4](./SDD-CIE-1-IMAGE-QUALITY.md) | 품질, 얼굴감지, AWB, 조명 |
| 퍼스널컬러 v2 | [SDD-PERSONAL-COLOR-v2.md](./SDD-PERSONAL-COLOR-v2.md) | PC-1 고도화 |
| 피부분석 v2 | [SDD-SKIN-ANALYSIS-v2.md](./SDD-SKIN-ANALYSIS-v2.md) | S-1 고도화 |
| 체형분석 v2 | [SDD-BODY-ANALYSIS-v2.md](./SDD-BODY-ANALYSIS-v2.md) | C-1 고도화 |
| AI 통합 | [ai-integration.md](../../.claude/rules/ai-integration.md) | Gemini 프롬프트 |

### 2.4 웰니스 모듈

| 주제 | 문서 | 설명 |
|------|------|------|
| 영양 분석 | [SDD-N1-NUTRITION.md](./SDD-N1-NUTRITION.md) | N-1 모듈 |
| 운동 모듈 | [SDD-W1-WORKOUT.md](./SDD-W1-WORKOUT.md) | W-1 모듈 |
| 스트레칭 | [SDD-W-2-ADVANCED-STRETCHING.md](./SDD-W-2-ADVANCED-STRETCHING.md) | W-2 고급 |
| AI 코치 | [SDD-COACH-AI-COMPREHENSIVE.md](./SDD-COACH-AI-COMPREHENSIVE.md) | RAG 기반 상담 |

### 2.5 인프라 & 운영

| 주제 | 문서 | 설명 |
|------|------|------|
| CI/CD | [SDD-CI-CD-PIPELINE.md](./SDD-CI-CD-PIPELINE.md) | GitHub Actions |
| 모니터링 | [SDD-MONITORING.md](./SDD-MONITORING.md) | Sentry, 알림 |
| Rate Limiting | [SDD-RATE-LIMITING.md](./SDD-RATE-LIMITING.md) | Upstash Redis |
| GDPR 삭제 | [SDD-GDPR-DELETION-CRON.md](./SDD-GDPR-DELETION-CRON.md) | 자동 삭제 Cron |

### 2.6 법률 & 규제

| 주제 | 문서 | 설명 |
|------|------|------|
| 연령 인증 | [SDD-N-1-AGE-VERIFICATION.md](./SDD-N-1-AGE-VERIFICATION.md) | 성인 콘텐츠 제한 |
| AI 투명성 | [SDD-AI-TRANSPARENCY.md](./SDD-AI-TRANSPARENCY.md) | AI 라벨링 |
| 감사 로깅 | [SDD-AUDIT-LOGGING.md](./SDD-AUDIT-LOGGING.md) | 행위 추적 |
| 법률 지원 | [SDD-LEGAL-SUPPORT.md](./SDD-LEGAL-SUPPORT.md) | 약관, 동의 |

---

## 3. 아키텍처 결정 기록 (ADR)

주요 기술 결정은 ADR에 기록됨: [docs/adr/README.md](../adr/README.md)

| ADR | 주제 |
|-----|------|
| [ADR-001](../adr/ADR-001-core-image-engine.md) | Core Image Engine |
| [ADR-002](../adr/ADR-002-hybrid-data-pattern.md) | Hybrid Data Pattern |
| [ADR-004](../adr/ADR-004-auth-strategy.md) | Clerk 인증 전략 |
| [ADR-007](../adr/ADR-007-mock-fallback-strategy.md) | Mock Fallback |
| [ADR-010](../adr/ADR-010-ai-pipeline.md) | AI 파이프라인 |
| [ADR-011](../adr/ADR-011-cross-module-data-flow.md) | 크로스 모듈 데이터 |

---

## 4. 품질 체크리스트

상세 품질 검증: [SDD-ULTIMATE-CHECKLIST.md](./SDD-ULTIMATE-CHECKLIST.md)

**핵심 P0 항목 (즉시 확인)**:
- [ ] AI 분석 재현성 95%+
- [ ] Mock 사용 시 사용자 알림
- [ ] 의료 면책 조항 표시
- [ ] 민감정보 별도 동의
- [ ] Health Endpoint 동작
- [ ] 단위 테스트 90%+

---

## 5. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.0 | 2026-01-28 | 간소화 (3,400줄 → 200줄), 링크 기반 구조로 전환 |
| 1.9 | 2026-01-14 | Part 15-20 추가 |
| 1.0 | 2026-01-13 | 초기 버전 |

---

## 6. 아카이브 안내

> 기존 상세 버전(v1.9, 3,400줄)이 필요한 경우 Git 히스토리에서 확인:
> ```bash
> git show HEAD~1:docs/specs/SDD-MASTER-REFACTORING-PLAN.md
> ```

---

**Version**: 2.0 | **간소화 완료**
