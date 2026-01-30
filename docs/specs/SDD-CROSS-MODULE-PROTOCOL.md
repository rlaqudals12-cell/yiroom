# SDD-CROSS-MODULE-PROTOCOL: 크로스 모듈 연동 프로토콜

> **Version**: 1.1 | **Created**: 2026-01-24 | **Status**: Active
> **Author**: Claude Code
> **관련 파일**: `apps/web/lib/shared/integration-types.ts`

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 모듈이 완벽하게 연동되는 통합 데이터 흐름"

- **자동 연동**: 분석 완료 시 연관 모듈 자동 데이터 전파
- **100% 커버리지**: 모든 분석 모듈 간 데이터 연동 정의
- **실시간 동기화**: 변경 사항 즉시 반영
- **버전 호환성**: 모듈 버전 업그레이드 시 하위 호환 보장
- **타입 안전성**: TypeScript 인터페이스로 컴파일 타임 검증

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 순환 의존성 | 모듈 간 양방향 연동 시 복잡도 증가 |
| 버전 관리 | 인터페이스 변경 시 마이그레이션 필요 |
| 성능 | 체인 연동 시 지연 누적 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| 연동 커버리지 | 100% | 핵심 연동 | 70% |
| 타입 정의 | 모든 연동 | 주요 연동 | 80% |
| 자동 갱신 | Push 방식 | Pull 혼합 | 60% |
| 테스트 커버리지 | 100% | 부분 | 50% |

### 현재 목표

**종합 달성률**: **70%** (핵심 모듈 연동)

### 의도적 제외 (이번 버전)

- 모든 모듈 양방향 연동 (핵심 연동 우선)
- 실시간 Push 전체 적용 (Pull 혼합)
- 자동 마이그레이션 도구

---

## P3: 원자 분해

### 구현 원자 (ATOM)

| ID | 원자 | 소요시간 | 입력 | 출력 | 의존성 | 성공 기준 |
|----|------|---------|------|------|--------|----------|
| CMP-A1 | 연동 타입 정의 | 1h | 연동 매트릭스 | `integration-types.ts` | - | 모든 연동 인터페이스 정의, TypeScript 컴파일 통과 |
| CMP-A2 | 이벤트 발행 시스템 | 2h | 타입 정의 | `integration-events.ts` | CMP-A1 | 이벤트 발행/구독, 캐시 무효화 동작 |
| CMP-A3 | 연동 클라이언트 | 2h | 타입 정의 | `integration-client.ts` | CMP-A1 | Pull 방식 조회, 캐시/DB/기본값 3단계 |
| CMP-A4 | 파이프라인 실행기 | 2h | CIE 모듈 | `analysis-pipeline.ts` | CMP-A1, CIE-* | CIE-1→4 순차 실행, 컨텍스트 전달 |
| CMP-A5 | 스키마 마이그레이션 | 1.5h | 버전 규칙 | `schema-migration.ts` | CMP-A1 | 버전 간 업그레이드/다운그레이드 |
| CMP-A6 | 에러 처리 모듈 | 1h | 에러 시나리오 | `integration-error.ts` | CMP-A1 | 5가지 에러 시나리오 처리 |
| CMP-A7 | 기본값 정의 | 1h | 연동 매트릭스 | `integration-defaults.ts` | CMP-A1 | 모든 연동 Fallback 데이터 |
| CMP-A8 | 통합 테스트 | 2h | 구현 모듈 | `cross-module.test.ts` | CMP-A2~A7 | 6개 TC 모두 Pass |

**총 소요시간**: 12.5h (병렬 시 8h)

### 의존성 그래프

```mermaid
graph TD
    A1[CMP-A1: 타입 정의] --> A2[CMP-A2: 이벤트 발행]
    A1 --> A3[CMP-A3: 연동 클라이언트]
    A1 --> A4[CMP-A4: 파이프라인]
    A1 --> A5[CMP-A5: 스키마 마이그레이션]
    A1 --> A6[CMP-A6: 에러 처리]
    A1 --> A7[CMP-A7: 기본값]

    A2 --> A8[CMP-A8: 통합 테스트]
    A3 --> A8
    A4 --> A8
    A5 --> A8
    A6 --> A8
    A7 --> A8

    style A1 fill:#e1f5fe
    style A8 fill:#c8e6c9
```

