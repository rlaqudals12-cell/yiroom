'use client';

import { memo } from 'react';
import { User, Play, Star, ChevronRight } from 'lucide-react';
import {
  CelebrityMatchResult,
  BodyType,
  PersonalColorSeason,
} from '@/types/workout';
import {
  generateMatchingTitle,
  generateCelebrityDisplayInfo,
} from '@/lib/celebrityMatching';

interface CelebrityRoutineCardProps {
  matchResults: CelebrityMatchResult[];
  bodyType: BodyType;
  personalColor: PersonalColorSeason;
  onFollowClick?: (celebrityId: string, routineName: string) => void;
}

// 매칭 타입별 배지 스타일
const MATCH_TYPE_STYLES = {
  exact: {
    label: '완벽 매칭',
    className: 'bg-purple-100 text-purple-700',
  },
  bodyType: {
    label: '체형 매칭',
    className: 'bg-blue-100 text-blue-700',
  },
  personalColor: {
    label: 'PC 매칭',
    className: 'bg-pink-100 text-pink-700',
  },
};

/**
 * 연예인 루틴 매칭 카드 (메모이제이션 적용)
 * matchResults가 변경되지 않으면 리렌더링 방지
 */
const CelebrityRoutineCard = memo(function CelebrityRoutineCard({
  matchResults,
  bodyType,
  personalColor,
  onFollowClick,
}: CelebrityRoutineCardProps) {
  const title = generateMatchingTitle(bodyType, personalColor);

  // 매칭 결과가 없는 경우
  if (matchResults.length === 0) {
    return (
      <div
        data-testid="celebrity-routine-card"
        className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-6 border border-purple-100"
      >
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
          <Star className="w-5 h-5 text-purple-500" />
          연예인 루틴
        </h3>
        <div className="text-center py-6 text-gray-400">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">아직 매칭된 연예인이 없습니다</p>
          <p className="text-xs mt-1">
            더 많은 연예인 루틴이 곧 추가될 예정이에요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="celebrity-routine-card"
      className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-6 border border-purple-100"
    >
      {/* 헤더 */}
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-2">
        <Star className="w-5 h-5 text-purple-500" />
        연예인 루틴
      </h3>

      {/* 타이틀 */}
      <p className="text-sm text-purple-600 font-medium mb-4">{title}</p>

      {/* 연예인 리스트 */}
      <div className="space-y-3">
        {matchResults.map((result) => {
          const displayInfo = generateCelebrityDisplayInfo(result.celebrity);
          const matchStyle = MATCH_TYPE_STYLES[result.matchType];

          return (
            <div
              key={result.celebrity.id}
              data-testid={`celebrity-item-${result.celebrity.id}`}
              className="bg-white rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* 아이콘 */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-purple-500" />
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  {/* 이름 & 그룹 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">
                      {displayInfo.name}
                    </span>
                    {displayInfo.group && (
                      <span className="text-sm text-gray-500">
                        ({displayInfo.group})
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${matchStyle.className}`}
                    >
                      {matchStyle.label}
                    </span>
                  </div>

                  {/* 상세 정보 */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                    <span>체형: {displayInfo.bodyType}</span>
                    <span>•</span>
                    <span>PC: {displayInfo.personalColor}</span>
                  </div>

                  {/* 운동 타입 */}
                  <div className="flex flex-wrap gap-1">
                    {displayInfo.routineTypes.map((routineType) => (
                      <span
                        key={routineType}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {routineType}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 따라하기 버튼 */}
                {onFollowClick && result.recommendedRoutine && (
                  <button
                    onClick={() =>
                      onFollowClick(
                        result.celebrity.id,
                        result.recommendedRoutine!.name
                      )
                    }
                    className="flex items-center gap-1 px-3 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors flex-shrink-0"
                  >
                    <Play className="w-4 h-4" />
                    따라하기
                  </button>
                )}
              </div>

              {/* 추천 루틴 정보 */}
              {result.recommendedRoutine && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {result.recommendedRoutine.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {result.recommendedRoutine.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 더보기 안내 */}
      {matchResults.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-4">
          {matchResults[0].matchType === 'exact'
            ? `${matchResults.length}명의 연예인이 같은 체형+PC 타입이에요`
            : '비슷한 체형의 연예인 루틴을 추천해드려요'}
        </p>
      )}
    </div>
  );
});

export default CelebrityRoutineCard;
