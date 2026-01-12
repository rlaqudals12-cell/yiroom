/**
 * 퍼스널 컬러 전용 RAG 검색
 * @description Phase K - 퍼스널 컬러 기반 색상/코디 추천을 위한 RAG 시스템
 */

import { coachLogger } from '@/lib/utils/logger';
import type { UserContext } from './types';

/** 시즌 타입 */
type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

/** 색상 추천 결과 */
export interface ColorRecommendation {
  colorName: string;
  hexCode: string;
  category: 'best' | 'good' | 'avoid';
  useCase: string; // 옷, 메이크업, 악세서리 등
  reason: string;
}

/** 퍼스널 컬러 검색 결과 */
export interface PersonalColorMatch {
  seasonType: SeasonType;
  recommendations: ColorRecommendation[];
  tips: string[];
  avoidColors: string[];
}

/** 시즌별 베스트 컬러 데이터 */
const SEASON_COLORS: Record<
  SeasonType,
  { best: ColorRecommendation[]; avoid: ColorRecommendation[] }
> = {
  spring: {
    best: [
      {
        colorName: '코랄',
        hexCode: '#FF7F50',
        category: 'best',
        useCase: '립스틱, 블러셔',
        reason: '봄 웜톤의 화사함을 살려줍니다',
      },
      {
        colorName: '피치',
        hexCode: '#FFCBA4',
        category: 'best',
        useCase: '옷, 악세서리',
        reason: '따뜻하고 생기있는 이미지를 연출합니다',
      },
      {
        colorName: '아이보리',
        hexCode: '#FFFFF0',
        category: 'best',
        useCase: '옷, 가방',
        reason: '깨끗하고 밝은 피부톤을 강조합니다',
      },
      {
        colorName: '살구색',
        hexCode: '#FBCEB1',
        category: 'best',
        useCase: '립스틱, 옷',
        reason: '자연스러운 혈색을 더해줍니다',
      },
    ],
    avoid: [
      {
        colorName: '블랙',
        hexCode: '#000000',
        category: 'avoid',
        useCase: '전체 코디',
        reason: '얼굴이 칙칙해 보일 수 있습니다',
      },
      {
        colorName: '버건디',
        hexCode: '#800020',
        category: 'avoid',
        useCase: '립스틱, 옷',
        reason: '쿨톤 색상이라 어울리지 않습니다',
      },
    ],
  },
  summer: {
    best: [
      {
        colorName: '라벤더',
        hexCode: '#E6E6FA',
        category: 'best',
        useCase: '옷, 악세서리',
        reason: '여름 쿨톤의 우아함을 살려줍니다',
      },
      {
        colorName: '로즈 핑크',
        hexCode: '#FF66B2',
        category: 'best',
        useCase: '립스틱, 블러셔',
        reason: '차분하면서 화사한 느낌을 줍니다',
      },
      {
        colorName: '스카이 블루',
        hexCode: '#87CEEB',
        category: 'best',
        useCase: '옷',
        reason: '시원하고 청초한 이미지를 연출합니다',
      },
      {
        colorName: '소프트 그레이',
        hexCode: '#A8A8A8',
        category: 'best',
        useCase: '옷, 가방',
        reason: '세련되고 깔끔한 느낌을 줍니다',
      },
    ],
    avoid: [
      {
        colorName: '오렌지',
        hexCode: '#FFA500',
        category: 'avoid',
        useCase: '옷, 립스틱',
        reason: '웜톤 색상이라 피부가 노랗게 보일 수 있습니다',
      },
      {
        colorName: '카키',
        hexCode: '#8B8970',
        category: 'avoid',
        useCase: '옷',
        reason: '얼굴이 칙칙해 보일 수 있습니다',
      },
    ],
  },
  autumn: {
    best: [
      {
        colorName: '테라코타',
        hexCode: '#E2725B',
        category: 'best',
        useCase: '립스틱, 옷',
        reason: '가을 웜톤의 깊이를 살려줍니다',
      },
      {
        colorName: '카멜',
        hexCode: '#C19A6B',
        category: 'best',
        useCase: '옷, 가방',
        reason: '고급스럽고 따뜻한 이미지를 연출합니다',
      },
      {
        colorName: '올리브 그린',
        hexCode: '#808000',
        category: 'best',
        useCase: '옷',
        reason: '가을의 분위기와 잘 어울립니다',
      },
      {
        colorName: '머스타드',
        hexCode: '#FFDB58',
        category: 'best',
        useCase: '악세서리, 옷',
        reason: '화사하면서 차분한 느낌을 줍니다',
      },
    ],
    avoid: [
      {
        colorName: '핫 핑크',
        hexCode: '#FF69B4',
        category: 'avoid',
        useCase: '옷, 립스틱',
        reason: '쿨톤 색상이라 어울리지 않습니다',
      },
      {
        colorName: '네온 컬러',
        hexCode: '#39FF14',
        category: 'avoid',
        useCase: '전체',
        reason: '너무 밝아서 피부톤과 맞지 않습니다',
      },
    ],
  },
  winter: {
    best: [
      {
        colorName: '버건디',
        hexCode: '#800020',
        category: 'best',
        useCase: '립스틱, 옷',
        reason: '겨울 쿨톤의 강렬함을 살려줍니다',
      },
      {
        colorName: '네이비',
        hexCode: '#000080',
        category: 'best',
        useCase: '옷',
        reason: '세련되고 깊이있는 이미지를 연출합니다',
      },
      {
        colorName: '퓨어 화이트',
        hexCode: '#FFFFFF',
        category: 'best',
        useCase: '옷',
        reason: '깨끗하고 시크한 느낌을 줍니다',
      },
      {
        colorName: '체리 레드',
        hexCode: '#DE3163',
        category: 'best',
        useCase: '립스틱, 악세서리',
        reason: '화려하고 강렬한 매력을 강조합니다',
      },
    ],
    avoid: [
      {
        colorName: '오렌지',
        hexCode: '#FFA500',
        category: 'avoid',
        useCase: '옷, 립스틱',
        reason: '웜톤 색상이라 어울리지 않습니다',
      },
      {
        colorName: '카멜',
        hexCode: '#C19A6B',
        category: 'avoid',
        useCase: '옷',
        reason: '얼굴이 노랗게 보일 수 있습니다',
      },
    ],
  },
};