### 병렬 실행 그룹

| Phase | 원자 | 병렬 가능 |
|-------|------|----------|
| **Phase 1** | CMP-A1 | 단독 |
| **Phase 2** | CMP-A2, A3, A4, A5, A6, A7 | 6개 병렬 |
| **Phase 3** | CMP-A8 | 단독 |

---

## 1. 개요

### 1.1 목적

이 문서는 이룸 프로젝트 내 모듈 간 데이터 흐름과 업데이트 규칙을 정의한다.
P8 (모듈 경계) 원칙에 따라 각 모듈은 공개 API만 노출하고, 내부 구현은 숨긴다.

### 1.2 범위

| 연동 유형 | 설명 |
|----------|------|
| **분석 → 추천** | 분석 결과를 기반으로 제품/시술/운동 추천 |
| **분석 → 분석** | 분석 모듈 간 데이터 전달 (PC → M, S → M 등) |
| **이미지 처리 → 분석** | CIE 파이프라인에서 분석 모듈로 전달 |
| **분석 → 리포트** | 분석 결과를 월간/종합 리포트로 집계 |

### 1.3 관련 문서

| 문서 | 경로 | 역할 |
|------|------|------|
| 제1원칙 | `.claude/rules/00-first-principles.md` | P8 모듈 경계 |
| 캡슐화 | `.claude/rules/encapsulation.md` | Barrel Export, 호출 방향 |
| 타입 정의 | `apps/web/lib/shared/integration-types.ts` | 연동 인터페이스 |

---

## 2. 연동 매트릭스

### 2.1 분석 → 추천/분석 연동

| 소스 | 타겟 | 트리거 조건 | 데이터 | 업데이트 방식 | 우선순위 |
|------|------|------------|--------|--------------|----------|
| PC-2 | M-1 | 퍼스널컬러 결과 저장 시 | season, subType, recommendedColors, skinTone, contrastLevel | 자동 갱신 (Push) | 필수 |
| PC-2 | H-1 | 퍼스널컬러 결과 저장 시 | season, subType, skinTone, recommendedLevelRange, recommendedUndertone | 자동 갱신 (Push) | 필수 |
| S-2 | SK-1 | 피부분석 완료 시 | fitzpatrickType, skinConcerns, sensitivityLevel, poreScore, pigmentationScore | 요청 시 조회 (Pull) | 필수 |
| S-2 | M-1 | 피부분석 완료 시 | skinType, tZoneOiliness, poreVisibility, sensitivityLevel, skinToneLab | 요청 시 조회 (Pull) | 높음 |
| C-2 | W-2 | 체형분석 완료 시 | postureType, imbalanceAreas, jandaSyndrome, asymmetryScore | 요청 시 조회 (Pull) | 필수 |
| OH-1 | N-1 | 구강건강 분석 완료 시 | gumHealth, inflammationScore, toothStaining, cavityRisk | 요청 시 조회 (Pull) | 높음 |

### 2.2 이미지 처리 → 분석 연동

| 소스 | 타겟 | 트리거 조건 | 데이터 | 업데이트 방식 | 우선순위 |
|------|------|------------|--------|--------------|----------|
| CIE-1 | 모든 분석 | 품질 검증 완료 시 | isValid, sharpness, resolution, qualityIssues | 파이프라인 내 전달 | 필수 |
| CIE-2 | PC-2, S-2, C-2, M-1 | 얼굴 감지 완료 시 | landmarks, faceBox, faceAngle, confidence | 파이프라인 내 전달 | 필수 |
| CIE-3 | PC-2, S-2, M-1 | AWB 보정 완료 시 | correctedImageBase64, originalColorTemp, correctedColorTemp, awbMethod | 파이프라인 내 전달 | 높음 |
| CIE-4 | 모든 분석 | 조명 분석 완료 시 | lightingQuality, uniformityScore, shadowRatio, colorTemperature, confidenceModifier, recommendAction | 파이프라인 내 전달 | 높음 |

