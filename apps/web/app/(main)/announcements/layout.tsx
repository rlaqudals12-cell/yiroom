import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '공지사항',
  description: '이룸의 새로운 소식과 업데이트를 확인하세요',
  keywords: ['공지사항', '업데이트', '소식'],
  openGraph: {
    title: '공지사항 | 이룸',
    description: '이룸 공지사항',
  },
};

export default function AnnouncementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
