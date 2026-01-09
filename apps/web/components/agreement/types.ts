/**
 * 서비스 약관동의 타입 정의
 * SDD-TERMS-AGREEMENT.md §8.2
 */

export interface UserAgreement {
  id: string;
  clerkUserId: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  termsVersion: string;
  privacyVersion: string;
  termsAgreedAt: string | null;
  privacyAgreedAt: string | null;
  marketingAgreedAt: string | null;
  marketingWithdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementItem {
  id: 'terms' | 'privacy' | 'marketing';
  label: string;
  required: boolean;
  description?: string;
  detailUrl: string;
}

export const AGREEMENT_ITEMS: AgreementItem[] = [
  {
    id: 'terms',
    label: '이용약관 동의',
    required: true,
    detailUrl: '/terms',
  },
  {
    id: 'privacy',
    label: '개인정보 수집 및 이용 동의',
    required: true,
    detailUrl: '/privacy',
  },
  {
    id: 'marketing',
    label: '마케팅 정보 수신 동의',
    required: false,
    description: '프로모션, 이벤트, 신기능 알림을 받습니다',
    detailUrl: '/help/marketing',
  },
];

// 현재 약관 버전
export const CURRENT_TERMS_VERSION = '1.0';
export const CURRENT_PRIVACY_VERSION = '1.0';

// 필수 동의 항목 ID
export const REQUIRED_AGREEMENT_IDS = AGREEMENT_ITEMS.filter((item) => item.required).map(
  (item) => item.id
);

// DB 응답을 프론트엔드 타입으로 변환
export function mapDbAgreementToFrontend(dbAgreement: Record<string, unknown>): UserAgreement {
  return {
    id: dbAgreement.id as string,
    clerkUserId: dbAgreement.clerk_user_id as string,
    termsAgreed: dbAgreement.terms_agreed as boolean,
    privacyAgreed: dbAgreement.privacy_agreed as boolean,
    marketingAgreed: dbAgreement.marketing_agreed as boolean,
    termsVersion: dbAgreement.terms_version as string,
    privacyVersion: dbAgreement.privacy_version as string,
    termsAgreedAt: dbAgreement.terms_agreed_at as string | null,
    privacyAgreedAt: dbAgreement.privacy_agreed_at as string | null,
    marketingAgreedAt: dbAgreement.marketing_agreed_at as string | null,
    marketingWithdrawnAt: dbAgreement.marketing_withdrawn_at as string | null,
    createdAt: dbAgreement.created_at as string,
    updatedAt: dbAgreement.updated_at as string,
  };
}