### 2.3 분석 → 분석 체이닝

| 시나리오 | 체인 | 설명 |
|----------|------|------|
| 메이크업 종합 추천 | PC-2 → M-1 + S-2 → M-1 | 퍼스널컬러 + 피부 상태 기반 메이크업 |
| 스타일링 종합 | PC-2 → H-1 + PC-2 → M-1 + C-2 → 패션 | 전체 스타일링 |
| 웰니스 플랜 | S-2 → SK-1 + C-2 → W-2 + OH-1 → N-1 | 종합 웰니스 플랜 |

---

## 3. 업데이트 방식 정의

### 3.1 자동 갱신 (Push)

**정의**: 소스 모듈 결과 저장 시 타겟 모듈 캐시 무효화 또는 이벤트 발행

**적용 대상**: PC-2 → M-1, PC-2 → H-1

**구현 패턴**:

```typescript
// lib/events/integration-events.ts

/**
 * 소스 모듈 결과 저장 후 이벤트 발행
 */
export async function publishIntegrationEvent<T>(
  event: IntegrationEvent<T>
): Promise<void> {
  // 1. 이벤트 로깅
  await logIntegrationEvent(event);

  // 2. 캐시 무효화
  await invalidateTargetCache(event.type, event.userId);

  // 3. 웹훅 전송 (필요 시)
  if (shouldNotifyTarget(event.type)) {
    await notifyTargetModule(event);
  }
}

// 사용 예시 (PC-2 결과 저장 후)
await publishIntegrationEvent({
  type: 'PC2_RESULT_SAVED',
  userId: user.id,
  timestamp: new Date().toISOString(),
  data: pc2Result,
  metadata: {
    schemaVersion: '1.0.0',
    sourceModuleVersion: 'PC-2@1.1',
    generatedAt: new Date().toISOString(),
  },
});
```

**캐시 무효화 규칙**:

| 소스 이벤트 | 무효화 대상 캐시 |
|------------|----------------|
| `PC2_RESULT_SAVED` | `makeup:recommendations:{userId}`, `hair:recommendations:{userId}` |
| `S2_RESULT_SAVED` | `procedures:recommendations:{userId}`, `makeup:foundation:{userId}` |
| `C2_RESULT_SAVED` | `stretching:plan:{userId}` |
| `OH1_RESULT_SAVED` | `nutrition:oral:{userId}` |

### 3.2 요청 시 조회 (Pull)

**정의**: 타겟 모듈이 필요 시 소스 모듈 최신 결과 조회

**적용 대상**: S-2 → SK-1, S-2 → M-1, C-2 → W-2, OH-1 → N-1

**구현 패턴**:

```typescript
// lib/shared/integration-client.ts

/**
 * 소스 모듈 최신 결과 조회
 */
export async function fetchIntegrationData<T>(
  sourceModule: SourceModule,
  userId: string,
  options: FetchOptions = {}
): Promise<IntegrationResult<T>> {
  const { maxAge = 24 * 60 * 60 * 1000, fallbackToDefault = true } = options;

  // 1. 캐시 확인
  const cached = await getCachedIntegration<T>(sourceModule, userId);
  if (cached && !isExpired(cached, maxAge)) {
    return { data: cached.data, fromCache: true };
  }

  // 2. DB에서 최신 결과 조회
  const latest = await getLatestAnalysis(sourceModule, userId);

  if (latest) {
    // 3. 캐시 갱신
    await cacheIntegration(sourceModule, userId, latest);
    return { data: transformToIntegrationData(sourceModule, latest), fromCache: false };
  }

  // 4. Fallback 처리
  if (fallbackToDefault) {
    return {
      data: getDefaultIntegrationData(sourceModule) as T,
      fromCache: false,
      usedDefault: true,
    };
  }

  throw new IntegrationDataNotFoundError(sourceModule, userId);
}

// 사용 예시 (SK-1에서 S-2 데이터 조회)
const skinData = await fetchIntegrationData<S2ToSK1IntegrationData>(
  'S-2',
  userId,
  { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7일
);
```

