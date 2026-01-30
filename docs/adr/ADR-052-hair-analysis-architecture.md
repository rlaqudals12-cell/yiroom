# ADR-052: H-1 헤어 분석 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 맥락 (Context)

이룸 앱에 **헤어 분석(H-1)** 모듈을 추가합니다. 이 모듈은 사용자의 얼굴형, 헤어컬러, 모발 타입, 두피 상태를 종합적으로 분석하여 최적의 헤어스타일과 헤어컬러를 추천합니다.

### 요구사항

1. **얼굴형 분석**: 6가지 얼굴형 분류 (계란형, 둥근형, 긴형, 사각형, 하트형, 다이아몬드)
2. **헤어컬러 분류**: Lab 색공간 기반 8개 카테고리 분류
3. **모발 타입 분석**: 직모/웨이브/곱슬/코일리 분류
4. **두피 상태 분석**: 건성/중성/지성/민감성 분류
5. **퍼스널컬러 연동**: PC-1 결과 기반 헤어컬러 추천
6. **영양 모듈 연동**: 모발 건강 알림을 N-1에 전달

### 모듈 간 관계 (Cross-Module)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    PC-1     │────▶│    H-1      │────▶│    N-1      │
│ 퍼스널컬러   │     │   헤어분석   │     │   영양분석   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │
      │  시즌 정보        │  두피/모발 건강 알림
      │  색상 팔레트      │  영양소 추천
      ▼                   ▼
   헤어컬러 추천        비오틴, 아연, 철분 등
```

### 원리 문서 참조

헤어 분석의 과학적 기반은 [docs/principles/hair-makeup-analysis.md](../principles/hair-makeup-analysis.md)에 상세히 정의되어 있습니다:
- 얼굴형 분류 비율 기준
- 헤어컬러 Lab 범위 정의
- 시즌별 권장 헤어컬러 매핑
- 모발 구조 및 건강 지표

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- 단일 이미지로 얼굴형, 헤어컬러, 모발 건강, 두피 상태 100% 정확 분석
- AR 기반 헤어스타일 가상 체험
- 실시간 헤어컬러 시뮬레이션
- 개인화된 헤어케어 처방 및 제품 추천
- 미용실 예약 및 스타일리스트 매칭
- PC-1, N-1과 완전 통합된 종합 헤어 솔루션

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| 얼굴형 분류 정확도 | 아시아인 데이터셋 제한 | 한국인 특화 임계값 튜닝 |
| 헤어컬러 측정 | 조명 영향 | CIE-3 AWB 보정 |
| 두피 상태 분석 | 이미지 해상도 제한 | 별도 두피 촬영 가이드 |
| AR 시뮬레이션 | 성능 부담 | Phase 2로 연기 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 얼굴형 분류 정확도 | 95%+ | 85% |
| 헤어컬러 분류 정확도 | 90%+ | 80% |
| 모발 건강 점수 신뢰도 | 상관관계 0.9+ | 0.7 |
| PC-1 연동 조화도 | 완전 통합 | 시즌 기반 추천 |
| 사용자 만족도 | NPS 60+ | NPS 40+ |

### 현재 목표

**Phase 1: 55%** (기본 분석 기능)
- face-api.js 기반 얼굴형 분류
- Lab 색공간 헤어컬러 분류
- 기본 모발 타입/두피 타입 분석
- PC-1 연동 헤어컬러 추천
- N-1 영양 알림 연동

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| AR 헤어스타일 시뮬레이션 | 구현 복잡도, 성능 | Phase 2 |
| 실시간 헤어컬러 변환 | 고급 이미지 처리 필요 | Phase 2 |
| 미용실 예약 연동 | MVP 범위 초과 | MAU 10K+ |
| 두피 정밀 분석 | 별도 장비 필요 | 파트너십 시 |

---

## 결정 (Decision)

### 1. 얼굴형 분석: face-api.js 기반 랜드마크 추출

**선택**: face-api.js (웹) + MediaPipe (모바일)를 통한 얼굴 랜드마크 추출 후 비율 계산

```typescript
// 얼굴형 판정 알고리즘 (hair-makeup-analysis.md 기반)
interface FaceShapeInput {
  faceHeight: number;
  faceWidth: number;
  jawAngle: number;
  foreheadWidth: number;
  jawWidth: number;
  cheekboneWidth: number;
}

type FaceShape = 'oval' | 'round' | 'oblong' | 'square' | 'heart' | 'diamond';

