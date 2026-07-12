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
  biometricAgreed: boolean;
  termsVersion: string;
  privacyVersion: string;
  biometricVersion: string | null;
  termsAgreedAt: string | null;
  privacyAgreedAt: string | null;
  marketingAgreedAt: string | null;
  marketingWithdrawnAt: string | null;
  biometricAgreedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementItem {
  id: 'terms' | 'privacy' | 'marketing' | 'biometric';
  label: string;
  required: boolean;
  description?: string;
  /** 상세 문서 링크 (약관·개인정보만 제공, 없으면 링크 미노출) */
  detailUrl?: string;
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
    // 생체정보(얼굴·체형 이미지) 수집·이용 별도 동의 (BIPA / PIPA 제23조) — 개별 필수 동의
    id: 'biometric',
    label: '생체정보(얼굴·체형 이미지) 수집·이용 동의',
    required: true,
    description:
      'AI 뷰티 분석(피부·퍼스널컬러·체형·헤어·메이크업)을 위해 얼굴·체형 이미지를 수집·이용하며, 분석을 위해 미국의 Google(Gemini)로 전송됩니다. 삭제 요청·회원 탈퇴 시까지 보관하며 언제든 철회할 수 있습니다.',
    detailUrl: '/privacy',
  },
  {
    // 마케팅 항목은 별도 상세 페이지가 없음 — detailUrl 미지정 (구 /help/marketing은 404)
    id: 'marketing',
    label: '마케팅 정보 수신 동의',
    required: false,
    description: '프로모션, 이벤트, 신기능 알림을 받습니다',
  },
];

// 현재 약관 버전
export const CURRENT_TERMS_VERSION = '1.0';
export const CURRENT_PRIVACY_VERSION = '1.0';
export const CURRENT_BIOMETRIC_VERSION = '1.0';

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
    biometricAgreed: (dbAgreement.biometric_agreed as boolean) ?? false,
    termsVersion: dbAgreement.terms_version as string,
    privacyVersion: dbAgreement.privacy_version as string,
    biometricVersion: (dbAgreement.biometric_version as string | null) ?? null,
    termsAgreedAt: dbAgreement.terms_agreed_at as string | null,
    privacyAgreedAt: dbAgreement.privacy_agreed_at as string | null,
    marketingAgreedAt: dbAgreement.marketing_agreed_at as string | null,
    marketingWithdrawnAt: dbAgreement.marketing_withdrawn_at as string | null,
    biometricAgreedAt: dbAgreement.biometric_agreed_at as string | null,
    createdAt: dbAgreement.created_at as string,
    updatedAt: dbAgreement.updated_at as string,
  };
}
