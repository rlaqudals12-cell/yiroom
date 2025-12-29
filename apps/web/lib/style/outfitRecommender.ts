/**
 * 코디 추천 로직
 *
 * 체감온도 기반 레이어링 + 강수/UV 대응 + 체형/퍼스널컬러 적용
 */

import type {
  WeatherData,
  OutfitRecommendation,
  LayerItem,
  TempLayerInfo,
} from '@/types/weather';
import { TEMP_LAYERS, BODY_TYPE_ADJUSTMENTS } from '@/types/weather';

// 체형별 아우터 추천
const OUTER_BY_BODY_TYPE: Record<string, string[]> = {
  S: ['트렌치코트', '싱글 코트', '테일러드 재킷'],
  W: ['핏티드 코트', 'A라인 코트', '벨티드 재킷'],
  N: ['오버핏 코트', '봄버 재킷', '카디건'],
};

// 체형별 상의 추천
const TOP_BY_BODY_TYPE: Record<string, string[]> = {
  S: ['스트레이트 셔츠', 'V넥 니트', '슬림 맨투맨'],
  W: ['크롭 니트', '페플럼 블라우스', '핏티드 티셔츠'],
  N: ['오버사이즈 니트', '루즈핏 셔츠', '드롭숄더 티셔츠'],
};

// 체형별 하의 추천
const BOTTOM_BY_BODY_TYPE: Record<string, string[]> = {
  S: ['스트레이트 슬랙스', '와이드 팬츠', 'H라인 스커트'],
  W: ['하이웨이스트 팬츠', 'A라인 스커트', '플레어 스커트'],
  N: ['조거 팬츠', '와이드 데님', '루즈핏 슬랙스'],
};

// 퍼스널컬러별 색상 팔레트
const COLOR_PALETTES: Record<string, string[]> = {
  // 봄 웜
  spring_warm: ['아이보리', '코랄', '피치', '살구', '라이트 카멜'],
  spring_light: ['아이보리', '연노랑', '라이트 그린', '스카이 블루'],
  // 여름 쿨
  summer_cool: ['로즈', '라벤더', '스카이 블루', '민트', '소프트 핑크'],
  summer_mute: ['더스티 핑크', '그레이시 블루', '라벤더 그레이'],
  // 가을 웜
  autumn_warm: ['버건디', '카멜', '테라코타', '올리브', '브릭'],
  autumn_mute: ['카키', '머스타드', '브라운', '베이지'],
  autumn_deep: ['딥 브라운', '버건디', '포레스트 그린', '네이비'],
  // 겨울 쿨
  winter_cool: ['퓨어 화이트', '블랙', '네이비', '레드', '로얄 블루'],
  winter_bright: ['비비드 핑크', '에메랄드', '코발트 블루', '퓨어 화이트'],
  winter_deep: ['블랙', '네이비', '딥 버건디', '차콜'],
};

// 기본 색상 (퍼스널컬러 미지정 시)
const DEFAULT_COLORS = ['네이비', '베이지', '화이트', '그레이'];

// 소재 추천 (기온별)
const MATERIALS_BY_TEMP: Record<string, string[]> = {
  extreme_cold: ['패딩', '울', '캐시미어', '플리스'],
  very_cold: ['울 블렌드', '트위드', '니트'],
  cold: ['면 혼방', '니트', '스웨이드'],
  cool: ['면', '얇은 니트', '폴리에스터'],
  mild: ['면', '린넨 혼방', '저지'],
  warm: ['면', '린넨', '시어서커'],
  hot: ['린넨', '모달', '레이온'],
};

/**
 * 체감온도로 온도 구간 결정
 */
function determineLayer(feelsLike: number): {
  key: string;
  info: TempLayerInfo;
} {
  for (const [key, info] of Object.entries(TEMP_LAYERS)) {
    if (feelsLike > info.min && feelsLike <= info.max) {
      return { key, info };
    }
  }
  // 기본값: mild
  return { key: 'mild', info: TEMP_LAYERS.mild };
}

/**
 * 체형별 아이템 선택
 */
