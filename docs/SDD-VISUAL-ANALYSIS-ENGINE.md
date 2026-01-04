# SDD: 통합 시각 분석 엔진 (S-1+ / PC-1+)

**버전**: 1.1
**작성일**: 2026-01-04
**최종 검증**: 2026-01-05
**상태**: 🔄 부분 구현 (70%)

> **구현 현황 요약**:
>
> - ✅ lib/analysis: 7/9 모듈 구현 (device-capability, face-landmark, skin-heatmap, drape-reflectance, synergy-insight, memory-manager, mediapipe-loader)
> - ✅ components/analysis/visual: 7/8 컴포넌트 구현
> - ✅ DB 스키마: analysis_visual_data 테이블 완전 구현
> - ⏳ 미구현: drape-palette.ts, uniformity-measure.ts, HistoryCompare.tsx

---

## 개요

### 목표

기존 Gemini AI 기반 분석(S-1, PC-1)에 **시각적 증거 레이어**를 추가하여 사용자에게 과학적 신뢰를 제공한다. 픽셀 단위 분석 근거를 히트맵, 드레이핑 시뮬레이션으로 시각화한다.

### 핵심 철학

> "온전한 나는?" - 피부 상태(S-1)가 퍼스널 컬러(PC-1)에 영향을 주는 **다이나믹 시너지**를 통해 사용자의 현재 상태에 맞는 맞춤 추천 제공

### 모듈 정의

| 코드      | 명칭                    | 설명                                   | 상태                |
| --------- | ----------------------- | -------------------------------------- | ------------------- |
| S-1       | 피부 분석               | Gemini AI 기반 7가지 지표 분석         | ✅ 기존             |
| **S-1+**  | **광원 시뮬레이션**     | 멜라닌/헤모글로빈 히트맵, 광원 모드 탭 | 🆕 신규             |
| PC-1      | 퍼스널 컬러             | Gemini AI 기반 시즌 판정               | ✅ 기존             |
| **PC-1+** | **드레이핑 시뮬레이션** | 16/64/128색 가상 드레이핑, 반사광 효과 | 🆕 신규             |
| C-1       | 체형 분석               | Gemini AI 기반 골격 진단               | ✅ 기존 (변경 없음) |

---

## 기술 아키텍처

### 하이브리드 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    클라이언트 (브라우저)                      │
├─────────────────────────────────────────────────────────────┤
│  1. MediaPipe Face Mesh                                     │
│     ├─ 468개 3D 랜드마크 추출 (15-20ms GPU)                  │
│     ├─ 얼굴 영역 세그멘테이션                                 │
│     └─ 좌표 데이터 JSON 생성                                 │
│                                                             │
│  2. RGB 색소 분석 알고리즘                                    │
│     ├─ 멜라닌 추정: (R - B) × 2                              │
│     ├─ 헤모글로빈 추정: (R - G) × 1.5                        │
│     └─ 픽셀별 농도 맵 생성                                   │
│                                                             │
│  3. Canvas 2D 시각화 레이어                                  │
│     ├─ 히트맵 오버레이 (광원 모드별)                          │
│     ├─ 드레이프 합성 + 반사광 효과                            │
│     └─ Before/After 비교 뷰                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ JSON (랜드마크 + 분석 결과)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      서버 (Next.js API)                      │
├─────────────────────────────────────────────────────────────┤
│  1. Gemini 3 Flash                                          │
│     ├─ 피부 상태 텍스트 분석 (기존 S-1)                       │
│     ├─ 퍼스널 컬러 판정 (기존 PC-1)                          │
│     └─ 시너지 문구 생성 (S-1 → PC-1 연동)                    │
│                                                             │
│  2. Supabase                                                │
│     ├─ skin_analyses (기존)                                 │
│     ├─ personal_color_assessments (기존)                    │
│     └─ analysis_visual_data (신규 - 랜드마크, 색소맵)         │
└─────────────────────────────────────────────────────────────┘
```

### 기술 스택

| 레이어    | 기술                  | 용도                   |
| --------- | --------------------- | ---------------------- |
| 랜드마크  | MediaPipe Face Mesh   | 468개 3D 좌표 추출     |
| 색소 분석 | RGB 근사 알고리즘     | 멜라닌/헤모글로빈 추정 |
| 시각화    | Canvas API            | 히트맵, 드레이프 합성  |
| AI 분석   | Gemini 3 Flash        | 텍스트 인사이트 (기존) |
| DB        | Supabase (PostgreSQL) | 분석 데이터 저장       |

---

## Phase 1: S-1+ 광원 시뮬레이션

### 1.1 광원 모드 탭

사용자가 탭을 전환하여 다른 광원 효과를 확인:

| 탭          | 시각화 대상     | 알고리즘              | 히트맵 색상     |
| ----------- | --------------- | --------------------- | --------------- |
| 일반광      | 원본 이미지     | -                     | -               |
| 편광 (색소) | 멜라닌 농도     | `(R - B) × 2`         | 갈색 그라데이션 |
| UV (혈관)   | 헤모글로빈 농도 | `(R - G) × 1.5`       | 빨강 그라데이션 |
| 피지        | 유분 영역       | Gemini 유분 지수 매핑 | 형광 노랑       |

### 1.2 히트맵 렌더링

```typescript
// lib/analysis/skin-heatmap.ts

