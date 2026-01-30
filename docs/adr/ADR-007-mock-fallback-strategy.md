# ADR-007: Mock Fallback 전략

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"AI 서비스 장애가 사용자에게 완전히 투명한 상태"

- **무중단 서비스**: AI 장애 시에도 사용자 경험 100% 유지
- **품질 동등성**: Mock 결과가 AI 결과와 90% 이상 일치
- **자동 복구**: Circuit Breaker가 자동으로 AI 서비스 복구 감지
- **비용 최적화**: 개발/테스트 시 AI 호출 0건

### 물리적 한계

| 항목 | 한계 |
|------|------|
| Mock 품질 | AI의 개인화 수준 완벽 재현 불가 |
| 실시간 학습 | Mock은 정적, AI는 동적 |
| 에지 케이스 | 비정형 입력에 대한 Mock 대응 한계 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 장애 시 가용성 | 100% | 100% | ✅ 달성 |
| Mock 품질 (AI 대비) | 90% | 70% | 개선 필요 |
| 자동 복구 | Circuit Breaker | try-catch | 향후 개선 |
| 개발 비용 절감 | 100% | 90% | FORCE_MOCK_AI |

### 현재 목표: 85%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Circuit Breaker | 현재 try-catch 충분 | 장애 빈도 증가 시 |
| Mock 자동 생성 | AI 결과 기반 자동 생성 | Phase 2 |
| A/B Mock 테스트 | 복잡도 대비 ROI 낮음 | 필요 시 |

---

## 맥락 (Context)

이룸은 Gemini AI에 의존하는 분석 기능이 핵심입니다. AI API 장애 시 사용자 경험이 완전히 중단되는 것은 허용할 수 없습니다:

1. **API 장애**: Gemini 서버 다운타임
2. **네트워크 문제**: 사용자 환경의 연결 불안정
3. **Rate Limiting**: API 호출 제한 초과
4. **개발/테스트**: AI 호출 없이 빠른 반복

## 결정 (Decision)

**모든 AI 호출에 Mock Fallback 필수** 패턴을 채택합니다.

```typescript
// 표준 패턴
try {
  const result = await analyzeWithGemini(input);
  return result;
} catch (error) {
  console.error('[Module] Gemini error, falling back to mock:', error);
  return generateMockResult(input);
}
```

### Mock 우선순위

```
1. AI 분석 성공 → AI 결과 반환
2. AI 분석 실패 → Mock 결과 반환 (사용자에게 신뢰도 표시)
3. Mock도 실패 → 에러 페이지 (극히 드문 경우)
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 에러 페이지 표시 | 구현 간단 | 사용자 경험 저하 | `NOT_NEEDED` - 대안 제공 가능 |
| 재시도만 수행 | 일시적 장애 해결 | 장기 장애 시 무한 대기 | `ALT_SUFFICIENT` - 재시도 + Fallback 조합 |
| 캐시된 결과 사용 | 개인화된 결과 | 첫 분석 시 불가 | `PREREQ_MISSING` - 첫 사용자 대응 불가 |

## 결과 (Consequences)

### 긍정적 결과

- **무중단 서비스**: AI 장애 시에도 기본 기능 제공
- **개발 효율**: Mock 모드로 빠른 UI 개발
- **테스트 안정성**: API 호출 없이 테스트 가능
- **비용 절감**: 개발 중 AI 호출 최소화

### 부정적 결과

- **Mock 유지보수**: Mock 데이터 지속 업데이트 필요
- **결과 차이**: AI vs Mock 결과 차이 존재

### 리스크

- Mock 품질 저하 → **Hybrid 패턴으로 최신 Mock 유지 (ADR-002)**

## 구현 가이드

### Mock 파일 구조

```
lib/mock/
├── personal-color.ts     # PC-1 Mock
├── skin-analysis.ts      # S-1 Mock
├── body-analysis.ts      # C-1 Mock
├── food-analysis.ts      # N-1 Mock
├── workout-analysis.ts   # W-1 Mock
└── image-quality.ts      # CIE-1 Mock
```

### Mock 함수 표준

```typescript
// lib/mock/skin-analysis.ts
export function generateMockSkinAnalysis(input: SkinAnalysisInput): SkinAnalysisResult {
  // 입력 기반으로 합리적인 Mock 생성
  const baseScore = 70 + Math.floor(Math.random() * 20);

  return {
    overallScore: baseScore,
    hydration: baseScore - 5 + Math.floor(Math.random() * 10),
    oiliness: baseScore - 10 + Math.floor(Math.random() * 20),
    // ...
    isMock: true,  // Mock 여부 표시 필수
    confidence: 0.5,  // 낮은 신뢰도 표시
  };
}
```

### 환경변수

```bash
# .env.local
FORCE_MOCK_AI=true  # 개발/테스트 시 Mock 강제
```

### UI 신뢰도 표시

```tsx
{result.isMock && (
  <Badge variant="outline" className="text-amber-600">
    AI 연결 불안정 - 임시 결과
  </Badge>
)}
```

### 타임아웃 설정

```typescript
const TIMEOUT_MS = 3000;    // 3초 타임아웃
const MAX_RETRIES = 2;      // 2회 재시도 후 Mock

async function analyzeWithFallback<T>(
  analyze: () => Promise<T>,
  generateMock: () => T
): Promise<T> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await withTimeout(analyze(), TIMEOUT_MS);
    } catch (error) {
      console.warn(`[AI] Attempt ${i + 1} failed:`, error);
    }
  }
  console.error('[AI] All attempts failed, using mock');
  return generateMock();
}
```

## 리서치 티켓

```
[ADR-007-R1] Mock Fallback 패턴 최적화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. State Machine 기반 Fallback vs try-catch 기반 Fallback 패턴 비교
2. Circuit Breaker 패턴의 half-open 상태 최적 타이밍 연구
3. Mock 데이터 품질 검증 자동화 방법론 (AI 결과와의 분포 비교)

→ 결과를 Claude Code에서 lib/mock/ 패턴 개선에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - 5단계 Fallback, 서킷 브레이커

### 관련 ADR
- [ADR-002: Hybrid 데이터 패턴](./ADR-002-hybrid-data-pattern.md)
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md)

### 규칙 파일 (이 ADR 참조)
- [AI Integration Rules](../../.claude/rules/ai-integration.md) - Gemini 통합, Fallback 요약
- [Hybrid Data Pattern](../../.claude/rules/hybrid-data-pattern.md) - DB + Mock 조합
- [Error Handling Patterns](../../.claude/rules/error-handling-patterns.md) - 3단계 폴백

---

**Author**: Claude Code | **Version**: 1.1 | **Updated**: 2026-01-28
