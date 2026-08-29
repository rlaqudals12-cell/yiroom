/**
 * ResultVerdictText — 분석 결과의 데이터 기반 결론 전용 세리프 텍스트
 *
 * ADR-120의 진단지 문법을 결과 히어로에만 제한해서 적용한다.
 * 정적 700 폰트 파일 자체가 굵기를 가지므로 fontWeight를 중첩하지 않는다.
 */
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { typography, useTheme } from '@/lib/theme';
import { RESULT_SERIF_FONT_FAMILY } from '@/lib/theme/fonts';

export interface ResultVerdictTextProps {
  children: string;
  color?: string;
  textAlign?: TextStyle['textAlign'];
  testID?: string;
}

export function ResultVerdictText({
  children,
  color,
  textAlign = 'center',
  testID = 'result-verdict-text',
}: ResultVerdictTextProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <Text
      accessibilityRole="header"
      style={[styles.verdict, styles.serif, { color: color ?? colors.foreground, textAlign }]}
      testID={testID}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  verdict: {
    fontSize: 28,
    lineHeight: 38,
    letterSpacing: typography.letterSpacing.tight,
  },
  serif: {
    fontFamily: RESULT_SERIF_FONT_FAMILY,
  },
});
