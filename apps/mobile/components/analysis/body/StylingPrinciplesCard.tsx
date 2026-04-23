/**
 * 스타일링 원칙 카드 (Mobile) — C-1 결과 3섹션 구조 ① (ADR-098)
 *
 * 체형을 "개선 대상"이 아니라 "이해와 표현의 대상"으로 다루는 장기 기준.
 * 웹 버전(apps/web/components/analysis/body/StylingPrinciplesCard.tsx)과
 * 동일한 데이터/구조를 React Native + NativeWind로 포팅.
 */

import { Sparkles, Check } from 'lucide-react-native';
import { View, Text } from 'react-native';

import { STYLING_PRINCIPLES, type StylingBodyType } from '@yiroom/shared';

interface StylingPrinciplesCardProps {
  bodyType: StylingBodyType;
  bodyTypeLabel?: string;
}

export function StylingPrinciplesCard({ bodyType, bodyTypeLabel }: StylingPrinciplesCardProps) {
  const principles = STYLING_PRINCIPLES[bodyType];

  if (!principles || principles.length === 0) {
    return null;
  }

  return (
    <View
      testID="styling-principles-card"
      accessibilityLabel="체형별 스타일링 원칙"
      className="rounded-2xl border border-violet-200/60 bg-violet-50 p-5"
    >
      <View className="mb-4 flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
          <Sparkles size={16} color="#7c3aed" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">스타일링 원칙</Text>
          <Text className="text-xs text-slate-600">
            {bodyTypeLabel ? `${bodyTypeLabel} 체형` : '이 체형'}이 가진 기준 — 장기적으로 가져갈
            방향이에요
          </Text>
        </View>
      </View>

      <View className="gap-3">
        {principles.map((principle, idx) => (
          <View
            key={principle.title}
            testID={`styling-principle-${idx}`}
            className="rounded-xl border border-violet-100/70 bg-white/80 p-4"
          >
            <View className="flex-row items-start gap-2">
              <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                <Text className="text-[10px] font-bold text-white">{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-900">{principle.title}</Text>
                <Text className="mt-1 text-xs leading-5 text-slate-600">{principle.rationale}</Text>
                <View className="mt-2 flex-row items-start gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5">
                  <View className="mt-0.5">
                    <Check size={12} color="#8b5cf6" />
                  </View>
                  <Text className="flex-1 text-[11px] leading-4 text-violet-900">
                    {principle.application}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
