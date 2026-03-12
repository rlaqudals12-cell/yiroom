# SDD-MAKEUP-ENGINE: M-1 메이크업 분석 + Virtual Try-On 엔진

> **Status**: Active | **Version**: 1.0 | **Date**: 2026-03-12
> **ADR**: [ADR-053](../adr/ADR-053-makeup-analysis.md)
> **원리**: [hair-makeup.md](../principles/hair-makeup.md)

---

## 1. 개요

M-1 메이크업 모듈은 두 가지 핵심 시스템으로 구성:

1. **AI 메이크업 분석** — Gemini 3 Flash 기반 얼굴 형태/피부 분석 + 메이크업 추천
2. **Virtual Try-On (VTO)** — Canvas 기반 클라이언트 사이드 메이크업 시뮬레이션 (5 엔진)

### 궁극의 형태 (P1)

- **100점**: AR 실시간 메이크업 + AI 개인화 추천 + 제품 매칭 + 구매 전환
- **현재 목표**: 85% (AI 분석 + 정적 이미지 VTO + 색상 추천)
- **의도적 제외**: AR 실시간 (Phase 2), 3D 컨투어링 (Phase 2)

---

## 2. 데이터 모델

### 2.1 AI 분석 결과 타입

```typescript
interface MakeupAnalysisResult {
  // 형태 분류
  undertone: 'warm' | 'cool' | 'neutral';
  eyeShape: 'monolid' | 'double' | 'hooded' | 'round' | 'almond' | 'downturned';
  lipShape: 'full' | 'thin' | 'wide' | 'small' | 'heart' | 'asymmetric';
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';

  // 피부 메트릭 (0-100)
  overallScore: number;
  metrics: MakeupMetric[]; // skinTexture, skinTone, hydration, poreVisibility, oilBalance

  // 인사이트
  concerns: MakeupConcernType[]; // 8종
  recommendedStyles: MakeupStyleType[]; // 6종
  colorRecommendations: ColorRecommendation[]; // 5 카테고리
  makeupTips: MakeupTip[];

  // PC-1 연동
  personalColorConnection?: { season; compatibility; note };

  // 메타
  analyzedAt: Date;
  analysisReliability: 'high' | 'medium' | 'low';
  usedFallback: boolean;
}
```

### 2.2 VTO 설정 타입

```typescript
interface MakeupConfig {
  type: 'lip' | 'blush' | 'eyeshadow' | 'foundation' | 'hair-color';
  color: RgbaColor; // { r, g, b, a }
  opacity: number; // 0.0-1.0
  featherRadius?: number; // px
}

interface EyeshadowConfig extends MakeupConfig {
  secondaryColor?: RgbaColor; // 듀얼 그래디언트
}

interface FoundationConfig extends MakeupConfig {
  // 기본값: opacity=0.25, featherRadius=5
}

interface HairColorConfig {
  targetHsl: { h; s; l }; // HSL 색공간 (0-1)
  intensity: number;
}
```

---

## 3. AI 분석 파이프라인

### 3.1 엔드포인트

```
POST /api/analyze/makeup
Authorization: Bearer {clerk_token}
Rate Limit: 50 req/24h/user
```

### 3.2 파이프라인

```
이미지 입력 → Clerk 인증 → Rate Limit → Gemini 3 Flash 분석
                                              ↓ (3초 타임아웃, 2회 재시도)
                                         실패 시 Mock Fallback
                                              ↓
                                    Zod 스키마 검증 → DB 저장
                                              ↓
                                    게이미피케이션 (15 XP) + 크로스모듈 알림
```

### 3.3 크로스모듈 알림

| 트리거         | 알림                     | CTA           |
| -------------- | ------------------------ | ------------- |
| 피부 고민 감지 | 비타민 C + 항산화 영양소 | → 영양 페이지 |
| 탄력 점수 < 60 | 콜라겐 + 수분 보충       | → 제품 페이지 |

---

## 4. Virtual Try-On 엔진

### 4.1 공통 알고리즘

**MediaPipe 468 랜드마크** → 영역 추출 → 스캔라인 폴리곤 채움 → 알파 블렌딩

```
output[i] = original[i] × (1 - α) + color[i] × α
α = opacity × mask_strength × edge_falloff
```

### 4.2 립 엔진

| 항목        | 값                                    |
| ----------- | ------------------------------------- |
| 랜드마크    | `LIPS_INDICES` (20개)                 |
| 기본 투명도 | 0.55                                  |
| 페더링      | 2px (박스 블러)                       |
| 프리셋      | 12색 (Coral Pink, Rose, Red, Wine 등) |

### 4.3 파운데이션 엔진

| 항목        | 값                                     |
| ----------- | -------------------------------------- |
| 랜드마크    | `FACE_OVAL_INDICES` (51개)             |
| 제외 영역   | 눈 (33×2), 입술 (20)                   |
| 기본 투명도 | 0.25 (쉬어 커버리지)                   |
| 에지 페이드 | 타원형 falloff (0.7 지점부터 2차 감쇄) |
| 프리셋      | 12색 (Warm/Cool/Neutral 언더톤별)      |

```
normalized_dist = sqrt((x-cx)²/rx² + (y-cy)²/ry²)
if dist > 0.7: edgeFalloff = max(0, 1 - (dist-0.7)/0.3)²
```

### 4.4 아이섀도 엔진

