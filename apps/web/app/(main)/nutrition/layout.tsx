import type { Metadata } from 'next';
import NutritionLayoutClient from './NutritionLayoutClient';

export const metadata: Metadata = {
  title: '영양 관리 | 이룸',
  description: 'AI 음식 인식으로 칼로리와 영양소를 자동 기록하세요. 목표에 맞는 식단 관리를 도와드립니다.',
  openGraph: {
    title: '영양 관리 | 이룸',
    description: 'AI 음식 인식으로 칼로리와 영양소를 자동 기록하세요.',
  },
};

interface NutritionLayoutProps {
  children: React.ReactNode;
}

/**
 * N-1 영양/식단 모듈 레이아웃 (서버)
 * - SEO 메타데이터 포함
 */
export default function NutritionLayout({ children }: NutritionLayoutProps) {
  return <NutritionLayoutClient>{children}</NutritionLayoutClient>;
}
