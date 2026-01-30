# ADR-011: Cross-Module 데이터 흐름

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 분석 모듈이 하나의 통합된 자기 이해를 형성하는 상태"

- **완전 통합**: 모든 분석 결과가 실시간으로 연동되어 holistic insights 제공
- **지능형 전파**: 한 모듈 갱신 시 영향받는 모든 모듈이 자동 재계산
- **제로 중복**: 동일 이미지/데이터의 완벽한 재사용
- **예측 의존성**: AI가 사용자 행동 예측하여 선제적 데이터 로딩

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 이미지 재사용 | 조명/각도 차이로 100% 재사용 불가 (얼굴 vs 전신) |
| 실시간 전파 | 연쇄 재계산 시 성능 저하 (100ms → 1s+) |
| 의존성 복잡도 | 모듈 증가 시 O(n²) 복잡도 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 이미지 재사용률 | 80% | 60% | PC-1 → S-1 |
| 캐시 적중률 | 95% | 70% | TTL 최적화 필요 |
| 전파 지연 | < 100ms | 500ms | 비동기 처리 |
| 순환 의존성 | 0개 | 0개 | ✅ 달성 |

### 현재 목표: 75%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 재계산 | 성능 vs 정확도 trade-off | Phase 3 |
| 예측 프리로딩 | 복잡도 대비 ROI 낮음 | MAU 10만+ |
| 전신↔얼굴 통합 | 물리적으로 다른 이미지 필요 | 3D 모델링 시 |

---

## 맥락 (Context)

이룸의 분석 모듈(PC-1, S-1, C-1)과 기능 모듈(Coach, Products)이 복잡하게 연결되어 있으나 **데이터 흐름이 문서화되지 않음**:

1. **의존성 불명확**: PC-1 완료가 S-1, C-1의 필수 조건인지?
2. **이미지 재사용**: 언제 기존 이미지를 사용하고 언제 새로 촬영?
3. **RAG 통합**: Coach가 어떤 데이터를 어떤 순서로 조회?
4. **갱신 전파**: PC-1 재분석 시 S-1, C-1에 영향?

## 결정 (Decision)

**Directed Acyclic Graph (DAG)** 형태의 데이터 흐름 정의:

```
┌─────────────────────────────────────────────────────────────┐
│                   Cross-Module Data Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │    PC-1      │ ← 필수 (온보딩 게이트)                    │
│  │ 퍼스널컬러   │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ├──→ S-1 (피부분석)   [선택적, 이미지 재사용 가능]   │
│         │     └── 피부 타입, 고민 분석                      │
│         │                                                    │
│         ├──→ C-1 (체형분석)   [선택적, 별도 이미지]         │
│         │     └── 체형, 자세 분석                           │
│         │                                                    │
│         └──→ F-1 (패션)       [PC-1 색상 palette 사용]       │
│               └── 색상 조합, 스타일 추천                    │
│                                                              │
│              ↓                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Coach (RAG)                        │   │
│  │  └── 모든 분석 결과 + 제품 DB 기반 추천               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 의존성 규칙

| 모듈 | 선행 조건 | 선택 조건 | 이미지 정책 |
|------|----------|----------|------------|
| PC-1 | 없음 | - | 새 촬영 필수 |
| S-1 | PC-1 완료 | - | PC-1 이미지 재사용 가능 |
| C-1 | PC-1 완료 | - | 전신 별도 촬영 |
| F-1 | PC-1 완료 | S-1, C-1 권장 | 없음 (데이터 기반) |
| Coach | PC-1 완료 | S-1, C-1, F-1 | 없음 |

### 데이터 전파 규칙

| 이벤트 | 영향 범위 | 처리 방식 |
|--------|----------|----------|
| PC-1 재분석 | S-1, C-1, F-1 | 캐시 무효화 (재분석 불요) |
| S-1 재분석 | Coach | RAG 캐시 갱신 |
| 제품 DB 갱신 | Coach | 실시간 반영 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 독립 모듈 | 결합도 최소 | 중복 분석 | `LOW_ROI` |
| 완전 연결 | 풍부한 데이터 | 복잡도 폭발 | `HIGH_COMPLEXITY` |

## 결과 (Consequences)

### 긍정적 결과

- **의존성 명확**: 개발 순서 결정 용이
- **캐시 효율**: 이미지 재사용으로 UX 개선
- **디버깅 용이**: 데이터 흐름 추적 가능

### 부정적 결과

- **강결합 위험**: PC-1 장애 시 전체 영향
- **복잡한 무효화**: 캐시 관리 어려움

## 구현 가이드

### 이미지 재사용 로직

```typescript
// lib/analysis/photo-reuse.ts
export async function getReusablePhoto(
  userId: string,
  targetModule: 'S-1' | 'C-1'
): Promise<Photo | null> {
  // PC-1 이미지 조회
  const pcPhoto = await getLatestPCPhoto(userId);

  if (!pcPhoto) return null;

  // 재사용 가능 여부 판단
  const ageInHours = getPhotoAge(pcPhoto);
  const isReusable = ageInHours < 24 && targetModule === 'S-1';

  return isReusable ? pcPhoto : null;
}
```

### 의존성 체크 미들웨어

```typescript
// lib/analysis/dependency-check.ts
export async function requirePC1(userId: string): Promise<void> {
  const pc1 = await getLatestPC1Analysis(userId);

  if (!pc1) {
    throw new DependencyError({
      code: 'PC1_REQUIRED',
      message: '퍼스널컬러 분석을 먼저 완료해주세요.',
      redirect: '/analysis/personal-color'
    });
  }
}

