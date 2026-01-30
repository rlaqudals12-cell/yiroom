# 분석 테이블 DB 스키마 (SDD-ANALYSIS-DB-SCHEMA)

> **Version**: 1.0 | **Created**: 2026-01-30
> **Status**: Reference | **Priority**: P3

---

## 1. 개요

### 1.1 목적

이룸 프로젝트의 AI 분석 결과 저장 테이블 스키마를 문서화합니다.

### 1.2 테이블 목록

| 모듈 | 테이블명 | 버전 | RLS | 생성일 |
|------|----------|------|-----|--------|
| **PC-1** | `personal_color_assessments` | v1 | ✅ | Phase 1 |
| **S-1** | `skin_analyses` | v1 | ✅ | Phase 1 |
| **C-1** | `body_analyses` | v1 | ✅ | Phase 1 |
| **H-1** | `hair_analyses` | v1 | ✅ | 2026-01-09 |
| **A-1** | `posture_analyses` | v1 | ✅ | 2026-01-11 |
| **M-1** | `makeup_analyses` | v1 | ✅ | 2026-01-07 |
| **OH-1** | `oral_health_assessments` | - | - | 미생성 |

### 1.3 공통 패턴

모든 분석 테이블은 다음 컬럼을 공통으로 포함:

```sql
-- 필수 컬럼
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
clerk_user_id TEXT NOT NULL,     -- RLS 기준 컬럼
created_at TIMESTAMPTZ DEFAULT NOW(),

-- 선택 컬럼
user_id UUID REFERENCES users(id),  -- 일부 레거시 테이블
updated_at TIMESTAMPTZ DEFAULT NOW()
```

---

## 2. PC-1 퍼스널컬러 (personal_color_assessments)

### 2.1 스키마

