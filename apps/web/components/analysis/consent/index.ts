// 이미지 동의 시스템
// GDPR/PIPA 컴플라이언스 동의 관리 컴포넌트

export { ImageConsentModal } from './ImageConsentModal';
export { ConsentStatus } from './ConsentStatus';

// 타입
export type {
  AnalysisType,
  ImageConsent,
  ConsentEligibility,
  ImageConsentModalProps,
  ConsentStatusProps,
  ConsentVersionInfo,
} from './types';

// 상수
export { ANALYSIS_TYPE_LABELS, CONSENT_VERSIONS, LATEST_CONSENT_VERSION } from './types';
