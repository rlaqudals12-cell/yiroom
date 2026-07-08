import { redirect } from 'next/navigation';

/**
 * /analysis 허브 → /home 리다이렉트 (ADR-111 One Canon)
 *
 * "분석 도구 메뉴판"은 홈 ProfileCardGrid(채워지는 5축 정체성 프로필)와 완전 중복이었다.
 * 정본은 홈 하나로 통일 — 이 정적 메뉴판은 제거하고 홈으로 위임한다.
 * 새 분석 시작은 /analysis/integrated, 개별 축은 /analysis/{axis}로 직행.
 */
export default function AnalysisHubRedirect(): never {
  redirect('/home');
}
