import { redirect } from 'next/navigation';

/**
 * /privacy-policy → /privacy 리다이렉트
 *
 * 개인정보처리방침 2벌 통합 (2026-07 감사):
 * - 정본 = /privacy (app/privacy/PrivacyContent.tsx) — 최신(2026-02-20), 한/영 지원,
 *   민감정보(생체정보) 섹션·Gemini 제3자 제공·처리 위탁 현황·버전 이력 포함,
 *   이미지 보관 정본 카피("보관 + 사용자 삭제권") 적용.
 * - 이 라우트(help·settings에서 인바운드)는 redirect로 유지해 기존 링크가 정본을 받게 함.
 */
export default function PrivacyPolicyRedirect(): never {
  redirect('/privacy');
}
