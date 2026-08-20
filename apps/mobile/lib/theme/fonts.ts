/**
 * 모바일 에디토리얼 폰트 정본.
 *
 * 결과 verdict 한 곳에만 한글 세리프를 적용해 전면 타이포 교체를 막는다.
 */
// 패키지 루트는 8개 weight(약 112MB)를 모두 require하므로 600 자산만 직접 가져온다.
import { NotoSerifKR_600SemiBold } from '@expo-google-fonts/noto-serif-kr/600SemiBold';

export const RESULT_SERIF_FONT_FAMILY = 'NotoSerifKR_600SemiBold';

export const resultSerifFonts = {
  [RESULT_SERIF_FONT_FAMILY]: NotoSerifKR_600SemiBold,
} as const;
