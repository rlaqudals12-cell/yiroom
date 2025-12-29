import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '스타일',
  description: '퍼스널 컬러와 체형에 맞는 패션 스타일, 코디 추천을 받아보세요',
  keywords: ['패션', '스타일추천', '코디', '퍼스널컬러패션', '체형별코디'],
  openGraph: {
    title: '스타일 | 이룸',
    description: '나에게 맞는 패션 스타일 추천',
  },
};

export default function StyleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
