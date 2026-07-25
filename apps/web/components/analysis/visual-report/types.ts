// 비주얼 리포트 시스템 타입 정의
// 구세대 채점표 Props(GradeDisplay·MetricBar·StrengthsFirst·VisualReportCard)는
// 진단지 문법 전환(ADR-120)으로 컴포넌트와 함께 삭제됨.

// 분석 타입
export type AnalysisType = 'skin' | 'body' | 'personal-color' | 'hair' | 'makeup';

// 피부 분석 영역별 점수 (Phase 3 확장용)
export interface SkinZoneScores {
  forehead: number; // 이마
  tZone: number; // T존 (코)
  uZone: number; // U존 (볼)
  chin: number; // 턱
  eyeArea: number; // 눈가
  overall: number; // 전체
}

// 체형 분석 영역별 점수 (Phase 3 확장용)
export interface BodyZoneScores {
  shoulder: number; // 어깨
  chest: number; // 가슴
  waist: number; // 허리
  hip: number; // 골반
  leg: number; // 다리
}

// 메트릭 항목 (피부 분석용)
export interface MetricItem {
  id: string;
  name: string;
  value: number; // 0-100
  description?: string;
}

// 강점/성장 가능성 항목
export interface StrengthItem {
  label: string;
  value: number; // 0-100
  description?: string;
}

// 통합 비주얼 리포트 데이터 (내부 사용)
export interface VisualReportData {
  analysisType: AnalysisType;
  overallScore: number;

  // 강점/성장 가능성
  strengths: StrengthItem[];
  growthAreas: StrengthItem[];

  // 영역별 점수 (선택)
  zoneScores?: SkinZoneScores | BodyZoneScores;

  // 분석 시간
  analyzedAt?: Date;
}
