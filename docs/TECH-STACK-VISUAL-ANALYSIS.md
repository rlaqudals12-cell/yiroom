# 기술 스택: 통합 시각 분석 엔진

**버전**: 1.0
**작성일**: 2026-01-04
**관련 SDD**: [SDD-VISUAL-ANALYSIS-ENGINE.md](./SDD-VISUAL-ANALYSIS-ENGINE.md)

---

## 패키지 의존성

### 신규 설치 필요

```bash
# MediaPipe Face Landmarker (얼굴 랜드마크 추출)
npm install @mediapipe/tasks-vision

# 선택: 이미지 해시 (캐싱용)
npm install blueimp-md5
```

### 기존 활용 패키지

| 패키지                  | 버전   | 용도                       |
| ----------------------- | ------ | -------------------------- |
| `next`                  | 16+    | App Router, Dynamic Import |
| `react`                 | 19+    | UI 컴포넌트                |
| `@supabase/supabase-js` | 2.x    | DB 연동                    |
| `lucide-react`          | latest | 아이콘                     |
| `tailwindcss`           | 4.x    | 스타일링                   |

---

## 환경 설정

### 환경 변수 (변경 없음)

기존 Gemini, Supabase 환경변수 그대로 사용:

```bash
# .env.local (변경 없음)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...  # 기존 Gemini
NEXT_PUBLIC_SUPABASE_URL=...          # 기존 Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Next.js 설정

```typescript
// next.config.ts
// Web Worker: Next.js 14+는 native Worker 지원 (worker-loader 불필요)

const nextConfig = {
  // MediaPipe CDN 외부 이미지 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/mediapipe-models/**',
      },
    ],
  },
  // 주의: COEP/COOP 헤더는 Clerk/Supabase와 충돌 가능
  // 분석 페이지에서만 적용하거나, SharedArrayBuffer 미사용 시 생략
  // async headers() { ... }
};

export default nextConfig;
```

**Web Worker 사용법 (Next.js 14+ native)**:

```typescript
// lib/analysis/drape-worker.ts
export function runDrapeAnalysis(...): Promise<DrapeResult[]> {
  return new Promise((resolve) => {
    // native Worker 생성 (worker-loader 불필요)
    const worker = new Worker(
      new URL('./workers/drape-analysis.worker.ts', import.meta.url)
    );
    // ...
  });
}
```

---

## 파일 구조

### lib/analysis/ (신규)

```
lib/
└── analysis/
    ├── index.ts                    # 통합 export
    ├── mediapipe-loader.ts         # MediaPipe 동적 로드
    ├── face-landmark.ts            # 랜드마크 추출 유틸
    ├── skin-heatmap.ts             # 색소 분석 + 히트맵 렌더링
    ├── drape-reflectance.ts        # 드레이프 반사광 효과
    ├── drape-palette.ts            # 16/64/128색 팔레트 정의
    ├── uniformity-measure.ts       # 균일도 측정
    ├── synergy-insight.ts          # S-1 → PC-1 시너지
    ├── device-capability.ts        # 기기 성능 감지
    ├── canvas-utils.ts             # Canvas 최적화 유틸
    └── memory-manager.ts           # 메모리 관리
```

### lib/analysis/workers/ (신규)

```
lib/
└── analysis/
    └── workers/
        └── drape-analysis.worker.ts  # 128색 드레이핑 Web Worker
```

### components/analysis/visual/ (신규)

```
components/
└── analysis/
    └── visual/
        ├── index.ts
        ├── SkinHeatmapCanvas.tsx   # 히트맵 렌더링
        ├── LightModeTab.tsx        # 광원 모드 탭 (일반/편광/UV/피지)
        ├── DrapeSimulator.tsx      # 드레이프 시뮬레이터
        ├── DrapeColorPicker.tsx    # 색상 팔레트 선택
        ├── MetalTestButton.tsx     # 실버/골드 테스트
        ├── UniformityScore.tsx     # 균일도 점수 표시
        ├── SynergyInsightCard.tsx  # 시너지 인사이트
        └── HistoryCompare.tsx      # 히스토리 비교 뷰
```

### types/ (신규)

```
types/
└── visual-analysis.ts              # 타입 정의
```

---

## 타입 정의

```typescript
// types/visual-analysis.ts

/** MediaPipe 랜드마크 좌표 */
export interface FaceLandmark {
  x: number; // 0.0 ~ 1.0 (정규화)
  y: number;
  z: number;
}

/** 기기 성능 티어 */
export type DeviceTier = 'high' | 'medium' | 'low';

/** 기기 성능 정보 */
export interface DeviceCapability {
  tier: DeviceTier;
  drapeColors: 128 | 64 | 16;
  landmarkCount: 468 | 68;
  useGPU: boolean;
}

/** 기기 정보 (DB 저장용) */
export interface DeviceInfo {
  userAgent: string;
  screen: { width: number; height: number };
  memory?: number;
  cores?: number;
}

