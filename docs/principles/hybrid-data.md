# Hybrid 데이터 패턴 원리

> 이 문서는 DB 핵심 데이터와 Mock 표시 데이터 조합의 기반이 되는 기본 원리를 설명한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 데이터 이분화 시스템"

- 100% 분리: 본질적 속성(DB) vs 우발적 속성(Mock) 완벽 분리
- 무결성 보장: DB에 저장된 핵심 데이터의 무결성 100%
- 유연한 표현: Mock 데이터 변경 시 DB 수정 없이 UI 업데이트
- 버전 관리: Mock 데이터 버전별 관리로 A/B 테스트 지원
- 다국어 지원: 핵심 값(enum)은 동일, 표시 문구만 언어별 Mock
- 캐시 최적화: 핵심 데이터 캐시, Mock 데이터 CDN 분리
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **경계 모호성** | 본질/우발 구분 판단 주관적 |
| **Mock 동기화** | DB 구조 변경 시 Mock 수동 업데이트 필요 |
| **복잡도 증가** | 단순 CRUD 대비 코드 복잡도 증가 |
| **디버깅 어려움** | 문제 발생 시 DB/Mock 중 원인 파악 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **분리 일관성** | 모든 도메인에 동일 패턴 적용 |
| **변환 함수** | transformDbToResult 100% 타입 안전 |
| **Mock 커버리지** | 모든 enum 값에 대응 Mock 존재 |
| **다국어 Mock** | 한국어/영어 Mock 100% 커버 |
| **캐시 분리** | DB TTL vs Mock TTL 독립 관리 |
| **테스트 커버** | transform 함수 단위 테스트 90% |

### 현재 목표

**80%** - MVP Hybrid 데이터 패턴

- ✅ 데이터 이분화 원칙 정의
- ✅ 본질적/우발적 속성 분류 기준
- ✅ CQRS 원리 적용
- ✅ transformDbToResult 패턴 구현
- ✅ PC-1, S-1 등 주요 모듈 적용
- ⏳ 전체 도메인 일관 적용 (70%)
- ⏳ 다국어 Mock (40%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Mock 자동 생성 | 도메인 지식 필요 | Phase 4 |
| 실시간 Mock 업데이트 | CMS 연동 필요 | Phase 3 |
| 다국어 완전 지원 | i18n 인프라 필요 | Phase 3 |

---

## 1. 핵심 개념

### 1.1 데이터 이분화 (Data Bifurcation)

데이터를 **본질적 속성(Essential)**과 **우발적 속성(Accidental)**으로 분리하는 개념.

```
본질적 속성: 변하지 않는 핵심 (What)
  → DB에 영구 저장
  → 예: 피부 타입, 시즌 타입, 체형 분류

우발적 속성: 표현 방식 (How)
  → Mock에서 동적 로드
  → 예: 추천 문구, 스타일 가이드, 색상 이름
```

### 1.2 정규화 vs 비정규화 트레이드오프

| 접근법 | 장점 | 단점 |
|--------|------|------|
| 완전 정규화 | 데이터 무결성 | 조회 복잡도 |
| 완전 비정규화 | 조회 성능 | 업데이트 어노말리 |
| **Hybrid** | 핵심만 정규화 | 설계 복잡도 |

### 1.3 CQRS 원리와의 관계

Command Query Responsibility Segregation의 변형:

```
┌─────────────────────────────────────────────────────────┐
│                    Hybrid 패턴                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Write Path (분석 시)       Read Path (결과 조회 시)    │
│   ─────────────────          ──────────────────         │
│   AI 분석 결과               transformDbToResult()      │
│       ↓                           ↓                     │
│   DB 저장 (핵심만)           DB 데이터 + Mock 조합      │
│   • seasonType               • seasonType (DB)         │
│   • confidence               • bestColors (Mock)       │
│   • raw_analysis             • styleGuide (Mock)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 수학적/물리학적 기반

### 2.1 집합론적 모델

```
Result = f(DB) ∪ g(Mock)

where:
  DB = 핵심 데이터 집합
  Mock = 표시 데이터 집합
  f = DB 데이터 변환 함수
  g = Mock 데이터 선택 함수 (seasonType → Mock[seasonType])
```

### 2.2 함수 합성

결과 생성은 두 함수의 합성:

```
transformDbToResult: DbData → Result
  = select_mock ∘ map_db_fields

select_mock(seasonType) = Mock[seasonType]
map_db_fields(db) = { seasonType: db.season, confidence: db.confidence }
```

### 2.3 캐시 무효화 회피

전통적 캐시 무효화 문제:

```
캐시 = f(시간, 데이터)
무효화 시점 = 데이터 변경 시

Hybrid에서:
  DB 데이터 → 변경 없음 → 캐시 유효
  Mock 데이터 → 배포 시 갱신 → CDN 캐시 무효화만
```

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

**원리**: 핵심 데이터는 영구 저장, 표시 데이터는 런타임 조합

**알고리즘**:

```
function getResult(id):
  1. DB에서 핵심 데이터 조회 (seasonType, confidence, ...)
  2. seasonType으로 Mock 데이터 선택
  3. 두 데이터 병합하여 Result 생성
  4. 선택적 필드 fallback 처리
```

### 3.2 알고리즘 → 코드

**데이터 분류 기준**:

```typescript
// 핵심 데이터 (DB 저장)
interface DbPersonalColorAssessment {
  id: string;
  clerk_user_id: string;
  season: string;          // 'spring', 'summer', 'autumn', 'winter'
  confidence: number;      // AI 신뢰도
  raw_analysis: object;    // AI 원본 응답
  created_at: string;
}

// 표시 데이터 (Mock)
interface SeasonDisplayData {
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];
  lipstickRecommendations: LipstickRecommendation[];
  styleDescription: StyleDescription;
  easyInsight: EasyInsight;
}
```

**변환 함수 구현**:

```typescript
function transformDbToResult(
  dbData: DbPersonalColorAssessment
): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;

  // Mock에서 표시 데이터 선택
  const mockData = {
    bestColors: BEST_COLORS[seasonType] ?? [],
    worstColors: WORST_COLORS[seasonType] ?? [],
    lipstickRecommendations: LIPSTICK_RECOMMENDATIONS[seasonType] ?? [],
    styleDescription: STYLE_DESCRIPTIONS[seasonType],
    easyInsight: EASY_INSIGHTS[seasonType]?.[0],
  };

  // 핵심 + 표시 데이터 병합
  return {
    // DB 핵심 데이터
    seasonType,
    confidence: dbData.confidence ?? 85,
    analyzedAt: new Date(dbData.created_at),

    // Mock 표시 데이터
    ...mockData,
  };
}
```

---

## 4. 적용 판단 기준

### 4.1 Hybrid 적합 조건

| 조건 | 설명 | 예시 |
|------|------|------|
| **분류 결과** | 유한한 카테고리로 분류됨 | 시즌 타입 (4가지) |
| **표시 개선** | UX 텍스트/이미지 개선이 자주 발생 | 색상 이름, 스타일 가이드 |
| **재분석 비용** | AI 재분석 비용이 높음 | Gemini API 호출 |

### 4.2 직접 저장 적합 조건

| 조건 | 설명 | 예시 |
|------|------|------|
| **고유 데이터** | 사용자별 고유 값 | 측정값, 점수 |
| **AI 생성** | AI가 개인화 생성 | 맞춤 인사이트 |
| **변경 추적** | 히스토리 필요 | 피부 점수 변화 |

### 4.3 의사결정 플로우차트

```
데이터 저장 방식 결정:

                    이 데이터가 사용자별로 고유한가?
                              │
                   ┌──────────┴──────────┐
                   │ Yes                 │ No
                   ↓                     ↓
              DB 저장              Mock에서 관리
                   │
        이 데이터가 시간에 따라 변하는가?
                   │
          ┌────────┴────────┐
          │ Yes             │ No
          ↓                 ↓
     히스토리 테이블     현재 값만 저장
