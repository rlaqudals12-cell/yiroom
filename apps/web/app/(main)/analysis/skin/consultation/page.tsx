import { redirect } from 'next/navigation';

/**
 * 피부 상담 → 물어보기(coach) 통폐합 (2026-07-10)
 *
 * 피부 전용 상담 챗봇이 코치(물어보기)와 중복이라 상담 경로를 하나로 합쳤다.
 * 이 라우트로 진입하면 내 분석 결과를 아는 코치의 피부 카테고리로 보낸다.
 * (인바운드 링크가 없던 고아 라우트 — URL 보존 목적의 리디렉트)
 */
export default function SkinConsultationPage(): never {
  redirect('/coach?category=skin');
}