/** 색소 분석 맵 */
export interface PigmentMaps {
  melanin: Float32Array; // 0.0 ~ 1.0
  hemoglobin: Float32Array; // 0.0 ~ 1.0
}

/** 색소 분석 요약 (DB 저장용) */
export interface PigmentAnalysisSummary {
  melanin_avg: number;
  hemoglobin_avg: number;
  distribution: number[];
}

/** 광원 모드 */
export type LightMode = 'normal' | 'polarized' | 'uv' | 'sebum';

/** 드레이프 결과 */
export interface DrapeResult {
  color: string; // HEX
  uniformity: number; // 낮을수록 좋음
  rank: number;
}

/** 드레이핑 결과 요약 (DB 저장용) */
export interface DrapingResultsSummary {
  best_colors: string[];
  uniformity_scores: Record<string, number>;
  metal_test: MetalType;
}

/** 금속 테스트 타입 */
export type MetalType = 'silver' | 'gold';

/** 분석 모드 */
export type AnalysisMode = 'basic' | 'standard' | 'detailed';

/** 반사광 설정 */
export interface ReflectanceConfig {
  brightness: number; // -100 ~ +100
  saturation: number; // -100 ~ +100
}

/** 시너지 인사이트 */
export interface SynergyInsight {
  message: string;
  colorAdjustment: 'muted' | 'bright' | 'neutral';
  reason: 'high_redness' | 'low_hydration' | 'high_oiliness' | 'normal';
}

/** 시각 분석 데이터 (DB 저장용) */
export interface VisualAnalysisData {
  id: string;
  clerk_user_id: string;
  skin_analysis_id?: string | null;
  personal_color_id?: string | null;
  landmark_data: {
    landmarks: [number, number, number][]; // 튜플 배열 (x, y, z)
    face_oval: number[];
    left_eye: number[];
    right_eye: number[];
  };
  pigment_analysis?: PigmentAnalysisSummary | null;
  draping_results?: DrapingResultsSummary | null;
  synergy_insight?: SynergyInsight | null;
  analysis_mode: AnalysisMode;
  device_tier: DeviceTier;
  device_info: DeviceInfo;
  processing_time_ms: number;
  created_at: string;
}

/** 시각 분석 데이터 생성용 */
export type VisualAnalysisInsert = Omit<VisualAnalysisData, 'id' | 'created_at'>;
```

---

## DB 마이그레이션

### 파일 위치

```
supabase/migrations/
└── 202601050100_analysis_visual_data.sql
```

### 마이그레이션 내용

SDD 문서의 Phase 4 DB 스키마 섹션 참조:

- `analysis_visual_data` 테이블 생성
- 인덱스 4개 (user, skin, color, created)
- RLS 정책 4개 (SELECT, INSERT, UPDATE, DELETE)
- cleanup 함수 (90일 + 5회 제한)

---

## API 라우트

### 신규 엔드포인트

| 메서드 | 경로                           | 용도                |
| ------ | ------------------------------ | ------------------- |
| POST   | `/api/analysis/visual`         | 시각 분석 결과 저장 |
| GET    | `/api/analysis/visual/[id]`    | 단일 분석 조회      |
| GET    | `/api/analysis/visual/history` | 히스토리 조회       |
| DELETE | `/api/analysis/visual/[id]`    | 분석 삭제           |

### Repository 패턴

```typescript
// lib/analysis/repository.ts

