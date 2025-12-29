import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '연말 리뷰',
  description: '나의 1년간 웰니스 여정을 돌아보고 성과를 확인하세요',
  keywords: ['연말리뷰', '웰니스리뷰', '연간요약', '성과'],
  openGraph: {
    title: '연말 리뷰 | 이룸',
    description: '나의 웰니스 연말 리뷰',
  },
};

export default function YearReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
