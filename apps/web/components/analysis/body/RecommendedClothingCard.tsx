'use client';

import { useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, ExternalLink, Palette, Shirt } from 'lucide-react';
import type { BodyType } from '@/lib/mock/body-analysis';
import type { ColorRecommendations } from '@/lib/mock/body-analysis';

interface ClothingItem {
  name: string;
  category: '상의' | '하의' | '원피스' | '아우터' | '악세서리';
  reason: string;
  searchKeyword: string;
  icon: string;
}

interface RecommendedClothingCardProps {
  bodyType: BodyType;
  styleRecommendations: Array<{ item: string; reason: string }>;
  colorRecommendations?: ColorRecommendations | null;
  personalColorSeason?: string | null;
}

// 체형별 상세 의류 추천 (쇼핑 검색어 포함)
const BODY_TYPE_CLOTHING: Record<BodyType, ClothingItem[]> = {
  X: [
    { name: '핏티드 니트', category: '상의', reason: '허리 라인 강조', searchKeyword: '슬림핏 니트', icon: '👕' },
    { name: '하이웨이스트 팬츠', category: '하의', reason: '균형잡힌 실루엣', searchKeyword: '하이웨이스트 와이드팬츠', icon: '👖' },
    { name: 'A라인 스커트', category: '하의', reason: '여성스러운 라인', searchKeyword: 'A라인 미디스커트', icon: '👗' },
    { name: '벨트', category: '악세서리', reason: '허리 강조 포인트', searchKeyword: '가죽 벨트 여성', icon: '🎀' },
  ],
  A: [
    { name: '보트넥 상의', category: '상의', reason: '어깨 라인 확장', searchKeyword: '보트넥 티셔츠', icon: '👕' },
    { name: '스트레이트 팬츠', category: '하의', reason: '하체 슬림 효과', searchKeyword: '스트레이트 슬랙스', icon: '👖' },
    { name: 'A라인 원피스', category: '원피스', reason: '전체 균형', searchKeyword: 'A라인 미디원피스', icon: '👗' },
    { name: '숄더 패드 블라우스', category: '상의', reason: '어깨 볼륨 추가', searchKeyword: '숄더패드 블라우스', icon: '👚' },
  ],
  V: [
    { name: 'V넥 상의', category: '상의', reason: '시선 집중 + 세로 라인', searchKeyword: 'V넥 니트', icon: '👕' },
    { name: '와이드 팬츠', category: '하의', reason: '하체 볼륨감', searchKeyword: '와이드 팬츠 여성', icon: '👖' },
    { name: '플레어 스커트', category: '하의', reason: '균형있는 실루엣', searchKeyword: '플레어 롱스커트', icon: '👗' },
    { name: '심플 탑', category: '상의', reason: '어깨 자연스럽게', searchKeyword: '심플 민소매', icon: '👚' },
  ],
  H: [
    { name: '벨트 원피스', category: '원피스', reason: '허리 라인 생성', searchKeyword: '벨트 셔츠원피스', icon: '👗' },
    { name: '페플럼 상의', category: '상의', reason: '곡선미 추가', searchKeyword: '페플럼 블라우스', icon: '👚' },
    { name: '랩 스타일 상의', category: '상의', reason: '여성스러운 라인', searchKeyword: '랩 블라우스', icon: '👕' },
    { name: '플리츠 스커트', category: '하의', reason: '볼륨감 연출', searchKeyword: '플리츠 미디스커트', icon: '👗' },
  ],
  O: [
    { name: 'V넥 니트', category: '상의', reason: '상체 길어보이게', searchKeyword: 'V넥 니트 여성', icon: '👕' },
    { name: 'A라인 코트', category: '아우터', reason: '슬림한 실루엣', searchKeyword: 'A라인 롱코트', icon: '🧥' },
    { name: '세로 스트라이프', category: '상의', reason: '세로 라인 강조', searchKeyword: '스트라이프 셔츠', icon: '👔' },
    { name: '부츠컷 팬츠', category: '하의', reason: '날씬해 보이는 효과', searchKeyword: '부츠컷 슬랙스', icon: '👖' },
  ],
  I: [
    { name: '볼륨 슬리브', category: '상의', reason: '입체감 추가', searchKeyword: '퍼프슬리브 블라우스', icon: '👚' },
    { name: '레이어드 아이템', category: '상의', reason: '볼륨감 연출', searchKeyword: '레이어드 니트', icon: '👕' },
    { name: '러플 원피스', category: '원피스', reason: '부드러운 곡선', searchKeyword: '러플 미디원피스', icon: '👗' },
    { name: '크롭 재킷', category: '아우터', reason: '비율 조절', searchKeyword: '크롭 트위드 자켓', icon: '🧥' },
  ],
  Y: [
    { name: '심플 탑', category: '상의', reason: '어깨 자연스럽게', searchKeyword: '기본 라운드 티', icon: '👕' },
    { name: '와이드 팬츠', category: '하의', reason: '하체 볼륨감', searchKeyword: '와이드 슬랙스', icon: '👖' },
    { name: 'A라인 스커트', category: '하의', reason: '전체 균형', searchKeyword: 'A라인 롱스커트', icon: '👗' },
    { name: '다크톤 상의', category: '상의', reason: '상체 시각적 축소', searchKeyword: '블랙 니트', icon: '🖤' },
  ],
  '8': [
    { name: '바디콘 원피스', category: '원피스', reason: '곡선미 강조', searchKeyword: '바디콘 미디원피스', icon: '👗' },
    { name: '하이웨이스트', category: '하의', reason: '허리 라인 강조', searchKeyword: '하이웨이스트 스커트', icon: '👖' },
    { name: '랩 상의', category: '상의', reason: '가슴 라인 정돈', searchKeyword: '랩 블라우스', icon: '👚' },
    { name: '펜슬 스커트', category: '하의', reason: '곡선 실루엣', searchKeyword: '펜슬 미디스커트', icon: '👗' },
  ],
};