// API 라우트에서 사용
export async function POST(req: Request) {
  const user = await auth.protect();
  await requirePC1(user.id);  // PC-1 필수 체크
  // ... S-1 분석 진행
}
```

### 캐시 무효화 이벤트

```typescript
// lib/analysis/cache-invalidation.ts
export async function onPC1Updated(userId: string): Promise<void> {
  // 연관 캐시 무효화
  await invalidateCache(`s1-analysis:${userId}`);
  await invalidateCache(`coach-context:${userId}`);
  await invalidateCache(`product-matching:${userId}`);

  // 로그
  console.log(`[Cross-Module] PC-1 updated, caches invalidated for ${userId}`);
}
```

### RAG 조회 순서

```typescript
// lib/coach/rag-pipeline/index.ts
export async function buildCoachContext(userId: string): Promise<CoachContext> {
  // 1. 필수 데이터
  const pc1 = await getPC1(userId);

  // 2. 선택 데이터 (병렬 조회)
  const [s1, c1, f1] = await Promise.all([
    getS1(userId).catch(() => null),
    getC1(userId).catch(() => null),
    getF1(userId).catch(() => null)
  ]);

  // 3. 컨텍스트 합성
  return {
    personalColor: pc1,
    skinAnalysis: s1,
    bodyAnalysis: c1,
    fashionPrefs: f1,
    hasFullProfile: !!(pc1 && s1 && c1)
  };
}
```

## 리서치 티켓

```
[ADR-011-R1] 크로스 모듈 데이터 흐름 최적화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Event-Driven Architecture에서 모듈 간 데이터 전파 패턴 비교
2. DAG 기반 의존성 해결과 동적 의존성 주입 패턴 trade-off
3. 이미지 재사용 시 캐시 일관성 보장 전략 (분산 시스템 관점)

→ 결과를 Claude Code에서 lib/analysis/ 의존성 관리에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 크로스도메인 시너지](../principles/cross-domain-synergy.md) - 모듈 간 시너지, 데이터 의존성

### 관련 ADR
- [ADR-002: Hybrid 데이터 패턴](./ADR-002-hybrid-data-pattern.md)
- [ADR-006: Phase 실행 순서](./ADR-006-phase-execution-order.md)

### 구현 스펙
- [SDD-S1-C1-UX-IMPROVEMENT](../specs/SDD-S1-C1-UX-IMPROVEMENT.md) - S-1/C-1 통합 UX
- [cross-module-insights-hair-makeup](../specs/cross-module-insights-hair-makeup.md) - 크로스 모듈 인사이트

---

**Author**: Claude Code
**Reviewed by**: -
