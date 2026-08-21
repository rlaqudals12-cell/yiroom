import { StyleSheet } from 'react-native';

import { AxisResultShareSection } from '@/components/share';
import type { PersonalColorReportSeasonInfo } from '@/lib/analysis/personal-color-report-data';
import { radii, spacing } from '@/lib/theme';

export function getPersonalColorMakeupRows(
  tone: PersonalColorReportSeasonInfo['tone']
): { label: string; value: string }[] {
  return tone === 'warm'
    ? [
        { label: '립 컬러', value: '코랄, 피치 계열' },
        { label: '아이섀도', value: '골드, 브론즈 계열' },
        { label: '블러셔', value: '피치, 살구 계열' },
        { label: '주얼리', value: '골드, 로즈골드' },
      ]
    : [
        { label: '립 컬러', value: '로즈, 베리 계열' },
        { label: '아이섀도', value: '실버, 라벤더 계열' },
        { label: '블러셔', value: '핑크, 로즈 계열' },
        { label: '주얼리', value: '실버, 플래티넘' },
      ];
}

export interface PersonalColorResultShareProps {
  description: string;
  season: PersonalColorReportSeasonInfo;
  usedFallback: boolean;
}

/** 퍼스널컬러 화면이 서버 팔레트 순서를 그대로 E+ 카드에 넘기게 고정한다. */
export function PersonalColorResultShare({
  description,
  season,
  usedFallback,
}: PersonalColorResultShareProps): React.JSX.Element {
  return (
    <AxisResultShareSection
      analysisType="personal-color"
      badges={[
        { label: '세부 톤', value: season.subType },
        { label: '언더톤', value: season.tone === 'warm' ? '웜' : '쿨' },
      ]}
      heading="내 컬러 카드"
      inviteText="너의 계절은?"
      oneLine={description}
      palette={season.bestColors}
      usedFallback={usedFallback}
      verdict={season.name}
      worstPalette={season.worstColors}
    />
  );
}

export const personalColorResultStyles = StyleSheet.create({
  conclusion: { gap: spacing.md },
  evidenceGroup: { gap: spacing.md },
  resultImage: {
    borderRadius: radii.lg,
    height: 168,
    width: 132,
  },
});
