import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '옷장',
  description: '내 옷장을 관리하고 퍼스널 컬러에 맞는 코디를 추천받으세요',
  keywords: ['옷장관리', '코디추천', '퍼스널컬러코디', '옷정리'],
  openGraph: {
    title: '옷장 | 이룸',
    description: '스마트 옷장 관리와 코디 추천',
  },
};

export default function ClosetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