// 쇼핑몰 링크 생성
function generateShoppingLinks(keyword: string, color?: string) {
  const searchTerm = color ? `${color} ${keyword}` : keyword;
  const encodedKeyword = encodeURIComponent(searchTerm);

  return {
    musinsa: `https://www.musinsa.com/search/musinsa/integration?q=${encodedKeyword}`,
    coupang: `https://www.coupang.com/np/search?component=&q=${encodedKeyword}`,
  };
}

// 카테고리 색상
const CATEGORY_COLORS: Record<string, string> = {
  '상의': 'bg-blue-50 text-blue-600 border-blue-200',
  '하의': 'bg-purple-50 text-purple-600 border-purple-200',
  '원피스': 'bg-pink-50 text-pink-600 border-pink-200',
  '아우터': 'bg-amber-50 text-amber-600 border-amber-200',
  '악세서리': 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

// 의류 아이템 컴포넌트
function ClothingItemCard({
  item,
  recommendedColor
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
            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category]}`}>
              {item.category}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>

          {/* 추천 색상 표시 */}
          {recommendedColor && (
            <div className="flex items-center gap-1 mb-2">
              <Palette className="w-3 h-3 text-violet-500" />
              <span className="text-xs text-violet-600">{recommendedColor} 추천</span>
            </div>
          )}

          {/* 쇼핑 링크 */}
          <div className="flex items-center gap-2">
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
              href={links.coupang}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-[#e01d2c] text-white rounded hover:bg-[#c41926] transition-colors"
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

  const clothingItems = BODY_TYPE_CLOTHING[bodyType] || [];

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
      className="bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 rounded-2xl border border-pink-100 overflow-hidden"
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
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    {personalColorSeason}톤
                  </span>
                )}
              </h3>
              <p className="text-sm text-pink-600">
                체형에 맞는 {clothingItems.length}개 아이템
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-pink-600"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* PC-1 연동 안내 */}
          {colorRecommendations && (
            <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200">
              <Shirt className="w-4 h-4 text-violet-500" />
              <p className="text-xs text-violet-700">
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
