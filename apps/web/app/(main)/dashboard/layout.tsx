import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드 | 이룸',
  description:
    '분석 결과와 프로필을 한눈에 확인하세요. 오늘의 포커스와 챌린지 진행 상황을 추적합니다.',
  openGraph: {
    title: '대시보드 | 이룸',
    description: '분석 결과와 프로필을 한눈에 확인하세요.',
  },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <>{children}</>;
}