function classifyFaceShape(input: FaceShapeInput): FaceShape {
  const faceRatio = input.faceHeight / input.faceWidth;

  if (faceRatio < 1.1) {
    return 'round';
  } else if (faceRatio > 1.6) {
    return 'oblong';
  } else if (input.jawAngle > 140) {
    return 'square';
  } else if (input.foreheadWidth > input.jawWidth * 1.3) {
    return 'heart';
  } else if (
    input.cheekboneWidth > input.foreheadWidth &&
    input.cheekboneWidth > input.jawWidth
  ) {
    return 'diamond';
  } else {
    return 'oval';
  }
}
```

### 2. 헤어컬러 분류: Lab 색공간 8개 카테고리

**선택**: Lab 색공간 기반 분류 (RGB 대신)

```typescript
interface LabRange {
  L: [number, number];  // 명도 범위
  a: [number, number];  // 빨강-초록 범위
  b: [number, number];  // 노랑-파랑 범위
}

type HairColorCategory =
  | 'black'
  | 'dark-brown'
  | 'medium-brown'
  | 'light-brown'
  | 'blonde'
  | 'red'
  | 'ash'
  | 'dyed-vivid';

const HAIR_COLOR_RANGES: Record<HairColorCategory, LabRange> = {
  black: { L: [10, 30], a: [-2, 3], b: [-2, 5] },
  'dark-brown': { L: [25, 40], a: [2, 8], b: [5, 15] },
  'medium-brown': { L: [35, 50], a: [5, 12], b: [10, 25] },
  'light-brown': { L: [45, 60], a: [8, 15], b: [15, 30] },
  blonde: { L: [55, 80], a: [5, 15], b: [20, 40] },
  red: { L: [30, 50], a: [15, 30], b: [15, 30] },
  ash: { L: [30, 60], a: [-5, 3], b: [-5, 5] },
  'dyed-vivid': { L: [20, 70], a: [-30, 50], b: [-30, 50] },
};
```

### 3. AI 분석: Gemini 3 Flash + Mock Fallback

**선택**: ADR-007 패턴 준수 (3초 타임아웃, 2회 재시도, Mock Fallback)

```typescript
// 표준 Fallback 패턴
async function analyzeHair(input: HairAnalysisInput): Promise<HairAnalysisResult> {
  return analyzeWithFallback(
    () => analyzeHairWithGemini(input),
    () => generateMockHairAnalysis(input),
    { timeout: 3000, maxRetries: 2 }
  );
}
```

### 4. 데이터 저장: hair_assessments 테이블

```sql
-- 마이그레이션: 20260123_create_hair_assessments.sql
CREATE TABLE IF NOT EXISTS hair_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 분석 결과
  face_shape TEXT NOT NULL,           -- oval, round, oblong, square, heart, diamond
  current_hair_color JSONB NOT NULL,  -- { category, labValues }
  hair_type TEXT NOT NULL,            -- straight, wavy, curly, coily
  scalp_type TEXT NOT NULL,           -- dry, normal, oily, sensitive

  -- 건강 지표
  health_scores JSONB NOT NULL,       -- { hydration, damage, density, shine, elasticity }
  scalp_scores JSONB NOT NULL,        -- { oilLevel, hydration, sensitivity }

  -- 추천
  recommended_colors JSONB NOT NULL,  -- 시즌별 권장 컬러
  recommended_styles JSONB NOT NULL,  -- 얼굴형별 권장 스타일
  care_recommendations JSONB,         -- 케어 추천

  -- 메타
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85,
  used_fallback BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  personal_color_id UUID REFERENCES personal_color_assessments(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE hair_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_hair_select" ON hair_assessments
  FOR SELECT USING (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_hair_insert" ON hair_assessments
  FOR INSERT WITH CHECK (clerk_user_id = auth.get_user_id());

-- 인덱스
CREATE INDEX idx_hair_assessments_user ON hair_assessments(clerk_user_id);
CREATE INDEX idx_hair_assessments_created ON hair_assessments(created_at DESC);
```

## 대안 (Alternatives Considered)

### 얼굴형 분석

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **수동 선택 (사용자 입력)** | 구현 간단, AI 비용 없음 | 정확도 낮음, 사용자 부담 | `LOW_ACCURACY` - 대부분 자신의 얼굴형을 모름 |
| **Gemini VLM 직접 분류** | 높은 정확도 | API 비용, 지연 | `COST` - 랜드마크로 충분히 정확함 |
| **face-api.js 랜드마크 + 비율 계산** | 빠름, 무료, 정확 | 라이브러리 의존성 | ✅ **선택** |

### 헤어컬러 분류

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **RGB 색공간** | 구현 간단 | 지각적 불균일, 조명 민감 | `LOW_ACCURACY` - 유사 색상 구분 어려움 |
| **HSL 색공간** | 직관적 | 밝기 정보 손실 | `ALT_BETTER` - Lab이 더 정확 |
| **Lab 색공간** | 지각적 균일성, 정확한 분류 | 변환 필요 | ✅ **선택** |

### AI 분석 전략

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **AI Only (Fallback 없음)** | 구현 간단 | 장애 시 서비스 중단 | `RELIABILITY` - 사용자 경험 저하 |
| **Mock Only (AI 없음)** | 빠름, 비용 없음 | 개인화 불가 | `LOW_VALUE` - 분석 의미 없음 |
| **AI + Mock Fallback** | 안정적, 무중단 | Mock 유지보수 필요 | ✅ **선택** (ADR-007) |

## 결과 (Consequences)

### 긍정적 결과

- **종합 분석**: 얼굴형 + 헤어컬러 + 모발 + 두피를 통합 분석
- **퍼스널컬러 연동**: PC-1 시즌 기반 과학적 헤어컬러 추천
- **영양 연동**: 모발 건강 이슈를 N-1으로 전달하여 통합 케어
- **안정적 서비스**: Mock Fallback으로 AI 장애 시에도 기본 결과 제공
- **확장성**: M-1(메이크업) 모듈과 동일 원리 공유

### 부정적 결과

- **라이브러리 의존성**: face-api.js (웹), MediaPipe (모바일) 유지보수 필요
- **Lab 변환 비용**: RGB → Lab 변환 연산 추가
- **Mock 데이터 관리**: 헤어 분석용 Mock 생성기 개발 필요

### 리스크

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| 얼굴형 분류 오류 | 중간 | 중간 | 황금비율 임계값 튜닝, 사용자 피드백 수집 |
| 헤어컬러 조명 영향 | 높음 | 중간 | CIE-3 AWB 보정 적용 (ADR-040) |
| PC-1 연동 불일치 | 낮음 | 높음 | 동일 분석 세션에서 처리, 데이터 일관성 검증 |
| face-api.js 유지보수 중단 | 낮음 | 높음 | TensorFlow.js 기반 자체 모델로 대체 준비 |

## 구현 가이드

### 파일 구조

```
lib/analysis/hair/
├── index.ts                    # 공개 API (Barrel Export)
├── types.ts                    # 타입 정의
├── internal/
│   ├── face-shape-classifier.ts    # 얼굴형 분류
│   ├── hair-color-analyzer.ts      # 헤어컬러 Lab 분석
│   ├── hair-type-detector.ts       # 모발 타입 감지
│   ├── scalp-analyzer.ts           # 두피 상태 분석
│   ├── style-recommender.ts        # 스타일 추천
│   └── color-harmony.ts            # PC-1 연동 색상 조화도
└── mock/
    └── hair-analysis.ts            # Mock 생성기

app/api/analyze/hair/
└── route.ts                        # API 엔드포인트
```

### 핵심 타입

```typescript
// lib/analysis/hair/types.ts
export type FaceShape = 'oval' | 'round' | 'oblong' | 'square' | 'heart' | 'diamond';
export type HairColorCategory = 'black' | 'dark-brown' | 'medium-brown' | 'light-brown' | 'blonde' | 'red' | 'ash' | 'dyed-vivid';
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';
export type ScalpType = 'dry' | 'normal' | 'oily' | 'sensitive';

export interface HairAnalysisInput {
  imageBase64: string;
  personalColorId?: string;  // PC-1 연동
}

export interface HairAnalysisResult {
  id: string;
  faceShape: FaceShape;
  currentHairColor: {
    category: HairColorCategory;
    labValues: { L: number; a: number; b: number };
  };
  hairType: HairType;
  scalpType: ScalpType;
  healthScores: {
    hydration: number;    // 0-100
    damage: number;       // 0-100 (낮을수록 좋음)
    density: number;      // 0-100
    shine: number;        // 0-100
    elasticity: number;   // 0-100
  };
  scalpScores: {
    oilLevel: number;     // 0-100
    hydration: number;    // 0-100
    sensitivity: number;  // 0-100
  };
  recommendations: {
    colors: HairColorRecommendation[];
    styles: HairStyleRecommendation[];
    care: string[];
  };
  confidence: number;
  usedFallback: boolean;
  createdAt: string;
}

export interface HairColorRecommendation {
  category: HairColorCategory;
  displayName: string;
  labCenter: { L: number; a: number; b: number };
  harmonyScore: number;  // PC-1 기반 조화도
  reason: string;
}

export interface HairStyleRecommendation {
  styleName: string;
  imageUrl?: string;
  suitabilityScore: number;
  reason: string;
}
```

### API 라우트 구현

```typescript
// app/api/analyze/hair/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { analyzeHair } from '@/lib/analysis/hair';
import { checkRateLimit } from '@/lib/security/rate-limit';

const requestSchema = z.object({
  imageBase64: z.string().min(1),
  personalColorId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // 2. Rate Limit 확인
    const { success: rateLimitOk } = await checkRateLimit(userId);
    if (!rateLimitOk) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_ERROR', message: '요청 한도 초과' } },
        { status: 429 }
      );
    }

    // 3. 입력 검증
    const body = await request.json();
    const validated = requestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '입력 검증 실패' } },
        { status: 400 }
      );
    }

    // 4. 헤어 분석 실행 (3초 타임아웃, 2회 재시도, Mock Fallback)
    const result = await analyzeHair(userId, validated.data);

    // 5. 성공 응답
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('[API] POST /analyze/hair error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '분석 중 오류 발생' } },
      { status: 500 }
    );
  }
}
```

### Cross-Module 연동

```typescript
// lib/analysis/hair/internal/color-harmony.ts
import { PersonalColorResult } from '@/lib/analysis/personal-color/types';
import { HairColorCategory, HairColorRecommendation } from '../types';