| 항목            | 값                                |
| --------------- | --------------------------------- |
| 랜드마크        | 눈 (33×2) + 눈썹 (5×2)            |
| 기본 투명도     | 0.4                               |
| 수직 그래디언트 | `t²` (위→아래 강도 증가)          |
| 듀얼 컬러       | 수평 50% 지점에서 1차↔2차 색 보간 |
| 프리셋          | 10색 (단색 8 + 듀얼 2)            |

### 4.5 블러셔 엔진

| 항목        | 값                                                 |
| ----------- | -------------------------------------------------- |
| 랜드마크    | 광대뼈 중심 (L:116, R:345)                         |
| 기본 투명도 | 0.3 (빌드업 가능)                                  |
| 마스크      | 타원형 가우시안: `exp(-d × 3)`                     |
| 프리셋      | 6색 (Peach, Coral, Pink, Rose, Lavender, Sunburnt) |

### 4.6 헤어 엔진

| 항목   | 값                              |
| ------ | ------------------------------- |
| 색공간 | HSL (밝기 보존)                 |
| 프리셋 | 10색 (Natural Brown ~ Burgundy) |

---

## 5. DB 스키마

```sql
CREATE TABLE makeup_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  undertone TEXT, eye_shape TEXT, lip_shape TEXT, face_shape TEXT,
  skin_texture SMALLINT, skin_tone_uniformity SMALLINT,
  hydration SMALLINT, pore_visibility SMALLINT, oil_balance SMALLINT,
  overall_score SMALLINT,
  concerns TEXT[] DEFAULT '{}',
  recommendations JSONB,
  analysis_reliability TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: clerk_user_id = auth.get_user_id()
```

---

## 5.5 에러 처리 매트릭스

| 에러 상황          | HTTP | 에러 코드        | 사용자 메시지           | 처리                         |
| ------------------ | ---- | ---------------- | ----------------------- | ---------------------------- |
| 미인증             | 401  | AUTH_ERROR       | "로그인이 필요합니다"   | Clerk auth 실패              |
| Rate Limit 초과    | 429  | RATE_LIMIT_ERROR | "요청이 너무 많습니다"  | 50 req/24h                   |
| 이미지 없음/불량   | 400  | VALIDATION_ERROR | "이미지를 확인해주세요" | Zod 검증 실패                |
| Gemini 타임아웃    | 200  | -                | 정상 반환 (Mock)        | 3초 타임아웃 → Mock Fallback |
| Gemini 파싱 실패   | 200  | -                | 정상 반환 (Mock)        | Zod 검증 → 유효값만 필터     |
| DB 저장 실패       | 200  | -                | 정상 반환               | `dbSaveFailed: true` 플래그  |
| 이미지 업로드 실패 | 200  | -                | 정상 반환               | 비차단, 로그만 기록          |

### 5.6 입력 검증 규칙

```typescript
// Zod 검증 (API route)
imageBase64: z.string().min(1)  // 필수
useMock: z.boolean().optional() // 개발용

// Gemini 응답 후처리 (유효값만 필터)
concerns → MakeupConcernType[] (8종) 외 제거
recommendedStyles → MakeupStyleType[] (6종) 외 제거
colorRecommendations.category → MakeupCategoryType (5종) 외 제거
```

### 5.7 Gemini 프롬프트 전략

- **Temperature**: 0.1 (결정적 분석)
- **구조화 출력**: JSON 형식 지정 → `jsonRepair()` → Zod 검증
- **입력**: Base64 JPEG 이미지 1장
- **출력 필드**: 얼굴 형태 4종 + 피부 메트릭 5종 + 고민/스타일/색상/팁
- **신뢰도**: Gemini가 자체 평가 ('high'|'medium'|'low')

---

## 6. 파일 구조

```
lib/analysis/makeup/
├── index.ts              # Barrel export (타입 + 라벨 + Mock)
├── types.ts              # MakeupAnalysisResult, 열거형, 라벨
└── (API route에서 직접 Gemini 호출)

lib/virtual-try-on/
├── lip-engine.ts         # 립 오버레이
├── foundation-engine.ts  # 파운데이션 오버레이
├── eyeshadow-engine.ts   # 아이섀도 오버레이
├── blush-engine.ts       # 블러셔 오버레이
├── hair-engine.ts        # 헤어 컬러 오버레이
├── types.ts              # VTO 공통 타입
├── face-landmarks.ts     # MediaPipe 랜드마크 추출
└── index.ts              # Barrel export

lib/mock/makeup-analysis.ts  # AI Fallback Mock 생성
```

---

## 7. 테스트 전략

| 레벨     | 대상                              | 파일                                |
| -------- | --------------------------------- | ----------------------------------- |
| 단위     | Mock 생성, 타입 검증, 색상 프리셋 | `tests/lib/analysis/makeup/`        |
| 단위     | VTO 엔진 블렌딩 로직              | `tests/lib/virtual-try-on/`         |
| API      | 인증, Rate Limit, Zod 검증        | `tests/api/analyze/makeup.test.ts`  |
| 컴포넌트 | MakeupResultCard 렌더링           | `tests/components/analysis/makeup/` |

---

## 8. 성능 목표

| 지표          | 목표                    |
| ------------- | ----------------------- |
| AI 분석 응답  | < 3s (p95)              |
| VTO 렌더링    | < 500ms (1024px 이미지) |
| 랜드마크 추출 | < 200ms                 |
| Mock Fallback | < 10ms                  |

---

**Version**: 1.0 | **Created**: 2026-03-12
