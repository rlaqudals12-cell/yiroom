/**
 * 오늘의 루틴 시간대 판정 — verdict-first '지금 블록'의 활성 그룹 결정
 *
 * 순수 함수만 두어 클라이언트 컴포넌트가 직접 import해도 안전하다
 * (index 배럴은 service-role 등 서버 전용 모듈을 함께 끌고 옴).
 */

export type CapsuleTimeGroup = 'morning' | 'evening' | 'anytime';

/**
 * 현재 시(0~23) → 활성 루틴 그룹.
 * 11시 미만 아침 / 17시 이후 저녁 / 그 외 낮 시간대는 지금 실행 가능한
 * 다음 그룹인 '언제든'(아침 창은 지났고 저녁 창은 아직이므로).
 */
export function getActiveTimeGroup(hour: number): CapsuleTimeGroup {
  if (hour < 11) return 'morning';
  if (hour >= 17) return 'evening';
  return 'anytime';
}

/**
 * 활성 그룹 우선 탐색 순서 — 활성 그룹이 전부 완료(또는 비어있음)이면
 * 다음 순서 그룹에서 '지금 블록'을 승계한다.
 */
export function getTimeGroupPriority(hour: number): CapsuleTimeGroup[] {
  if (hour < 11) return ['morning', 'anytime', 'evening'];
  if (hour >= 17) return ['evening', 'anytime', 'morning'];
  return ['anytime', 'evening', 'morning'];
}
