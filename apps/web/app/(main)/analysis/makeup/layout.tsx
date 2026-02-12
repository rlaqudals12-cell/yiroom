import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '메이크업 분석',
  description:
    'AI 기반 메이크업 분석 - 언더톤, 얼굴형, 눈/입술 형태를 분석하여 맞춤 메이크업을 추천해드려요',
  keywords: ['메이크업분석', '언더톤', '웜톤', '쿨톤', '퍼스널컬러', 'AI분석'],
  openGraph: {
    title: '메이크업 분석 | 이룸',
    description: 'AI로 나에게 맞는 메이크업 컬러와 스타일을 찾아보세요',
  },
};

export default function MakeupAnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
