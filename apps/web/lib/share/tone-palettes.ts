/**
 * 공유카드용 12톤 큐레이션 팔레트 — 재수출 심(shim)
 *
 * 2026-07-23 본체를 @yiroom/shared/tone-palettes로 이관(모바일 E+ 카드 포팅이 동일
 * 큐레이션을 소비 — 웹-모바일 색 드리프트 방지). 웹 소비자(결과 페이지·랜딩·프리뷰·테스트)의
 * 기존 import 경로를 보존하기 위해 이 파일은 재수출만 한다.
 *
 * @module lib/share/tone-palettes
 * @see packages/shared/src/tone-palettes/index.ts (정본)
 */

export {
  getCardPalette,
  toneHeroLabelKo,
  TONE_LABELS_KO,
  SEASON_LABELS_KO,
  type CardPalette,
  type CardPaletteColor,
  type CardLocale,
} from '@yiroom/shared';
