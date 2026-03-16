// lib/consent 공개 API
export {
  CONSENT_VERSIONS,
  LATEST_CONSENT_VERSION,
  shouldRequestReconsent,
  getVersionChanges,
  calculateRetentionUntil,
  getDaysUntilExpiry,
  checkConsentEligibility,
} from './version-check';