```sql
CREATE TABLE public.personal_color_assessments (
    -- 기본 키
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,

    -- 문진 데이터
    questionnaire_answers JSONB NOT NULL,

    -- 이미지 정보
    face_image_url TEXT,

    -- 분석 결과
    season TEXT NOT NULL CHECK (season IN ('Spring', 'Summer', 'Autumn', 'Winter')),
    undertone TEXT CHECK (undertone IN ('Warm', 'Cool', 'Neutral')),
    confidence INT CHECK (confidence >= 0 AND confidence <= 100),

    -- 문진 점수
    season_scores JSONB,

    -- 이미지 분석 결과
    image_analysis JSONB,

    -- 추천 데이터
    best_colors JSONB,
    worst_colors JSONB,
    makeup_recommendations JSONB,
    fashion_recommendations JSONB,

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 JSONB 컬럼 상세

#### questionnaire_answers

```typescript
interface QuestionnaireAnswers {
  veinColor: 'blue' | 'green' | 'mixed';
  jewelryPreference: 'silver' | 'gold' | 'both';
  sunReaction: 'burn' | 'tan' | 'both';
  naturalHairColor: string;
  eyeColor: string;
  // ... 추가 문항
}
```

#### season_scores

```typescript
interface SeasonScores {
  spring: number;  // 0-100
  summer: number;
  autumn: number;
  winter: number;
}
```

#### image_analysis (v2에서 확장)

```typescript
interface ImageAnalysis {
  skinTone: {
    hex: string;
    lab: { L: number; a: number; b: number };
  };
  hairColor: { hex: string; };
  eyeColor: { hex: string; };
  contrast: 'low' | 'medium' | 'high';
  clarity: 'soft' | 'clear';
  // v2 추가
  subType?: 'light' | 'true' | 'dark' | 'bright' | 'muted';
  evidenceReport?: EvidenceReport;
}
```

### 2.3 인덱스

```sql
CREATE INDEX idx_pc_assessments_clerk_user_id ON personal_color_assessments(clerk_user_id);
CREATE INDEX idx_pc_assessments_season ON personal_color_assessments(season);
CREATE INDEX idx_pc_assessments_created_at ON personal_color_assessments(created_at DESC);
```

---

## 3. S-1 피부분석 (skin_analyses)

### 3.1 스키마

```sql
CREATE TABLE public.skin_analyses (
    -- 기본 키
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,

    -- 이미지 정보
    image_url TEXT NOT NULL,

    -- 분석 결과 (7가지 지표)
    skin_type TEXT NOT NULL,
    hydration INT CHECK (hydration >= 0 AND hydration <= 100),
    oil_level INT CHECK (oil_level >= 0 AND oil_level <= 100),
    pores INT CHECK (pores >= 0 AND pores <= 100),
    pigmentation INT CHECK (pigmentation >= 0 AND pigmentation <= 100),
    wrinkles INT CHECK (wrinkles >= 0 AND wrinkles <= 100),
    sensitivity INT CHECK (sensitivity >= 0 AND sensitivity <= 100),

    -- 전체 점수
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

    -- 추천 사항
    recommendations JSONB,
    products JSONB,

    -- 성분 분석
    ingredient_warnings JSONB,

    -- 퍼스널 컬러 연동
    personal_color_season TEXT,
    foundation_recommendation TEXT,

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 skin_type 값

```sql
-- 허용 값 (CHECK 미적용, 애플리케이션 레벨 검증)
'dry'         -- 건성
'oily'        -- 지성
'combination' -- 복합성
'normal'      -- 중성
'sensitive'   -- 민감성
```

### 3.3 JSONB 컬럼 상세

#### recommendations

```typescript
interface Recommendations {
  morning: string[];      // 아침 루틴
  evening: string[];      // 저녁 루틴
  weekly: string[];       // 주간 케어
  lifestyle: string[];    // 생활습관
}
```

#### products

```typescript
interface ProductRecommendations {
  cleansers: Product[];
  moisturizers: Product[];
  serums: Product[];
  sunscreens: Product[];
}

interface Product {
  name: string;
  brand: string;
  reason: string;
  matchRate: number;  // 0-100
}
```

#### ingredient_warnings

```typescript
interface IngredientWarnings {
  avoid: string[];           // 피해야 할 성분
  caution: string[];         // 주의 성분
  recommended: string[];     // 추천 성분
}
```

### 3.4 S-2 확장 컬럼 (202601080300_skin_analyses_extension.sql)

```sql
-- 6존 분석 데이터
zone_analysis JSONB,      -- 6존 개별 점수
vitality_grade TEXT,      -- A-F 등급
skin_age INT,             -- 피부 나이
analysis_version TEXT,    -- '1.0' | '2.0'
```

### 3.5 인덱스

```sql
CREATE INDEX idx_skin_analyses_clerk_user_id ON skin_analyses(clerk_user_id);
CREATE INDEX idx_skin_analyses_created_at ON skin_analyses(created_at DESC);
CREATE INDEX idx_skin_analyses_skin_type ON skin_analyses(skin_type);
```

---

## 4. C-1 체형분석 (body_analyses)

### 4.1 스키마

```sql
CREATE TABLE public.body_analyses (
    -- 기본 키
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,

    -- 이미지 정보
    image_url TEXT NOT NULL,

    -- 기본 측정값
    height DECIMAL(5,2),
    weight DECIMAL(5,2),

    -- 분석 결과
    body_type TEXT NOT NULL,
    shoulder INT CHECK (shoulder >= 0 AND shoulder <= 100),
    waist INT CHECK (waist >= 0 AND waist <= 100),
    hip INT CHECK (hip >= 0 AND hip <= 100),
    ratio DECIMAL(3,2),

    -- 추천 사항
    strengths JSONB,
    improvements JSONB,
    style_recommendations JSONB,

    -- 퍼스널 컬러 연동
    personal_color_season TEXT,
    color_recommendations JSONB,

    -- 목표 설정
    target_weight DECIMAL(5,2),
    target_date DATE,

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 body_type 값

```sql
-- S/W/N 3-Type (현재)
'S' -- Straight (직선형)
'W' -- Wave (웨이브형)
'N' -- Natural (내추럴형)

-- 레거시 8-Type (하위 호환)
'straight'    -- 직선형
'pear'        -- 하체 볼륨
'apple'       -- 상체 볼륨
'hourglass'   -- 모래시계
'rectangle'   -- 직사각형
'inverted'    -- 역삼각형
'oval'        -- 타원형
'athletic'    -- 운동형
```

### 4.3 인덱스

```sql
CREATE INDEX idx_body_analyses_clerk_user_id ON body_analyses(clerk_user_id);
CREATE INDEX idx_body_analyses_created_at ON body_analyses(created_at DESC);
CREATE INDEX idx_body_analyses_body_type ON body_analyses(body_type);
```

---

## 5. H-1 헤어분석 (hair_analyses)

### 5.1 스키마

```sql
CREATE TABLE public.hair_analyses (
    -- 기본 키
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,

    -- 이미지
    image_url TEXT NOT NULL DEFAULT '',

    -- 분석 결과 (기본 분류)
    hair_type TEXT NOT NULL,        -- 'straight' | 'wavy' | 'curly' | 'coily'
    hair_thickness TEXT NOT NULL,   -- 'thin' | 'medium' | 'thick'
    scalp_type TEXT NOT NULL,       -- 'dry' | 'normal' | 'oily'

    -- 지표 점수 (0-100)
    hydration INT CHECK (hydration >= 0 AND hydration <= 100),
    scalp_health INT CHECK (scalp_health >= 0 AND scalp_health <= 100),
    damage_level INT CHECK (damage_level >= 0 AND damage_level <= 100),
    density INT CHECK (density >= 0 AND density <= 100),
    elasticity INT CHECK (elasticity >= 0 AND elasticity <= 100),
    shine INT CHECK (shine >= 0 AND shine <= 100),
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

    -- 결과 데이터 (JSONB)
    concerns JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '{}'::jsonb,

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 hair_type / hair_thickness / scalp_type 값

```sql
-- hair_type
'straight'  -- 직모
'wavy'      -- 웨이브
'curly'     -- 곱슬
'coily'     -- 강한 곱슬

-- hair_thickness
'thin'      -- 가는 모발
'medium'    -- 중간 모발
'thick'     -- 굵은 모발

-- scalp_type
'dry'       -- 건성 두피
'normal'    -- 중성 두피
'oily'      -- 지성 두피
```

### 5.3 JSONB 컬럼 상세

#### concerns

```typescript
type Concerns = string[];
// 예: ['건조함', '손상', '가려움', '비듬']
```

#### recommendations

```typescript
interface Recommendations {
  insight: string;
  shampoo: string[];
  treatment: string[];
  styling: string[];
  lifestyle: string[];
}
```

### 5.4 인덱스

```sql
CREATE INDEX idx_hair_analyses_clerk_user_id ON hair_analyses(clerk_user_id);
CREATE INDEX idx_hair_analyses_created_at ON hair_analyses(created_at DESC);
CREATE INDEX idx_hair_analyses_hair_type ON hair_analyses(hair_type);
```

---

## 6. A-1 자세분석 (posture_analyses)

### 6.1 스키마

```sql
CREATE TABLE public.posture_analyses (
    -- 기본 키
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,

    -- 이미지 정보
    front_image_url TEXT NOT NULL,
    side_image_url TEXT,

    -- 자세 타입
    posture_type TEXT NOT NULL CHECK (posture_type IN (
        'ideal', 'forward_head', 'rounded_shoulders',
        'swayback', 'flatback', 'lordosis'
    )),

    -- 전체 점수 및 신뢰도
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),
    confidence INT CHECK (confidence >= 0 AND confidence <= 100),

    -- 분석 결과 (JSONB)
    front_analysis JSONB,    -- 정면 분석
    side_analysis JSONB,     -- 측면 분석
    concerns JSONB,          -- 문제점
    stretching_recommendations JSONB,  -- 스트레칭 추천

    -- AI 인사이트
    insight TEXT,
    analysis_evidence JSONB,
    image_quality JSONB,

    -- C-1 체형 연동
    body_type TEXT,
    body_type_correlation JSONB,

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 posture_type 값

```sql
'ideal'              -- 이상적 자세
'forward_head'       -- 거북목
'rounded_shoulders'  -- 굽은 어깨
'swayback'           -- 스웨이백
'flatback'           -- 일자허리
'lordosis'           -- 과전만
```

### 6.3 JSONB 컬럼 상세

#### front_analysis

```typescript
interface FrontAnalysis {
  shoulderSymmetry: number;  // 어깨 대칭 (-10 ~ +10)
  pelvisSymmetry: number;    // 골반 대칭
  kneeAlignment: number;     // 무릎 정렬
  footAngle: number;         // 발 각도
}
```

#### side_analysis

```typescript
interface SideAnalysis {
  headForwardAngle: number;   // 목 전방 경사
  thoracicKyphosis: number;   // 흉추 후만
  lumbarLordosis: number;     // 요추 전만
  pelvicTilt: number;         // 골반 기울기
}
```

### 6.4 인덱스

```sql
CREATE INDEX idx_posture_analyses_clerk_user_id ON posture_analyses(clerk_user_id);
CREATE INDEX idx_posture_analyses_created_at ON posture_analyses(created_at DESC);
CREATE INDEX idx_posture_analyses_posture_type ON posture_analyses(posture_type);
CREATE INDEX idx_posture_analyses_body_type ON posture_analyses(body_type);
```

---

## 7. M-1 메이크업분석 (makeup_analyses)

### 7.1 스키마

```sql
CREATE TABLE public.makeup_analyses (
    -- 기본 키
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,

    -- 이미지 정보
    image_url TEXT NOT NULL,

    -- 기본 분석 결과
    undertone TEXT NOT NULL CHECK (undertone IN ('warm', 'cool', 'neutral')),
    eye_shape TEXT NOT NULL CHECK (eye_shape IN (
        'monolid', 'double', 'hooded', 'round', 'almond', 'downturned'
    )),
    lip_shape TEXT NOT NULL CHECK (lip_shape IN (
        'full', 'thin', 'wide', 'small', 'heart', 'asymmetric'
    )),
    face_shape TEXT NOT NULL CHECK (face_shape IN (
        'oval', 'round', 'square', 'heart', 'oblong', 'diamond'
    )),

    -- 피부 상태 지표 (0-100)
    skin_texture INT CHECK (skin_texture >= 0 AND skin_texture <= 100),
    skin_tone_uniformity INT CHECK (skin_tone_uniformity >= 0 AND skin_tone_uniformity <= 100),
    hydration INT CHECK (hydration >= 0 AND hydration <= 100),
    pore_visibility INT CHECK (pore_visibility >= 0 AND pore_visibility <= 100),
    oil_balance INT CHECK (oil_balance >= 0 AND oil_balance <= 100),

    -- 전체 점수
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

    -- 결과 데이터 (JSONB)
    concerns JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '{}'::jsonb,

    -- 메타 정보
    analysis_reliability TEXT DEFAULT 'medium' CHECK (
        analysis_reliability IN ('high', 'medium', 'low')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 분류 값 상세

#### eye_shape

```sql
'monolid'     -- 무쌍
'double'      -- 쌍커풀
'hooded'      -- 속쌍
'round'       -- 동그란 눈
'almond'      -- 아몬드형
'downturned'  -- 처진 눈
```

#### lip_shape

```sql
'full'        -- 도톰한 입술
'thin'        -- 얇은 입술
'wide'        -- 넓은 입술
'small'       -- 작은 입술
'heart'       -- 하트형
'asymmetric'  -- 비대칭
```

#### face_shape

```sql
'oval'     -- 타원형
'round'    -- 둥근형
'square'   -- 사각형
'heart'    -- 하트형
'oblong'   -- 긴 형
'diamond'  -- 다이아몬드형
```

### 7.3 인덱스

```sql
CREATE INDEX idx_makeup_analyses_clerk_user_id ON makeup_analyses(clerk_user_id);
CREATE INDEX idx_makeup_analyses_created_at ON makeup_analyses(created_at DESC);
CREATE INDEX idx_makeup_analyses_undertone ON makeup_analyses(undertone);
```

---

## 8. OH-1 구강건강 (oral_health_assessments) - 미생성

### 8.1 제안 스키마

> **상태**: 마이그레이션 미생성 - 향후 구현 시 참조

```sql
CREATE TABLE public.oral_health_assessments (
    -- 기본 키
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,

    -- 이미지 정보
    image_url TEXT NOT NULL,

    -- 분석 결과
    tooth_color_grade TEXT NOT NULL CHECK (tooth_color_grade IN (
        'A1', 'A2', 'A3', 'A3.5', 'A4',  -- VITA 스케일
        'B1', 'B2', 'B3', 'B4',
        'C1', 'C2', 'C3', 'C4',
        'D2', 'D3', 'D4'
    )),
    gum_health_score INT CHECK (gum_health_score >= 0 AND gum_health_score <= 100),
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

    -- 분석 상세 (JSONB)
    tooth_analysis JSONB,       -- 치아 분석
    gum_analysis JSONB,         -- 잇몸 분석
    whitening_goals JSONB,      -- 미백 목표
    recommendations JSONB,      -- 추천 사항

    -- 메타 정보
    confidence INT CHECK (confidence >= 0 AND confidence <= 100),
    used_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_oral_health_clerk_user_id ON oral_health_assessments(clerk_user_id);
CREATE INDEX idx_oral_health_created_at ON oral_health_assessments(created_at DESC);

-- RLS
ALTER TABLE oral_health_assessments ENABLE ROW LEVEL SECURITY;
```

---

## 9. RLS 정책 패턴

### 9.1 표준 RLS 정책

모든 분석 테이블에 적용되는 표준 패턴:

```sql
-- RLS 활성화
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- 본인 데이터 조회
CREATE POLICY "Users can view own [table] data"
    ON [table_name]
    FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 본인 데이터 생성
CREATE POLICY "Users can insert own [table] data"
    ON [table_name]
    FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 본인 데이터 수정
CREATE POLICY "Users can update own [table] data"
    ON [table_name]
    FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 본인 데이터 삭제
CREATE POLICY "Users can delete own [table] data"
    ON [table_name]
    FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Service role 전체 접근
CREATE POLICY "Service role full access on [table]"
    ON [table_name]
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

### 9.2 JWT 클레임 추출

```sql
-- Clerk JWT에서 user_id 추출
auth.jwt() ->> 'sub'

-- 예: 'user_2abc123def456'
```

---

## 10. 테이블 간 관계

### 10.1 ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         분석 테이블 관계도                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  users                                                                  │
│    │                                                                    │
│    ├──< personal_color_assessments (PC-1)                               │
│    │       │                                                            │
│    │       └── season ──> skin_analyses.personal_color_season           │
│    │       └── season ──> body_analyses.personal_color_season           │
│    │       └── season ──> makeup_analyses (undertone 연동)              │
│    │                                                                    │
│    ├──< skin_analyses (S-1)                                             │
│    │       └── skin_type ──> hair_analyses (두피 연동)                  │
│    │                                                                    │
│    ├──< body_analyses (C-1)                                             │
│    │       └── body_type ──> posture_analyses.body_type                 │
│    │                                                                    │
│    ├──< hair_analyses (H-1)                                             │
│    │       └── face_shape 분석 포함                                     │
│    │                                                                    │
│    ├──< posture_analyses (A-1)                                          │
│    │       └── body_type_correlation (C-1 연동)                         │
│    │                                                                    │
│    ├──< makeup_analyses (M-1)                                           │
│    │       └── undertone ──> PC-1 연동                                  │
│    │       └── face_shape ──> H-1 연동                                  │
│    │                                                                    │
│    └──< oral_health_assessments (OH-1) [미생성]                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

범례:
  ──< : 1:N 관계
  ──> : 논리적 연동 (FK 없음)
```

### 10.2 모듈 간 데이터 연동

| 소스 모듈 | 대상 모듈 | 연동 필드 | 용도 |
|-----------|-----------|-----------|------|
| PC-1 | S-1 | `season` | 파운데이션 추천 |
| PC-1 | C-1 | `season` | 의상 색상 추천 |
| PC-1 | M-1 | `undertone` | 메이크업 컬러 |
| C-1 | A-1 | `body_type` | 자세-체형 상관관계 |
| S-1 | H-1 | `skin_type` | 두피-피부 연관 |
| H-1 | M-1 | `face_shape` | 얼굴형 기반 메이크업 |

---

## 11. 마이그레이션 참조

### 11.1 관련 마이그레이션 파일

| 파일명 | 테이블 | 생성일 |
|--------|--------|--------|
| `00000000000002_phase1_analysis_tables.sql` | PC-1, S-1, C-1 | Phase 1 |
| `202601090200_hair_analyses.sql` | H-1 | 2026-01-09 |
| `20260111_posture_analyses.sql` | A-1 | 2026-01-11 |
| `202601070400_makeup_analyses.sql` | M-1 | 2026-01-07 |
| `202601080300_skin_analyses_extension.sql` | S-2 확장 | 2026-01-08 |
| `202601080100_pc_multi_angle_columns.sql` | PC-2 확장 | 2026-01-08 |

### 11.2 확장 마이그레이션

v2 API용 확장 컬럼은 별도 마이그레이션으로 추가:

```sql
-- 예: S-2 확장 (202601080300_skin_analyses_extension.sql)
ALTER TABLE skin_analyses
  ADD COLUMN IF NOT EXISTS zone_analysis JSONB,
  ADD COLUMN IF NOT EXISTS vitality_grade TEXT,
  ADD COLUMN IF NOT EXISTS skin_age INT,
  ADD COLUMN IF NOT EXISTS analysis_version TEXT DEFAULT '1.0';
```

---

## 12. 관련 문서

- [DATABASE-SCHEMA.md](../DATABASE-SCHEMA.md) - 전체 DB 스키마
- [SDD-API-VERSION-STRATEGY.md](./SDD-API-VERSION-STRATEGY.md) - API 버전 전략
- [db-migration-rules.md](../../.claude/rules/db-migration-rules.md) - 마이그레이션 규칙
- [supabase-db.md](../../.claude/rules/supabase-db.md) - Supabase DB 규칙

---

**Version**: 1.0 | **Author**: Claude Code
