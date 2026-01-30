/**
 * 패션 전용 RAG 검색
 * @description Phase K - 옷장 인벤토리 기반 코디 추천을 위한 RAG 시스템
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { coachLogger } from '@/lib/utils/logger';
import type { UserContext } from './types';

/** TPO (상황) */
type Occasion = 'casual' | 'formal' | 'workout' | 'date' | 'travel';

/** 코디 추천 결과 */
export interface OutfitRecommendation {
  items: FashionItem[];
  occasion: Occasion;
  reason: string;
  tips: string[];
}

/** 패션 아이템 */
export interface FashionItem {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  brand: string | null;
  color: string[];
  imageUrl: string;
  matchScore: number;
  matchReason: string;
}

/** 패션 검색 결과 */
export interface FashionSearchResult {
  hasClosetItems: boolean;
  recommendations: OutfitRecommendation[];
  generalTips: string[];
}

/** 질문 의도 분석 */
type FashionIntent = 'outfit' | 'top' | 'bottom' | 'accessory' | 'shoes' | 'general';

/** 질문에서 TPO 추출 */
function detectOccasion(query: string): Occasion | null {
  const lowerQuery = query.toLowerCase();

  if (
    lowerQuery.includes('면접') ||
    lowerQuery.includes('회사') ||
    lowerQuery.includes('포멀') ||
    lowerQuery.includes('출근')
  ) {
    return 'formal';
  }
  if (
    lowerQuery.includes('데이트') ||
    lowerQuery.includes('소개팅') ||
    lowerQuery.includes('약속')
  ) {
    return 'date';
  }
  if (lowerQuery.includes('운동') || lowerQuery.includes('헬스') || lowerQuery.includes('조깅')) {
    return 'workout';
  }
  if (lowerQuery.includes('여행') || lowerQuery.includes('나들이')) {
    return 'travel';
  }
  if (
    lowerQuery.includes('캐주얼') ||
    lowerQuery.includes('평상복') ||
    lowerQuery.includes('편하게')
  ) {
    return 'casual';
  }

  return null;
}

/** 질문 의도 추출 */
function analyzeFashionIntent(query: string): FashionIntent {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('코디') || lowerQuery.includes('전체')) {
    return 'outfit';
  }
  if (lowerQuery.includes('상의') || lowerQuery.includes('티셔츠') || lowerQuery.includes('셔츠')) {
    return 'top';
  }
  if (lowerQuery.includes('하의') || lowerQuery.includes('바지') || lowerQuery.includes('스커트')) {
    return 'bottom';
  }
  if (lowerQuery.includes('신발') || lowerQuery.includes('운동화') || lowerQuery.includes('구두')) {
    return 'shoes';
  }
  if (
    lowerQuery.includes('악세서리') ||
    lowerQuery.includes('시계') ||
    lowerQuery.includes('가방')
  ) {
    return 'accessory';
  }

  return 'general';
}

/** TPO별 스타일링 팁 */
const OCCASION_TIPS: Record<Occasion, string[]> = {
  casual: [
    '편안하면서도 깔끔한 핏이 중요해요',
    '청바지 + 니트 조합은 언제나 실패 없어요',
    '컬러풀한 악세서리로 포인트를 주세요',
  ],
  formal: [
    '단정한 핏과 깔끔한 색상이 중요해요',
    '네이비, 그레이, 블랙이 기본이에요',
    '깔끔한 구두와 심플한 악세서리로 마무리하세요',
  ],
  date: [
    '자신감 있는 스타일이 가장 중요해요',
    '부드러운 색상이 친근한 인상을 줘요',
    '향수를 살짝 뿌리면 더 좋아요',
  ],
  workout: [
    '편안함과 기능성이 최우선이에요',
    '통기성 좋은 소재를 선택하세요',
    '밝은 색상이 활동적인 이미지를 줘요',
  ],
  travel: [
    '편안하면서 세련된 스타일이 좋아요',
    '레이어링하기 좋은 아이템을 챙기세요',
    '구김이 적은 소재가 실용적이에요',
  ],
};

/** 퍼스널 컬러 기반 색상 매칭 체크 */
function matchesPersonalColor(itemColors: string[], seasonType: string | undefined): boolean {
  if (!seasonType) return true; // 정보 없으면 매칭으로 처리

  const warmSeasons = ['spring', 'autumn', '봄', '가을'];
  // coolSeasons는 isWarm 반대로 계산하므로 명시적 배열 불필요

  const isWarm = warmSeasons.some((s) => seasonType.toLowerCase().includes(s.toLowerCase()));

  const warmColors = ['베이지', '카멜', '브라운', '오렌지', '코랄', '골드', '살구', '아이보리'];
  const coolColors = ['네이비', '그레이', '블루', '핑크', '라벤더', '실버', '화이트', '블랙'];

  const targetColors = isWarm ? warmColors : coolColors;

  return itemColors.some((color) =>
    targetColors.some((tc) => color.includes(tc) || tc.includes(color))
  );
}