/**
 * PC-1 결과 기반 헤어컬러 조화도 계산
 * @see ../../../docs/principles/hair-makeup-analysis.md#2.2.3
 */
export function calculateHairColorHarmony(
  season: PersonalColorResult['season'],
  hairColorLab: { L: number; a: number; b: number }
): number {
  const idealCenters = {
    spring: { L: 55, a: 10, b: 25 },
    summer: { L: 45, a: 0, b: 5 },
    autumn: { L: 40, a: 15, b: 20 },
    winter: { L: 25, a: 5, b: 0 },
  };

  const center = idealCenters[season];
  const distance = Math.sqrt(
    Math.pow(hairColorLab.L - center.L, 2) +
    Math.pow(hairColorLab.a - center.a, 2) * 2 +  // a 가중치 2배 (웜/쿨)
    Math.pow(hairColorLab.b - center.b, 2) * 1.5  // b 가중치 1.5배
  );

  return Math.max(0, Math.round(100 - distance * 1.5));
}

/**
 * H-1 → N-1 크로스 모듈 알림 생성
 */
export function generateNutritionAlerts(
  healthScores: HairAnalysisResult['healthScores'],
  scalpScores: HairAnalysisResult['scalpScores']
): CrossModuleAlert[] {
  const alerts: CrossModuleAlert[] = [];

  // 두피 건강 알림
  if (scalpScores.hydration < 40 || scalpScores.sensitivity > 60) {
    alerts.push({
      type: 'scalp_health_nutrition',
      source: 'H-1',
      priority: 'high',
      message: '두피 건강 개선이 필요합니다',
      nutritionSuggestions: ['비오틴', '아연', '오메가-3', '비타민 B군'],
    });
  }

  // 모발 윤기 알림
  if (healthScores.shine < 50) {
    alerts.push({
      type: 'hair_shine_boost',
      source: 'H-1',
      priority: 'medium',
      message: '모발 윤기 개선을 위한 영양소를 추천합니다',
      nutritionSuggestions: ['비타민 E', '실리카', '콜라겐', '철분'],
    });
  }

  // 탈모 예방 알림
  if (healthScores.density < 70) {
    alerts.push({
      type: 'hair_loss_prevention',
      source: 'H-1',
      priority: 'high',
      message: '모발 밀도 감소가 감지되었습니다',
      nutritionSuggestions: ['비오틴', '철분', '비타민 D', '단백질', '아연'],
    });
  }

  return alerts;
}
```

### Mock 생성기

```typescript
// lib/analysis/hair/mock/hair-analysis.ts
import { HairAnalysisInput, HairAnalysisResult } from '../types';

