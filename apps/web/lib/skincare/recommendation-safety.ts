/** 시간대와 문진을 모든 루틴 추천 경로에 전달하는 공통 문맥. */
import type { TimeOfDay } from '@/types/skincare-routine';
import { resolveRoutineSafety, type RoutineSafetyProfile } from '@/lib/safety/routine-guard';

export interface RecommendationSafetyContext {
  safetyProfile?: RoutineSafetyProfile | null;
  timeOfDay?: TimeOfDay;
}

/** 미문진·주의 상태에는 활성 성분을 개인 추천하지 않는다. */
export function allowsActiveRecommendations(context: RecommendationSafetyContext = {}): boolean {
  return resolveRoutineSafety(context.safetyProfile).retinoidAllowed;
}

/** 명칭만으로 안전을 보증하지 않고, 알려진 활성 성분/제품명은 보수적으로 제외한다. */
export function isRecommendationAllowed(
  text: string,
  context: RecommendationSafetyContext = {}
): boolean {
  const retinoid =
    /retin(?:ol|al|oid|yl)|tretinoin|adapalene|tazarotene|레티놀|레티날|레티노|트레티노인|아다팔렌|타자로텐/i.test(
      text
    );
  if (retinoid && (context.timeOfDay !== 'evening' || !allowsActiveRecommendations(context)))
    return false;
  const normalized = text.toLowerCase();
  const activeNames = [
    'salicylic',
    'glycolic',
    'lactic acid',
    'ascorb',
    'niacinamide',
    'arbutin',
    'benzoyl',
    '살리실',
    '글리콜',
    '락틱',
    '나이아신',
    '알부틴',
    '벤조일',
    '각질',
    '필링',
  ];
  const hasActive =
    activeNames.some((name) => normalized.includes(name)) ||
    /\b(?:aha|bha|pha)\b|비타민\s*c/i.test(text);
  if (!allowsActiveRecommendations(context) && hasActive) return false;
  return true;
}
