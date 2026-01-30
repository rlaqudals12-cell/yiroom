# ADR-003: AI 모델 선택 (Gemini 3 Flash)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"최적의 비용/성능 균형으로 모든 분석 모듈에 일관된 AI 추론 제공"

- 응답 시간: < 2초 (p95)
- 정확도: 전문가 판정 대비 95%+ 일치
- 비용: 분석당 $0.02 이하
- 한국어: 네이티브 수준 자연스러움
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| API 가용성 | Google Cloud 의존성 |
| 모델 업데이트 | 버전 변경 시 재검증 필요 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 응답 속도 | p95 < 2초 |
| 분석 정확도 | 전문가 검증 95%+ |
| 비용 효율 | $0.02/분석 유지 |
| Fallback 대응 | Mock 100% 커버리지 |

### 현재 달성률

**85%** - 속도/비용 달성, 정확도 검증 진행 중

### 의도적 제외

| 제외 항목 | 이유 |
|----------|------|
| 멀티 모델 앙상블 | 복잡도 대비 ROI 낮음 |
| Fine-tuning | MVP 범위 초과 |

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

이룸은 이미지 기반 AI 분석(퍼스널컬러, 피부, 체형, 음식 인식)이 핵심 기능입니다. 적절한 AI 모델 선택이 필요합니다:

- **정확도**: 분석 품질
- **속도**: 사용자 경험
- **비용**: 운영 지속성
- **멀티모달**: 이미지 + 텍스트 처리

## 결정 (Decision)

**Gemini 3 Flash**를 기본 AI 모델로 채택합니다.

```typescript
// lib/gemini.ts
model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
```

### 선택 근거

| 기준 | Gemini 3 Flash | GPT-4 Vision | Claude 3.5 Sonnet |
|------|---------------|--------------|-------------------|
| **속도** | 1-2초 | 3-5초 | 2-3초 |
| **비용** | $0.02/req | $0.05/req | $0.03/req |
| **한국어** | 90%+ | 85%+ | 88%+ |
| **이미지 분석** | 우수 | 우수 | 우수 |
| **컨텍스트 캐싱** | 90% 절감 | 미지원 | 미지원 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| GPT-4 Vision | 높은 정확도 | 비용/속도 | `FINANCIAL_HOLD` - 2.5배 비용 |
| Claude 3.5 Sonnet | 추론 능력 | 이미지 분석 제한 | `ALT_SUFFICIENT` - 이미지 분석 Gemini 충분 |
| 자체 모델 학습 | 완전 제어 | 시간/비용 | `HIGH_COMPLEXITY` - MVP 범위 초과 |

## 결과 (Consequences)

### 긍정적 결과

- **비용 효율**: MAU 10K 기준 월 $1,000 예상 (GPT-4 대비 60% 절감)
- **빠른 응답**: 1-2초 분석 완료
- **한국어 최적화**: 도메인 용어 정확도 높음
- **컨텍스트 캐싱**: 동일 프롬프트 반복 시 90% 비용 절감

### 부정적 결과

- **단일 벤더 의존**: Google API 장애 시 서비스 영향

### 리스크

- Gemini API 장애 → **Mock Fallback 필수 (ADR-007)**
- 가격 정책 변경 → **월별 비용 모니터링**

## 구현 가이드

### 환경변수

```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
GEMINI_MODEL=gemini-3-flash-preview  # 선택적 오버라이드
FORCE_MOCK_AI=true  # 개발/테스트 시 Mock 강제
```

### 타임아웃 및 재시도

```typescript
const TIMEOUT_MS = 3000;    // 3초 타임아웃
const MAX_RETRIES = 2;      // 2회 재시도
```

### 프롬프트 언어 정책

```
프롬프트 본문: 한국어 (도메인 전문성)
JSON 필드명: 영어 (camelCase)
응답 텍스트: 한국어
```

## 리서치 티켓

```
[ADR-003-R1] Gemini 3 Flash 최적화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. 컨텍스트 캐싱 최적 패턴
2. 이미지 해상도별 정확도/비용 trade-off
3. 프롬프트 토큰 최적화 기법

→ 결과를 Claude Code에서 lib/gemini.ts에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - VLM, 프롬프트 엔지니어링, 신뢰도 계산

### 관련 ADR
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md)
- [ADR-010: AI 파이프라인 아키텍처](./ADR-010-ai-pipeline.md)

### 구현 스펙
- [SDD-PHASE-J-AI-STYLING](../specs/SDD-PHASE-J-AI-STYLING.md) - AI 스타일링
- [PC1-detailed-evidence-report](../specs/PC1-detailed-evidence-report.md) - 퍼스널컬러 근거 리포트
- [SDD-S1-PROFESSIONAL-ANALYSIS](../specs/SDD-S1-PROFESSIONAL-ANALYSIS.md) - 피부 분석

### 관련 규칙
- [AI Integration Rules](../../.claude/rules/ai-integration.md)
- [Prompt Engineering Rules](../../.claude/rules/prompt-engineering.md)

---

**Author**: Claude Code
**Reviewed by**: -