interface PigmentMaps {
  melanin: Float32Array; // 0.0 ~ 1.0
  hemoglobin: Float32Array; // 0.0 ~ 1.0
}

/**
 * RGB 이미지에서 색소 분포 추출
 * 참고: PMC10042298 - Deep learning-based optical approach
 */
export function extractPigmentMaps(
  imageData: ImageData,
  faceMask: Uint8Array // MediaPipe 얼굴 영역
): PigmentMaps {
  const { width, height, data } = imageData;
  const pixelCount = width * height;

  const melanin = new Float32Array(pixelCount);
  const hemoglobin = new Float32Array(pixelCount);

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;

    // 얼굴 영역만 분석
    if (faceMask[pixelIndex] === 0) continue;

    const R = data[i] / 255;
    const G = data[i + 1] / 255;
    const B = data[i + 2] / 255;

    // 멜라닌: 갈색 성분 (R-B 차이)
    melanin[pixelIndex] = Math.max(0, Math.min(1, (R - B) * 2));

    // 헤모글로빈: 적색 성분 (R-G 차이)
    hemoglobin[pixelIndex] = Math.max(0, Math.min(1, (R - G) * 1.5));
  }

  return { melanin, hemoglobin };
}

/**
 * 히트맵 오버레이 렌더링
 */
export function renderHeatmapOverlay(
  ctx: CanvasRenderingContext2D,
  pigmentMap: Float32Array,
  width: number,
  height: number,
  colorScheme: 'brown' | 'red' | 'yellow',
  opacity: number = 0.5
): void {
  const imageData = ctx.createImageData(width, height);

  const colors = {
    brown: [139, 69, 19], // 멜라닌
    red: [220, 20, 60], // 헤모글로빈
    yellow: [255, 255, 0], // 피지
  };

  const [baseR, baseG, baseB] = colors[colorScheme];

  for (let i = 0; i < pigmentMap.length; i++) {
    const intensity = pigmentMap[i];
    const idx = i * 4;

    imageData.data[idx] = baseR;
    imageData.data[idx + 1] = baseG;
    imageData.data[idx + 2] = baseB;
    imageData.data[idx + 3] = Math.round(intensity * opacity * 255);
  }

  ctx.putImageData(imageData, 0, 0);
}
```

### 1.3 UI 컴포넌트

```
/analysis/skin (기존 페이지)
└─ 탭 UI
   ├─ [기본 분석] - Gemini 텍스트 결과 (기존)
   └─ [상세 시각화] - 광원 모드 (S-1+)
       ├─ 탭: 일반광 | 편광 | UV | 피지
       ├─ Canvas: 히트맵 오버레이
       ├─ 범례: 색상 = 농도 설명
       └─ 지표 수치: 평균 멜라닌/헤모글로빈 점수
