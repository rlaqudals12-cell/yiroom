import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

export const metadata: Metadata = {
  title: '기록',
  description: '운동, 식단, 물 섭취 등 일일 건강 기록을 관리하고 리포트를 확인하세요',
  keywords: ['건강기록', '운동기록', '식단기록', '물섭취', '리포트'],
  openGraph: {
    title: '기록 | 이룸',
    description: '나의 일일 건강 기록 관리',
  },
};

/**
 * /record (운동+영양 통합 기록) — Phase 2 보류 (ADR-098)
 * WELLNESS_PHASE2=false 상태에서는 홈으로 리다이렉트
 */
export default function RecordLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/home');
  }
  return children;
}
