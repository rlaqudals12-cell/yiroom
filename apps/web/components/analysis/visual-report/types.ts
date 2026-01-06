// 비주얼 리포트 시스템 타입 정의

import type { AnalysisGrade, GradeConfig } from './constants';

// 분석 타입
export type AnalysisType = 'skin' | 'body' | 'personal-color';

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
  grade?: AnalysisGrade;
}

// GradeDisplay Props
export interface GradeDisplayProps {
  score: number;
  label?: string; // "전체 점수", "피부 상태" 등
  showProgress?: boolean; // 백분율 바 표시 여부
  showScore?: boolean; // 점수 숫자 표시 여부
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean; // CountUp 애니메이션 여부
  className?: string;
}

// MetricBar Props
export interface MetricBarProps {
  name: string;
  value: number; // 0-100
  showGrade?: boolean; // 등급 배지 표시 여부
  delay?: number; // 애니메이션 딜레이 (0-12)
  className?: string;
}

// StrengthsFirst Props
export interface StrengthsFirstProps {
  analysisType: AnalysisType;
  // 피부 분석용 - 7가지 메트릭
  metrics?: MetricItem[];
  // 체형 분석용 - 강점/측정값
  strengths?: string[];
  measurements?: Array<{ name: string; value: number; description?: string }>;
  // 퍼스널 컬러용 - 베스트 컬러
  bestColors?: Array<{ hex: string; name: string }>;
  // 공통
  maxStrengths?: number; // 강점 표시 개수 (기본: 3)
  maxGrowthAreas?: number; // 성장 가능성 표시 개수 (기본: 2)
  className?: string;
}

// VisualReportCard Props
export interface VisualReportCardProps {
  // 분석 타입
  analysisType: AnalysisType;

  // 공통 데이터
  overallScore: number;

  // 피부 분석 (S-1)
  skinMetrics?: MetricItem[];
  skinZoneScores?: SkinZoneScores;

  // 체형 분석 (C-1)
  bodyType?: 'S' | 'W' | 'N';
  bodyTypeLabel?: string;
  bodyStrengths?: string[];
  bodyMeasurements?: Array<{ name: string; value: number; description?: string }>;
  bodyZoneScores?: BodyZoneScores;

  // 퍼스널 컬러 (PC-1)
  seasonType?: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonLabel?: string;
  tone?: 'warm' | 'cool';
  confidence?: number;
  bestColors?: Array<{ hex: string; name: string }>;

  // 분석 시간
  analyzedAt?: Date;

  // 스타일
  className?: string;
}

// 통합 비주얼 리포트 데이터 (내부 사용)
export interface VisualReportData {
  analysisType: AnalysisType;
  overallScore: number;
  grade: AnalysisGrade;
  gradeConfig: GradeConfig;

  // 강점/성장 가능성
  strengths: StrengthItem[];
  growthAreas: StrengthItem[];

  // 영역별 점수 (선택)
  zoneScores?: SkinZoneScores | BodyZoneScores;

  // 분석 시간
  analyzedAt?: Date;
}
