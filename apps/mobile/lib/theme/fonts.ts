/**
 * 모바일 에디토리얼 폰트 정본.
 *
 * 결과 verdict 한 곳에만 한글 세리프를 적용해 전면 타이포 교체를 막는다.
 */
// 패키지 루트 대신 700 자산만 직접 가져와 결과 히어로의 번들 비용을 제한한다.
import { NanumMyeongjo_700Bold } from '@expo-google-fonts/nanum-myeongjo/700Bold';

export const RESULT_SERIF_FONT_FAMILY = 'NanumMyeongjo_700Bold';

export const resultSerifFonts = {
  [RESULT_SERIF_FONT_FAMILY]: NanumMyeongjo_700Bold,
} as const;