/** 옷장 기반 패션 검색 */
export async function searchFashionItems(
  userContext: UserContext | null,
  query: string,
  userId?: string
): Promise<FashionSearchResult> {
  try {
    const occasion = detectOccasion(query) || 'casual';
    // intent는 향후 카테고리별 필터링에 사용 예정: analyzeFashionIntent(query)
    const seasonType = userContext?.personalColor?.season;
    const bodyType = userContext?.bodyAnalysis?.bodyType;

    const result: FashionSearchResult = {
      hasClosetItems: false,
      recommendations: [],
      generalTips: OCCASION_TIPS[occasion],
    };

    // userId가 있으면 옷장에서 검색
    if (userId) {
      const supabase = createClerkSupabaseClient();

      const { data: closetItems, error } = await supabase
        .from('user_inventory')
        .select('id, name, sub_category, brand, metadata, image_url')
        .eq('clerk_user_id', userId)
        .eq('category', 'closet')
        .limit(20);

      if (error) {
        coachLogger.error('[FashionRAG] DB query error:', error);
      }

      if (closetItems && closetItems.length > 0) {
        result.hasClosetItems = true;

        // 아이템 변환 및 점수 계산
        const scoredItems: FashionItem[] = closetItems.map((item) => {
          const metadata = item.metadata as Record<string, unknown>;
          const colors = (metadata?.color as string[]) || [];

          // 매칭 점수 계산
          let score = 50;
          const reasons: string[] = [];

          // 퍼스널 컬러 매칭
          if (matchesPersonalColor(colors, seasonType)) {
            score += 25;
            reasons.push('퍼스널 컬러와 어울림');
          }

          // TPO 매칭
          const occasions = (metadata?.occasion as string[]) || [];
          if (occasions.includes(occasion)) {
            score += 20;
            reasons.push(`${occasion} 상황에 적합`);
          }

          return {
            id: item.id,
            name: item.name,
            category: 'closet',
            subCategory: item.sub_category || 'top',
            brand: item.brand,
            color: colors,
            imageUrl: item.image_url,
            matchScore: Math.min(score, 100),
            matchReason: reasons.join(', ') || '기본 아이템',
          };
        });

        // 상위 아이템으로 코디 구성
        const topItems = scoredItems.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);

        if (topItems.length > 0) {
          result.recommendations.push({
            items: topItems,
            occasion,
            reason: `옷장에서 ${occasion} 상황에 맞는 아이템을 찾았어요`,
            tips: generateStylingTips(topItems, bodyType, seasonType),
          });
        }
      }
    }

    // 옷장 아이템이 없으면 일반 팁 제공
    if (result.recommendations.length === 0) {
      result.recommendations.push({
        items: [],
        occasion,
        reason: '옷장에 등록된 아이템이 없어요. 일반 스타일링 팁을 드릴게요.',
        tips: OCCASION_TIPS[occasion],
      });
    }

    return result;
  } catch (error) {
    coachLogger.error('[FashionRAG] Search error:', error);
    return {
      hasClosetItems: false,
      recommendations: [],
      generalTips: ['다양한 스타일을 시도해보세요!'],
    };
  }
}

/** 스타일링 팁 생성 */
function generateStylingTips(
  items: FashionItem[],
  bodyType: string | undefined,
  seasonType: string | undefined
): string[] {
  const tips: string[] = [];

  // 체형 기반 팁
  if (bodyType) {
    const bodyTips: Record<string, string> = {
      S: '허리 라인을 강조하면 좋아요',
      W: '상체에 볼륨감을 주는 디자인이 어울려요',
      N: '다양한 스타일이 잘 어울려요',
      straight: '세로 라인이 강조된 스타일이 좋아요',
      wave: '부드러운 소재와 곡선 디자인이 어울려요',
      natural: '편안한 오버핏 스타일도 잘 어울려요',
    };

    const tip = bodyTips[bodyType];
    if (tip) tips.push(tip);
  }

  // 퍼스널 컬러 기반 팁
  if (seasonType) {
    const isWarm =
      seasonType.includes('spring') ||
      seasonType.includes('autumn') ||
      seasonType.includes('봄') ||
      seasonType.includes('가을');
    tips.push(isWarm ? '골드 악세서리가 피부톤을 살려줘요' : '실버 악세서리가 피부톤을 살려줘요');
  }

  // 보유 아이템 기반 팁
  if (items.length > 0) {
    const hasTop = items.some((i) => i.subCategory === 'top' || i.subCategory === 'outer');
    const hasBottom = items.some((i) => i.subCategory === 'bottom' || i.subCategory === 'dress');

    if (hasTop && !hasBottom) {
      tips.push('하의 아이템을 추가하면 코디가 완성돼요');
    } else if (!hasTop && hasBottom) {
      tips.push('상의 아이템을 추가하면 코디가 완성돼요');
    }
  }

  return tips.length > 0 ? tips : ['자신만의 스타일을 찾아가세요!'];
}

/** RAG 결과를 프롬프트용 문자열로 변환 */
export function formatFashionForPrompt(result: FashionSearchResult): string {
  if (result.recommendations.length === 0 || !result.recommendations[0].items.length) {
    if (result.generalTips.length > 0) {
      let context = '\n\n## 스타일링 팁\n';
      result.generalTips.forEach((tip) => {
        context += `- ${tip}\n`;
      });
      return context;
    }
    return '';
  }

  let context = '\n\n## 옷장 기반 코디 추천\n';

  result.recommendations.forEach((rec) => {
    context += `\n### ${rec.occasion} 스타일\n`;
    context += `${rec.reason}\n\n`;

    context += '**추천 아이템:**\n';
    rec.items.forEach((item, j) => {
      context += `${j + 1}. ${item.brand ? `${item.brand} ` : ''}${item.name}\n`;
      context += `   - 매칭률: ${item.matchScore}%\n`;
      if (item.matchReason) {
        context += `   - 이유: ${item.matchReason}\n`;
      }
    });

    if (rec.tips.length > 0) {
      context += '\n**스타일링 팁:**\n';
      rec.tips.forEach((tip) => {
        context += `- ${tip}\n`;
      });
    }
  });

  return context;
}
