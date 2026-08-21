import { StyleSheet } from 'react-native';

import { REPORT_COLORS } from '@/components/analysis/report';
import { AxisResultShareSection } from '@/components/share';
import { spacing, typography } from '@/lib/theme';

export interface SkinResultShareProps {
  description: string;
  recommendedIngredient: string;
  typeName: string;
  usedFallback: boolean;
}

/** 피부 결과의 실제 타입·추천 성분만 E+ 카드에 넘긴다. */
export function SkinResultShare({
  description,
  recommendedIngredient,
  typeName,
  usedFallback,
}: SkinResultShareProps): React.JSX.Element {
  return (
    <AxisResultShareSection
      analysisType="skin"
      badges={[{ label: '추천 성분', value: recommendedIngredient }]}
      heading="내 피부 카드"
      oneLine={description}
      usedFallback={usedFallback}
      verdict={typeName}
    />
  );
}

export const skinResultStyles = StyleSheet.create({
  skinImage: { borderRadius: 52, height: 104, width: 104 },
  evidenceText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.sm,
    lineHeight: 21,
    paddingBottom: spacing.xs,
  },
});
