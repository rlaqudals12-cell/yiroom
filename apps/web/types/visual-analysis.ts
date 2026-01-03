/**
 * 시각 분석 엔진 타입 정의
 * @description S-1+ 광원 시뮬레이션, PC-1+ 드레이핑 관련 타입
 */

// ============================================
// MediaPipe 관련 타입
// ============================================

/** MediaPipe 랜드마크 좌표 (정규화된 값) */
export interface FaceLandmark {
  /** X 좌표 (0.0 ~ 1.0) */
  x: number;
  /** Y 좌표 (0.0 ~ 1.0) */
  y: number;
  /** Z 좌표 (깊이) */
  z: number;
}

/** MediaPipe 얼굴 랜드마크 결과 */
export interface FaceLandmarkResult {
  /** 468개 전체 랜드마크 */
  landmarks: FaceLandmark[];
  /** 얼굴 윤곽 인덱스 */
  faceOval: number[];
  /** 왼쪽 눈 인덱스 */
  leftEye: number[];
  /** 오른쪽 눈 인덱스 */
  rightEye: number[];
  /** 입술 인덱스 */
  lips: number[];
}

// ============================================
// 기기 성능 관련 타입
// ============================================

/** 기기 성능 티어 */
export type DeviceTier = 'high' | 'medium' | 'low';

/** 기기 성능 정보 */
export interface DeviceCapability {
  /** 성능 티어 */
  tier: DeviceTier;
  /** 드레이프 색상 수 */
  drapeColors: 128 | 64 | 16;
  /** 랜드마크 수 (저사양은 68개로 제한) */
  landmarkCount: 468 | 68;
  /** GPU 가속 사용 여부 */
  useGPU: boolean;
}

/** 기기 정보 (DB 저장용) */
export interface DeviceInfo {
  userAgent: string;
  screen: {
    width: number;
    height: number;
  };
  memory?: number;
  cores?: number;
}

// ============================================
// S-1+ 광원 시뮬레이션 타입
// ============================================

/** 광원 모드 */
export type LightMode = 'normal' | 'polarized' | 'uv' | 'sebum';

/** 광원 모드 설정 */
export interface LightModeConfig {
  mode: LightMode;
  label: string;
  description: string;
  colorScheme: 'brown' | 'red' | 'yellow' | null;
}

/** 색소 분석 맵 */
export interface PigmentMaps {
  /** 멜라닌 농도 (0.0 ~ 1.0) */
  melanin: Float32Array;
  /** 헤모글로빈 농도 (0.0 ~ 1.0) */
  hemoglobin: Float32Array;
}

/** 색소 분석 요약 (DB 저장용) */
export interface PigmentAnalysisSummary {
  /** 평균 멜라닌 농도 */
  melanin_avg: number;
  /** 평균 헤모글로빈 농도 */
  hemoglobin_avg: number;
  /** 분포 히스토그램 (10구간) */
  distribution: number[];
}

// ============================================
// PC-1+ 드레이핑 시뮬레이션 타입
// ============================================

/** 금속 테스트 타입 */
export type MetalType = 'silver' | 'gold';

/** 반사광 설정 */
export interface ReflectanceConfig {
  /** 밝기 조정 (-100 ~ +100) */
  brightness: number;
  /** 채도 조정 (-100 ~ +100) */
  saturation: number;
}

/** 드레이프 색상 */
export interface DrapeColor {
  /** HEX 색상 코드 */
  hex: string;
  /** 색상 이름 */
  name: string;
  /** 소속 시즌 */
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

/** 드레이프 분석 결과 */
export interface DrapeResult {
  /** 색상 HEX */
  color: string;
  /** 균일도 점수 (낮을수록 좋음) */
  uniformity: number;
  /** 순위 */
  rank: number;
}

/** 드레이핑 결과 요약 (DB 저장용) */
export interface DrapingResultsSummary {
  /** 베스트 컬러 TOP 5 */
  best_colors: string[];
  /** 각 색상별 균일도 점수 */
  uniformity_scores: Record<string, number>;
  /** 금속 테스트 결과 */
  metal_test: MetalType;
}

/** 분석 모드 */
export type AnalysisMode = 'basic' | 'standard' | 'detailed';

// ============================================
// 시너지 인사이트 타입
// ============================================

/** 컬러 조정 방향 */
export type ColorAdjustment = 'muted' | 'bright' | 'neutral';

/** 시너지 인사이트 */
export interface SynergyInsight {
  /** 사용자에게 보여줄 메시지 */
  message: string;
  /** 컬러 조정 방향 */
  colorAdjustment: ColorAdjustment;
  /** 조정 이유 */
  reason: 'high_redness' | 'low_hydration' | 'high_oiliness' | 'normal';
}

// ============================================
// DB 저장용 통합 타입
// ============================================

/** 시각 분석 데이터 (DB Row) */
export interface VisualAnalysisData {
  id: string;
  clerk_user_id: string;
  skin_analysis_id?: string | null;
  personal_color_id?: string | null;
  landmark_data: {
    landmarks: [number, number, number][];
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

/** 시각 분석 데이터 생성용 (id, created_at 제외) */
export type VisualAnalysisInsert = Omit<VisualAnalysisData, 'id' | 'created_at'>;

// ============================================
// UI 컴포넌트 Props 타입
// ============================================

/** 히트맵 캔버스 Props */
export interface SkinHeatmapCanvasProps {
  /** 원본 이미지 */
  image: HTMLImageElement;
  /** 얼굴 마스크 */
  faceMask: Uint8Array;
  /** 색소 맵 */
  pigmentMaps: PigmentMaps;
  /** 현재 광원 모드 */
  lightMode: LightMode;
  /** 히트맵 투명도 (0.0 ~ 1.0) */
  opacity?: number;
  /** 추가 클래스 */
  className?: string;
}

/** 드레이프 시뮬레이터 Props */
export interface DrapeSimulatorProps {
  /** 원본 이미지 */
  image: HTMLImageElement;
  /** 얼굴 마스크 */
  faceMask: Uint8Array;
  /** 기기 성능 정보 */
  deviceCapability: DeviceCapability;
  /** 분석 완료 콜백 */
  onAnalysisComplete?: (results: DrapeResult[]) => void;
  /** 추가 클래스 */
  className?: string;
}

/** 시너지 인사이트 카드 Props */
export interface SynergyInsightCardProps {
  /** 시너지 인사이트 */
  insight: SynergyInsight;
  /** 베스트 컬러 목록 */
  bestColors: DrapeResult[];
  /** 피해야 할 컬러 목록 */
  avoidColors?: string[];
  /** 추가 클래스 */
  className?: string;
}

/** 광원 모드 탭 Props */
export interface LightModeTabProps {
  /** 현재 선택된 모드 */
  activeMode: LightMode;
  /** 모드 변경 핸들러 */
  onModeChange: (mode: LightMode) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}
