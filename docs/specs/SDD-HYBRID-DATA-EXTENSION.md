# SDD: Hybrid 데이터 패턴 확장 (S-1, C-1)

> PC-1에 적용된 Hybrid 데이터 패턴을 S-1(피부), C-1(체형) 분석에 확장 적용

## 개요

### 배경

PC-1 퍼스널 컬러 분석에서 Hybrid 데이터 패턴 적용:

- **DB**: 핵심 데이터만 저장 (seasonType, confidence, analyzedAt)
- **Mock**: 표시용 데이터 런타임 조회 (bestColors, worstColors, lipstick, style)
- **효과**: Mock 수정 시 기존 사용자도 새로고침만으로 개선 사항 적용

### 목표

S-1, C-1에도 동일 패턴 적용하여:

1. 초보자 친화 UX 개선을 기존 사용자에게 즉시 반영
2. DB 마이그레이션 없이 추천 내용 업데이트 가능
3. 분석 모듈 간 일관된 데이터 전략 유지

### 범위

| 모듈 | 결과 페이지                           | Mock 파일                   |
| ---- | ------------------------------------- | --------------------------- |
| S-1  | `/analysis/skin/result/[id]/page.tsx` | `lib/mock/skin-analysis.ts` |
| C-1  | `/analysis/body/result/[id]/page.tsx` | `lib/mock/body-analysis.ts` |

## 현재 상태 분석

### PC-1 Hybrid 구조 (참조)

```
┌─────────────────────────────────────────────────────────────┐
│                    transformDbToResult                       │
├─────────────────────────────────────────────────────────────┤
│  DB 데이터 (고정)         │  Mock 데이터 (최신)             │
│  ───────────────          │  ──────────────                 │
│  • seasonType             │  • bestColors                   │
│  • confidence             │  • worstColors                  │
│  • analyzedAt             │  • lipstickRecommendations      │
│                           │  • styleDescription             │
│                           │  • easyInsight                  │
└─────────────────────────────────────────────────────────────┘
```

### S-1 피부 분석 현재 구조

**DB 저장 데이터:**

- `skin_type`: 피부 타입 (oily, dry, combination, normal, sensitive)
- `scores`: 각 지표별 점수 (JSONB)
- `primary_concern`, `secondary_concerns`: 주요 고민
- `recommendations`: AI 추천 (JSONB)

**Mock 데이터 (`skin-analysis.ts`):**

- `SKIN_TYPES`: 피부 타입별 설명
- `SKIN_CONCERNS`: 피부 고민별 설명
- `CARE_RECOMMENDATIONS`: 관리 추천
- (추가 필요) `EASY_SKIN_TIPS`: 초보자 친화 팁

### C-1 체형 분석 현재 구조

**DB 저장 데이터:**

- `body_type`: 체형 타입 (S, W, N 또는 상세)
- `measurements`: 측정값 (JSONB)
- `style_recommendations`: AI 추천 (JSONB)

**Mock 데이터 (`body-analysis.ts`):**

- `BODY_TYPES_3`: 체형별 설명
- `generateMockBodyAnalysis3`: Mock 생성
- (추가 필요) `EASY_BODY_TIPS`: 초보자 친화 팁

## 상세 요구사항

### 1. S-1 Hybrid 적용

#### 1.1 Mock 데이터 확장 (`lib/mock/skin-analysis.ts`)

```typescript
// 초보자 친화 피부 관리 팁
export interface EasySkinTip {
  summary: string;           // "건성 피부는 수분 크림이 필수예요!"
  easyExplanation: string;   // 쉬운 설명
  morningRoutine: string[];  // ["세안 → 토너 → 에센스 → 수분 크림"]
  eveningRoutine: string[];  // ["클렌징 → 토너 → 세럼 → 나이트 크림"]
  productTip: string;        // "히알루론산 성분을 찾아보세요"
}

export const EASY_SKIN_TIPS: Record<SkinTypeId, EasySkinTip> = {
  oily: { ... },
  dry: { ... },
  combination: { ... },
  normal: { ... },
  sensitive: { ... },
};
```

#### 1.2 결과 페이지 변경 (`skin/result/[id]/page.tsx`)

```typescript
import { EASY_SKIN_TIPS } from '@/lib/mock/skin-analysis';

function transformDbToResult(dbData: DbSkinAnalysis): SkinAnalysisResult {
  const skinType = dbData.skin_type as SkinTypeId;

  // Hybrid 전략: 초보자 친화 팁은 최신 Mock 사용
  const mockEasyTip = EASY_SKIN_TIPS[skinType];

  return {
    // DB 데이터
    skinType,
    overallScore: dbData.scores?.overall || 70,
    metrics: dbData.scores?.metrics || [],

    // Mock 데이터 (최신)
    easySkinTip: mockEasyTip,
    // ...
  };
}
```

### 2. C-1 Hybrid 적용

#### 2.1 Mock 데이터 확장 (`lib/mock/body-analysis.ts`)