```

---

## Phase 2: PC-1+ 드레이핑 시뮬레이션

### 2.1 드레이프 색상 팔레트

#### 기본 16색 (각 시즌 4색)

| 시즌   | 색상 1             | 색상 2             | 색상 3           | 색상 4           |
| ------ | ------------------ | ------------------ | ---------------- | ---------------- |
| Spring | Coral #FF7F50      | Peach #FFCBA4      | Salmon #FA8072   | Ivory #FFFFF0    |
| Summer | Lavender #E6E6FA   | Rose #FF007F       | Sky Blue #87CEEB | Mint #98FF98     |
| Autumn | Terracotta #E2725B | Olive #808000      | Mustard #FFDB58  | Burgundy #800020 |
| Winter | Fuchsia #FF00FF    | Royal Blue #4169E1 | Emerald #50C878  | Black #000000    |

#### 확장 64/128색

- 64색: 각 시즌 16색 (명도/채도 변형)
- 128색: 전문가 수준 전체 팔레트

### 2.2 반사광 효과 알고리즘

```typescript
// lib/analysis/drape-reflectance.ts

interface ReflectanceConfig {
  brightness: number; // -100 ~ +100
  saturation: number; // -100 ~ +100
}

/**
 * 금속 드레이프 반사광 효과
 * 실버: 쿨톤 강조 (밝게 + 채도 낮춤)
 * 골드: 웜톤 강조 (약간 밝게 + 채도 높임)
 */
export const METAL_REFLECTANCE: Record<'silver' | 'gold', ReflectanceConfig> = {
  silver: { brightness: +10, saturation: -5 },
  gold: { brightness: +5, saturation: +5 },
};

/**
 * 얼굴 영역에 반사광 효과 적용
 */
export function applyReflectance(
  ctx: CanvasRenderingContext2D,
  faceMask: Uint8Array,
  config: ReflectanceConfig
): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    if (faceMask[pixelIndex] === 0) continue;

    // RGB → HSL 변환
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);

    // 밝기/채도 조정
    const newL = Math.max(0, Math.min(1, l + config.brightness / 100));
    const newS = Math.max(0, Math.min(1, s + config.saturation / 100));

    // HSL → RGB 변환
    const [r, g, b] = hslToRgb(h, newS, newL);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
}
```

### 2.3 균일도 측정

```typescript
/**
 * 피부톤 균일도 (표준편차 기반)
 * 낮을수록 균일함 = 해당 색상이 잘 어울림
 */
export function measureUniformity(imageData: ImageData, faceMask: Uint8Array): number {
  const luminances: number[] = [];
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    if (faceMask[pixelIndex] === 0) continue;

    // 휘도 계산 (ITU-R BT.601)
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luminances.push(luminance);
  }

  // 표준편차 계산
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
  const variance = luminances.reduce((sum, val) => sum + (val - mean) ** 2, 0) / luminances.length;

  return Math.sqrt(variance);
}
```

### 2.4 기기별 적응형 드레이프

```typescript
// lib/analysis/device-capability.ts

interface DeviceCapability {
  tier: 'high' | 'medium' | 'low';
  drapeColors: 128 | 64 | 16;
  landmarkCount: 468 | 68;
  useGPU: boolean;
}

export function detectDeviceCapability(): DeviceCapability {
  const isDesktop = window.innerWidth >= 1024;
  const hasWebGL2 = !!document.createElement('canvas').getContext('webgl2');
  const memoryGB = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  // 고사양: 데스크톱 또는 (WebGL2 + 4GB+ + 4코어+)
  if (isDesktop || (hasWebGL2 && memoryGB >= 4 && cores >= 4)) {
    return { tier: 'high', drapeColors: 128, landmarkCount: 468, useGPU: true };
  }

  // 중사양: WebGL2 + 2GB+
  if (hasWebGL2 && memoryGB >= 2) {
    return { tier: 'medium', drapeColors: 64, landmarkCount: 468, useGPU: true };
  }

  // 저사양
  return { tier: 'low', drapeColors: 16, landmarkCount: 68, useGPU: false };
}
```

### 2.5 UI 컴포넌트

```
/analysis/personal-color (기존 페이지)
└─ 탭 UI
   ├─ [기본 분석] - Gemini 시즌 결과 (기존)
   └─ [드레이핑 시뮬레이션] (PC-1+)
       ├─ 금속 테스트: 실버 | 골드 버튼
       ├─ 드레이프 팔레트: 16/64/128색 그리드
       ├─ Canvas: 드레이프 합성 + 반사광
       ├─ 균일도 점수: "이 색상이 가장 잘 어울려요"
       ├─ 분석 모드: 자동 | 빠름(16) | 표준(64) | 상세(128)
       └─ 베스트 TOP 5 색상 추천
