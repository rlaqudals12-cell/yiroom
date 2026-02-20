/**
 * 개인정보처리방침 페이지 (한/영 지원)
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PrivacyContent } from './PrivacyContent';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Privacy Policy',
  description: '이룸 서비스의 개인정보처리방침입니다. / Yiroom Privacy Policy.',
};

export default function PrivacyPolicyPage() {
  return (
    <Suspense>
      <PrivacyContent />
    </Suspense>
  );
}