export function generateMockHairAnalysis(input: HairAnalysisInput): HairAnalysisResult {
  const faceShapes = ['oval', 'round', 'oblong', 'square', 'heart', 'diamond'] as const;
  const hairTypes = ['straight', 'wavy', 'curly', 'coily'] as const;
  const scalpTypes = ['dry', 'normal', 'oily', 'sensitive'] as const;

  const randomScore = () => 60 + Math.floor(Math.random() * 30);

  return {
    id: `mock_${Date.now()}`,
    faceShape: faceShapes[Math.floor(Math.random() * faceShapes.length)],
    currentHairColor: {
      category: 'dark-brown',
      labValues: { L: 35, a: 5, b: 12 },
    },
    hairType: hairTypes[Math.floor(Math.random() * hairTypes.length)],
    scalpType: scalpTypes[Math.floor(Math.random() * scalpTypes.length)],
    healthScores: {
      hydration: randomScore(),
      damage: 100 - randomScore(),
      density: randomScore(),
      shine: randomScore(),
      elasticity: randomScore(),
    },
    scalpScores: {
      oilLevel: randomScore(),
      hydration: randomScore(),
      sensitivity: 100 - randomScore(),
    },
    recommendations: {
      colors: [
        {
          category: 'medium-brown',
          displayName: '미디엄 브라운',
          labCenter: { L: 42, a: 8, b: 17 },
          harmonyScore: 85,
          reason: '퍼스널컬러와 조화로운 자연스러운 브라운 톤',
        },
      ],
      styles: [
        {
          styleName: '레이어드 컷',
          suitabilityScore: 88,
          reason: '얼굴형에 맞는 볼륨감 있는 스타일',
        },
      ],
      care: ['보습 샴푸 사용', '주 2회 헤어 마스크'],
    },
    confidence: 0.5,  // Mock 낮은 신뢰도
    usedFallback: true,
    createdAt: new Date().toISOString(),
  };
}
```

## 리서치 티켓

```
[ADR-052-R1] 한국인 얼굴형 분류 정확도 검증
────────────────────────────────────────
리서치 질문:
1. 한국인 얼굴 비율 특성 (서양인 기준 황금비율과의 차이)
2. face-api.js 랜드마크 추출 정확도 (아시아인 데이터셋)
3. 얼굴형 분류 임계값 최적화 방안

