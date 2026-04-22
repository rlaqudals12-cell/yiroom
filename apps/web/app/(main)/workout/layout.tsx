import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';
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

/**
 * /workout — Phase 2 보류 (ADR-098)
 * WELLNESS_PHASE2=false 상태에서는 홈으로 리다이렉트
 */
export default function WorkoutLayout({ children }: WorkoutLayoutProps) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/home');
  }
  return <WorkoutLayoutClient>{children}</WorkoutLayoutClient>;
}
