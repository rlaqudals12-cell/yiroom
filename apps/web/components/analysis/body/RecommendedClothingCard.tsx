'use client';

import { useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, ExternalLink, Palette, Shirt } from 'lucide-react';
import type { BodyType, BodyType3 } from '@/lib/mock/body-analysis';
import type { ColorRecommendations } from '@/lib/mock/body-analysis';

interface ClothingItem {
  name: string;
  category: '상의' | '하의' | '원피스' | '아우터' | '악세서리';
  reason: string;
  searchKeyword: string;
  icon: string;
}

interface RecommendedClothingCardProps {
  bodyType: BodyType | BodyType3 | string;
  styleRecommendations: Array<{ item: string; reason: string }>;
  colorRecommendations?: ColorRecommendations | null;
  personalColorSeason?: string | null;
}

// 3타입 체형별 상세 의류 추천 (쇼핑 검색어 포함) - 대중적인 아이템 위주
const BODY_TYPE_3_CLOTHING: Record<BodyType3, ClothingItem[]> = {
  // 스트레이트: 심플하고 베이직한 I라인 아이템
  S: [
    {
      name: '슬림핏 티셔츠',
      category: '상의',
      reason: '깔끔한 실루엣',
      searchKeyword: '슬림핏 반팔티',
      icon: '👕',
    },
    {
      name: '스트레이트 슬랙스',
      category: '하의',
      reason: 'I라인 연출',
      searchKeyword: '스트레이트 슬랙스',
      icon: '👖',
    },
    {
      name: 'V넥 니트',
      category: '상의',
      reason: '세련된 느낌',
      searchKeyword: 'V넥 니트 베이직',
      icon: '🧶',
    },
    {
      name: '테일러드 재킷',
      category: '아우터',
      reason: '정장 스타일',
      searchKeyword: '여성 블레이저',
      icon: '🧥',
    },
    {
      name: '펜슬 스커트',
      category: '하의',
      reason: '깔끔한 라인',
      searchKeyword: '펜슬 스커트 오피스',
      icon: '👗',
    },
  ],
  // 웨이브: 여성스럽고 X라인, 하이웨이스트 아이템
  W: [
    {
      name: '페플럼 블라우스',
      category: '상의',
      reason: '여성스러운 라인',
      searchKeyword: '페플럼 블라우스',
      icon: '👚',
    },
    {
      name: '하이웨이스트 팬츠',
      category: '하의',
      reason: '다리 길어보이게',
      searchKeyword: '하이웨이스트 와이드팬츠',
      icon: '👖',
    },
    {
      name: 'A라인 스커트',
      category: '하의',
      reason: 'X라인 연출',
      searchKeyword: 'A라인 미디스커트',
      icon: '👗',
    },
    {
      name: '크롭 가디건',
      category: '아우터',
      reason: '허리선 강조',
      searchKeyword: '크롭 가디건',
      icon: '🧥',
    },
    {
      name: '프릴 원피스',
      category: '원피스',
      reason: '여성스러움',
      searchKeyword: '프릴 원피스',
      icon: '👗',
    },
  ],
  // 내추럴: 오버핏, 캐주얼, 레이어드 아이템
  N: [
    {
      name: '오버사이즈 셔츠',
      category: '상의',
      reason: '자연스러운 핏',
      searchKeyword: '오버핏 셔츠',
      icon: '👕',
    },
    {
      name: '와이드 팬츠',
      category: '하의',
      reason: '편안한 실루엣',
      searchKeyword: '와이드 슬랙스',
      icon: '👖',
    },
    {
      name: '롱 코트',
      category: '아우터',
      reason: '레이어드 연출',
      searchKeyword: '롱코트 여성',
      icon: '🧥',
    },
    {
      name: '맨투맨',
      category: '상의',
      reason: '캐주얼 스타일',
      searchKeyword: '오버핏 맨투맨',
      icon: '👕',
    },
    {
      name: '데님 재킷',
      category: '아우터',
      reason: '자연스러운 멋',
      searchKeyword: '청자켓 여성',
      icon: '🧥',
    },
  ],
};

// 레거시 8타입 체형별 의류 추천 (하위 호환성)
const BODY_TYPE_CLOTHING: Record<BodyType, ClothingItem[]> = {
  X: BODY_TYPE_3_CLOTHING.S,
  V: BODY_TYPE_3_CLOTHING.S,
  Y: BODY_TYPE_3_CLOTHING.S,
  A: BODY_TYPE_3_CLOTHING.W,
  '8': BODY_TYPE_3_CLOTHING.W,
  O: BODY_TYPE_3_CLOTHING.W,
  H: BODY_TYPE_3_CLOTHING.N,
  I: BODY_TYPE_3_CLOTHING.N,
};

