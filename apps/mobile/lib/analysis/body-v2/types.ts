/**
 * Body Analysis V2 타입 정의
 * MediaPipe 33 랜드마크 기반 체형 분석
 *
 * @description C-2 체형분석 v2
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
 * @see docs/principles/body-mechanics.md
 */

/** 3D 포인트 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/** MediaPipe 33 랜드마크 */
export interface Landmark33 extends Point3D {
  /** 가시성 (0-1) */
  visibility: number;
}

/** MediaPipe Pose 랜드마크 인덱스 */
export const POSE_LANDMARK_INDEX = {
  // 얼굴
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  // 상체
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  // 하체
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/** 포즈 감지 결과 */
export interface PoseDetectionResult {
  /** 33개 랜드마크 */
  landmarks: Landmark33[];
  /** 전체 가시성 점수 */
  overallVisibility: number;
  /** 감지 신뢰도 */
  confidence: number;
}

/** 체형 비율 */
export interface BodyRatios {
  /** 어깨 너비 (cm 추정) */
  shoulderWidth: number;
  /** 허리 너비 (cm 추정) */
  waistWidth: number;
  /** 힙 너비 (cm 추정) */
  hipWidth: number;
  /** 어깨-허리 비율 */
  shoulderToWaistRatio: number;
  /** 허리-힙 비율 */
  waistToHipRatio: number;
  /** 상체 길이 (어깨-힙) */
  upperBodyLength: number;
  /** 하체 길이 (힙-발목) */
  lowerBodyLength: number;
  /** 상하체 비율 */
  upperToLowerRatio: number;
  /** 팔 길이 (어깨-손목) */
  armLength: number;
  /** 다리 길이 (힙-발목) */
  legLength: number;
  /** 팔-상체 비율 */
  armToTorsoRatio: number;
}

/** 체형 유형 */
export type BodyShapeType =
  | 'rectangle'         // 사각형 (일자)
  | 'inverted-triangle' // 역삼각형
  | 'triangle'          // 삼각형 (배형)
  | 'oval'              // 타원형
  | 'hourglass';        // 모래시계형

/** 체형 정보 */
export interface BodyShapeInfo {
  type: BodyShapeType;
  label: string;
  description: string;
  characteristics: string[];
  stylingTips: string[];
}

/** 체형별 정보 */
export const BODY_SHAPE_INFO: Record<BodyShapeType, Omit<BodyShapeInfo, 'type'>> = {
  rectangle: {
    label: '직사각형',
    description: '어깨, 허리, 힙이 비슷한 너비',
    characteristics: [
      '상하체 균형이 좋음',
      '허리 라인이 잘 드러나지 않음',
      '전체적으로 일자 실루엣',
    ],
    stylingTips: [
      '허리를 강조하는 벨트 활용',
      '레이어드 스타일링으로 입체감 추가',
      'A라인 스커트/드레스 추천',
    ],
  },
  'inverted-triangle': {
    label: '역삼각형',
    description: '어깨가 넓고 힙이 좁음',
    characteristics: [
      '넓은 어깨와 좁은 힙',
      '상체가 발달',
      'V자 실루엣',
    ],
    stylingTips: [
      '하체 볼륨을 주는 와이드 팬츠',
      '어깨 패드 없는 상의',
      'A라인 하의로 균형 맞추기',
    ],
  },
  triangle: {
    label: '삼각형',
    description: '힙이 어깨보다 넓음',
    characteristics: [
      '좁은 어깨와 넓은 힙',
      '하체가 발달',
      'A자 실루엣',
    ],
    stylingTips: [
      '어깨 볼륨을 주는 상의',
      '보트넥, 오프숄더 추천',
      '다크 컬러 하의로 시각적 균형',
    ],
  },
  oval: {
    label: '타원형',
    description: '허리가 가장 넓은 체형',
    characteristics: [
      '중심부가 가장 넓음',
      '부드러운 곡선 실루엣',
      '사지가 상대적으로 가늘음',
    ],
    stylingTips: [
      '세로선을 강조하는 디자인',
      '허리를 너무 강조하지 않기',
      'V넥, 롱 카디건 활용',
    ],
  },
  hourglass: {
    label: '모래시계형',
    description: '어깨와 힙이 비슷하고 허리가 잘록함',
    characteristics: [
      '균형 잡힌 상하체',
      '잘록한 허리 라인',
      '여성스러운 곡선 실루엣',
    ],
    stylingTips: [
      '허리를 강조하는 핏',
      '바디컨 실루엣',
      '랩 드레스, 하이웨이스트 추천',
    ],
  },
};

/** 자세 분석 */
export interface PostureAnalysis {
  /** 어깨 기울기 (도) */
  shoulderTilt: number;
  /** 골반 기울기 (도) */
  hipTilt: number;
  /** 척추 정렬 점수 (0-100) */
  spineAlignment: number;
  /** 머리 위치 (전방/중립/후방) */
  headPosition: 'forward' | 'neutral' | 'backward';
  /** 자세 문제점 */
  issues: PostureIssue[];
}

/** 자세 문제 */
export interface PostureIssue {
  /** 문제 유형 */
  type: 'shoulder-imbalance' | 'hip-imbalance' | 'forward-head' | 'rounded-shoulders' | 'lordosis' | 'kyphosis';
  /** 심각도 (1-5) */
  severity: number;
  /** 설명 */
  description: string;
  /** 교정 운동 추천 */
  exercises: string[];
}

/** C-2 분석 입력 */
export interface BodyAnalysisV2Input {
  /** Base64 인코딩 이미지 */
  imageBase64: string;
  /** 실제 키 (cm, 선택) */
  heightCm?: number;
  /** 분석 옵션 */
  options?: {
    /** 자세 분석 포함 */
    includePostureAnalysis?: boolean;
    /** 스타일링 추천 포함 */
    includeStylingRecommendations?: boolean;
  };
}

/** C-2 분석 결과 */
export interface BodyAnalysisV2Result {
  /** 결과 ID */
  id: string;
  /** 포즈 감지 결과 */
  poseDetection: PoseDetectionResult;
  /** 체형 비율 */
  bodyRatios: BodyRatios;
  /** 체형 유형 */
  bodyShape: BodyShapeType;
  /** 체형 정보 */
  bodyShapeInfo: BodyShapeInfo;
  /** 자세 분석 (선택적) */
  postureAnalysis?: PostureAnalysis;
  /** 스타일링 추천 */
  stylingRecommendations?: {
    /** 상의 추천 */
    tops: string[];
    /** 하의 추천 */
    bottoms: string[];
    /** 아우터 추천 */
    outerwear: string[];
    /** 전체 실루엣 추천 */
    silhouettes: string[];
    /** 피해야 할 스타일 */
    avoid: string[];
  };
  /** 측정 신뢰도 */
  measurementConfidence: number;
  /** 분석 시간 */
  analyzedAt: string;
  /** Mock fallback 사용 여부 */
  usedFallback: boolean;
}

/** 체형 분류 기준값 */
export const BODY_SHAPE_THRESHOLDS = {
  /** 모래시계: 허리가 어깨/힙의 75% 이하 */
  hourglassWaistRatio: 0.75,
  /** 역삼각형: 어깨가 힙보다 10% 이상 넓음 */
  invertedTriangleRatio: 1.1,
  /** 삼각형: 힙이 어깨보다 10% 이상 넓음 */
  triangleRatio: 1.1,
  /** 타원형: 허리가 어깨/힙보다 넓음 */
  ovalWaistRatio: 1.0,
} as const;

/** 자세 문제 라벨 */
export const POSTURE_ISSUE_LABELS: Record<PostureIssue['type'], string> = {
  'shoulder-imbalance': '어깨 불균형',
  'hip-imbalance': '골반 불균형',
  'forward-head': '거북목',
  'rounded-shoulders': '굽은 어깨',
  lordosis: '요추전만',
  kyphosis: '흉추후만',
};

/** 자세 교정 운동 매핑 */
export const POSTURE_EXERCISES: Record<PostureIssue['type'], string[]> = {
  'shoulder-imbalance': ['사이드 플랭크', '덤벨 숄더 프레스', '스트레칭'],
  'hip-imbalance': ['힙 스트레칭', '글루트 브릿지', '런지'],
  'forward-head': ['턱 당기기', '목 스트레칭', '흉추 신전'],
  'rounded-shoulders': ['가슴 스트레칭', '로우 운동', '페이스 풀'],
  lordosis: ['코어 운동', '플랭크', '힙 플렉서 스트레칭'],
  kyphosis: ['흉추 신전', '로우 운동', '가슴 열기 스트레칭'],
};
