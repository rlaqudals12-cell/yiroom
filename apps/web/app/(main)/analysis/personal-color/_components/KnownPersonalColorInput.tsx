'use client';

import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SEASON_INFO,
  SUBTYPES_BY_SEASON,
  type SeasonType,
  type PersonalColorSubtype,
  type PersonalColorSubtypeInfo,
} from '@/lib/mock/personal-color';

interface KnownPersonalColorInputProps {
  onSelect: (seasonType: SeasonType, subtype?: PersonalColorSubtype) => void;
  onBack: () => void;
}

// 시즌 타입별 스타일
const seasonStyles: Record<SeasonType, { bg: string; border: string; selected: string; accent: string }> = {
  spring: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    selected: 'border-pink-500 bg-pink-100',
    accent: 'text-pink-600',
  },
  summer: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    selected: 'border-blue-500 bg-blue-100',
    accent: 'text-blue-600',
  },
  autumn: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    selected: 'border-orange-500 bg-orange-100',
    accent: 'text-orange-600',
  },
  winter: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    selected: 'border-purple-500 bg-purple-100',
    accent: 'text-purple-600',
  },
};

export default function KnownPersonalColorInput({
  onSelect,
  onBack,
}: KnownPersonalColorInputProps) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonType | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<PersonalColorSubtypeInfo | null>(null);

  // 시즌 선택 핸들러
  const handleSeasonSelect = (season: SeasonType) => {
    setSelectedSeason(season);
    setSelectedSubtype(null); // 시즌 변경 시 서브타입 초기화
  };

  // 서브타입 선택 핸들러
  const handleSubtypeSelect = (subtype: PersonalColorSubtypeInfo) => {
    setSelectedSubtype(subtype);
  };

  // 확인 핸들러
  const handleConfirm = () => {
    if (selectedSeason) {
      onSelect(selectedSeason, selectedSubtype?.id);
    }
  };

  // 현재 선택된 시즌의 서브타입 목록
  const currentSubtypes = selectedSeason ? SUBTYPES_BY_SEASON[selectedSeason] : [];

  return (
    <div data-testid="known-personal-color-input" className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          퍼스널 컬러를 선택해주세요
        </h2>
        <p className="text-sm text-muted-foreground">
          이전에 진단받은 퍼스널 컬러 타입을 선택하세요
        </p>
      </div>

      {/* Step 1: 시즌 선택 */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">1. 기본 시즌 선택</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(SEASON_INFO) as SeasonType[]).map((season) => {
            const info = SEASON_INFO[season];
            const styles = seasonStyles[season];
            const isSelected = selectedSeason === season;

            return (
              <button
                key={season}
                onClick={() => handleSeasonSelect(season)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? styles.selected
                    : `${styles.bg} ${styles.border} hover:opacity-80`
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.emoji}</span>
                  {isSelected && <Check className={`w-4 h-4 ${styles.accent}`} />}
                </div>
                <div className="font-semibold text-foreground mt-1">{info.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: 세부 타입 선택 (시즌 선택 후 표시) */}
      {selectedSeason && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            2. 세부 타입 선택 <span className="text-muted-foreground font-normal">(선택)</span>
          </p>
          <div className="space-y-2">
            {currentSubtypes.map((subtype) => {
              const styles = seasonStyles[selectedSeason];
              const isSelected = selectedSubtype?.id === subtype.id;

              return (
                <button
                  key={subtype.id}
                  onClick={() => handleSubtypeSelect(subtype)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? styles.selected
                      : `bg-card ${styles.border} hover:bg-muted/50`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">{subtype.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {subtype.description}
                      </p>
                    </div>
                    {isSelected && <Check className={`w-4 h-4 ${styles.accent}`} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 세부 타입을 모르는 경우 안내 */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            세부 타입을 모르면 기본 시즌만 선택해도 괜찮아요
          </p>
        </div>
      )}

      {/* 선택 결과 미리보기 */}
      {selectedSeason && (
        <div className={`p-4 rounded-xl ${seasonStyles[selectedSeason].bg} border ${seasonStyles[selectedSeason].border}`}>
          <p className="text-sm text-foreground">
            <span className="font-medium">선택한 퍼스널 컬러: </span>
            {selectedSubtype ? selectedSubtype.label : SEASON_INFO[selectedSeason].label}
          </p>
        </div>
      )}

      {/* 안내 문구 */}
      <div className="text-center text-xs text-muted-foreground">
        <p>정확하지 않다면 AI 진단을 받아보세요</p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          돌아가기
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedSeason}
          className="flex-1 h-12 bg-foreground hover:bg-foreground/90 text-background"
        >
          선택 완료
        </Button>
      </div>
    </div>
  );
}