```typescript
// 초보자 친화 체형 스타일 팁
export interface EasyBodyTip {
  summary: string;           // "S타입은 허리 라인을 강조하면 좋아요!"
  easyExplanation: string;   // 쉬운 설명
  doList: string[];          // ["핏한 상의", "A라인 스커트"]
  dontList: string[];        // ["루즈핏 전체", "박스 실루엣"]
  styleTip: string;          // "허리 벨트를 활용해보세요"
}

export const EASY_BODY_TIPS: Record<BodyType3, EasyBodyTip> = {
  S: { ... },
  W: { ... },
  N: { ... },
};
```

#### 2.2 결과 페이지 변경 (`body/result/[id]/page.tsx`)

PC-1, S-1과 동일한 패턴 적용

### 3. 타입 설계

#### 선택적 필드로 하위 호환성 유지

```typescript
// SkinAnalysisResult 확장
export interface SkinAnalysisResult {
  // 기존 필드 (필수)
  skinType: SkinTypeId;
  overallScore: number;

  // 초보자 친화 필드 (선택적)
  easySkinTip?: EasySkinTip;
}

// BodyAnalysisResult 확장
export interface BodyAnalysisResult {
  // 기존 필드 (필수)
  bodyType: BodyType | BodyType3;
  measurements: Measurement[];

  // 초보자 친화 필드 (선택적)
  easyBodyTip?: EasyBodyTip;
}
```

### 4. UI 컴포넌트 업데이트

#### AnalysisResult 컴포넌트에 초보자 친화 섹션 추가

```tsx
{easySkinTip && (
  <section className="bg-gradient-to-r from-emerald-50 to-teal-50 ...">
    <h2>스킨케어 가이드</h2>
    <p>{easySkinTip.summary}</p>
    <div>
      <h3>아침 루틴</h3>
      <ul>{easySkinTip.morningRoutine.map(...)}</ul>
    </div>
    <div>
      <h3>저녁 루틴</h3>
      <ul>{easySkinTip.eveningRoutine.map(...)}</ul>
    </div>
  </section>
)}
```

## 변경 파일 목록

| 파일                                  | 변경 내용                                      | 우선순위 |
| ------------------------------------- | ---------------------------------------------- | -------- |
| `lib/mock/skin-analysis.ts`           | `EasySkinTip` 인터페이스 + 데이터 추가, export | 높음     |
| `lib/mock/body-analysis.ts`           | `EasyBodyTip` 인터페이스 + 데이터 추가, export | 높음     |
| `skin/result/[id]/page.tsx`           | `transformDbToResult` Hybrid 적용              | 중간     |
| `body/result/[id]/page.tsx`           | `transformDbToResult` Hybrid 적용              | 중간     |
| `skin/_components/AnalysisResult.tsx` | 초보자 친화 섹션 추가                          | 낮음     |
| `body/_components/AnalysisResult.tsx` | 초보자 친화 섹션 추가                          | 낮음     |

## 테스트 계획

### 단위 테스트

- [ ] `EASY_SKIN_TIPS` 5개 타입 모두 존재 확인
- [ ] `EASY_BODY_TIPS` 3개 타입 모두 존재 확인
- [ ] `transformDbToResult` 함수 Hybrid 변환 정상 동작

### 통합 테스트

- [ ] 기존 DB 데이터로 결과 페이지 렌더링 성공
- [ ] Mock 데이터 변경 후 새로고침 시 반영 확인

### 수동 테스트

- [ ] S-1 결과 페이지 초보자 친화 섹션 표시
- [ ] C-1 결과 페이지 초보자 친화 섹션 표시
- [ ] 다크모드 대응 확인

## 제외 항목

다음은 이번 스펙에서 **제외**:

1. **기존 테스트 수정** - 별도 이슈로 처리 (Hybrid 무관)
2. **H-1 헤어 분석** - 아직 결과 페이지 미구현
3. **DB 스키마 변경** - 불필요 (Hybrid 패턴 목적)

## 시지푸스 적용 여부 분석

### 복잡도 평가

| 항목        | 점수     | 근거                    |
| ----------- | -------- | ----------------------- |
| 파일 영향도 | 20점     | 6개 파일 수정           |
| 변경 유형   | 10점     | 기존 패턴 반복 적용     |
| 의존성      | 5점      | Mock → Result 단순 의존 |
| 리스크      | 5점      | 선택적 필드, 하위 호환  |
| **총점**    | **40점** |                         |

### 결정: 시지푸스 적용

- 총점 40점 → `full` 전략 적용 대상 (31점 이상)
- 6개 파일 수정으로 품질 검증 필요
- 그러나 **패턴 반복**이므로 `code-quality` 에이전트만 활용 권장

### 권장 실행 방식

```
/sisyphus S-1, C-1에 Hybrid 데이터 패턴 확장 적용
```

또는 직접 실행 후 `yiroom-code-quality` 에이전트로 검증

---

**Version**: 1.0 | **Date**: 2026-01-08 | **Author**: Claude
