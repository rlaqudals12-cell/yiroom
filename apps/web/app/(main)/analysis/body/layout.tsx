import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '체형 분석',
  description: 'AI 체형 분석 - 스트레이트/웨이브/내추럴 체형을 파악하고 맞춤 스타일을 추천받으세요',
  keywords: ['체형분석', '스트레이트', '웨이브', '내추럴', '골격진단'],
  openGraph: {
    title: '체형 분석 | 이룸',
    description: 'AI로 나의 체형을 분석하고 맞춤 스타일을 추천받으세요',
  },
};

export default function BodyAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
