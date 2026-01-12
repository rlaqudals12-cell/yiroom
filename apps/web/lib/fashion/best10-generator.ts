/**
 * 패션 Best 10 생성기
 * @description Phase K-2 - 스타일 카테고리별 인기 코디 추천
 */

import type { PersonalColorSeason } from '@/lib/color-recommendations';
import type { ClothingCategory, Season, Occasion } from '@/types/inventory';

// 스타일 카테고리
export type StyleCategory =
  | 'casual' // 캐주얼
  | 'formal' // 포멀/비즈니스
  | 'street' // 스트릿
  | 'minimal' // 미니멀
  | 'sporty' // 스포티
  | 'classic' // 클래식
  | 'preppy' // 프레피
  | 'hiphop' // 힙합
  | 'romantic' // 로맨틱
  | 'workwear'; // 워크웨어

export const STYLE_CATEGORY_LABELS: Record<StyleCategory, string> = {
  casual: '캐주얼',
  formal: '포멀',
  street: '스트릿',
  minimal: '미니멀',
  sporty: '스포티',
  classic: '클래식',
  preppy: '프레피',
  hiphop: '힙합',
  romantic: '로맨틱',
  workwear: '워크웨어',
};

// 코디 아이템
export interface OutfitItem {
  category: ClothingCategory;
  name: string;
  color: string;
  tags?: string[];
}

// 코디 추천
export interface OutfitRecommendation {
  id: string;
  name: string;
  description: string;
  items: OutfitItem[];
  occasions: Occasion[];
  seasons: Season[];
  personalColors: PersonalColorSeason[];
  imageUrl?: string;
}

// 스타일 Best 10
export interface StyleBest10 {
  category: StyleCategory;
  label: string;
  description: string;
  outfits: OutfitRecommendation[];
}

// 퍼스널컬러별 추천 색상 (향후 색상 매칭 로직에서 활용 예정)
const _SEASON_COLORS: Record<PersonalColorSeason, string[]> = {
  Spring: ['코랄', '피치', '아이보리', '민트', '베이지', '카키'],
  Summer: ['라벤더', '로즈핑크', '스카이블루', '그레이', '네이비', '화이트'],
  Autumn: ['테라코타', '머스타드', '올리브', '버건디', '캐멀', '브라운'],
  Winter: ['화이트', '블랙', '로얄블루', '에메랄드', '버건디', '차콜'],
};

