import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

export const metadata: Metadata = {
  title: '연말 리뷰',
  description: '나의 1년간 웰니스 여정을 돌아보고 성과를 확인하세요',
  keywords: ['연말리뷰', '웰니스리뷰', '연간요약', '성과'],
  openGraph: {
    title: '연말 리뷰 | 이룸',
    description: '나의 웰니스 연말 리뷰',
  },
};

/**
 * /year-review — 운동·영양(W/N)과 소셜 기반 연말 결산 (ADR-098: W/N 숨김 정책 적용).
 * 현재 페이지는 하드코딩 가짜 데이터(운동 156h·가짜 친구 비교)라 노출 부적합 —
 * 실데이터가 쌓인 후 재작업. 복원 시 WELLNESS_PHASE2=true 전환 + 실데이터 배선 필요.
 */
export default function YearReviewLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/home');
  }
  return children;
}
