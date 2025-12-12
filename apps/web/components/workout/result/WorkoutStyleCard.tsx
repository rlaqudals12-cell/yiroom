'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { Shirt, Palette, Package, Sparkles, ChevronDown, ChevronUp, ExternalLink, ShoppingBag } from 'lucide-react';
import type { PersonalColorSeason, BodyType } from '@/types/workout';
import {
  getWorkoutStyleRecommendation,
  getPersonalColorLabel,
  getPersonalColorEmoji,
  getPersonalColorTheme,
} from '@/lib/workout/styleRecommendations';
import {
  generateShoppingLinks,
  type ShoppingCategory,
} from '@/lib/workout/shoppingLinks';

interface WorkoutStyleCardProps {
  personalColor: PersonalColorSeason;
  bodyType: BodyType | null;
}

/**
 * 운동복 스타일 추천 카드 (메모이제이션 적용)
 * PC-1 연동 (운동복 색상 + 핏 추천)
 */
const WorkoutStyleCard = memo(function WorkoutStyleCard({
  personalColor,
  bodyType,
}: WorkoutStyleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ShoppingCategory>('workout-top');

  // 스타일 추천 결과 (메모이제이션)
  const recommendation = useMemo(
    () => getWorkoutStyleRecommendation(personalColor, bodyType),
    [personalColor, bodyType]
  );

  // 테마 정보 (메모이제이션)
  const { theme, label, emoji } = useMemo(
    () => ({
      theme: getPersonalColorTheme(personalColor),
      label: getPersonalColorLabel(personalColor),
      emoji: getPersonalColorEmoji(personalColor),
    }),
    [personalColor]
  );

  // 쇼핑 링크 생성 (메모이제이션)
  const shoppingLinks = useMemo(
    () => generateShoppingLinks(selectedCategory, personalColor, bodyType),
    [selectedCategory, personalColor, bodyType]
  );

  // 쇼핑 링크 클릭 핸들러 (useCallback으로 최적화)
  const handleShopClick = useCallback((url: string) => {
    // TODO: 분석 이벤트 트래킹 추가 시 platform 파라미터 추가
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border ${theme.border} overflow-hidden`}
      data-testid="workout-style-card"
    >
      {/* 헤더 */}
      <div className={`${theme.bgLight} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${theme.bg} rounded-full flex items-center justify-center`}>
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">운동복 스타일 가이드</h3>
              <p className={`text-sm ${theme.text}`}>
                {emoji} {label} 맞춤 추천
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg hover:bg-white/50 transition-colors ${theme.text}`}
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

      {/* 스타일 팁 (항상 표시) */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <Sparkles className={`w-4 h-4 ${theme.text} mt-0.5 flex-shrink-0`} />
          <p className="text-sm text-gray-700">{recommendation.styleTip}</p>
        </div>
      </div>

      {/* 추천 색상 (항상 표시) */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">추천 색상</span>
        </div>
        <div className="flex gap-2 flex-wrap" data-testid="recommended-colors">
          {recommendation.recommendedColors.map((color) => (
            <div
              key={color.hex}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full"
            >
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
              />
              <span className="text-xs text-gray-600">{color.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* 피해야 할 색상 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">피해야 할 색상</span>
            </div>
            <div className="flex gap-2 flex-wrap" data-testid="avoid-colors">
              {recommendation.avoidColors.map((color) => (
                <div
                  key={color.hex}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  />
                  <span className="text-xs text-red-600">{color.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 핏 추천 (체형이 있을 때만) */}
          {recommendation.fitRecommendation && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Shirt className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {bodyType}자 체형 맞춤 핏
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 w-12 flex-shrink-0">상의</span>
                  <span className="text-sm text-gray-700">
                    {recommendation.fitRecommendation.top}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 w-12 flex-shrink-0">하의</span>
                  <span className="text-sm text-gray-700">
                    {recommendation.fitRecommendation.bottom}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-red-500 w-12 flex-shrink-0">피하기</span>
                  <span className="text-sm text-gray-500">
                    {recommendation.fitRecommendation.avoid.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 운동 소품 추천 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">운동 소품 색상</span>
            </div>
            <div className="grid grid-cols-2 gap-2" data-testid="accessories">
              {recommendation.accessories.map((accessory) => (
                <div
                  key={accessory.item}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: accessory.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {accessory.item}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {accessory.colorName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 운동 분위기 */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">어울리는 운동 분위기</span>
            </div>
            <div className={`p-3 rounded-xl ${theme.bgLight}`}>
              <p className={`text-sm font-medium ${theme.text} mb-2`}>
                {recommendation.ambient.mood} 분위기
              </p>
              <p className="text-xs text-gray-600 mb-2">
                {recommendation.ambient.environment}
              </p>
              <div className="flex flex-wrap gap-1">
                {recommendation.ambient.activities.map((activity) => (
                  <span
                    key={activity}
                    className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 쇼핑 링크 */}
          <div className="p-4 bg-gray-50" data-testid="shopping-section">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">쇼핑몰에서 찾아보기</span>
            </div>

            {/* 카테고리 선택 */}
            <div className="flex gap-2 mb-3" data-testid="category-selector">
              {([
                { value: 'workout-top', label: '상의' },
                { value: 'workout-bottom', label: '하의' },
                { value: 'accessory', label: '소품' },
              ] as const).map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    selectedCategory === cat.value
                      ? `${theme.bg} text-white`
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                  aria-pressed={selectedCategory === cat.value}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 플랫폼별 쇼핑 링크 */}
            <div className="space-y-2" data-testid="shopping-links">
              {shoppingLinks.map((link) => (
                <button
                  key={link.platform}
                  onClick={() => handleShopClick(link.url)}
                  className="w-full py-2.5 px-4 flex items-center justify-between bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                  data-testid={`shop-link-${link.platform}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{link.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {link.platformName}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </button>
              ))}
            </div>

            {/* 색상 힌트 */}
            <p className="text-xs text-gray-400 mt-3 text-center">
              {emoji} {label} 타입에 어울리는 색상으로 검색됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default WorkoutStyleCard;