```

---

## Phase 3: 다이나믹 시너지

### 3.1 S-1 → PC-1 연동

```typescript
// lib/analysis/synergy-insight.ts

import type { GeminiSkinAnalysisResult } from '@/lib/gemini';
import type { PersonalColorAssessment } from '@/types/analysis';

interface SynergyInsight {
  message: string;
  colorAdjustment: 'muted' | 'bright' | 'neutral';
  reason: string;
}

/**
 * 피부 상태에 따른 컬러 추천 조정
 * 주의: Gemini 결과는 metrics 배열 구조이므로 변환 필요
 */
export function generateSynergyInsight(
  skinAnalysis: GeminiSkinAnalysisResult,
  personalColor: PersonalColorAssessment
): SynergyInsight {
  // metrics 배열을 객체로 변환
  const metricsMap = Object.fromEntries(skinAnalysis.metrics.map((m) => [m.id, m.value]));

  // 기존 DB 컬럼명과 매핑 (sensitivity → redness 대용)
  const redness = metricsMap['sensitivity'] || 0;
  const oiliness = metricsMap['oil'] || 50;
  const hydration = metricsMap['hydration'] || 50;

  // 홍조가 높으면 차분한 뮤트 톤 추천
  if (redness >= 70) {
    return {
      message: `오늘 측정된 붉은 기 지수(${redness}점)가 높아, 평소보다 차분한 뮤트 톤의 컬러를 추천합니다.`,
      colorAdjustment: 'muted',
      reason: 'high_redness',
    };
  }

  // 건조하면 생기있는 브라이트 톤 추천
  if (hydration <= 30) {
    return {
      message: `피부 수분도(${hydration}점)가 낮아, 생기를 더해줄 브라이트 톤을 추천합니다.`,
      colorAdjustment: 'bright',
      reason: 'low_hydration',
    };
  }

  // 피지가 많으면 매트한 뉴트럴 톤 추천
  if (oiliness >= 70) {
    return {
      message: `유분기(${oiliness}점)가 높아, 차분해 보이는 뉴트럴 톤이 잘 어울립니다.`,
      colorAdjustment: 'neutral',
      reason: 'high_oiliness',
    };
  }

  // 기본 상태
  return {
    message: `피부 컨디션이 좋아요! ${personalColor.season} 시즌의 대표 컬러가 잘 어울립니다.`,
    colorAdjustment: 'neutral',
    reason: 'normal',
  };
}
```

### 3.2 통합 리포트 UI

```
┌─────────────────────────────────────────────┐
│  🎨 오늘의 맞춤 컬러 추천                     │
├─────────────────────────────────────────────┤
│  [시너지 인사이트]                           │
│  "오늘 측정된 붉은 기 지수(75점)가 높아,      │
│   평소보다 차분한 뮤트 톤의 컬러를 추천합니다" │
├─────────────────────────────────────────────┤
│  베스트 컬러 TOP 5                           │
│  1. 🟫 더스티 로즈    균일도 12.3           │
│  2. 🟤 모브 핑크      균일도 14.1           │
│  3. 🟣 라벤더 그레이  균일도 15.2           │
│  4. 🔵 슬레이트 블루  균일도 16.8           │
│  5. 🟢 세이지 그린    균일도 17.4           │
├─────────────────────────────────────────────┤
│  오늘 피하면 좋은 컬러                        │
│  ⚠️ 선명한 코랄, 비비드 오렌지                │
│     (홍조가 더 두드러져 보일 수 있어요)        │
└─────────────────────────────────────────────┘
```

---

## Phase 4: 데이터 저장 (3D 확장 대비)

### 4.1 DB 스키마

```sql
-- 신규 테이블: 시각 분석 데이터
CREATE TABLE analysis_visual_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 연결 (둘 중 하나)
  skin_analysis_id UUID REFERENCES skin_analyses(id),
  personal_color_id UUID REFERENCES personal_color_assessments(id),

  -- MediaPipe 랜드마크 (468개 3D 좌표) - 최근 5회만 유지
  landmark_data JSONB NOT NULL,
  -- 예: { "landmarks": [[x, y, z], ...], "face_oval": [...], "left_eye": [...] }

  -- 색소 분석 결과 (S-1+)
  pigment_analysis JSONB,
  -- 예: { "melanin_avg": 0.45, "hemoglobin_avg": 0.32, "distribution": [...] }

  -- 드레이핑 결과 (PC-1+)
  draping_results JSONB,
  -- 예: { "best_colors": ["#FF7F50", ...], "uniformity_scores": {...}, "metal_test": "gold" }

  -- 시너지 분석
  synergy_insight JSONB,
  -- 예: { "message": "...", "color_adjustment": "muted", "reason": "high_redness" }

  -- 메타데이터
  analysis_mode TEXT CHECK (analysis_mode IN ('basic', 'standard', 'detailed')),
  device_tier TEXT CHECK (device_tier IN ('high', 'medium', 'low')),
  device_info JSONB, -- { "userAgent": "...", "screen": {...} }
  processing_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- RLS 연결
  CONSTRAINT fk_user FOREIGN KEY (clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_visual_data_user ON analysis_visual_data(clerk_user_id);
CREATE INDEX idx_visual_data_skin ON analysis_visual_data(skin_analysis_id);
CREATE INDEX idx_visual_data_color ON analysis_visual_data(personal_color_id);
CREATE INDEX idx_visual_data_created ON analysis_visual_data(created_at DESC);

-- RLS 정책 (SELECT, INSERT, UPDATE, DELETE 모두 포함)
ALTER TABLE analysis_visual_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visual data" ON analysis_visual_data
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own visual data" ON analysis_visual_data
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own visual data" ON analysis_visual_data
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own visual data" ON analysis_visual_data
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 랜드마크 데이터 정리 함수 (사용자당 최근 5회만 유지)
CREATE OR REPLACE FUNCTION cleanup_old_visual_data()
RETURNS void AS $$
BEGIN
  -- 90일 이상 된 데이터 삭제
  DELETE FROM analysis_visual_data
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- 사용자당 최근 5회 초과 데이터 삭제 (랜드마크 용량 관리)
  DELETE FROM analysis_visual_data
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY clerk_user_id ORDER BY created_at DESC
      ) as rn
      FROM analysis_visual_data
    ) ranked
    WHERE rn > 5
  );
