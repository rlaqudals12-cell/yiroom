import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '피부 분석',
  description: 'AI 피부 분석 - 수분, 유분, 모공 등 7가지 지표로 내 피부 상태를 확인하세요',
  keywords: ['피부분석', '피부타입', '건성', '지성', '복합성', '민감성'],
  openGraph: {
    title: '피부 분석 | 이룸',
    description: 'AI로 나의 피부 상태를 분석해보세요',
  },
};

export default function SkinAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
