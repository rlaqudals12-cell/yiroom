import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '홈',
  description: '이룸 홈 - 오늘의 뷰티/스타일 추천과 건강 기록을 한눈에 확인하세요',
  openGraph: {
    title: '이룸 홈',
    description: '오늘의 뷰티/스타일 추천과 건강 기록을 한눈에',
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
