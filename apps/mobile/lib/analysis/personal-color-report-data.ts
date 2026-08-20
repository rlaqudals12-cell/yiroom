import type { PersonalColorSeason } from '@yiroom/shared';

export interface PersonalColorReportSeasonInfo {
  name: string;
  subType: string;
  tone: 'warm' | 'cool';
  description: string;
  bestColors: string[];
  worstColors: string[];
  celebrities: string[];
  stylingTips: string[];
}

/** 구형 API의 누락 필드에만 쓰는 결정론적 시즌 참고표. 사용 시 화면은 폴백으로 고지한다. */
export const PERSONAL_COLOR_REPORT_DATA: Record<
  PersonalColorSeason,
  PersonalColorReportSeasonInfo
> = {
  Spring: {
    name: '봄 웜톤',
    subType: '밝고 화사한 웜 언더톤',
    tone: 'warm',
    description:
      '밝고 화사한 색상이 잘 어울리는 타입이에요. 코랄, 피치, 아이보리 등 따뜻하고 맑은 색상이 피부를 환하게 밝혀줘요.',
    bestColors: ['#FFB6C1', '#FFDAB9', '#FFA07A', '#F0E68C', '#98FB98', '#FFD700'],
    worstColors: ['#000000', '#808080', '#4B0082', '#191970'],
    celebrities: ['아이유', '수지', '윤아'],
    stylingTips: [
      '코랄 립과 피치 블러셔로 생기 있는 메이크업을 해보세요',
      '골드 주얼리가 피부톤을 더 따뜻하게 해줘요',
      '크림화이트, 아이보리 같은 웜한 밝은 색상이 최적이에요',
    ],
  },
  Summer: {
    name: '여름 쿨톤',
    subType: '부드럽고 우아한 쿨 언더톤',
    tone: 'cool',
    description:
      '부드럽고 차분한 색상이 잘 어울리는 타입이에요. 라벤더, 로즈핑크, 스카이블루 등 시원하고 우아한 색상을 추천드려요.',
    bestColors: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#87CEEB', '#FFC0CB', '#C8A2C8'],
    worstColors: ['#FF4500', '#FF8C00', '#DAA520', '#8B4513'],
    celebrities: ['블랙핑크 제니', '김태희', '손예진'],
    stylingTips: [
      '로즈핑크 립과 라벤더 아이섀도가 피부를 맑게 해줘요',
      '실버 주얼리가 쿨톤 피부와 자연스럽게 어울려요',
      '파스텔 블루, 라일락 같은 차분한 색상으로 우아함을 연출하세요',
    ],
  },
  Autumn: {
    name: '가을 웜톤',
    subType: '깊고 풍부한 웜 언더톤',
    tone: 'warm',
    description:
      '깊고 풍부한 색상이 잘 어울리는 타입이에요. 버건디, 머스타드, 카키 등 차분하고 고급스러운 색상을 추천드려요.',
    bestColors: ['#8B4513', '#DAA520', '#BC8F8F', '#CD853F', '#556B2F', '#A0522D'],
    worstColors: ['#FF69B4', '#00BFFF', '#E6E6FA', '#F0FFFF'],
    celebrities: ['제니퍼 로페즈', '김희선', '공효진'],
    stylingTips: [
      '브릭레드 립과 테라코타 블러셔로 깊이감을 더하세요',
      '골드, 브론즈 주얼리가 가을 웜톤과 완벽한 조화를 이뤄요',
      '카키, 올리브, 버건디 등 깊은 색상으로 고급스러움을 연출하세요',
    ],
  },
  Winter: {
    name: '겨울 쿨톤',
    subType: '선명하고 강렬한 쿨 언더톤',
    tone: 'cool',
    description:
      '선명하고 대비가 강한 색상이 잘 어울리는 타입이에요. 블랙, 화이트, 로열블루 등 강렬하고 세련된 색상을 추천드려요.',
    bestColors: ['#000000', '#FFFFFF', '#4169E1', '#DC143C', '#800080', '#008B8B'],
    worstColors: ['#FFDAB9', '#F5DEB3', '#FFE4C4', '#DEB887'],
    celebrities: ['김연아', '전지현', '송혜교'],
    stylingTips: [
      '레드, 베리 립으로 선명한 인상을 만들어보세요',
      '실버, 플래티넘 주얼리가 겨울 쿨톤의 세련됨을 강조해요',
      '블랙, 네이비, 화이트 같은 고대비 조합이 가장 잘 어울려요',
    ],
  },
};
