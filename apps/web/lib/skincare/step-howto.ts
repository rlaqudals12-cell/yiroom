/** 승인 사용법 정본. 근거: 상담 시뮬레이션 D-2/D-3, ADR-117. */
import type { ProductCategory } from '@/types/skincare-routine';
export type ClaimEvidence = 'established' | 'conventional' | 'unsupported' | 'hygiene';
export interface SkincareClaim {
  id: string;
  text: string;
  evidence: ClaimEvidence;
  sourceId: string;
  scope: string;
}
export type StepHowToKey = ProductCategory | 'handWash';
export interface StepHowTo {
  amount: string;
  method: string;
  waitTime?: string;
  tips?: string[];
  claims: {
    amount: SkincareClaim;
    method: SkincareClaim;
    waitTime?: SkincareClaim;
    tips: SkincareClaim[];
  };
}
// 원문 50개 판정은 감사용으로 보존한다. unsupported를 승인 목록으로 승격하지 않는다.
export const HOWTO_SOURCE_AUDIT: ReadonlyArray<{ id: string; evidence: ClaimEvidence }> = [
  { id: 'D3-1', evidence: 'hygiene' },
  { id: 'D3-2', evidence: 'hygiene' },
  { id: 'D3-3', evidence: 'hygiene' },
  { id: 'D3-4', evidence: 'conventional' },
  { id: 'D3-5', evidence: 'unsupported' },
  { id: 'D3-6', evidence: 'established' },
  { id: 'D3-7', evidence: 'unsupported' },
  { id: 'D3-8', evidence: 'conventional' },
  { id: 'D3-9', evidence: 'established' },
  { id: 'D3-10', evidence: 'conventional' },
  { id: 'D3-11', evidence: 'unsupported' },
  { id: 'D3-12', evidence: 'unsupported' },
  { id: 'D3-13', evidence: 'unsupported' },
  { id: 'D3-14', evidence: 'conventional' },
  { id: 'D3-15', evidence: 'conventional' },
  { id: 'D3-16', evidence: 'unsupported' },
  { id: 'D3-17', evidence: 'conventional' },
  { id: 'D3-18', evidence: 'unsupported' },
  { id: 'D3-19', evidence: 'unsupported' },
  { id: 'D3-20', evidence: 'conventional' },
  { id: 'D3-21', evidence: 'unsupported' },
  { id: 'D3-22', evidence: 'unsupported' },
  { id: 'D3-23', evidence: 'unsupported' },
  { id: 'D3-24', evidence: 'established' },
  { id: 'D3-25', evidence: 'conventional' },
  { id: 'D3-26', evidence: 'unsupported' },
  { id: 'D3-27', evidence: 'unsupported' },
  { id: 'D3-28', evidence: 'conventional' },
  { id: 'D3-29', evidence: 'unsupported' },
  { id: 'D3-30', evidence: 'established' },
  { id: 'D3-31', evidence: 'unsupported' },
  { id: 'D3-32', evidence: 'established' },
  { id: 'D3-33', evidence: 'conventional' },
  { id: 'D3-34', evidence: 'conventional' },
  { id: 'D3-35', evidence: 'unsupported' },
  { id: 'D3-36', evidence: 'conventional' },
  { id: 'D3-37', evidence: 'unsupported' },
  { id: 'D3-38', evidence: 'unsupported' },
  { id: 'D3-39', evidence: 'conventional' },
  { id: 'D3-40', evidence: 'conventional' },
  { id: 'D3-41', evidence: 'unsupported' },
  { id: 'D3-42', evidence: 'conventional' },
  { id: 'D3-43', evidence: 'conventional' },
  { id: 'D3-44', evidence: 'unsupported' },
  { id: 'D3-45', evidence: 'conventional' },
  { id: 'D3-46', evidence: 'conventional' },
  { id: 'D3-47', evidence: 'unsupported' },
  { id: 'D3-48', evidence: 'established' },
  { id: 'D3-49', evidence: 'hygiene' },
  { id: 'D3-50', evidence: 'hygiene' },
];
export const APPROVED_SKINCARE_CLAIMS: readonly SkincareClaim[] = [
  {
    id: 'labelAmount',
    text: '제품 라벨의 사용량을 기준으로 선택해주세요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'gentleApply',
    text: '사용 습관에 따라 가볍게 펴 바르는 방법을 선택할 수 있어요. 흡수 효과의 차이를 뜻하지 않아요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'labelWait',
    text: '다음 단계까지의 대기는 제품 라벨과 사용감을 기준으로 선택해주세요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'labelArea',
    text: '제품 라벨에 표시된 사용 부위와 방법을 확인해 선택해주세요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'handSoap',
    text: '비누와 물을 사용해주세요.',
    evidence: 'hygiene',
    sourceId: 'C1',
    scope: '비누와 물을 사용해주세요.',
  },
  {
    id: 'handWash',
    text: '시작 전 손을 씻어주세요. 손에서 얼굴로 옮는 오염을 줄이기 위한 위생 안내예요.',
    evidence: 'hygiene',
    sourceId: 'C1',
    scope: '시작 전 손을 씻어주세요. 손에서 얼굴로 옮는 오염을 줄이기 위한 위생 안내예요.',
  },
  {
    id: 'handTime',
    text: '비누로 20초 이상 꼼꼼히 손 씻기를 권장해요.',
    evidence: 'hygiene',
    sourceId: 'C1',
    scope: '비누로 20초 이상 꼼꼼히 손 씻기를 권장해요.',
  },
  {
    id: 'cleanse',
    text: '세안할 때 미온수와 손끝으로 부드럽게 씻고 헹구는 것을 권장해요.',
    evidence: 'established',
    sourceId: 'A1',
    scope: '세안할 때 미온수와 손끝으로 부드럽게 씻고 헹구는 것을 권장해요.',
  },
  {
    id: 'dryTowel',
    text: '세안 후 부드러운 수건으로 가볍게 물기를 닦는 것을 권장해요.',
    evidence: 'established',
    sourceId: 'A1',
    scope: '세안 후 부드러운 수건으로 가볍게 물기를 닦는 것을 권장해요.',
  },
  {
    id: 'noScrub',
    text: '세안할 때 세게 문지르지 않는 것을 권장해요.',
    evidence: 'established',
    sourceId: 'A1',
    scope: '세안할 때 세게 문지르지 않는 것을 권장해요.',
  },
  {
    id: 'ph',
    text: '클렌저는 사용감과 제품 라벨을 보고 선택해주세요. pH만으로 저자극을 보장할 수 없어요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'tonerOptional',
    text: '토너와 도포 도구는 사용 습관에 따라 선택하는 단계예요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'testProduct',
    text: '새 화장품은 작은 부위에서 반복 시험을 권장해요. 한 번 반응이 없다고 안전이 보장되지는 않아요.',
    evidence: 'established',
    sourceId: 'A4',
    scope:
      '새 화장품은 작은 부위에서 반복 시험을 권장해요. 한 번 반응이 없다고 안전이 보장되지는 않아요.',
  },
  {
    id: 'moisture',
    text: '건조한 피부는 씻은 뒤 촉촉할 때 보습제를 부드럽게 바르는 것을 권장해요.',
    evidence: 'established',
    sourceId: 'A8',
    scope: '건조한 피부는 씻은 뒤 촉촉할 때 보습제를 부드럽게 바르는 것을 권장해요.',
  },
  {
    id: 'adjust',
    text: '제품 라벨 범위에서 사용감에 따라 양을 선택해주세요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'sunAmount',
    text: '노출되는 피부 전체를 덮을 충분한 양의 선크림을 권장해요. 제품 라벨도 확인해주세요.',
    evidence: 'established',
    sourceId: 'A2',
    scope: '노출되는 피부 전체를 덮을 충분한 양의 선크림을 권장해요. 제품 라벨도 확인해주세요.',
  },
  {
    id: 'sunBefore',
    text: '외출 약 15분 전, 노출되는 피부에 고르게 바르는 것을 권장해요.',
    evidence: 'established',
    sourceId: 'A2',
    scope: '외출 약 15분 전, 노출되는 피부에 고르게 바르는 것을 권장해요.',
  },
  {
    id: 'sunRepeat',
    text: '야외에서는 약 2시간마다, 땀을 흘리거나 수영한 뒤에는 다시 바르는 것을 권장해요.',
    evidence: 'established',
    sourceId: 'A2',
    scope: '야외에서는 약 2시간마다, 땀을 흘리거나 수영한 뒤에는 다시 바르는 것을 권장해요.',
  },
  {
    id: 'sunEnough',
    text: '선크림은 양이 부족하면 표기된 차단 효과를 기대하기 어려워 충분량을 권장해요.',
    evidence: 'established',
    sourceId: 'A2',
    scope: '선크림은 양이 부족하면 표기된 차단 효과를 기대하기 어려워 충분량을 권장해요.',
  },
  {
    id: 'sunOrder',
    text: '아침에는 스킨케어 마지막, 메이크업 전에 바르는 사용 습관을 선택할 수 있어요.',
    evidence: 'conventional',
    sourceId: 'A3',
    scope: '아침에는 스킨케어 마지막, 메이크업 전에 바르는 사용 습관을 선택할 수 있어요.',
  },
  {
    id: 'mask',
    text: '마스크는 선택 단계예요. 사용 시간과 횟수는 제품 라벨을 따라주세요.',
    evidence: 'conventional',
    sourceId: 'A6',
    scope: '마스크는 선택 단계예요. 사용 시간과 횟수는 제품 라벨을 따라주세요.',
  },
  {
    id: 'maskRemaining',
    text: '남은 제형은 제품이 허용하는 부위에만 바르는 방법을 선택해주세요.',
    evidence: 'conventional',
    sourceId: 'LABEL',
    scope: '제품 라벨·화장품 사용 습관',
  },
  {
    id: 'eye',
    text: '눈가용 제품은 라벨에 따라 약지로 가볍게 바르는 사용 습관을 선택할 수 있어요.',
    evidence: 'conventional',
    sourceId: 'A3',
    scope: '눈가용 제품은 라벨에 따라 약지로 가볍게 바르는 사용 습관을 선택할 수 있어요.',
  },
  {
    id: 'oil',
    text: '오일은 사용감에 따라 생략할 수 있는 선택 단계예요. 아침에는 선크림 전에 사용해주세요.',
    evidence: 'conventional',
    sourceId: 'A3',
    scope: '오일은 사용감에 따라 생략할 수 있는 선택 단계예요. 아침에는 선크림 전에 사용해주세요.',
  },
  {
    id: 'stop',
    text: '화장품 사용 후 자극이 생기면 중단을 권장해요. 심하거나 지속되면 의료인과 상의해주세요. 처방약은 처방 지시를 따라주세요.',
    evidence: 'established',
    sourceId: 'A4',
    scope:
      '화장품 사용 후 자극이 생기면 중단을 권장해요. 심하거나 지속되면 의료인과 상의해주세요. 처방약은 처방 지시를 따라주세요.',
  },
];
function claim(id: string): SkincareClaim {
  const found = APPROVED_SKINCARE_CLAIMS.find((item) => item.id === id);
  if (!found || found.evidence === 'unsupported') throw new Error('Unapproved skincare claim');
  return found;
}
function howTo(
  amountId: string,
  methodId: string,
  waitId?: string,
  tipIds: string[] = []
): StepHowTo {
  const amount = claim(amountId),
    method = claim(methodId);
  const waitTime = waitId ? claim(waitId) : undefined;
  const tips = tipIds.map(claim);
  return {
    amount: amount.text,
    method: method.text,
    ...(waitTime ? { waitTime: waitTime.text } : {}),
    tips: tips.map((tip) => tip.text),
    claims: { amount, method, waitTime, tips },
  };
}
export const STEP_HOWTO: Record<StepHowToKey, StepHowTo> = {
  handWash: howTo('handSoap', 'handWash', undefined, ['handTime']),
  cleanser: howTo('labelAmount', 'cleanse', 'dryTowel', ['ph', 'noScrub']),
  toner: howTo('labelAmount', 'gentleApply', 'labelWait', ['tonerOptional']),
  essence: howTo('labelAmount', 'gentleApply', 'labelWait', []),
  serum: howTo('labelAmount', 'gentleApply', 'labelWait', ['labelArea']),
  ampoule: howTo('labelAmount', 'gentleApply', 'labelWait', ['testProduct']),
  cream: howTo('labelAmount', 'moisture', 'labelWait', ['adjust']),
  sunscreen: howTo('sunAmount', 'sunBefore', 'sunRepeat', ['sunEnough', 'sunOrder']),
  mask: howTo('labelAmount', 'mask', undefined, ['maskRemaining']),
  eye_cream: howTo('labelAmount', 'eye', 'labelWait', []),
  oil: howTo('labelAmount', 'oil', 'labelWait', []),
  spot_treatment: howTo('labelAmount', 'labelArea', undefined, ['stop']),
};
export function getStepHowTo(category: StepHowToKey): StepHowTo | undefined {
  return STEP_HOWTO[category];
}
/** 모델과 렌더러에 동일한 승인 문장만 제공한다. */
export function getApprovedSkincareClaims(): SkincareClaim[] {
  return APPROVED_SKINCARE_CLAIMS.filter((item) => item.evidence !== 'unsupported').map((item) => ({
    ...item,
  }));
}
export const HAND_WASH_PRESTEP = { label: '손 씻기', note: claim('handWash').text } as const;