**조회 우선순위**:

1. 캐시 (Redis/Memory)
2. DB 최신 레코드
3. 기본값 (Fallback)

### 3.3 파이프라인 내 전달 (Pipeline)

**정의**: 분석 요청 내에서 CIE 파이프라인 결과를 순차 전달

**적용 대상**: CIE-1~4 → 모든 분석 모듈

**구현 패턴**:

```typescript
// lib/analysis/pipeline/analysis-pipeline.ts

/**
 * 분석 파이프라인 실행
 */
export async function runAnalysisPipeline(
  input: AnalysisPipelineInput
): Promise<AnalysisPipelineResult> {
  // 1. CIE-1: 품질 검증
  const qualityResult = await validateImageQuality(input.imageBase64);
  if (!qualityResult.isValid) {
    throw new ImageQualityError(qualityResult.qualityIssues);
  }

  // 2. CIE-2: 얼굴 감지
  const faceResult = await detectFace(input.imageBase64);
  if (!faceResult.detected) {
    throw new FaceNotDetectedError();
  }

  // 3. CIE-3: AWB 보정 (선택적)
  const awbResult = input.options?.skipAwb
    ? null
    : await applyAwbCorrection(input.imageBase64);

  // 4. CIE-4: 조명 분석
  const lightingResult = await analyzeLighting(
    awbResult?.correctedImageBase64 || input.imageBase64
  );

  // 5. 파이프라인 컨텍스트 구성
  const pipelineContext: PipelineContext = {
    originalImage: input.imageBase64,
    processedImage: awbResult?.correctedImageBase64 || input.imageBase64,
    quality: qualityResult,
    face: faceResult,
    awb: awbResult,
    lighting: lightingResult,
    confidenceModifier: lightingResult.confidenceModifier,
  };

  // 6. 분석 모듈 실행
  const analysisResult = await runTargetAnalysis(
    input.analysisType,
    pipelineContext
  );

  return {
    analysis: analysisResult,
    pipeline: pipelineContext,
  };
}
```

**파이프라인 의존성 그래프**:

```
CIE-1 (품질)
   │
   ▼
CIE-2 (얼굴 감지) ────────────────────────┐
   │                                      │
   ▼                                      │
CIE-3 (AWB 보정) ──┬── CIE-4 (조명 분석) │
                   │         │            │
                   ▼         ▼            │
              [분석 모듈] ◀───────────────┘
              (PC-2, S-2, C-2, M-1)
```

---

## 4. 버전 관리

### 4.1 스키마 버전 규칙

| 필드 | 타입 | 설명 |
|------|------|------|
| `schemaVersion` | string (semver) | 연동 스키마 버전 |
| `sourceModuleVersion` | string | 소스 모듈 버전 (예: "PC-2@1.1") |
| `generatedAt` | string (ISO 8601) | 데이터 생성 시각 |
| `expiresAt` | string (ISO 8601) | 데이터 만료 시각 (선택) |

### 4.2 버전 호환성 매트릭스

| 스키마 버전 | 지원 소스 모듈 | 지원 타겟 모듈 | 상태 |
|------------|---------------|---------------|------|
| 1.0.0 | PC-2@1.0+, S-2@1.0+ | M-1@1.0+, SK-1@1.0+ | Active |
| 0.9.0 | PC-1, S-1 | M-1@0.x | Deprecated |

### 4.3 마이그레이션 전략

