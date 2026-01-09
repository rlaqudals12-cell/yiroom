// 이미지 동의 시스템 타입 정의
// SDD-VISUAL-SKIN-REPORT.md §4.2

export type AnalysisType = 'skin' | 'body' | 'personal-color';

// DB 테이블 image_consents 매핑
export interface ImageConsent {
  id: string;
  clerk_user_id: string;
  analysis_type: AnalysisType;
  consent_given: boolean;
  consent_version: string;
  consent_at: string | null;
  withdrawal_at: string | null;
  retention_until: string | null;
  created_at: string;
  updated_at: string;
}

// 동의 자격 체크 결과
export interface ConsentEligibility {
  canConsent: boolean;
  reason?: 'under_age' | 'no_birthdate';
  requiredAction?: string;
}

// ImageConsentModal Props
export interface ImageConsentModalProps {
  isOpen: boolean;
  onConsent: () => void;
  onSkip: () => void;
  analysisType: AnalysisType;
  consentVersion?: string;
  isLoading?: boolean;
}

// ConsentStatus Props
export interface ConsentStatusProps {
  consent: ImageConsent | null;
  analysisType: AnalysisType;
  showDetails?: boolean;
  onManage?: () => void;
  className?: string;
}

// 동의 버전 정보
export interface ConsentVersionInfo {
  version: string;
  date: string;
  changes: string;
}

// 분석 타입별 라벨
export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, string> = {
  skin: '피부 분석',
  body: '체형 분석',
  'personal-color': '퍼스널 컬러',
};

// 동의 버전 관리
export const CONSENT_VERSIONS: Record<string, ConsentVersionInfo> = {
  'v1.0': {
    version: 'v1.0',
    date: '2026-01-08',
    changes: '최초 버전',
  },
};

// 현재 최신 동의 버전
export const LATEST_CONSENT_VERSION = 'v1.0';
