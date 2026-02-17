import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '구강건강 분석',
  description: 'AI 구강건강 분석 - 치아 색상, 잇몸 건강, 치석 상태 등을 확인하세요',
  keywords: ['구강건강', '치아분석', '잇몸건강', '치아미백', '구강관리'],
  openGraph: {
    title: '구강건강 분석 | 이룸',
    description: 'AI로 나의 구강건강 상태를 분석해보세요',
  },
};

export default function OralHealthAnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