```typescript
// lib/shared/schema-migration.ts

/**
 * 스키마 버전 업그레이드
 */
export function migrateIntegrationData<T>(
  data: unknown,
  fromVersion: string,
  toVersion: string
): T {
  const migrations = getMigrationPath(fromVersion, toVersion);

  let current = data;
  for (const migration of migrations) {
    current = migration.up(current);
  }

  return current as T;
}

// 마이그레이션 등록
registerMigration('0.9.0', '1.0.0', {
  up: (data) => ({
    ...data,
    // 새 필드 추가
    confidence: data.confidence ?? 80,
  }),
  down: (data) => {
    const { confidence, ...rest } = data;
    return rest;
  },
});
```

---

## 5. 에러 처리

### 5.1 에러 시나리오 및 처리

| 시나리오 | 에러 코드 | 처리 방법 | 사용자 메시지 |
|----------|----------|----------|--------------|
| 소스 데이터 없음 | `INTEGRATION_DATA_NOT_FOUND` | 기본값 사용 또는 분석 유도 | "먼저 [분석명]을 완료해주세요" |
| 소스 데이터 만료 | `INTEGRATION_DATA_EXPIRED` | 재분석 권장, 캐시된 이전 결과 사용 | "분석 결과가 오래되었습니다. 다시 분석하시겠습니까?" |
| 스키마 불일치 | `INTEGRATION_SCHEMA_MISMATCH` | 마이그레이션 시도 또는 기본값 | (내부 처리, 사용자 노출 없음) |
| 타임아웃 | `INTEGRATION_TIMEOUT` | 캐시된 이전 결과 사용 | "일시적인 문제가 발생했습니다" |
| 검증 실패 | `INTEGRATION_VALIDATION_ERROR` | 기본값 사용 + 로깅 | (내부 처리) |

### 5.2 에러 처리 코드

```typescript
// lib/shared/integration-error.ts

export class IntegrationError extends Error {
  constructor(
    public code: IntegrationErrorCode,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export function handleIntegrationError<T>(
  error: IntegrationError,
  fallbackData: T
): IntegrationResult<T> {
  // 로깅
  logger.warn('[Integration] Error handled', {
    code: error.code,
    message: error.message,
    context: error.context,
  });

  // 에러 유형별 처리
  switch (error.code) {
    case 'INTEGRATION_DATA_NOT_FOUND':
      return {
        data: fallbackData,
        usedDefault: true,
        requiresAnalysis: true,
      };

    case 'INTEGRATION_DATA_EXPIRED':
      return {
        data: fallbackData,
        usedDefault: true,
        suggestReanalysis: true,
      };

    case 'INTEGRATION_TIMEOUT':
      return {
        data: fallbackData,
        usedDefault: true,
        temporaryFailure: true,
      };

    default:
      return {
        data: fallbackData,
        usedDefault: true,
      };
  }
}
```

### 5.3 Fallback 데이터 정의

```typescript
// lib/shared/integration-defaults.ts

export const DEFAULT_INTEGRATION_DATA: Record<string, unknown> = {
  'S-2→SK-1': {
    fitzpatrickType: 3,           // 한국인 평균
    skinConcerns: [],
    sensitivityLevel: 'medium',
    confidence: 50,
  },
  'S-2→M-1': {
    skinType: 'combination',
    tZoneOiliness: 50,
    poreVisibility: 50,
    sensitivityLevel: 'medium',
    skinToneLab: { L: 70, a: 8, b: 18 },  // 한국인 평균
    confidence: 50,
  },
  'PC-2→M-1': {
    season: 'summer',             // 한국인 많은 유형
    subType: 'summer-mute',
    recommendedColors: [],
    avoidColors: [],
    skinTone: 'neutral',
    contrastLevel: 'medium',
    confidence: 50,
  },
  // ... 기타 연동
};
```

---

## 6. 연동 검증 테스트

### 6.1 테스트 시나리오