// 대중적인 쇼핑몰 링크 생성
function generateShoppingLinks(keyword: string, color?: string) {
  const searchTerm = color ? `${color} ${keyword}` : keyword;
  const encodedKeyword = encodeURIComponent(searchTerm);

  return {
    musinsa: `https://www.musinsa.com/search/musinsa/integration?q=${encodedKeyword}`,
    ably: `https://m.a-bly.com/search?keyword=${encodedKeyword}`,
    coupang: `https://www.coupang.com/np/search?component=&q=${encodedKeyword}`,
  };
}

// 카테고리 색상
const CATEGORY_COLORS: Record<string, string> = {
  상의: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  하의: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  원피스:
    'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  아우터:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  악세서리:
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

// 의류 아이템 컴포넌트
function ClothingItemCard({
  item,
  recommendedColor,
}: {
  item: ClothingItem;
  recommendedColor?: string;
}) {
  const links = generateShoppingLinks(item.searchKeyword, recommendedColor);

  return (
    <div
      className="p-4 bg-card rounded-lg border border-border/50 hover:border-pink-200 transition-colors"
      data-testid="clothing-item"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-foreground text-sm">{item.name}</p>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category]}`}
            >
              {item.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>

          {/* 추천 색상 표시 */}
          {recommendedColor && (
            <div className="flex items-center gap-1 mb-2">
              <Palette className="w-3 h-3 text-violet-500" />
              <span className="text-xs text-violet-600 dark:text-violet-400">
                {recommendedColor} 추천
              </span>
            </div>
          )}

          {/* 쇼핑 링크 - 대중적인 플랫폼 */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={links.musinsa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              data-testid="musinsa-link"
            >
              무신사
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={links.ably}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--affiliate-musinsa)' }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-musinsa-hover)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-musinsa)')
              }
              data-testid="ably-link"
            >
              에이블리
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={links.coupang}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--affiliate-coupang)' }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-coupang-hover)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-coupang)')
              }
              data-testid="coupang-link"
            >
              쿠팡
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 체형별 의류 추천 카드
 * C-1 결과 페이지에서 체형에 맞는 의류 추천 + 쇼핑 링크
 */
export default function RecommendedClothingCard({
  bodyType,
  colorRecommendations,
  personalColorSeason,
}: RecommendedClothingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 3타입이면 직접 사용, 8타입이면 매핑, 그 외는 스트레이트 기본값
  const getClothingItems = (): ClothingItem[] => {
    if (bodyType === 'S' || bodyType === 'W' || bodyType === 'N') {
      return BODY_TYPE_3_CLOTHING[bodyType];
    }
    // 8타입 체크
    const validBodyTypes: BodyType[] = ['X', 'V', 'Y', 'A', '8', 'O', 'H', 'I'];
    if (validBodyTypes.includes(bodyType as BodyType)) {
      return BODY_TYPE_CLOTHING[bodyType as BodyType];
    }
    // 기본값: 스트레이트
    return BODY_TYPE_3_CLOTHING.S;
  };

  const clothingItems = getClothingItems();

  // 색상 추천이 있으면 카테고리별로 색상 배정
  const getRecommendedColor = (category: string): string | undefined => {
    if (!colorRecommendations) return undefined;

    if (category === '상의') {
      return colorRecommendations.topColors[0];
    } else if (category === '하의' || category === '원피스') {
      return colorRecommendations.bottomColors[0];
    }
    return undefined;
  };

  return (
    <div
      data-testid="recommended-clothing-card"
      className="bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-fuchsia-950/30 rounded-2xl border border-pink-100 dark:border-pink-800 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                맞춤 의류 추천
                {personalColorSeason && (
                  <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                    {personalColorSeason}톤
                  </span>
                )}
              </h3>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                체형에 맞는 {clothingItems.length}개 아이템
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-pink-600 dark:text-pink-400"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* PC-1 연동 안내 */}
          {colorRecommendations && (
            <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
              <Shirt className="w-4 h-4 text-violet-500" />
              <p className="text-xs text-violet-700 dark:text-violet-300">
                퍼스널컬러 기반 색상이 반영된 추천이에요
              </p>
            </div>
          )}

          {/* 의류 아이템 목록 */}
          {clothingItems.map((item, index) => (
            <ClothingItemCard
              key={index}
              item={item}
              recommendedColor={getRecommendedColor(item.category)}
            />
          ))}

          {/* 스타일링 팁 */}
          <div className="text-center pt-2 text-xs text-muted-foreground">
            💡 검색 결과에서 추천 색상으로 필터링해보세요
          </div>
        </div>
      )}
    </div>
  );
}
