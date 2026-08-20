/**
 * ResultVerdictText — 분석 결과의 데이터 기반 결론 전용 세리프 텍스트
 *
 * ADR-120의 진단지 문법을 결과 히어로에만 제한해서 적용한다.
 * 정적 600 폰트 파일 자체가 굵기를 가지므로 fontWeight를 중첩하지 않는다.
 */
import { useFonts } from 'expo-font';
import { StyleSheet, Text } from 'react-native';

import { typography, useTheme } from '@/lib/theme';
import { RESULT_SERIF_FONT_FAMILY, resultSerifFonts } from '@/lib/theme/fonts';

export interface ResultVerdictTextProps {
  children: string;
  color?: string;
  testID?: string;
}

export function ResultVerdictText({
  children,
  color,
  testID = 'result-verdict-text',
}: ResultVerdictTextProps): React.JSX.Element {
  const { colors } = useTheme();
  // 14MB 한글 글꼴이 앱 시작과 계측을 막지 않도록 결과 히어로가 나타날 때만 로드한다.
  const [fontsLoaded] = useFonts(resultSerifFonts);

  return (
    <Text
      accessibilityRole="header"
      style={[
        styles.verdict,
        fontsLoaded ? styles.serif : null,
        { color: color ?? colors.foreground },
      ]}
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
    textAlign: 'center',
  },
  serif: {
    fontFamily: RESULT_SERIF_FONT_FAMILY,
  },
});