// 스타일별 Best 10 코디 데이터
const STYLE_OUTFITS: Record<StyleCategory, OutfitRecommendation[]> = {
  casual: [
    {
      id: 'casual-1',
      name: '화이트 티 + 데님',
      description: '기본 중의 기본, 클린한 캐주얼룩',
      items: [
        { category: 'top', name: '화이트 티셔츠', color: '화이트' },
        { category: 'bottom', name: '슬림핏 청바지', color: '인디고' },
        { category: 'shoes', name: '화이트 스니커즈', color: '화이트' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['spring', 'summer', 'autumn'],
      personalColors: ['Spring', 'Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'casual-2',
      name: '스트라이프 셔츠 + 치노',
      description: '깔끔한 세미 캐주얼',
      items: [
        { category: 'top', name: '스트라이프 셔츠', color: '네이비/화이트' },
        { category: 'bottom', name: '베이지 치노팬츠', color: '베이지' },
        { category: 'shoes', name: '로퍼', color: '브라운' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Summer', 'Autumn'],
    },
    {
      id: 'casual-3',
      name: '니트 + 와이드팬츠',
      description: '편안하면서 세련된 룩',
      items: [
        { category: 'top', name: '오버핏 니트', color: '크림' },
        { category: 'bottom', name: '와이드 슬랙스', color: '그레이' },
        { category: 'shoes', name: '첼시부츠', color: '블랙' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'casual-4',
      name: '맨투맨 + 조거팬츠',
      description: '편안한 일상 캐주얼',
      items: [
        { category: 'top', name: '그레이 맨투맨', color: '그레이' },
        { category: 'bottom', name: '블랙 조거팬츠', color: '블랙' },
        { category: 'shoes', name: '러닝화', color: '화이트' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'casual-5',
      name: '린넨 셔츠 + 반바지',
      description: '시원한 여름 캐주얼',
      items: [
        { category: 'top', name: '린넨 셔츠', color: '아이보리' },
        { category: 'bottom', name: '버뮤다 반바지', color: '베이지' },
        { category: 'shoes', name: '에스파드리유', color: '네이비' },
      ],
      occasions: ['casual', 'travel'],
      seasons: ['summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'casual-6',
      name: '데님 자켓 + 블랙 진',
      description: '데님온데님 스타일링',
      items: [
        { category: 'outer', name: '데님 자켓', color: '라이트블루' },
        { category: 'top', name: '화이트 티셔츠', color: '화이트' },
        { category: 'bottom', name: '블랙 스키니진', color: '블랙' },
        { category: 'shoes', name: '컨버스', color: '화이트' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'casual-7',
      name: '후드티 + 카고팬츠',
      description: '스트릿 무드 캐주얼',
      items: [
        { category: 'top', name: '오버핏 후드티', color: '블랙' },
        { category: 'bottom', name: '카고팬츠', color: '카키' },
        { category: 'shoes', name: '하이탑 스니커즈', color: '화이트' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'casual-8',
      name: '폴로셔츠 + 치노',
      description: '골프 무드 캐주얼',
      items: [
        { category: 'top', name: '폴로셔츠', color: '네이비' },
        { category: 'bottom', name: '화이트 치노', color: '화이트' },
        { category: 'shoes', name: '로퍼', color: '브라운' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Summer', 'Winter'],
    },
    {
      id: 'casual-9',
      name: '가디건 + 원피스',
      description: '여성스러운 캐주얼',
      items: [
        { category: 'outer', name: '니트 가디건', color: '베이지' },
        { category: 'dress', name: '플로럴 원피스', color: '핑크/화이트' },
        { category: 'shoes', name: '메리제인', color: '블랙' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'casual-10',
      name: '체크 셔츠 + 데님',
      description: '아메리칸 캐주얼',
      items: [
        { category: 'top', name: '체크 플란넬 셔츠', color: '레드/네이비' },
        { category: 'bottom', name: '스트레이트 데님', color: '인디고' },
        { category: 'shoes', name: '워크부츠', color: '브라운' },
      ],
      occasions: ['casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
  ],
  formal: [
    {
      id: 'formal-1',
      name: '네이비 수트',
      description: '비즈니스 필수 아이템',
      items: [
        { category: 'outer', name: '네이비 수트 자켓', color: '네이비' },
        { category: 'bottom', name: '네이비 수트 팬츠', color: '네이비' },
        { category: 'top', name: '화이트 드레스셔츠', color: '화이트' },
        { category: 'shoes', name: '옥스포드 구두', color: '블랙' },
      ],
      occasions: ['formal'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'formal-2',
      name: '차콜 수트',
      description: '고급스러운 비즈니스 룩',
      items: [
        { category: 'outer', name: '차콜 수트 자켓', color: '차콜' },
        { category: 'bottom', name: '차콜 수트 팬츠', color: '차콜' },
        { category: 'top', name: '라이트블루 셔츠', color: '라이트블루' },
        { category: 'shoes', name: '더비 슈즈', color: '브라운' },
      ],
      occasions: ['formal'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'formal-3',
      name: '블레이저 + 슬랙스',
      description: '비즈니스 캐주얼',
      items: [
        { category: 'outer', name: '네이비 블레이저', color: '네이비' },
        { category: 'bottom', name: '그레이 슬랙스', color: '그레이' },
        { category: 'top', name: '화이트 셔츠', color: '화이트' },
        { category: 'shoes', name: '로퍼', color: '버건디' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'formal-4',
      name: '베이지 수트',
      description: '봄/여름 비즈니스',
      items: [
        { category: 'outer', name: '베이지 수트 자켓', color: '베이지' },
        { category: 'bottom', name: '베이지 수트 팬츠', color: '베이지' },
        { category: 'top', name: '화이트 셔츠', color: '화이트' },
        { category: 'shoes', name: '브라운 로퍼', color: '브라운' },
      ],
      occasions: ['formal'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Autumn'],
    },
    {
      id: 'formal-5',
      name: '블랙 수트',
      description: '포멀 필수 아이템',
      items: [
        { category: 'outer', name: '블랙 수트 자켓', color: '블랙' },
        { category: 'bottom', name: '블랙 수트 팬츠', color: '블랙' },
        { category: 'top', name: '화이트 드레스셔츠', color: '화이트' },
        { category: 'shoes', name: '페이턴트 옥스포드', color: '블랙' },
      ],
      occasions: ['formal'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Winter'],
    },
    {
      id: 'formal-6',
      name: '셔츠 + 니트 베스트',
      description: '스마트 오피스 룩',
      items: [
        { category: 'top', name: '스트라이프 셔츠', color: '블루/화이트' },
        { category: 'top', name: '니트 베스트', color: '네이비' },
        { category: 'bottom', name: '그레이 슬랙스', color: '그레이' },
        { category: 'shoes', name: '로퍼', color: '블랙' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'formal-7',
      name: '트렌치코트 + 수트',
      description: '가을 비즈니스',
      items: [
        { category: 'outer', name: '베이지 트렌치코트', color: '베이지' },
        { category: 'outer', name: '네이비 수트', color: '네이비' },
        { category: 'top', name: '화이트 셔츠', color: '화이트' },
        { category: 'shoes', name: '옥스포드', color: '브라운' },
      ],
      occasions: ['formal'],
      seasons: ['autumn'],
      personalColors: ['Spring', 'Autumn'],
    },
    {
      id: 'formal-8',
      name: '오피스 원피스',
      description: '여성 비즈니스 룩',
      items: [
        { category: 'dress', name: '시스 원피스', color: '네이비' },
        { category: 'outer', name: '크롭 자켓', color: '네이비' },
        { category: 'shoes', name: '펌프스', color: '누드' },
        { category: 'bag', name: '구조적인 토트백', color: '블랙' },
      ],
      occasions: ['formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'formal-9',
      name: '와이드 슬랙스 + 블라우스',
      description: '모던 비즈니스 캐주얼',
      items: [
        { category: 'top', name: '실크 블라우스', color: '아이보리' },
        { category: 'bottom', name: '하이웨이스트 와이드 슬랙스', color: '블랙' },
        { category: 'shoes', name: '스틸레토', color: '블랙' },
      ],
      occasions: ['formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Summer', 'Winter'],
    },
    {
      id: 'formal-10',
      name: '투피스 수트',
      description: '파워 비즈니스 룩',
      items: [
        { category: 'outer', name: '테일러드 자켓', color: '그레이' },
        { category: 'bottom', name: '매칭 스커트', color: '그레이' },
        { category: 'top', name: '실크 블라우스', color: '화이트' },
        { category: 'shoes', name: '펌프스', color: '블랙' },
      ],
      occasions: ['formal'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Summer', 'Autumn', 'Winter'],
    },
  ],
  street: [
    {
      id: 'street-1',
      name: '오버사이즈 후드 + 카고',
      description: '힙한 스트릿 룩',
      items: [
        { category: 'top', name: '오버사이즈 후드티', color: '블랙' },
        { category: 'bottom', name: '카고팬츠', color: '카키' },
        { category: 'shoes', name: '청키 스니커즈', color: '화이트' },
        { category: 'accessory', name: '볼캡', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'street-2',
      name: '그래픽 티 + 와이드 진',
      description: '캐주얼 스트릿',
      items: [
        { category: 'top', name: '그래픽 티셔츠', color: '화이트' },
        { category: 'bottom', name: '와이드 청바지', color: '라이트블루' },
        { category: 'shoes', name: '조던', color: '레드/블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'summer'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'street-3',
      name: '윈드브레이커 + 트랙팬츠',
      description: '스포티 스트릿',
      items: [
        { category: 'outer', name: '윈드브레이커', color: '네이비/화이트' },
        { category: 'bottom', name: '트랙팬츠', color: '블랙' },
        { category: 'shoes', name: '에어맥스', color: '화이트' },
      ],
      occasions: ['casual', 'workout'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'street-4',
      name: '레더 자켓 + 스키니',
      description: '락시크 스트릿',
      items: [
        { category: 'outer', name: '라이더 자켓', color: '블랙' },
        { category: 'top', name: '밴드 티셔츠', color: '블랙' },
        { category: 'bottom', name: '블랙 스키니진', color: '블랙' },
        { category: 'shoes', name: '첼시부츠', color: '블랙' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Winter'],
    },
    {
      id: 'street-5',
      name: '패딩 + 조거',
      description: '겨울 스트릿',
      items: [
        { category: 'outer', name: '숏패딩', color: '블랙' },
        { category: 'top', name: '기모 후드티', color: '그레이' },
        { category: 'bottom', name: '조거팬츠', color: '블랙' },
        { category: 'shoes', name: '어글리슈즈', color: '화이트' },
      ],
      occasions: ['casual'],
      seasons: ['winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'street-6',
      name: '데님 셋업',
      description: '데님온데님 스트릿',
      items: [
        { category: 'outer', name: '오버사이즈 데님 자켓', color: '인디고' },
        { category: 'bottom', name: '와이드 데님', color: '인디고' },
        { category: 'top', name: '화이트 티셔츠', color: '화이트' },
        { category: 'shoes', name: '컨버스 하이', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'street-7',
      name: '플리스 + 나일론',
      description: '테크웨어 스트릿',
      items: [
        { category: 'outer', name: '플리스 자켓', color: '블랙' },
        { category: 'bottom', name: '나일론 카고', color: '블랙' },
        { category: 'shoes', name: '테크러너', color: '블랙/그레이' },
        { category: 'bag', name: '메신저백', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Winter'],
    },
    {
      id: 'street-8',
      name: '크롭 탑 + 하이웨이스트',
      description: '걸리시 스트릿',
      items: [
        { category: 'top', name: '크롭 후드', color: '핑크' },
        { category: 'bottom', name: '하이웨이스트 와이드 진', color: '라이트블루' },
        { category: 'shoes', name: '플랫폼 스니커즈', color: '화이트' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'street-9',
      name: '맨투맨 + 플리츠',
      description: '믹스매치 스트릿',
      items: [
        { category: 'top', name: '오버사이즈 맨투맨', color: '그레이' },
        { category: 'bottom', name: '플리츠 스커트', color: '블랙' },
        { category: 'shoes', name: '뉴발란스', color: '그레이' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'street-10',
      name: '셋업 수트',
      description: '스트릿 테일러링',
      items: [
        { category: 'outer', name: '오버사이즈 블레이저', color: '차콜' },
        { category: 'bottom', name: '와이드 슬랙스', color: '차콜' },
        { category: 'top', name: '터틀넥', color: '블랙' },
        { category: 'shoes', name: '청키 더비', color: '블랙' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
  ],
  minimal: [
    {
      id: 'minimal-1',
      name: '화이트 셔츠 + 블랙 팬츠',
      description: '미니멀의 정석',
      items: [
        { category: 'top', name: '오버사이즈 화이트 셔츠', color: '화이트' },
        { category: 'bottom', name: '테이퍼드 블랙 팬츠', color: '블랙' },
        { category: 'shoes', name: '화이트 스니커즈', color: '화이트' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'minimal-2',
      name: '올 블랙 룩',
      description: '시크한 올블랙',
      items: [
        { category: 'top', name: '블랙 터틀넥', color: '블랙' },
        { category: 'bottom', name: '와이드 블랙 팬츠', color: '블랙' },
        { category: 'shoes', name: '블랙 앵클부츠', color: '블랙' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Winter'],
    },
    {
      id: 'minimal-3',
      name: '그레이 톤온톤',
      description: '세련된 그레이스케일',
      items: [
        { category: 'top', name: '라이트그레이 니트', color: '라이트그레이' },
        { category: 'bottom', name: '차콜 슬랙스', color: '차콜' },
        { category: 'shoes', name: '그레이 스니커즈', color: '그레이' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'minimal-4',
      name: '아이보리 셋업',
      description: '부드러운 미니멀',
      items: [
        { category: 'outer', name: '아이보리 블레이저', color: '아이보리' },
        { category: 'bottom', name: '아이보리 와이드 팬츠', color: '아이보리' },
        { category: 'top', name: '화이트 티셔츠', color: '화이트' },
        { category: 'shoes', name: '베이지 로퍼', color: '베이지' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'minimal-5',
      name: '네이비 + 화이트',
      description: '깔끔한 컬러 조합',
      items: [
        { category: 'top', name: '네이비 니트', color: '네이비' },
        { category: 'bottom', name: '화이트 면바지', color: '화이트' },
        { category: 'shoes', name: '네이비 로퍼', color: '네이비' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'minimal-6',
      name: '베이지 코트 + 블랙',
      description: '겨울 미니멀',
      items: [
        { category: 'outer', name: '베이지 울 코트', color: '베이지' },
        { category: 'top', name: '블랙 터틀넥', color: '블랙' },
        { category: 'bottom', name: '블랙 슬랙스', color: '블랙' },
        { category: 'shoes', name: '블랙 앵클부츠', color: '블랙' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['winter'],
      personalColors: ['Spring', 'Autumn', 'Winter'],
    },
    {
      id: 'minimal-7',
      name: '린넨 셔츠 + 화이트',
      description: '여름 미니멀',
      items: [
        { category: 'top', name: '베이지 린넨 셔츠', color: '베이지' },
        { category: 'bottom', name: '화이트 린넨 팬츠', color: '화이트' },
        { category: 'shoes', name: '화이트 에스파드리유', color: '화이트' },
      ],
      occasions: ['casual', 'travel'],
      seasons: ['summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'minimal-8',
      name: '머슬 티 + 슬랙스',
      description: '심플 섬머룩',
      items: [
        { category: 'top', name: '블랙 머슬 티', color: '블랙' },
        { category: 'bottom', name: '베이지 와이드 슬랙스', color: '베이지' },
        { category: 'shoes', name: '블랙 샌들', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['summer'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'minimal-9',
      name: '원피스 + 앵클부츠',
      description: '여성 미니멀',
      items: [
        { category: 'dress', name: 'H라인 원피스', color: '블랙' },
        { category: 'shoes', name: '앵클부츠', color: '블랙' },
        { category: 'bag', name: '미니멀 숄더백', color: '블랙' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Winter'],
    },
    {
      id: 'minimal-10',
      name: '니트 원피스',
      description: '원피스 미니멀',
      items: [
        { category: 'dress', name: '롱 니트 원피스', color: '그레이' },
        { category: 'shoes', name: '롱부츠', color: '블랙' },
        { category: 'bag', name: '토트백', color: '블랙' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Summer', 'Winter'],
    },
  ],
  sporty: [
    {
      id: 'sporty-1',
      name: '트랙수트',
      description: '클래식 스포티',
      items: [
        { category: 'outer', name: '트랙 자켓', color: '네이비' },
        { category: 'bottom', name: '트랙팬츠', color: '네이비' },
        { category: 'shoes', name: '러닝화', color: '화이트' },
      ],
      occasions: ['casual', 'workout'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'sporty-2',
      name: '레깅스 + 크롭탑',
      description: '피트니스 룩',
      items: [
        { category: 'bottom', name: '하이웨이스트 레깅스', color: '블랙' },
        { category: 'top', name: '스포츠 브라탑', color: '네온핑크' },
        { category: 'shoes', name: '트레이닝화', color: '화이트' },
      ],
      occasions: ['workout'],
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      personalColors: ['Spring', 'Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'sporty-3',
      name: '애슬레저 룩',
      description: '일상 스포티',
      items: [
        { category: 'top', name: '오버사이즈 티셔츠', color: '화이트' },
        { category: 'bottom', name: '바이커 쇼츠', color: '블랙' },
        { category: 'shoes', name: '슬라이드 샌들', color: '블랙' },
      ],
      occasions: ['casual', 'workout'],
      seasons: ['summer'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'sporty-4',
      name: '후드집업 + 조거',
      description: '편안한 스포티',
      items: [
        { category: 'outer', name: '후드집업', color: '그레이' },
        { category: 'bottom', name: '조거팬츠', color: '블랙' },
        { category: 'shoes', name: '러닝화', color: '블랙/화이트' },
      ],
      occasions: ['casual', 'workout'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'sporty-5',
      name: '테니스 룩',
      description: '테니스코어',
      items: [
        { category: 'top', name: '폴로셔츠', color: '화이트' },
        { category: 'bottom', name: '테니스 스커트', color: '화이트' },
        { category: 'shoes', name: '테니스화', color: '화이트/그린' },
      ],
      occasions: ['workout', 'casual'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Summer', 'Winter'],
    },
    {
      id: 'sporty-6',
      name: '골프 룩',
      description: '골프코어',
      items: [
        { category: 'top', name: '폴로셔츠', color: '네이비' },
        { category: 'bottom', name: '골프 팬츠', color: '베이지' },
        { category: 'shoes', name: '골프화', color: '화이트' },
        { category: 'accessory', name: '썬캡', color: '화이트' },
      ],
      occasions: ['workout', 'casual'],
      seasons: ['spring', 'summer', 'autumn'],
      personalColors: ['Spring', 'Summer', 'Autumn'],
    },
    {
      id: 'sporty-7',
      name: '윈드러너 + 쇼츠',
      description: '러닝 룩',
      items: [
        { category: 'outer', name: '윈드러너', color: '블랙' },
        { category: 'bottom', name: '러닝 쇼츠', color: '블랙' },
        { category: 'shoes', name: '러닝화', color: '네온그린' },
      ],
      occasions: ['workout'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'sporty-8',
      name: '요가 룩',
      description: '요가/필라테스',
      items: [
        { category: 'top', name: '요가 탑', color: '올리브' },
        { category: 'bottom', name: '요가 레깅스', color: '블랙' },
        { category: 'outer', name: '크롭 후디', color: '그레이' },
      ],
      occasions: ['workout'],
      seasons: ['spring', 'summer', 'autumn', 'winter'],
      personalColors: ['Spring', 'Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'sporty-9',
      name: '하이킹 룩',
      description: '아웃도어 스포티',
      items: [
        { category: 'outer', name: '고어텍스 자켓', color: '카키' },
        { category: 'bottom', name: '트레킹 팬츠', color: '차콜' },
        { category: 'shoes', name: '트레킹화', color: '브라운' },
      ],
      occasions: ['workout', 'travel'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'sporty-10',
      name: '수영복 + 커버업',
      description: '비치 룩',
      items: [
        { category: 'top', name: '래쉬가드', color: '네이비' },
        { category: 'bottom', name: '보드쇼츠', color: '네이비/화이트' },
        { category: 'shoes', name: '아쿠아슈즈', color: '블랙' },
      ],
      occasions: ['workout', 'travel'],
      seasons: ['summer'],
      personalColors: ['Summer', 'Winter'],
    },
  ],
  classic: [
    {
      id: 'classic-1',
      name: '트렌치코트 + 터틀넥',
      description: '영원한 클래식',
      items: [
        { category: 'outer', name: '베이지 트렌치코트', color: '베이지' },
        { category: 'top', name: '블랙 터틀넥', color: '블랙' },
        { category: 'bottom', name: '다크네이비 슬랙스', color: '네이비' },
        { category: 'shoes', name: '옥스포드', color: '브라운' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Autumn', 'Winter'],
    },
    {
      id: 'classic-2',
      name: '피코트 + 니트',
      description: '해양 클래식',
      items: [
        { category: 'outer', name: '네이비 피코트', color: '네이비' },
        { category: 'top', name: '아이보리 케이블 니트', color: '아이보리' },
        { category: 'bottom', name: '그레이 울 팬츠', color: '그레이' },
        { category: 'shoes', name: '첼시부츠', color: '블랙' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'classic-3',
      name: '카멜 코트',
      description: '타임리스 룩',
      items: [
        { category: 'outer', name: '카멜 울 코트', color: '카멜' },
        { category: 'top', name: '화이트 셔츠', color: '화이트' },
        { category: 'bottom', name: '다크 데님', color: '인디고' },
        { category: 'shoes', name: '브라운 부츠', color: '브라운' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Spring', 'Autumn'],
    },
    {
      id: 'classic-4',
      name: '옥스포드 셔츠 + 치노',
      description: '아이비리그 스타일',
      items: [
        { category: 'top', name: '스카이블루 옥스포드 셔츠', color: '스카이블루' },
        { category: 'bottom', name: '카키 치노', color: '카키' },
        { category: 'shoes', name: '페니로퍼', color: '버건디' },
        { category: 'accessory', name: '브라운 벨트', color: '브라운' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Summer', 'Autumn'],
    },
    {
      id: 'classic-5',
      name: '블레이저 + 터틀넥',
      description: '스마트 클래식',
      items: [
        { category: 'outer', name: '차콜 블레이저', color: '차콜' },
        { category: 'top', name: '크림 터틀넥', color: '크림' },
        { category: 'bottom', name: '그레이 슬랙스', color: '그레이' },
        { category: 'shoes', name: '브로그', color: '탄' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'classic-6',
      name: '헤링본 코트',
      description: '영국 신사 룩',
      items: [
        { category: 'outer', name: '헤링본 오버코트', color: '그레이' },
        { category: 'top', name: '버건디 스웨터', color: '버건디' },
        { category: 'bottom', name: '차콜 울 팬츠', color: '차콜' },
        { category: 'shoes', name: '옥스포드', color: '블랙' },
        { category: 'accessory', name: '울 머플러', color: '네이비' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'classic-7',
      name: '브레톤 스트라이프',
      description: '프렌치 클래식',
      items: [
        { category: 'top', name: '브레톤 스트라이프 티', color: '네이비/화이트' },
        { category: 'bottom', name: '화이트 청바지', color: '화이트' },
        { category: 'shoes', name: '에스파드리유', color: '네이비' },
      ],
      occasions: ['casual', 'travel'],
      seasons: ['spring', 'summer'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'classic-8',
      name: '트위드 자켓',
      description: '샤넬 스타일',
      items: [
        { category: 'outer', name: '트위드 자켓', color: '핑크/화이트' },
        { category: 'bottom', name: '화이트 슬랙스', color: '화이트' },
        { category: 'top', name: '실크 블라우스', color: '화이트' },
        { category: 'shoes', name: '슬링백', color: '베이지/블랙' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'classic-9',
      name: 'A라인 스커트 + 니트',
      description: '레이디라이크',
      items: [
        { category: 'top', name: '캐시미어 니트', color: '카멜' },
        { category: 'bottom', name: 'A라인 미디 스커트', color: '버건디' },
        { category: 'shoes', name: '메리제인', color: '블랙' },
        { category: 'bag', name: '구조적인 핸드백', color: '버건디' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'classic-10',
      name: '리틀 블랙 드레스',
      description: 'LBD 클래식',
      items: [
        { category: 'dress', name: '리틀 블랙 드레스', color: '블랙' },
        { category: 'shoes', name: '스틸레토', color: '블랙' },
        { category: 'accessory', name: '진주 목걸이', color: '화이트' },
        { category: 'bag', name: '클러치', color: '골드' },
      ],
      occasions: ['formal', 'date'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Winter'],
    },
  ],
  preppy: [
    {
      id: 'preppy-1',
      name: '니트 베스트 + 셔츠',
      description: '아이비리그 프레피',
      items: [
        { category: 'top', name: '케이블 니트 베스트', color: '네이비' },
        { category: 'top', name: '화이트 옥스포드 셔츠', color: '화이트' },
        { category: 'bottom', name: '카키 치노', color: '카키' },
        { category: 'shoes', name: '로퍼', color: '브라운' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'preppy-2',
      name: '아가일 니트',
      description: '클래식 프레피',
      items: [
        { category: 'top', name: '아가일 패턴 니트', color: '네이비/레드' },
        { category: 'bottom', name: '플리츠 스커트', color: '네이비' },
        { category: 'shoes', name: '메리제인', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'preppy-3',
      name: '폴로셔츠 + 쇼츠',
      description: '썸머 프레피',
      items: [
        { category: 'top', name: '폴로셔츠', color: '핑크' },
        { category: 'bottom', name: '버뮤다 쇼츠', color: '네이비' },
        { category: 'shoes', name: '보트슈즈', color: '탄' },
        { category: 'accessory', name: '웨이퍼러 선글라스', color: '토터스' },
      ],
      occasions: ['casual', 'travel'],
      seasons: ['summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'preppy-4',
      name: '블레이저 + 치노',
      description: '스마트 프레피',
      items: [
        { category: 'outer', name: '네이비 블레이저', color: '네이비' },
        { category: 'top', name: '스트라이프 셔츠', color: '블루/화이트' },
        { category: 'bottom', name: '베이지 치노', color: '베이지' },
        { category: 'shoes', name: '로퍼', color: '버건디' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'preppy-5',
      name: '카디건 + 플리츠',
      description: '스쿨 프레피',
      items: [
        { category: 'outer', name: 'V넥 카디건', color: '크림' },
        { category: 'top', name: '화이트 셔츠', color: '화이트' },
        { category: 'bottom', name: '타탄체크 플리츠 스커트', color: '레드/그린' },
        { category: 'shoes', name: '로퍼', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'preppy-6',
      name: '퀼팅 자켓',
      description: '컨트리 프레피',
      items: [
        { category: 'outer', name: '퀼팅 자켓', color: '올리브' },
        { category: 'top', name: '체크 셔츠', color: '레드/네이비' },
        { category: 'bottom', name: '코듀로이 팬츠', color: '브라운' },
        { category: 'shoes', name: '첼시부츠', color: '브라운' },
      ],
      occasions: ['casual', 'travel'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn'],
    },
    {
      id: 'preppy-7',
      name: '럭비 셔츠',
      description: '스포티 프레피',
      items: [
        { category: 'top', name: '럭비 셔츠', color: '네이비/화이트' },
        { category: 'bottom', name: '카키 치노', color: '카키' },
        { category: 'shoes', name: '화이트 스니커즈', color: '화이트' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'preppy-8',
      name: '시어서커 수트',
      description: '썸머 프레피 포멀',
      items: [
        { category: 'outer', name: '시어서커 자켓', color: '블루/화이트' },
        { category: 'bottom', name: '시어서커 팬츠', color: '블루/화이트' },
        { category: 'top', name: '화이트 셔츠', color: '화이트' },
        { category: 'shoes', name: '로퍼', color: '브라운' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['summer'],
      personalColors: ['Summer'],
    },
    {
      id: 'preppy-9',
      name: '테니스 스웨터',
      description: '케이블니트 프레피',
      items: [
        { category: 'top', name: '크리켓 스웨터', color: '크림/네이비' },
        { category: 'bottom', name: '화이트 치노', color: '화이트' },
        { category: 'shoes', name: '화이트 스니커즈', color: '화이트' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'preppy-10',
      name: '피케 드레스',
      description: '서머 프레피 드레스',
      items: [
        { category: 'dress', name: '피케 원피스', color: '핑크' },
        { category: 'shoes', name: '에스파드리유', color: '네이비' },
        { category: 'bag', name: '스트로 토트백', color: '내추럴' },
        { category: 'accessory', name: '리본 헤어밴드', color: '핑크' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['summer'],
      personalColors: ['Spring', 'Summer'],
    },
  ],
  hiphop: [
    {
      id: 'hiphop-1',
      name: '오버사이즈 후디 레이어드',
      description: '편안하면서 트렌디한 힙합 기본 룩',
      items: [
        { category: 'top', name: '오버사이즈 후디', color: '블랙' },
        { category: 'top', name: '롱 티셔츠', color: '화이트' },
        { category: 'bottom', name: '와이드 카고팬츠', color: '카키' },
        { category: 'shoes', name: '에어포스1', color: '화이트' },
        { category: 'accessory', name: '체인 목걸이', color: '실버' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'hiphop-2',
      name: '벌키 패딩 + 조거',
      description: '겨울 힙합 스타일',
      items: [
        { category: 'outer', name: '벌키 패딩', color: '블랙' },
        { category: 'top', name: '후드티', color: '그레이' },
        { category: 'bottom', name: '조거팬츠', color: '블랙' },
        { category: 'shoes', name: '에어조던', color: '블랙/레드' },
      ],
      occasions: ['casual'],
      seasons: ['winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'hiphop-3',
      name: '그래픽 후디 + 워싱 데님',
      description: '스트릿 감성 힙합',
      items: [
        { category: 'top', name: '그래픽 후디', color: '화이트' },
        { category: 'bottom', name: '워싱 와이드 데님', color: '라이트블루' },
        { category: 'shoes', name: '청키 스니커즈', color: '화이트' },
        { category: 'accessory', name: '버킷햇', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'summer', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'hiphop-4',
      name: '볼륨 MA-1 + 스키니',
      description: '락시크 힙합',
      items: [
        { category: 'outer', name: 'MA-1 자켓', color: '카키' },
        { category: 'top', name: '블랙 티셔츠', color: '블랙' },
        { category: 'bottom', name: '블랙 스키니진', color: '블랙' },
        { category: 'shoes', name: '하이탑 스니커즈', color: '화이트' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'hiphop-5',
      name: '트랙수트 셋업',
      description: '클래식 힙합',
      items: [
        { category: 'outer', name: '트랙 자켓', color: '네이비/화이트' },
        { category: 'bottom', name: '트랙팬츠', color: '네이비/화이트' },
        { category: 'shoes', name: '아디다스 슈퍼스타', color: '화이트' },
        { category: 'accessory', name: '스냅백', color: '네이비' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'hiphop-6',
      name: '레터링 맨투맨 + 카고',
      description: '데일리 힙합',
      items: [
        { category: 'top', name: '레터링 맨투맨', color: '그레이' },
        { category: 'bottom', name: '카고 조거팬츠', color: '블랙' },
        { category: 'shoes', name: '뉴발란스 990', color: '그레이' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'hiphop-7',
      name: '오버핏 셔츠 + 와이드',
      description: '모던 힙합',
      items: [
        { category: 'top', name: '오버핏 체크 셔츠', color: '블루/화이트' },
        { category: 'top', name: '화이트 티셔츠', color: '화이트' },
        { category: 'bottom', name: '와이드 데님', color: '인디고' },
        { category: 'shoes', name: '컨버스 척테일러', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Autumn', 'Winter'],
    },
    {
      id: 'hiphop-8',
      name: '롱 코트 + 조거',
      description: '시크 힙합',
      items: [
        { category: 'outer', name: '롱 트렌치코트', color: '베이지' },
        { category: 'top', name: '블랙 후디', color: '블랙' },
        { category: 'bottom', name: '조거팬츠', color: '블랙' },
        { category: 'shoes', name: '워커', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'hiphop-9',
      name: '데님 자켓 + 스웻팬츠',
      description: '캐주얼 힙합',
      items: [
        { category: 'outer', name: '오버사이즈 데님 자켓', color: '인디고' },
        { category: 'top', name: '그래픽 티셔츠', color: '화이트' },
        { category: 'bottom', name: '스웻팬츠', color: '그레이' },
        { category: 'shoes', name: '에어맥스', color: '화이트/블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'hiphop-10',
      name: '후드 집업 + 와이드 카고',
      description: '테크웨어 힙합',
      items: [
        { category: 'outer', name: '테크 후드 집업', color: '블랙' },
        { category: 'bottom', name: '테크 카고팬츠', color: '블랙' },
        { category: 'shoes', name: '나이키 ACG', color: '블랙/그레이' },
        { category: 'bag', name: '크로스백', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Winter'],
    },
  ],
  romantic: [
    {
      id: 'romantic-1',
      name: '플로럴 원피스',
      description: '봄날의 로맨틱',
      items: [
        { category: 'dress', name: '플로럴 미디 원피스', color: '핑크/화이트' },
        { category: 'outer', name: '데님 자켓', color: '라이트블루' },
        { category: 'shoes', name: '메리제인', color: '누드' },
        { category: 'bag', name: '위커백', color: '내추럴' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'romantic-2',
      name: '레이스 블라우스 + 스커트',
      description: '우아한 로맨틱',
      items: [
        { category: 'top', name: '레이스 블라우스', color: '아이보리' },
        { category: 'bottom', name: 'A라인 미디 스커트', color: '핑크' },
        { category: 'shoes', name: '스틸레토', color: '누드' },
        { category: 'accessory', name: '진주 귀걸이', color: '화이트' },
      ],
      occasions: ['formal', 'date'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'romantic-3',
      name: '셔링 원피스',
      description: '여름 로맨틱',
      items: [
        { category: 'dress', name: '셔링 롱 원피스', color: '라벤더' },
        { category: 'shoes', name: '스트랩 샌들', color: '화이트' },
        { category: 'bag', name: '미니 숄더백', color: '화이트' },
        { category: 'accessory', name: '밀짚모자', color: '베이지' },
      ],
      occasions: ['casual', 'date', 'travel'],
      seasons: ['summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'romantic-4',
      name: '퍼프소매 블라우스',
      description: '빈티지 로맨틱',
      items: [
        { category: 'top', name: '퍼프소매 블라우스', color: '화이트' },
        { category: 'bottom', name: '하이웨이스트 와이드 팬츠', color: '베이지' },
        { category: 'shoes', name: '메리제인', color: '블랙' },
        { category: 'bag', name: '프레임백', color: '브라운' },
      ],
      occasions: ['casual', 'formal'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Autumn'],
    },
    {
      id: 'romantic-5',
      name: '프릴 니트 + 플리츠',
      description: '가을 로맨틱',
      items: [
        { category: 'top', name: '프릴 니트', color: '아이보리' },
        { category: 'bottom', name: '플리츠 롱스커트', color: '버건디' },
        { category: 'shoes', name: '앵클부츠', color: '브라운' },
        { category: 'bag', name: '체인백', color: '버건디' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'romantic-6',
      name: '시폰 원피스',
      description: '여성스러운 로맨틱',
      items: [
        { category: 'dress', name: '시폰 롱 원피스', color: '로즈핑크' },
        { category: 'shoes', name: '스트랩 힐', color: '누드' },
        { category: 'bag', name: '클러치', color: '골드' },
        { category: 'accessory', name: '리본 헤어핀', color: '핑크' },
      ],
      occasions: ['formal', 'date'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'romantic-7',
      name: '앙고라 니트 + 벨벳 스커트',
      description: '겨울 로맨틱',
      items: [
        { category: 'top', name: '앙고라 니트', color: '핑크' },
        { category: 'bottom', name: '벨벳 스커트', color: '블랙' },
        { category: 'shoes', name: '무릎부츠', color: '블랙' },
        { category: 'bag', name: '퀼팅백', color: '블랙' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['winter'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'romantic-8',
      name: '자수 블라우스 + 데님',
      description: '캐주얼 로맨틱',
      items: [
        { category: 'top', name: '자수 블라우스', color: '화이트' },
        { category: 'bottom', name: '하이웨이스트 데님', color: '라이트블루' },
        { category: 'shoes', name: '에스파드리유', color: '베이지' },
        { category: 'bag', name: '크로스백', color: '브라운' },
      ],
      occasions: ['casual', 'date'],
      seasons: ['spring', 'summer'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'romantic-9',
      name: '트위드 원피스',
      description: '샤넬 로맨틱',
      items: [
        { category: 'dress', name: '트위드 원피스', color: '핑크/화이트' },
        { category: 'shoes', name: '슬링백', color: '베이지/블랙' },
        { category: 'bag', name: '체인백', color: '블랙' },
        { category: 'accessory', name: '진주 목걸이', color: '화이트' },
      ],
      occasions: ['formal', 'date'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Spring', 'Summer'],
    },
    {
      id: 'romantic-10',
      name: '리본 블라우스 + 플레어',
      description: '클래식 로맨틱',
      items: [
        { category: 'top', name: '리본 블라우스', color: '아이보리' },
        { category: 'bottom', name: '플레어 스커트', color: '네이비' },
        { category: 'shoes', name: '펌프스', color: '블랙' },
        { category: 'bag', name: '토트백', color: '블랙' },
      ],
      occasions: ['formal', 'casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
  ],
  workwear: [
    {
      id: 'workwear-1',
      name: '카하트 자켓 + 데님',
      description: '클래식 워크웨어',
      items: [
        { category: 'outer', name: '캔버스 워크 자켓', color: '카키' },
        { category: 'top', name: '화이트 티셔츠', color: '화이트' },
        { category: 'bottom', name: '스트레이트 데님', color: '인디고' },
        { category: 'shoes', name: '워크부츠', color: '브라운' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'workwear-2',
      name: '덕 재킷 + 카고',
      description: '실용 워크웨어',
      items: [
        { category: 'outer', name: '덕 재킷', color: '브라운' },
        { category: 'top', name: '플란넬 셔츠', color: '레드/블랙' },
        { category: 'bottom', name: '카고팬츠', color: '베이지' },
        { category: 'shoes', name: '워크부츠', color: '브라운' },
      ],
      occasions: ['casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'workwear-3',
      name: '데님 커버올',
      description: '빈티지 워크웨어',
      items: [
        { category: 'top', name: '데님 커버올', color: '인디고' },
        { category: 'top', name: '스트라이프 티셔츠', color: '화이트/네이비' },
        { category: 'shoes', name: '컨버스', color: '화이트' },
        { category: 'accessory', name: '비니', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Summer', 'Winter'],
    },
    {
      id: 'workwear-4',
      name: '밀리터리 셔츠 + 치노',
      description: '밀리터리 워크웨어',
      items: [
        { category: 'top', name: '밀리터리 셔츠', color: '올리브' },
        { category: 'bottom', name: '베이커 팬츠', color: '베이지' },
        { category: 'shoes', name: '컴뱃부츠', color: '블랙' },
        { category: 'bag', name: '메신저백', color: '카키' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'workwear-5',
      name: '코듀로이 셔츠 + 카펜터',
      description: '레트로 워크웨어',
      items: [
        { category: 'top', name: '코듀로이 셔츠', color: '브라운' },
        { category: 'bottom', name: '카펜터 팬츠', color: '베이지' },
        { category: 'shoes', name: '워크부츠', color: '브라운' },
        { category: 'accessory', name: '비니', color: '베이지' },
      ],
      occasions: ['casual'],
      seasons: ['autumn', 'winter'],
      personalColors: ['Autumn'],
    },
    {
      id: 'workwear-6',
      name: '쉘파 재킷 + 데님',
      description: '캐주얼 워크웨어',
      items: [
        { category: 'outer', name: '쉘파 재킷', color: '베이지' },
        { category: 'top', name: '후드티', color: '그레이' },
        { category: 'bottom', name: '블루 데님', color: '인디고' },
        { category: 'shoes', name: '워커', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'workwear-7',
      name: '헌팅 베스트 + 팬츠',
      description: '아웃도어 워크웨어',
      items: [
        { category: 'outer', name: '헌팅 베스트', color: '올리브' },
        { category: 'top', name: '플란넬 셔츠', color: '그린/블랙' },
        { category: 'bottom', name: '카고 팬츠', color: '카키' },
        { category: 'shoes', name: '트레킹화', color: '브라운' },
      ],
      occasions: ['casual', 'travel'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'workwear-8',
      name: '체크 셔츠 + 오버올',
      description: '팜코어 워크웨어',
      items: [
        { category: 'top', name: '체크 플란넬 셔츠', color: '레드/블랙' },
        { category: 'bottom', name: '데님 오버올', color: '인디고' },
        { category: 'shoes', name: '워크부츠', color: '브라운' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'workwear-9',
      name: '챔피온 후디 + 페인터',
      description: '스트릿 워크웨어',
      items: [
        { category: 'top', name: '리버스위브 후디', color: '그레이' },
        { category: 'bottom', name: '페인터 팬츠', color: '베이지' },
        { category: 'shoes', name: '뉴발란스 992', color: '그레이' },
      ],
      occasions: ['casual'],
      seasons: ['spring', 'autumn', 'winter'],
      personalColors: ['Autumn', 'Winter'],
    },
    {
      id: 'workwear-10',
      name: 'N3B 파카 + 카고',
      description: '겨울 워크웨어',
      items: [
        { category: 'outer', name: 'N3B 파카', color: '카키' },
        { category: 'top', name: '터틀넥', color: '블랙' },
        { category: 'bottom', name: '밀리터리 카고', color: '올리브' },
        { category: 'shoes', name: '컴뱃부츠', color: '블랙' },
      ],
      occasions: ['casual'],
      seasons: ['winter'],
      personalColors: ['Autumn', 'Winter'],
    },
  ],
};

/**
 * 스타일별 Best 10 조회
 */
export function getStyleBest10(category: StyleCategory): StyleBest10 {
  const descriptions: Record<StyleCategory, string> = {
    casual: '편안하면서도 스타일리시한 일상 코디',
    formal: '비즈니스와 공식 자리를 위한 격식있는 스타일',
    street: '트렌디하고 개성있는 스트릿 패션',
    minimal: '군더더기 없는 깔끔하고 세련된 스타일',
    sporty: '활동적이고 건강한 이미지의 스포티 룩',
    classic: '시대를 초월하는 클래식한 스타일',
    preppy: '단정하고 지적인 프레피 스타일',
    hiphop: '오버사이즈와 스트릿 감성의 힙합 스타일',
    romantic: '여성스럽고 우아한 로맨틱 스타일',
    workwear: '실용적이고 튼튼한 워크웨어 스타일',
  };

  return {
    category,
    label: STYLE_CATEGORY_LABELS[category],
    description: descriptions[category],
    outfits: STYLE_OUTFITS[category],
  };
}

/**
 * 모든 스타일의 Best 10 조회
 */
export function getAllStyleBest10(): StyleBest10[] {
  return Object.keys(STYLE_OUTFITS).map((category) => getStyleBest10(category as StyleCategory));
}

/**
 * 퍼스널컬러에 맞는 코디 필터링
 */
export function filterByPersonalColor(
  outfits: OutfitRecommendation[],
  seasonType: PersonalColorSeason
): OutfitRecommendation[] {
  return outfits.filter((outfit) => outfit.personalColors.includes(seasonType));
}

/**
 * 계절에 맞는 코디 필터링
 */
export function filterBySeason(
  outfits: OutfitRecommendation[],
  season: Season
): OutfitRecommendation[] {
  return outfits.filter((outfit) => outfit.seasons.includes(season));
}

/**
 * 상황(TPO)에 맞는 코디 필터링
 */
export function filterByOccasion(
  outfits: OutfitRecommendation[],
  occasion: Occasion
): OutfitRecommendation[] {
  return outfits.filter((outfit) => outfit.occasions.includes(occasion));
}

/**
 * 사용자 맞춤 Best 10 추천
 */
export function getPersonalizedBest10(
  category: StyleCategory,
  options?: {
    seasonType?: PersonalColorSeason;
    currentSeason?: Season;
    occasion?: Occasion;
  }
): OutfitRecommendation[] {
  let outfits = STYLE_OUTFITS[category];

  if (options?.seasonType) {
    outfits = filterByPersonalColor(outfits, options.seasonType);
  }

  if (options?.currentSeason) {
    outfits = filterBySeason(outfits, options.currentSeason);
  }

  if (options?.occasion) {
    outfits = filterByOccasion(outfits, options.occasion);
  }

  // 최소 3개 이상 유지
  if (outfits.length < 3) {
    outfits = STYLE_OUTFITS[category].slice(0, 10);
  }

  return outfits.slice(0, 10);
}
