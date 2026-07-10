/**
 * 성분 효과 타임라인 (L4 레이어, ADR-112)
 *
 * @module lib/scan/ingredient-timeline
 * @description
 *   활성 성분 → 임상 문헌상 효과 발현 시기. "예측"이 아니라 **문헌 인용형 안내**다.
 *   화장품법 준수: 치료/보장/기간 단정 표현 금지 — 모든 항목은 출처(sourceUrl) 필수이며,
 *   문헌이 없는 성분은 등록하지 않는다(추정 금지, 정직성 원칙).
 *
 * @see docs/principles/ingredient-safety-timeline.md §3 (임상 근거 표)
 * @see docs/adr/ADR-112-product-fit-scan.md
 */

export interface IngredientTimeline {
  /** 대표 표시명 (국문) */
  name: string;
  /** 매칭용 별칭 — 국문·영문·INCI 변형 (소문자 비교) */
  aliases: string[];
  /** 기대 효과 (안전 표현: "~에 도움") */
  effect: string;
  /** 서술형 타임라인 */
  timeline: string;
  /** 짧은 표시용 */
  timelineShort: string;
  /** 문헌 출처 URL (필수) */
  sourceUrl: string;
  /** 출처 라벨 */
  sourceLabel: string;
}

/**
 * 문헌 확보 성분만 등록 (원리 문서 §3 표 기반).
 * ⚠️ 새 항목 추가 시: 논문/임상 출처 필수 + 금지 표현(치료·재생·보장·사라져) 검사 테스트 통과 필요.
 */
export const INGREDIENT_TIMELINES: IngredientTimeline[] = [
  {
    name: '비타민C',
    aliases: ['비타민c', 'vitamin c', 'ascorbic acid', '아스코르빅애씨드', '아스코빌', 'ascorbyl'],
    effect: '피부 톤·광채 개선에 도움',
    timeline: '초기 광채 변화는 3-7일, 톤·색소 개선은 8-12주에 보고돼요',
    timelineShort: '8-12주',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/27050703/',
    sourceLabel: 'PubMed 27050703 (12주 임상)',
  },
  {
    name: '레티놀',
    aliases: ['레티놀', 'retinol', '레티닐', 'retinyl', '레티날', 'retinal'],
    effect: '피부 결·잔주름 관리에 도움',
    timeline: '결·매끄러움은 2-4주, 주름·탄력은 8-12주에 개선이 보고돼요',
    timelineShort: '2-4주(결) · 8-12주(주름)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/27050703/',
    sourceLabel: 'PubMed 27050703 (0.5% 레티놀 12주 임상)',
  },
  {
    name: '나이아신아마이드',
    aliases: ['나이아신아마이드', 'niacinamide', '니코틴아마이드', 'nicotinamide'],
    effect: '피지·장벽·톤 관리에 도움',
    timeline: '유수분·장벽 개선은 2-4주, 색소·톤은 8-12주에 보고돼요',
    timelineShort: '2-4주(장벽) · 8-12주(톤)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/16029679/',
    sourceLabel: 'Bissett 2005 계열 임상',
  },
  {
    name: '살리실릭애씨드(BHA)',
    aliases: ['살리실릭애씨드', 'salicylic acid', 'bha', '살리실산'],
    effect: '피지·모공·각질 관리에 도움',
    timeline: '21일 임상에서 피지·수분 지표의 유의한 개선이 보고됐어요',
    timelineShort: '약 3주',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12274963/',
    sourceLabel: 'PMC12274963 (21일 전향 임상)',
  },
  {
    name: 'AHA(글리콜릭·락틱)',
    aliases: [
      'aha',
      '글리콜릭애씨드',
      'glycolic acid',
      '락틱애씨드',
      'lactic acid',
      '글리콜산',
      '젖산',
    ],
    effect: '각질·결·톤 관리에 도움',
    timeline: '결·톤 개선은 2-4주에 보고돼요',
    timelineShort: '2-4주',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12274963/',
    sourceLabel: 'PMC12274963 (병용 임상)',
  },
  {
    name: '세라마이드',
    aliases: ['세라마이드', 'ceramide', 'ceramide np', 'ceramide ap', 'ceramide eop'],
    effect: '피부 장벽·수분 관리에 도움',
    timeline: '장벽·수분·홍조 지표의 유의한 개선이 4주에 보고됐어요',
    timelineShort: '약 4주',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12945871/',
    sourceLabel: 'PMC12945871 (4주 임상, 2026)',
  },
  {
    name: '히알루론산',
    aliases: [
      '히알루론산',
      'hyaluronic acid',
      '소듐하이알루로네이트',
      'sodium hyaluronate',
      '하이알루로닉애씨드',
    ],
    effect: '즉각적인 수분 공급에 도움',
    timeline: '표면 수분감은 사용 직후부터 느껴질 수 있어요',
    timelineShort: '즉시~수시간',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/21587178/',
    sourceLabel: '보습제 임상 종설',
  },
];

/** 표시 템플릿 — 문구 변경 시 금지 표현 테스트 필수 통과 */
export function formatTimelineNotice(t: IngredientTimeline): string {
  return `임상 연구에서는 보통 ${t.timelineShort} 후 개선이 보고돼요`;
}

/** 고정 면책 문구 (표시 시 상시 동반) */
export const TIMELINE_DISCLAIMER =
  '개인차가 있어요 · 의학적 조언이 아니에요. 꾸준히 사용했다면 그 시기에 피부 분석으로 변화를 확인해보세요.';

/**
 * 성분 리스트에서 타임라인 보유 성분만 매칭.
 * 커버되지 않는 성분은 반환하지 않는다(추정 금지).
 */
export function matchTimelines(ingredients: string[]): IngredientTimeline[] {
  const normalized = ingredients.map((i) => i.toLowerCase().replace(/\s+/g, ' ').trim());
  const matched: IngredientTimeline[] = [];
  for (const entry of INGREDIENT_TIMELINES) {
    const hit = normalized.some((ing) =>
      entry.aliases.some((alias) => ing.includes(alias.toLowerCase()))
    );
    if (hit) matched.push(entry);
  }
  return matched;
}
