/** 웹 `lib/analysis/drape-palette` 표준 색천 메타데이터의 모바일 미러. */
import { calculateCIEDE2000, hexToLab } from '@/lib/color';

export interface DrapeOpticalReference {
  hex: string;
  name: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  reflectance: number;
  warmth: number;
  saturationBoost: number;
  muteness: number;
}

type DrapeTuple = readonly [
  hex: string,
  name: string,
  season: DrapeOpticalReference['season'],
  reflectance: number,
  warmth: number,
  saturationBoost: number,
  muteness: number,
];

// 값은 웹 정본의 32색과 동일하다. 피부 실측값이 없으므로 상호작용 점수는 미러하지 않는다.
const OPTICAL_DRAPE_TUPLES: readonly DrapeTuple[] = [
  ['#FFE0B2', '피치', 'spring', 0.85, 0.7, 0.3, 0.1],
  ['#FFB74D', '아프리콧', 'spring', 0.75, 0.8, 0.4, 0.15],
  ['#FFD54F', '선플라워', 'spring', 0.88, 0.85, 0.35, 0.1],
  ['#81C784', '스프링 그린', 'spring', 0.72, 0.3, 0.25, 0.2],
  ['#FF8A65', '코랄', 'spring', 0.7, 0.75, 0.45, 0.1],
  ['#64B5F6', '스카이 블루', 'spring', 0.78, -0.1, 0.2, 0.15],
  ['#FFA726', '망고', 'spring', 0.73, 0.9, 0.5, 0.05],
  ['#F06292', '로즈 핑크', 'spring', 0.68, 0.2, 0.35, 0.1],
  ['#CE93D8', '라벤더', 'summer', 0.72, -0.4, 0.15, 0.45],
  ['#90CAF9', '스카이 블루', 'summer', 0.8, -0.35, 0.1, 0.4],
  ['#B2DFDB', '민트', 'summer', 0.82, -0.2, 0.1, 0.5],
  ['#F8BBD0', '로즈 쿼츠', 'summer', 0.85, -0.1, 0.2, 0.55],
  ['#C5CAE9', '퍼플 그레이', 'summer', 0.78, -0.5, 0.05, 0.6],
  ['#B0BEC5', '블루 그레이', 'summer', 0.7, -0.3, -0.1, 0.65],
  ['#FFCDD2', '블러쉬', 'summer', 0.88, 0.1, 0.15, 0.5],
  ['#81D4FA', '아쿠아', 'summer', 0.83, -0.25, 0.2, 0.35],
  ['#BC8F8F', '로지 브라운', 'autumn', 0.55, 0.5, 0.1, 0.7],
  ['#CD853F', '테라코타', 'autumn', 0.52, 0.85, 0.2, 0.55],
  ['#8FBC8F', '세이지', 'autumn', 0.6, 0.2, 0.05, 0.65],
  ['#B8860B', '머스타드', 'autumn', 0.5, 0.9, 0.25, 0.5],
  ['#A52A2A', '버건디', 'autumn', 0.35, 0.6, 0.15, 0.45],
  ['#8B5A2B', '카멜', 'autumn', 0.45, 0.8, 0.1, 0.6],
  ['#808000', '올리브', 'autumn', 0.42, 0.4, 0, 0.75],
  ['#D2691E', '시나몬', 'autumn', 0.48, 0.85, 0.3, 0.4],
  ['#000000', '트루 블랙', 'winter', 0.05, 0, 0, 0],
  ['#FFFFFF', '퓨어 화이트', 'winter', 0.98, 0, 0, 0],
  ['#DC143C', '크림슨', 'winter', 0.4, 0.3, 0.5, 0.05],
  ['#00008B', '네이비', 'winter', 0.15, -0.7, 0.2, 0.1],
  ['#008000', '포레스트 그린', 'winter', 0.25, -0.2, 0.15, 0.2],
  ['#8A2BE2', '로얄 퍼플', 'winter', 0.3, -0.5, 0.4, 0.1],
  ['#FF00FF', '매젠타', 'winter', 0.55, -0.3, 0.6, 0],
  ['#00FFFF', '시안', 'winter', 0.75, -0.4, 0.45, 0],
];

export const FULL_DRAPE_PALETTE: readonly DrapeOpticalReference[] = OPTICAL_DRAPE_TUPLES.map(
  ([hex, name, season, reflectance, warmth, saturationBoost, muteness]) => ({
    hex,
    name,
    season,
    reflectance,
    warmth,
    saturationBoost,
    muteness,
  })
);

/** HEX와 CIEDE2000 거리가 가장 가까운 표준 색천 메타데이터를 반환한다. */
export function findNearestOpticalDrape(hex: string): DrapeOpticalReference {
  const targetLab = hexToLab(hex);
  return FULL_DRAPE_PALETTE.slice(1).reduce(
    (nearest, candidate) =>
      calculateCIEDE2000(targetLab, hexToLab(candidate.hex)) <
      calculateCIEDE2000(targetLab, hexToLab(nearest.hex))
        ? candidate
        : nearest,
    FULL_DRAPE_PALETTE[0]
  );
}
