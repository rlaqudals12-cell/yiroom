/**
 * 초대 링크 리디렉트 페이지
 * /invite/[code] -> /sign-up?ref=[code]
 *
 * QR 코드나 공유 링크를 통해 접근한 사용자를
 * referral 코드를 포함하여 회원가입 페이지로 안내
 */

import { redirect } from 'next/navigation';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;

  // referral 코드를 포함하여 회원가입 페이지로 리디렉트
  redirect(`/sign-up?ref=${encodeURIComponent(code)}`);
}