END;
$$ LANGUAGE plpgsql;
```

### 4.2 히스토리 관리

| 설정         | 값       | 근거                 |
| ------------ | -------- | -------------------- |
| 저장 기간    | 90일     | 피부 사이클 28일 × 3 |
| 최대 분석 수 | 30회     | 주 1회 × 7개월       |
| 비교 뷰 표시 | 최근 5회 | UI 복잡도 제한       |

### 4.3 3D 확장 로드맵

```
Phase 4 완료 후:
├─ 468개 랜드마크 데이터 축적
├─ Ready Player Me 무료 SDK 연동 테스트
└─ 자체 3D 모델 개발 검토 (Three.js)

3D 전환 시:
├─ landmark_data JSONB → 3D 메쉬 생성
├─ pigment_analysis → 3D 텍스처 매핑
└─ draping_results → 3D 의상 합성
```

---

## 구현 계획

### 파일 구조

```
lib/
├─ analysis/
│   ├─ mediapipe-loader.ts      # MediaPipe 동적 로드
│   ├─ face-landmark.ts         # 랜드마크 추출
│   ├─ skin-heatmap.ts          # 색소 분석 + 히트맵
│   ├─ drape-reflectance.ts     # 드레이프 반사광
│   ├─ drape-palette.ts         # 16/64/128색 팔레트
│   ├─ uniformity-measure.ts    # 균일도 측정
│   ├─ synergy-insight.ts       # S-1 → PC-1 시너지
│   ├─ device-capability.ts     # 기기 성능 감지
│   └─ index.ts

