import type { Metadata } from 'next';
import WorkoutLayoutClient from './WorkoutLayoutClient';

export const metadata: Metadata = {
  title: '운동 추천 | 이룸',
  description:
    '체형에 맞는 맞춤 운동 플랜을 추천받고 기록해요. 주간 운동 계획과 진행 추적을 지원해요.',
  openGraph: {
    title: '운동 추천 | 이룸',
    description: '체형에 맞는 맞춤 운동 플랜을 추천받고 기록해요.',
  },
};

interface WorkoutLayoutProps {
  children: React.ReactNode;
}

export default function WorkoutLayout({ children }: WorkoutLayoutProps) {
  return <WorkoutLayoutClient>{children}</WorkoutLayoutClient>;
}