/** 시즌별 스타일링 팁 */
const SEASON_TIPS: Record<SeasonType, string[]> = {
  spring: [
    '밝고 따뜻한 색상이 잘 어울려요',
    '골드 악세서리가 피부톤을 살려줍니다',
    '베이지, 코랄 계열로 포인트를 주세요',
    '너무 어두운 색보다 중간 밝기가 좋아요',
  ],
  summer: [
    '차분하고 부드러운 색상이 잘 어울려요',
    '실버 악세서리가 피부톤을 살려줍니다',
    '파스텔 톤으로 청초한 느낌을 연출하세요',
    '로즈, 라벤더 계열이 특히 잘 어울려요',
  ],
  autumn: [
    '깊고 따뜻한 색상이 잘 어울려요',
    '골드나 앤틱 악세서리가 잘 어울립니다',
    '브라운, 카키 계열이 고급스러워 보여요',
    '머스타드, 테라코타로 포인트를 주세요',
  ],
  winter: [
    '선명하고 대비가 강한 색상이 잘 어울려요',
    '실버나 플래티늄 악세서리가 잘 어울립니다',
    '블랙, 화이트 대비가 시크해 보여요',
    '원색 계열 포인트가 강렬한 매력을 줘요',
  ],
};

/** 질문 의도 분석 */
type ColorIntent = 'lip' | 'clothes' | 'hair' | 'accessory' | 'general';