function selectByBodyType(
  items: Record<string, string[]>,
  bodyType: string
): string {
  const options = items[bodyType] || items.N;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * 퍼스널컬러 팔레트 가져오기
 */
function getColorPalette(personalColor: string): string[] {
  // 정확한 매칭
  if (COLOR_PALETTES[personalColor]) {
    return COLOR_PALETTES[personalColor];
  }

  // 시즌만 있을 때 (예: "Spring", "Summer")
  const season = personalColor.toLowerCase();
  const matchingKey = Object.keys(COLOR_PALETTES).find((key) =>
    key.startsWith(season)
  );

  if (matchingKey) {
    return COLOR_PALETTES[matchingKey];
  }

  return DEFAULT_COLORS;
}

/**
 * 레이어 아이템 생성
 */
function generateLayers(
  tempKey: string,
  bodyType: string,
  feelsLike: number
): LayerItem[] {
  const layers: LayerItem[] = [];
  const layerInfo = TEMP_LAYERS[tempKey];

  // 아우터 (layers >= 1.5)
  if (layerInfo.layers >= 1.5) {
    const outerName = selectByBodyType(OUTER_BY_BODY_TYPE, bodyType);
    layers.push({
      type: 'outer',
      name: outerName,
      reason: `${feelsLike}°C 체감온도에 적합한 아우터`,
    });
  }

  // 상의
  const topName = selectByBodyType(TOP_BY_BODY_TYPE, bodyType);
  const topReason =
    layerInfo.layers >= 2
      ? '레이어링하기 좋은 아이템'
      : feelsLike >= 23
        ? '시원한 소재의 상의'
        : '편안한 데일리 상의';

  layers.push({
    type: 'top',
    name: topName,
    reason: topReason,
  });

  // 하의
  const bottomName = selectByBodyType(BOTTOM_BY_BODY_TYPE, bodyType);
  const bodyAdjust = BODY_TYPE_ADJUSTMENTS[bodyType] || BODY_TYPE_ADJUSTMENTS.N;

  layers.push({
    type: 'bottom',
    name: bottomName,
    reason: `${bodyAdjust.focus === 'straight_lines' ? '스트레이트 체형' : bodyAdjust.focus === 'fitted_waist' ? '웨이브 체형' : '내추럴 체형'}에 어울리는 핏`,
  });

  // 신발
  const shoes =
    feelsLike < 5
      ? '부츠'
      : feelsLike < 15
        ? '로퍼'
        : feelsLike < 23
          ? '스니커즈'
          : '샌들';

  layers.push({
    type: 'shoes',
    name: shoes,
    reason: `${feelsLike}°C에 적합한 신발`,
  });

  return layers;
}

/**
 * 팁 생성
 */
function generateTips(
  weather: WeatherData,
  tempKey: string,
  hasRainItems: boolean,
  hasSunItems: boolean
): string[] {
  const tips: string[] = [];
  const { current, forecast } = weather;

  // 기온 변화 팁
  if (forecast.length >= 2) {
    const firstTemp = forecast[0].temp;
    const lastTemp = forecast[forecast.length - 1].temp;
    const diff = lastTemp - firstTemp;

    if (diff > 5) {
      tips.push('오후에 기온이 올라갈 예정이에요. 가벼운 레이어드를 추천해요.');
    } else if (diff < -5) {
      tips.push(
        '오후에 기온이 떨어질 예정이에요. 겉옷을 꼭 챙기세요.'
      );
    }
  }

  // 강수 팁
  if (hasRainItems) {
    tips.push('비 예보가 있어요. 우산과 방수 아이템을 챙기세요.');
  }

  // UV 팁
  if (hasSunItems) {
    tips.push('UV 지수가 높으니 선글라스와 모자를 챙기세요.');
  }

  // 습도 팁
  if (current.humidity > 80) {
    tips.push('습도가 높아요. 통기성 좋은 소재를 선택하세요.');
  } else if (current.humidity < 30) {
    tips.push('건조한 날씨에요. 정전기 방지 스프레이를 활용하세요.');
  }

  // 바람 팁
  if (current.windSpeed > 5) {
    tips.push('바람이 강해요. 머플러나 윈드브레이커를 추천해요.');
  }

  // 기본 팁 (최소 1개)
  if (tips.length === 0) {
    tips.push(`오늘은 ${current.description}, 체감 ${current.feelsLike}°C에요.`);
  }

  return tips;
}

/**
 * 메인 코디 추천 함수
 */
export function recommendOutfit(
  weather: WeatherData,
  bodyType: string = 'N',
  personalColor: string = ''
): OutfitRecommendation {
  const { current } = weather;
  const feelsLike = current.feelsLike;
  const precipitation = current.precipitation;
  const uvi = current.uvi;

  // 1. 기온 기반 레이어 결정
  const { key: tempKey } = determineLayer(feelsLike);

  // 2. 강수 대응 아이템
  const rainItems: string[] = [];
  if (precipitation > 50) {
    rainItems.push('우산', '방수 아우터');
    if (precipitation > 70) {
      rainItems.push('레인부츠');
    }
  } else if (precipitation > 30) {
    rainItems.push('접이식 우산');
  }

  // 3. UV 대응 아이템
  const sunItems: string[] = [];
  if (uvi > 7) {
    sunItems.push('선글라스', '챙 넓은 모자', '자외선 차단 카디건');
  } else if (uvi > 5) {
    sunItems.push('선글라스', '모자');
  } else if (uvi > 3) {
    sunItems.push('선글라스');
  }

  // 4. 레이어 아이템 생성 (체형 적용)
  const layers = generateLayers(tempKey, bodyType, feelsLike);

  // 5. 퍼스널컬러 팔레트
  const colors = getColorPalette(personalColor);

  // 6. 소재 추천
  const materials = MATERIALS_BY_TEMP[tempKey] || MATERIALS_BY_TEMP.mild;

  // 7. 팁 생성
  const tips = generateTips(
    weather,
    tempKey,
    rainItems.length > 0,
    sunItems.length > 0
  );

  // 8. 날씨 요약
  const weatherSummary = `${weather.location} ${current.description}, ${current.temp}°C (체감 ${feelsLike}°C)`;

  return {
    layers,
    accessories: [...rainItems, ...sunItems],
    colors,
    materials,
    tips,
    weatherSummary,
  };
}

/**
 * 특정 상황(occasion)에 맞춘 코디 조정
 */
export function adjustForOccasion(
  recommendation: OutfitRecommendation,
  occasion: 'casual' | 'formal' | 'workout' | 'date'
): OutfitRecommendation {
  const adjusted = { ...recommendation };

  switch (occasion) {
    case 'formal':
      // 포멀 상황: 정장 스타일로 조정
      adjusted.layers = adjusted.layers.map((layer) => {
        if (layer.type === 'top') {
          return { ...layer, name: '드레스 셔츠', reason: '포멀한 자리에 적합' };
        }
        if (layer.type === 'bottom') {
          return { ...layer, name: '슬랙스', reason: '단정한 인상을 위한 선택' };
        }
        if (layer.type === 'outer') {
          return { ...layer, name: '블레이저', reason: '격식있는 자리에 어울리는 아우터' };
        }
        return layer;
      });
      adjusted.tips = [
        ...adjusted.tips,
        '포멀한 자리에는 액세서리를 최소화하세요.',
      ];
      break;

    case 'workout':
      // 운동 상황: 스포츠웨어로 조정
      adjusted.layers = [
        { type: 'top', name: '기능성 티셔츠', reason: '땀 흡수와 통기성이 좋아요' },
        { type: 'bottom', name: '운동 레깅스 또는 반바지', reason: '활동성이 좋은 선택' },
        { type: 'shoes', name: '러닝화', reason: '운동에 적합한 신발' },
      ];
      adjusted.materials = ['폴리에스터', '스판덱스', '드라이핏'];
      adjusted.tips = ['운동 후 갈아입을 옷도 챙기세요.'];
      break;

    case 'date':
      // 데이트 상황: 세련된 스타일 강조
      adjusted.tips = [
        ...adjusted.tips,
        '깔끔한 인상을 위해 다림질된 옷을 입으세요.',
        '향수는 은은하게 뿌려주세요.',
      ];
      break;

    default:
      // casual은 기본 추천 유지
      break;
  }

  return adjusted;
}
