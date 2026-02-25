/**
 * EWG 성분 등급 데이터베이스
 * 주요 화장품 성분의 EWG 안전 등급 및 기능 정보
 * @see https://www.ewg.org/skindeep/
 */

import type { EWGGrade, IngredientInfo } from '../../components/products/ingredients/EWGAnalysis';

interface EWGEntry {
  nameKo: string;
  grade: EWGGrade;
  functions: string[];
  isCaution?: boolean;
  isAllergen?: boolean;
  description?: string;
}

// 주요 화장품 성분 EWG 데이터 (한글명 → 영문명 기반 매핑)
const EWG_DATABASE: Record<string, EWGEntry> = {
  // 보습 성분
  히알루론산: {
    nameKo: '히알루론산',
    grade: 1,
    functions: ['보습', '수분 공급'],
    description: '피부 수분 보유에 탁월한 천연 보습 성분',
  },
  세라마이드: {
    nameKo: '세라마이드',
    grade: 1,
    functions: ['피부 장벽 강화', '보습'],
    description: '피부 장벽의 주요 구성 성분으로 건조함 방지',
  },
  판테놀: {
    nameKo: '판테놀',
    grade: 1,
    functions: ['진정', '보습', '피부 재생'],
    description: '비타민 B5 유도체, 피부 진정 및 재생 촉진',
  },
  알로에베라: {
    nameKo: '알로에베라',
    grade: 1,
    functions: ['진정', '보습', '항염'],
    description: '천연 진정 성분, 자극받은 피부에 효과적',
  },
  시어버터: {
    nameKo: '시어버터',
    grade: 1,
    functions: ['보습', '영양 공급'],
    description: '풍부한 지방산으로 건조한 피부에 영양 공급',
  },
  호호바오일: {
    nameKo: '호호바오일',
    grade: 1,
    functions: ['보습', '피지 조절'],
    description: '피부 피지와 유사한 구조로 자연스러운 보습',
  },
  글리세린: {
    nameKo: '글리세린',
    grade: 1,
    functions: ['보습', '수분 유지'],
    description: '수분을 끌어당겨 피부에 유지시키는 보습제',
  },
  스쿠알란: {
    nameKo: '스쿠알란',
    grade: 1,
    functions: ['보습', '피부 연화'],
    description: '올리브 유래 보습 성분, 가볍고 산뜻한 사용감',
  },

  // 기능성 성분
  나이아신아마이드: {
    nameKo: '나이아신아마이드',
    grade: 1,
    functions: ['미백', '피지 조절', '모공 축소'],
    description: '비타민 B3 유도체, 미백과 피지 조절에 효과적',
  },
  비타민E: {
    nameKo: '비타민E',
    grade: 1,
    functions: ['항산화', '보습'],
    description: '강력한 항산화 효과로 피부 노화 방지',
  },
  비타민C: {
    nameKo: '비타민C',
    grade: 1,
    functions: ['미백', '항산화', '콜라겐 생성'],
    description: '피부 톤 개선과 항산화에 효과적',
  },
  레티놀: {
    nameKo: '레티놀',
    grade: 4,
    functions: ['주름 개선', '세포 재생', '콜라겐 촉진'],
    description: '비타민A 유도체, 주름 개선 효과가 검증된 성분',
  },
  녹차추출물: {
    nameKo: '녹차추출물',
    grade: 1,
    functions: ['항산화', '진정'],
    description: '카테킨 풍부, 항산화 및 진정 효과',
  },
  살리실산: {
    nameKo: '살리실산',
    grade: 3,
    functions: ['각질 제거', '모공 관리'],
    description: 'BHA 성분, 모공 속 노폐물 제거에 효과적',
  },
  AHA: {
    nameKo: 'AHA',
    grade: 4,
    functions: ['각질 제거', '피부결 개선'],
    description: '글리콜산 등 수용성 산, 표면 각질 제거',
  },
  아데노신: {
    nameKo: '아데노신',
    grade: 1,
    functions: ['주름 개선', '피부 탄력'],
    description: '식약처 인증 주름 개선 기능성 성분',
  },

  // 자외선 차단 성분
  징크옥사이드: {
    nameKo: '징크옥사이드',
    grade: 2,
    functions: ['자외선 차단', '진정'],
    description: '무기 자외선 차단제, 민감성 피부에 적합',
  },
  티타늄디옥사이드: {
    nameKo: '티타늄디옥사이드',
    grade: 2,
    functions: ['자외선 차단'],
    description: '무기 자외선 차단제, 물리적 UV 차단',
  },

  // 주의 성분
  파라벤: {
    nameKo: '파라벤',
    grade: 7,
    functions: ['방부제'],
    isCaution: true,
    description: '방부 효과가 뛰어나지만 호르몬 교란 우려',
  },
  '인공 향료': {
    nameKo: '인공 향료',
    grade: 8,
    functions: ['향기'],
    isCaution: true,
    isAllergen: true,
    description: '알레르기 반응 가능성이 있는 합성 향료',
  },
  트리클로산: {
    nameKo: '트리클로산',
    grade: 7,
    functions: ['항균'],
    isCaution: true,
    description: '항균 성분이지만 내분비계 교란 우려',
  },
  SLS: {
    nameKo: 'SLS (소듐라우릴설페이트)',
    grade: 5,
    functions: ['세정', '거품'],
    description: '세정력이 강한 계면활성제, 건조함 유발 가능',
  },
  포름알데히드: {
    nameKo: '포름알데히드',
    grade: 10,
    functions: ['방부제'],
    isCaution: true,
    isAllergen: true,
    description: '발암 물질로 분류된 방부제',
  },

  // 기타 일반 성분
  콜라겐: {
    nameKo: '콜라겐',
    grade: 1,
    functions: ['보습', '탄력'],
    description: '피부 탄력 유지에 도움을 주는 단백질',
  },
  프로폴리스: {
    nameKo: '프로폴리스',
    grade: 1,
    functions: ['항염', '항균', '진정'],
    description: '벌이 만드는 천연 항균 물질',
  },
  센텔라아시아티카: {
    nameKo: '센텔라아시아티카',
    grade: 1,
    functions: ['진정', '피부 재생'],
    description: '민감한 피부 진정에 효과적인 허브 성분',
  },
  티트리오일: {
    nameKo: '티트리오일',
    grade: 3,
    functions: ['항균', '트러블 케어'],
    description: '천연 항균 성분, 트러블 피부 관리',
  },
  카페인: {
    nameKo: '카페인',
    grade: 1,
    functions: ['부기 완화', '혈액순환'],
    description: '혈액순환 촉진으로 다크서클 및 부기 완화',
  },
  펩타이드: {
    nameKo: '펩타이드',
    grade: 1,
    functions: ['주름 개선', '탄력'],
    description: '아미노산 결합체, 콜라겐 생성 촉진',
  },
};

/**
 * 성분명으로 EWG 정보를 조회
 * DB에 없는 성분은 등급 없이 반환
 */
export function lookupIngredient(name: string): IngredientInfo {
  const entry = EWG_DATABASE[name];

  if (entry) {
    return {
      name: name,
      nameKo: entry.nameKo,
      ewgGrade: entry.grade,
      functions: entry.functions,
      isCaution: entry.isCaution,
      isAllergen: entry.isAllergen,
      description: entry.description,
    };
  }

  // 데이터베이스에 없는 성분
  return {
    name: name,
    nameKo: name,
    functions: [],
  };
}

/**
 * 성분명 배열을 EWG 정보 배열로 변환
 */
export function lookupIngredients(names: string[]): IngredientInfo[] {
  return names.map(lookupIngredient);
}
