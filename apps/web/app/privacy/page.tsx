/**
 * 개인정보처리방침 페이지 (한/영 지원)
 */
import type { Metadata } from 'next';

import { PrivacyContent } from './PrivacyContent';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Privacy Policy',
  description: '이룸 서비스의 개인정보처리방침입니다. / Yiroom Privacy Policy.',
};

interface PrivacyPolicyPageProps {
  searchParams?: Promise<{ lang?: string | string[] }>;
}

export default async function PrivacyPolicyPage({ searchParams }: PrivacyPolicyPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const lang = params.lang === 'en' ? 'en' : 'ko';

  return <PrivacyContent lang={lang} />;
}