| TC-ID | 시나리오 | 검증 내용 | 예상 결과 |
|-------|----------|----------|----------|
| INT-TC-001 | PC-2 결과 저장 → M-1 캐시 무효화 | M-1 재조회 시 최신 PC-2 데이터 반영 | Pass |
| INT-TC-002 | S-2 데이터 없이 SK-1 호출 | 기본값 사용 + requiresAnalysis 플래그 | Pass |
| INT-TC-003 | 만료된 S-2 데이터로 M-1 호출 | 캐시 사용 + suggestReanalysis 플래그 | Pass |
| INT-TC-004 | CIE 파이프라인 전체 실행 | 각 단계 결과가 다음 단계로 전달 | Pass |
| INT-TC-005 | 스키마 버전 0.9.0 → 1.0.0 마이그레이션 | 새 필드 추가, 기존 데이터 유지 | Pass |
| INT-TC-006 | 동시 다발 이벤트 발행 | 이벤트 순서 보장, 중복 방지 | Pass |

### 6.2 통합 테스트 코드

```typescript
// tests/integration/cross-module.test.ts

describe('Cross-Module Integration', () => {
  describe('PC-2 → M-1 연동', () => {
    it('should provide latest PC-2 data to M-1', async () => {
      // Arrange
      const userId = 'test-user-1';
      const pc2Result = createMockPC2Result({ season: 'spring' });

      // Act: PC-2 결과 저장
      await savePC2Result(userId, pc2Result);

      // Act: M-1에서 조회
      const integrationData = await fetchIntegrationData<PC2ToM1IntegrationData>(
        'PC-2',
        userId
      );

      // Assert
      expect(integrationData.data.season).toBe('spring');
      expect(integrationData.fromCache).toBe(false);
    });

    it('should invalidate M-1 cache when PC-2 result saved', async () => {
      // Arrange
      const userId = 'test-user-2';
      await cacheM1Recommendations(userId, mockRecommendations);

      // Act: PC-2 결과 저장 (이벤트 발행)
      await savePC2Result(userId, createMockPC2Result());

      // Assert: 캐시 무효화 확인
      const cached = await getM1Cache(userId);
      expect(cached).toBeNull();
    });
  });

  describe('S-2 → SK-1 연동', () => {
    it('should use default when S-2 data not found', async () => {
      // Arrange
      const userId = 'user-without-analysis';

      // Act
      const result = await fetchIntegrationData<S2ToSK1IntegrationData>(
        'S-2',
        userId,
        { fallbackToDefault: true }
      );

      // Assert
      expect(result.usedDefault).toBe(true);
      expect(result.data.fitzpatrickType).toBe(3);  // 기본값
    });
  });

  describe('CIE Pipeline Integration', () => {
    it('should pass CIE results through pipeline', async () => {
      // Arrange
      const input = createMockAnalysisInput();

      // Act
      const result = await runAnalysisPipeline(input);

      // Assert
      expect(result.pipeline.quality.isValid).toBe(true);
      expect(result.pipeline.face.detected).toBe(true);
      expect(result.pipeline.lighting.confidenceModifier).toBeGreaterThan(0);
      expect(result.analysis.confidence).toBeDefined();
    });
  });
});
```

---

## 7. 모니터링

### 7.1 메트릭

| 메트릭 | 설명 | 임계값 |
|--------|------|--------|
| `integration_event_count` | 연동 이벤트 발생 수 | - |
| `integration_cache_hit_rate` | 캐시 적중률 | > 70% |
| `integration_fallback_rate` | 기본값 사용률 | < 10% |
| `integration_latency_p95` | 연동 조회 지연 (p95) | < 100ms |
| `integration_error_rate` | 연동 에러율 | < 1% |

### 7.2 알림 규칙

| 조건 | 심각도 | 액션 |
|------|--------|------|
| `fallback_rate > 20%` | Warning | Slack 알림 |
| `error_rate > 5%` | Critical | PagerDuty + Slack |
| `latency_p95 > 500ms` | Warning | Slack 알림 |

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.1 | 2026-01-29 | P3 원자 분해 섹션 추가 |
| 1.0 | 2026-01-24 | 초기 버전 - 연동 매트릭스, 업데이트 방식, 에러 처리 정의 |

---

**Author**: Claude Code
