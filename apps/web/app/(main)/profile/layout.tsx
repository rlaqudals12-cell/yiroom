import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필',
  description: '내 프로필과 설정을 관리하고 활동 내역을 확인하세요',
  keywords: ['프로필', '설정', '계정관리'],
  openGraph: {
    title: '프로필 | 이룸',
    description: '내 프로필 관리',
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