/** 질문 의도 추출 */
function analyzeColorIntent(query: string): ColorIntent {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('립') || lowerQuery.includes('입술')) {
    return 'lip';
  }
  if (lowerQuery.includes('옷') || lowerQuery.includes('코디') || lowerQuery.includes('입')) {
    return 'clothes';
  }
  if (lowerQuery.includes('염색') || lowerQuery.includes('머리')) {
    return 'hair';
  }
  if (
    lowerQuery.includes('악세서리') ||
    lowerQuery.includes('시계') ||
    lowerQuery.includes('가방')
  ) {
    return 'accessory';
  }

  return 'general';
}

/** 시즌 문자열을 SeasonType으로 변환 */
function normalizeSeasonType(season: string): SeasonType {
  const lowerSeason = season.toLowerCase();

  if (lowerSeason.includes('spring') || lowerSeason.includes('봄')) {
    return 'spring';
  }
  if (lowerSeason.includes('summer') || lowerSeason.includes('여름')) {
    return 'summer';
  }
  if (
    lowerSeason.includes('autumn') ||
    lowerSeason.includes('fall') ||
    lowerSeason.includes('가을')
  ) {
    return 'autumn';
  }
  if (lowerSeason.includes('winter') || lowerSeason.includes('겨울')) {
    return 'winter';
  }

  // 기본값
  return 'spring';
}

/** 퍼스널 컬러 기반 검색 */
export async function searchByPersonalColor(
  userContext: UserContext | null,
  query: string
): Promise<PersonalColorMatch | null> {
  try {
    // 시즌 타입 추출
    const userSeason = userContext?.personalColor?.season;
    if (!userSeason) {
      coachLogger.info('[PersonalColorRAG] No personal color data');
      return null;
    }

    const seasonType = normalizeSeasonType(userSeason);
    const intent = analyzeColorIntent(query);

    // 시즌별 색상 데이터
    const seasonData = SEASON_COLORS[seasonType];
    const tips = SEASON_TIPS[seasonType];

    // 의도에 따라 필터링
    let filteredRecommendations = seasonData.best;
    if (intent !== 'general') {
      filteredRecommendations = seasonData.best.filter((color) => {
        switch (intent) {
          case 'lip':
            return color.useCase.includes('립') || color.useCase.includes('블러셔');
          case 'clothes':
            return color.useCase.includes('옷');
          case 'hair':
            return true; // 모든 색상 참고 가능
          case 'accessory':
            return color.useCase.includes('악세서리') || color.useCase.includes('가방');
          default:
            return true;
        }
      });

      // 필터 결과가 없으면 전체 반환
      if (filteredRecommendations.length === 0) {
        filteredRecommendations = seasonData.best;
      }
    }

    return {
      seasonType,
      recommendations: [...filteredRecommendations, ...seasonData.avoid.slice(0, 2)],
      tips,
      avoidColors: seasonData.avoid.map((c) => c.colorName),
    };
  } catch (error) {
    coachLogger.error('[PersonalColorRAG] Search error:', error);
    return null;
  }
}

/** RAG 결과를 프롬프트용 문자열로 변환 */
export function formatPersonalColorForPrompt(match: PersonalColorMatch | null): string {
  if (!match) return '';

  const seasonLabels: Record<SeasonType, string> = {
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
  };

  let context = `\n\n## 퍼스널 컬러 정보 (${seasonLabels[match.seasonType]})\n`;

  context += '\n### 추천 색상\n';
  match.recommendations
    .filter((r) => r.category === 'best')
    .forEach((r, i) => {
      context += `${i + 1}. ${r.colorName}: ${r.reason} (${r.useCase})\n`;
    });

  context += '\n### 피해야 할 색상\n';
  match.recommendations
    .filter((r) => r.category === 'avoid')
    .forEach((r, i) => {
      context += `${i + 1}. ${r.colorName}: ${r.reason}\n`;
    });

  context += '\n### 스타일링 팁\n';
  match.tips.forEach((tip) => {
    context += `- ${tip}\n`;
  });

  return context;
}