components/
├─ analysis/
│   ├─ visual/
│   │   ├─ SkinHeatmapCanvas.tsx
│   │   ├─ LightModeTab.tsx
│   │   ├─ DrapeSimulator.tsx
│   │   ├─ DrapeColorPicker.tsx
│   │   ├─ MetalTestButton.tsx
│   │   ├─ UniformityScore.tsx
│   │   ├─ SynergyInsightCard.tsx
│   │   ├─ HistoryCompare.tsx
│   │   └─ index.ts

app/(main)/analysis/
├─ skin/
│   └─ page.tsx                 # 탭 추가: [기본] [상세 시각화]
├─ personal-color/
│   └─ page.tsx                 # 탭 추가: [기본] [드레이핑]

types/
├─ visual-analysis.ts           # 타입 정의

supabase/migrations/
└─ 202601050100_analysis_visual_data.sql
```

### 개발 일정

| Phase  | 내용                      | 예상 기간  |
| ------ | ------------------------- | ---------- |
| 1      | S-1+ 광원 시뮬레이션      | 1주        |
| 2      | PC-1+ 드레이핑 시뮬레이션 | 1.5주      |
| 3      | 다이나믹 시너지           | 3일        |
| 4      | DB 스키마 + 히스토리      | 2일        |
| -      | 테스트 + 버그 수정        | 3일        |
| **총** |                           | **약 3주** |

---

## 성능 최적화

### 번들 사이즈 관리

```typescript
// lib/analysis/mediapipe-loader.ts
// MediaPipe 동적 로드 (분석 페이지 진입 시에만)

let faceLandmarkerInstance: FaceLandmarker | null = null;

export async function loadMediaPipe(): Promise<FaceLandmarker> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;

  // 동적 import로 ~3MB weights 지연 로드
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU', // GPU 우선, 실패시 CPU 자동 폴백
    },
    runningMode: 'IMAGE',
    numFaces: 1,
  });

  return faceLandmarkerInstance;
}
```

### Canvas 최적화

```typescript
// lib/analysis/canvas-utils.ts

/**
 * 최적화된 Canvas 컨텍스트 생성
 * - willReadFrequently: getImageData 최적화
 * - alpha: false로 투명도 처리 비용 절감
 */
export function createOptimizedCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true, // getImageData 성능 최적화
    alpha: false, // 투명도 미사용 시 성능 향상
  })!;

  return { canvas, ctx };
}

/**
 * OffscreenCanvas로 메인 스레드 블로킹 방지
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}
```

### Web Worker 분리 (128색 드레이핑)

```typescript
// workers/drape-analysis.worker.ts

self.onmessage = async (event: MessageEvent) => {
  const { imageData, palette, faceMask } = event.data;

  const results = [];
  for (const color of palette) {
    const uniformity = calculateUniformity(imageData, faceMask, color);
    results.push({ color, uniformity });
  }

  // 균일도 순 정렬
  results.sort((a, b) => a.uniformity - b.uniformity);

  self.postMessage({ type: 'complete', results });
};

// lib/analysis/drape-worker.ts
export function runDrapeAnalysis(
  imageData: ImageData,
  palette: string[],
  faceMask: Uint8Array
): Promise<DrapeResult[]> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/drape-analysis.worker.ts', import.meta.url));

    worker.onmessage = (event) => {
      if (event.data.type === 'complete') {
        resolve(event.data.results);
        worker.terminate();
      }
    };

    worker.postMessage({ imageData, palette, faceMask });
  });
}
```

### Progressive Loading UX

```typescript
// components/analysis/visual/DrapeSimulator.tsx

export function DrapeSimulator({ image, faceMask }: Props) {
  const [results, setResults] = useState<DrapeResult[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function analyze() {
      // 1단계: 16색 빠른 분석 (즉시 표시)
      const quick16 = await analyzeDrape(image, PALETTE_16, faceMask);
      setResults(quick16);
      setProgress(20);

      // 기기 성능 확인
      const capability = detectDeviceCapability();
      if (capability.drapeColors <= 16) return;

      // 2단계: 64색 확장
      const medium64 = await analyzeDrape(image, PALETTE_64, faceMask);
      setResults(medium64);
      setProgress(60);

      if (capability.drapeColors <= 64) return;

      // 3단계: 128색 상세 (Web Worker)
      const detailed128 = await runDrapeAnalysis(image, PALETTE_128, faceMask);
      setResults(detailed128);
      setProgress(100);
    }

    analyze();
  }, [image, faceMask]);

  return (
    <div>
      {progress < 100 && (
        <div className="text-sm text-muted-foreground">
          {progress < 20 && '빠른 분석 중...'}
          {progress >= 20 && progress < 60 && '표준 분석 중...'}
          {progress >= 60 && progress < 100 && '상세 분석 중...'}
        </div>
      )}
      <DrapeResultGrid results={results} />
    </div>
  );
}
```

### 메모리 관리

```typescript
// lib/analysis/memory-manager.ts

/**
 * 분석 완료 후 리소스 정리
 */
