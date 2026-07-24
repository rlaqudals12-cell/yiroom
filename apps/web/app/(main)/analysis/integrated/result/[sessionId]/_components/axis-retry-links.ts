/**
 * 축별 재시도 진입 경로 — PartialSuccessBanner·NextStepsLinks 공용 (단일 정본).
 *
 * personal_color만 통합 입력(/analysis/integrated)으로 보낸다: 복귀 유저의 축 선택 UI가
 * mode:'update' 재분석을 지원해 실패한 퍼컬 축만 다시 돌릴 수 있다(프로필 전체 덮어쓰기 없음).
 * 나머지 축은 개별 분석 시작 경로로 딥링크한다
 * (forceNew=true: 기존 결과가 있어도 자동 진입하지 않고 새로 촬영).
 */

import type { AxisCode } from '@/lib/analysis/integrated';

export const AXIS_ANALYSIS_HREF: Record<AxisCode, string> = {
  personal_color: '/analysis/integrated',
  skin: '/analysis/skin?forceNew=true',
  body: '/analysis/body?forceNew=true',
  hair: '/analysis/hair?forceNew=true',
  makeup: '/analysis/makeup?forceNew=true',
};
