import type { MobileAnalysisType } from '@/lib/analytics/tracker';

import { PersonaShareSection } from './PersonaShareSection';

type AxisAnalysisType = Exclude<MobileAnalysisType, 'integrated'>;

export interface AxisResultShareSectionProps {
  analysisType: AxisAnalysisType;
  heading: string;
  verdict: string;
  oneLine: string;
  badges?: { label: string; value: string }[];
  palette?: string[];
  worstPalette?: string[];
  usedFallback?: boolean;
  inviteText?: string;
}

/** 단독 5축 결과를 검증된 E+ 카드 입력으로만 얇게 변환한다. */
export function AxisResultShareSection({
  analysisType,
  heading,
  verdict,
  oneLine,
  badges = [],
  palette = [],
  worstPalette = [],
  usedFallback = false,
  inviteText = '나도 진단하기',
}: AxisResultShareSectionProps): React.JSX.Element {
  return (
    <PersonaShareSection
      analysisType={analysisType}
      data={{
        oneLine,
        toneName: verdict,
        badges: [...badges, ...(usedFallback ? [{ label: '근거', value: '예시 결과' }] : [])],
        palette: palette.map((hex) => ({ hex })),
        worstPalette: worstPalette.map((hex) => ({ hex })),
      }}
      dialogTitle={`${heading} 공유`}
      heading={heading}
      inviteText={inviteText}
    />
  );
}