export function cleanupAnalysisResources(
  imageData?: ImageData,
  canvasCtx?: CanvasRenderingContext2D
): void {
  // ImageData 참조 해제
  if (imageData) {
    (imageData as any).data = null;
  }

  // Canvas 정리
  if (canvasCtx) {
    const canvas = canvasCtx.canvas;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * 세션 내 결과 캐싱
 */
const analysisCache = new Map<string, AnalysisResult>();

export function getCachedResult(imageHash: string): AnalysisResult | null {
  return analysisCache.get(imageHash) || null;
}

export function cacheResult(imageHash: string, result: AnalysisResult): void {
  // 최대 5개 캐시 유지
  if (analysisCache.size >= 5) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  analysisCache.set(imageHash, result);
}
```

### 성능 메트릭

| 기기 티어 | MediaPipe | 색소 분석 | 드레이핑      | 총 시간 |
| --------- | --------- | --------- | ------------- | ------- |
| High      | 15ms      | 10ms      | 400ms (128색) | ~500ms  |
| Medium    | 20ms      | 15ms      | 200ms (64색)  | ~300ms  |
| Low       | 50ms      | 30ms      | 50ms (16색)   | ~200ms  |

---

## 에러 처리

| 실패 상황              | Fallback                  | 사용자 안내                                |
| ---------------------- | ------------------------- | ------------------------------------------ |
| MediaPipe 로드 실패    | Gemini 텍스트 분석만 표시 | "상세 시각화는 현재 이용할 수 없어요"      |
| 얼굴 감지 실패         | 재촬영 요청               | "얼굴이 잘 보이도록 정면으로 촬영해주세요" |
| 드레이핑 연산 타임아웃 | 기본 16색 결과만 표시     | "기본 분석 결과를 보여드릴게요"            |
| WebGL 미지원           | CPU 모드 + 68 랜드마크    | 무음 처리 (사용자 인지 불필요)             |
| 메모리 부족            | 16색 모드 자동 전환       | "기기 성능에 맞게 조정했어요"              |

---

## 참고 자료

### 학술 논문

- [Deep learning-based optical approach for skin analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC10042298/) - 멜라닌/헤모글로빈 분석
- [Integrated approach for cross-polarized images](https://pmc.ncbi.nlm.nih.gov/articles/PMC11502720/) - 2024 최신 연구
- [NIST Reflectance Measurements of Human Skin](https://www.nist.gov/programs-projects/reflectance-measurements-human-skin)

### 기술 문서

- [MediaPipe Face Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- [SkinTracker - Dermatology Mobile App](https://pmc.ncbi.nlm.nih.gov/articles/PMC10516539/) - 히스토리 UX

### 컬러 분석

- [Personal Color Analysis - Gold or Silver](https://www.thechicfashionista.com/gold-or-silver-color-analysis/)
- [Color Analysis Wikipedia](https://en.wikipedia.org/wiki/Color_analysis)

---

**버전 히스토리**

| 버전 | 날짜       | 변경 내용                                                            |
| ---- | ---------- | -------------------------------------------------------------------- |
| 1.0  | 2026-01-04 | 초안 작성                                                            |
| 1.1  | 2026-01-04 | 성능 최적화 섹션 추가 (Web Worker, Progressive Loading, 메모리 관리) |
| 1.2  | 2026-01-04 | 에러 처리 사용자 안내 메시지 추가                                    |