```

---

## 5. 검증 방법

### 5.1 데이터 분류 검증

```typescript
// 테스트: DB 데이터만으로 Mock 데이터 선택 가능
test('seasonType으로 Mock 데이터 선택 가능', () => {
  const dbData = { season: 'spring', confidence: 90 };
  const result = transformDbToResult(dbData);

  expect(result.bestColors).toHaveLength(greaterThan(0));
  expect(result.styleDescription).toBeDefined();
});
```

### 5.2 하위 호환성 검증

```typescript
// 테스트: 새 필드 없어도 기존 기능 동작
test('easyInsight 없어도 fallback 동작', () => {
  const seasonWithoutEasy = 'unknown_season';
  const result = transformDbToResult({ season: seasonWithoutEasy });

  expect(result.easyInsight).toBeUndefined(); // null이 아닌 undefined
});
```

### 5.3 Mock 업데이트 영향 검증

```typescript
// 테스트: Mock 변경이 기존 결과에 즉시 반영
test('Mock 업데이트가 결과에 반영', () => {
  const before = transformDbToResult({ season: 'spring' });

  // Mock 업데이트 시뮬레이션
  BEST_COLORS['spring'] = [...BEST_COLORS['spring'], newColor];

  const after = transformDbToResult({ season: 'spring' });
  expect(after.bestColors).toContain(newColor);
});
```

---

## 6. 모듈별 적용

| 모듈 | DB 핵심 데이터 | Mock 표시 데이터 |
|------|---------------|-----------------|
| **PC-1** | seasonType, subType, confidence | bestColors, worstColors, lipstick, styleGuide |
| **S-1** | skinType, zoneScores, concerns | recommendations, productTips, routineGuide |
| **C-1** | bodyType, measurements | strengths, fashionTips, avoidStyles |
| **H-1** | hairType, condition | careRoutine, productRecommendations |
| **N-1** | bmr, tdee, goals | mealPlans, supplementTips |

---

## 7. 관련 문서

### 규칙
- [hybrid-data-pattern.md](../../.claude/rules/hybrid-data-pattern.md) - 구체적 구현 가이드

### ADR
- [ADR-002: Hybrid 데이터 패턴](../adr/ADR-002-hybrid-data-pattern.md)
- [ADR-007: Mock Fallback 전략](../adr/ADR-007-mock-fallback-strategy.md)
- [ADR-014: 캐싱 전략](../adr/ADR-014-caching-strategy.md)

### 스펙
- [SDD-HYBRID-DATA-EXTENSION](../specs/SDD-HYBRID-DATA-EXTENSION.md)

---

## 8. 참고 자료

- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Essential vs Accidental Complexity - Fred Brooks](https://en.wikipedia.org/wiki/No_Silver_Bullet)
- [Database Normalization - Edgar Codd](https://en.wikipedia.org/wiki/Database_normalization)

---

**Version**: 1.0 | **Created**: 2026-01-21 | **Updated**: 2026-01-21