export async function saveVisualAnalysis(
  supabase: SupabaseClient,
  data: Omit<VisualAnalysisData, 'id' | 'created_at'>
): Promise<VisualAnalysisData> {
  const { data: result, error } = await supabase
    .from('analysis_visual_data')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getVisualHistory(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit: number = 5
): Promise<VisualAnalysisData[]> {
  const { data, error } = await supabase
    .from('analysis_visual_data')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
```

---

## 페이지 수정

### 피부 분석 페이지

```
app/(main)/analysis/skin/page.tsx
└── 탭 추가: [기본 분석] | [상세 시각화]
    └── LightModeTab 컴포넌트 렌더링
```

### 퍼스널 컬러 페이지

```
app/(main)/analysis/personal-color/page.tsx
└── 탭 추가: [기본 분석] | [드레이핑 시뮬레이션]
    └── DrapeSimulator 컴포넌트 렌더링
```

---

## 성능 고려사항

### 번들 최적화

```typescript
// Dynamic Import 패턴 (분석 페이지에서만 로드)
const SkinHeatmapCanvas = dynamic(
  () => import('@/components/analysis/visual/SkinHeatmapCanvas'),
  { ssr: false, loading: () => <Skeleton /> }
);

const DrapeSimulator = dynamic(
  () => import('@/components/analysis/visual/DrapeSimulator'),
  { ssr: false, loading: () => <Skeleton /> }
);
```

### CDN 캐싱 및 네트워크 의존성

MediaPipe weights 파일은 CDN에서 로드:

- 초기 로드: ~3MB
- 캐시 후: 즉시 로드

**네트워크 장애 대응:**
| 상황 | 대응 |
|------|------|
| CDN 접근 불가 | Mock Fallback 사용 (Gemini 텍스트 분석만) |
| 모델 로드 실패 | 기본 분석 결과 표시 + 사용자 안내 |
| 느린 네트워크 | Progressive Loading (16 → 64 → 128색) |

### SharedArrayBuffer 미사용 정책

**COEP/COOP 헤더 충돌 문제:**

- Clerk OAuth 팝업이 `Cross-Origin-Embedder-Policy` 헤더와 충돌
- Supabase Realtime도 COOP 헤더 영향 받음

**SharedArrayBuffer 미사용 시 영향:**
| 항목 | 영향 | 심각도 |
|------|------|--------|
| MediaPipe WASM | SIMD fallback 사용, 10-20% 느림 | 낮음 |
| Worker 간 통신 | 데이터 복사 필요 (메모리 공유 불가) | 낮음 |
| 사용자 경험 | **거의 차이 없음** | - |

**결론**: SharedArrayBuffer 미사용을 권장. 성능 저하는 미미하며, Clerk/Supabase 호환성 유지가 더 중요.

### Mock Fallback 전략

**필수 구현 파일:**

```
lib/mock/visual-analysis.ts
```

**구현 내용:**

```typescript
// lib/mock/visual-analysis.ts

/**
 * MediaPipe 로드 실패 시 Mock 데이터 생성
 */
export function generateMockPigmentMaps(width: number, height: number): PigmentMaps {
  const pixelCount = width * height;
  // 균일한 평균값으로 채움 (실제 분석 없이)
  return {
    melanin: new Float32Array(pixelCount).fill(0.4),
    hemoglobin: new Float32Array(pixelCount).fill(0.3),
  };
}

/**
 * 드레이핑 분석 실패 시 기본 결과
 */
export function generateMockDrapeResults(): DrapeResult[] {
  return [
    { color: '#FF7F50', uniformity: 15, rank: 1 }, // Coral
    { color: '#E6E6FA', uniformity: 18, rank: 2 }, // Lavender
    { color: '#E2725B', uniformity: 20, rank: 3 }, // Terracotta
  ];
}
```

**Fallback 시나리오:**
| 실패 상황 | Mock 함수 | 사용자 안내 |
|----------|----------|------------|
| MediaPipe 로드 실패 | `generateMockPigmentMaps()` | "상세 시각화는 현재 이용할 수 없어요" |
| 얼굴 감지 실패 | - | "정면 사진을 다시 촬영해주세요" |
| 드레이핑 타임아웃 | `generateMockDrapeResults()` | "기본 분석 결과를 보여드릴게요" |

### Web Worker

128색 드레이핑은 별도 Worker에서 처리:

- 메인 스레드 블로킹 방지
- UI 반응성 유지

---

## 테스트 전략

### 단위 테스트

```
tests/lib/analysis/
├── skin-heatmap.test.ts
├── drape-reflectance.test.ts
├── uniformity-measure.test.ts
├── device-capability.test.ts
└── synergy-insight.test.ts
```

### 컴포넌트 테스트

```
tests/components/analysis/visual/
├── LightModeTab.test.tsx
├── DrapeSimulator.test.tsx
└── SynergyInsightCard.test.tsx
```

### E2E 테스트

```
tests/e2e/
└── visual-analysis.spec.ts
```

---

## 구현 순서

| 순서 | 작업                    | 의존성         |
| ---- | ----------------------- | -------------- |
| 1    | DB 마이그레이션         | -              |
| 2    | 타입 정의               | -              |
| 3    | lib/analysis 유틸리티   | 타입           |
| 4    | S-1+ 컴포넌트           | lib/analysis   |
| 5    | 피부 분석 페이지 통합   | S-1+ 컴포넌트  |
| 6    | PC-1+ 컴포넌트          | lib/analysis   |
| 7    | 퍼스널 컬러 페이지 통합 | PC-1+ 컴포넌트 |
| 8    | 시너지 인사이트         | S-1+, PC-1+    |
| 9    | 테스트 작성             | 전체           |

---

## 참고 링크

- [MediaPipe Face Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)

---

**버전 히스토리**

| 버전 | 날짜       | 변경 내용                                                                                                   |
| ---- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| 1.0  | 2026-01-04 | 초안 작성                                                                                                   |
| 1.1  | 2026-01-04 | worker-loader 제거 (Next.js native), COEP/COOP 주의사항, workers 경로 수정                                  |
| 1.2  | 2026-01-04 | 타입 정의 실제 구현과 동기화 (DeviceInfo, PigmentAnalysisSummary, DrapingResultsSummary, AnalysisMode 추가) |
| 1.3  | 2026-01-04 | SharedArrayBuffer 미사용 정책, Mock Fallback 전략, CDN 네트워크 의존성 상세 추가                            |
