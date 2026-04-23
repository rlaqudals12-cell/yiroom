/**
 * 추천 코디 카드 (Mobile) — C-1 결과 3섹션 구조 ② (ADR-098)
 *
 * 체형 × 퍼스널컬러로 바로 실행 가능한 3세트 코디.
 * 웹 버전과 동일하게 `getOutfitExamples()` 재활용.
 *
 * PC-1 결과가 없으면 "퍼스널 컬러를 먼저 분석하면 더 정확해요" 안내를
 * 붙이되, 중립 색상군(Autumn)으로라도 코디를 보여 단기 실행을 막지 않는다.
 */

import { Shirt, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

import type { StylingBodyType } from '@yiroom/shared';
import { getOutfitExamples, type PersonalColorSeason } from '@/lib/color-recommendations';

interface OutfitExamplesCardProps {
  bodyType: StylingBodyType;
  // DB에는 string | null 로 저장되므로 string도 허용하고 내부에서 화이트리스트 검증
  personalColorSeason?: PersonalColorSeason | string | null;
}

const SEASON_SET: Set<PersonalColorSeason> = new Set(['Spring', 'Summer', 'Autumn', 'Winter']);

function normalizeSeason(
  raw: PersonalColorSeason | string | null | undefined
): PersonalColorSeason | null {
  if (!raw) return null;
  return SEASON_SET.has(raw as PersonalColorSeason) ? (raw as PersonalColorSeason) : null;
}

// PC-1 미분석 사용자를 위한 중립 시즌 fallback (Autumn이 중립 톤)
const DEFAULT_SEASON: PersonalColorSeason = 'Autumn';

export function OutfitExamplesCard({ bodyType, personalColorSeason }: OutfitExamplesCardProps) {
  const normalizedSeason = normalizeSeason(personalColorSeason);
  const season = normalizedSeason ?? DEFAULT_SEASON;
  const examples = getOutfitExamples(bodyType, season);
  const hasPersonalColor = normalizedSeason !== null;

  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <View
      testID="outfit-examples-card"
      accessibilityLabel="추천 코디 세트"
      className="rounded-2xl border border-blue-200/60 bg-blue-50 p-5"
    >
      <View className="mb-4 flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
          <Shirt size={16} color="#2563eb" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">추천 코디</Text>
          <Text className="text-xs text-slate-600">
            원칙을 바로 입어볼 수 있는 {examples.length}가지 세트
          </Text>
        </View>
      </View>

      {!hasPersonalColor && (
        <Pressable
          onPress={() => router.push('/(analysis)/personal-color')}
          className="mb-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/80 px-3 py-2"
          accessibilityRole="button"
          accessibilityLabel="퍼스널 컬러 분석하러 가기"
        >
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-xs font-medium text-blue-800">
              퍼스널 컬러를 분석하면 내 톤에 딱 맞는 코디로 바뀌어요
            </Text>
            <ChevronRight size={14} color="#1d4ed8" />
          </View>
        </Pressable>
      )}

      <View className="gap-3">
        {examples.map((outfit, idx) => (
          <View
            key={outfit.title}
            testID={`outfit-example-${idx}`}
            className="rounded-xl border border-blue-100/70 bg-white/80 p-4"
          >
            <View className="mb-2 flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-sm font-semibold text-slate-900">{outfit.title}</Text>
              <View className="rounded-full bg-blue-100 px-2 py-0.5">
                <Text className="text-[10px] font-medium text-blue-700">{outfit.occasion}</Text>
              </View>
            </View>
            <View className="gap-1">
              {outfit.items.map((item) => (
                <View key={item} className="flex-row items-start gap-1.5">
                  <View className="mt-1.5 h-1 w-1 rounded-full bg-blue-400" />
                  <Text className="flex-1 text-xs text-slate-600">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