예상 출력:
- 한국인 특화 얼굴형 분류 알고리즘 개선안
- 분류 정확도 벤치마크 (목표: 85%+)
```

```
[ADR-052-R2] 헤어컬러 Lab 측정 표준화
────────────────────────────────────
리서치 질문:
1. 헤어 영역 자동 추출 알고리즘 (배경/피부 분리)
2. 조명 조건별 Lab 값 보정 계수
3. 염색 vs 자연색 구분 기준

예상 출력:
- 헤어 영역 마스킹 알고리즘
- 조명 보정 공식 (CIE-3 연동)
```

```
[ADR-052-R3] 모발 건강 지표 AI 프롬프트 최적화
────────────────────────────────────────────
리서치 질문:
1. Gemini VLM으로 모발 윤기/손상도 측정 프롬프트
2. 두피 상태 분석을 위한 이미지 요구사항
3. 신뢰도 점수 산출 기준

예상 출력:
- 헤어 분석 전용 Gemini 프롬프트 템플릿
- Mock 데이터 분포 검증 기준
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 헤어 & 메이크업 분석](../principles/hair-makeup-analysis.md) - 얼굴형 분류, Lab 헤어컬러, 모발 구조

### 관련 ADR
- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - CIE-2 랜드마크 추출
- [ADR-003: AI Model Selection](./ADR-003-ai-model-selection.md) - Gemini 3 Flash 선택
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - 3초 타임아웃, 재시도, Fallback
- [ADR-033: Face Detection Library](./ADR-033-face-detection-library.md) - face-api.js / MediaPipe 선택
- [ADR-026: Color Space HSL Decision](./ADR-026-color-space-hsl-decision.md) - 색공간 선택 원칙

### 구현 스펙
- [SDD-HAIR-ANALYSIS](../specs/SDD-HAIR-ANALYSIS.md) - H-1 모듈 상세 스펙
- [cross-module-insights-hair-makeup](../specs/cross-module-insights-hair-makeup.md) - H-1 → N-1 연동

### 관련 규칙
- [AI Integration](../../.claude/rules/ai-integration.md) - AI 호출 패턴
- [Hybrid Data Pattern](../../.claude/rules/hybrid-data-pattern.md) - Mock Fallback 규칙

---

**Author**: Claude Code
**Reviewed by**: -
