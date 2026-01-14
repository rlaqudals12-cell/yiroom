/**
 * S-1 피부 분석 12존 상세 설명 Mock 데이터
 * @description Progressive Disclosure 시스템용 존별 상세 정보
 * @version 1.0
 * @date 2026-01-13
 */

import type { DetailedZoneId } from '@/types/skin-zones';

// ============================================
// 타입 정의
// ============================================

/** 측정 상세 정보 */
export interface ZoneMeasurementDetail {
  /** 측정 지표명 */
  indicator: string;
  /** 정상 범위 */
  normalRange: string;
  /** 설명 */
  description: string;
}

/** 존 상세 설명 데이터 */
export interface ZoneDetailedExplanation {
  /** 존 ID */
  zoneId: DetailedZoneId;
  /** 한국어 이름 */
  zoneName: string;
  /** 존 특성 설명 */
  zoneCharacteristic: string;
  /** 주요 문제점 */
  concerns: string[];
  /** 측정 상세 정보 */
  measurementDetails: ZoneMeasurementDetail[];
  /** 맞춤 추천 솔루션 */
  recommendations: string[];
  /** 피해야 할 것 */
  avoidance: string[];
  /** 관련 피부 지표 */
  relatedMetrics: string[];
}

// ============================================
// 12존 상세 설명 데이터
// ============================================

export const ZONE_DETAILED_EXPLANATIONS: Record<DetailedZoneId, ZoneDetailedExplanation> = {
  // ============================================
  // 이마 영역 (3존)
  // ============================================

  forehead_center: {
    zoneId: 'forehead_center',
    zoneName: '이마 중앙',
    zoneCharacteristic:
      'T존 상단에 위치하며 피지선이 가장 밀집된 부위 중 하나예요. 호르몬 변화에 민감하게 반응하고, 스트레스나 수면 부족이 바로 나타나는 영역이에요.',
    concerns: [
      '피지 과다 분비로 인한 번들거림',
      '여드름 및 좁쌀 여드름 발생',
      '잦은 트러블로 인한 색소침착',
      '표정 주름(이마 주름) 형성',
      '모공 확대 및 블랙헤드',
    ],
    measurementDetails: [
      {
        indicator: '피지 분비량',
        normalRange: '150-200 ug/cm2',
        description:
          '이마 중앙은 얼굴에서 피지 분비가 가장 활발한 부위예요. 과다 분비 시 번들거림과 트러블이 생겨요.',
      },
      {
        indicator: '수분도',
        normalRange: '40-60%',
        description: '피지가 많아도 수분이 부족할 수 있어요. 수분-유분 밸런스가 중요한 영역이에요.',
      },
      {
        indicator: '모공 크기',
        normalRange: '0.02-0.05mm',
        description: '피지 분비가 많으면 모공이 넓어질 수 있어요. 정기적인 관리가 필요해요.',
      },
    ],
    recommendations: [
      'BHA(살리실산) 토너로 모공 속 피지 제거',
      '나이아신아마이드 세럼으로 피지 조절',
      '가벼운 수분 젤 크림 사용',
      '주 1회 클레이 마스크로 피지 흡착',
      '논코메도제닉 선크림 사용',
    ],
    avoidance: [
      '무거운 오일 베이스 제품',
      '과도한 세안 (하루 3회 이상)',
      '손으로 이마 자주 만지기',
      '기름진 헤어 제품이 닿는 것',
      '각질 제거제 남용 (주 2회 이상)',
    ],
    relatedMetrics: ['oil', 'pores', 'trouble', 'hydration'],
  },

  forehead_left: {
    zoneId: 'forehead_left',
    zoneName: '왼쪽 이마',
    zoneCharacteristic:
      '헤어라인과 가까워 헤어 제품의 영향을 많이 받는 영역이에요. 두피와 연결된 부분이라 두피 상태가 피부에 영향을 줄 수 있어요.',
    concerns: [
      '헤어라인 트러블 (포마드 아크네)',
      '헤어 제품으로 인한 모공 막힘',
      '각질 축적 및 건조함',
      '두피 유분이 내려오면서 생기는 트러블',
      '이마 중앙보다 상대적으로 건조함',
    ],
    measurementDetails: [
      {
        indicator: '피지 분비량',
        normalRange: '100-150 ug/cm2',
        description: '이마 중앙보다 피지 분비가 적어 상대적으로 건조할 수 있어요.',
      },
      {
        indicator: '각질 축적도',
        normalRange: '정상 턴오버 28일',
        description: '헤어라인 근처는 세안이 소홀해지기 쉬워 각질이 축적될 수 있어요.',
      },
      {
        indicator: '트러블 발생 빈도',
        normalRange: '월 0-2개',
        description: '헤어 스타일링 제품이 원인이 되는 트러블이 자주 생기는 부위예요.',
      },
    ],
    recommendations: [
      '세안 시 헤어라인까지 꼼꼼히 클렌징',
      '가벼운 수분 에센스로 보습',
      '두피 관리와 병행하면 효과적',
      '포마드/왁스 사용 후 철저한 세안',
      '주 1회 각질 제거 (순한 AHA 제품)',
    ],
    avoidance: [
      '헤어 스타일링 제품이 피부에 닿는 것',
      '세안 시 헤어라인 놓치기',
      '두피용 오일이 이마로 흐르게 두기',
      '앞머리로 이마 가리고 방치',
      '코메도제닉 헤어 제품',
    ],
    relatedMetrics: ['hydration', 'trouble', 'pores'],
  },

  forehead_right: {
    zoneId: 'forehead_right',
    zoneName: '오른쪽 이마',
    zoneCharacteristic:
      '왼쪽 이마와 마찬가지로 헤어라인의 영향을 받는 영역이에요. 수면 자세나 베개 접촉에 따라 한쪽이 더 트러블이 생길 수 있어요.',
    concerns: [
      '헤어라인 트러블 (포마드 아크네)',
      '베개/이불 접촉으로 인한 트러블',
      '각질 축적 및 건조함',
      '비대칭적 피부 상태',
      '세안 시 놓치기 쉬운 영역',
    ],
    measurementDetails: [
      {
        indicator: '피지 분비량',
        normalRange: '100-150 ug/cm2',
        description: '이마 측면은 중앙보다 피지 분비가 적어요. 수분 관리가 중요해요.',
      },
      {
        indicator: '수분도',
        normalRange: '45-65%',
        description: '건조해지기 쉬운 부위라 보습에 신경 써야 해요.',
      },
      {
        indicator: '민감도',
        normalRange: '외부 자극에 주의',
        description: '베개나 손이 자주 닿으면 민감해질 수 있어요.',
      },
    ],
    recommendations: [
      '세안 시 헤어라인까지 꼼꼼히 클렌징',
      '가벼운 수분 에센스로 보습',
      '베개 커버 주 1회 이상 교체',
      '손으로 얼굴 만지는 습관 개선',
      '취침 전 헤어 묶기',
    ],
    avoidance: [
      '더러운 베개에서 수면',
      '손으로 이마 자주 괴기',
      '세안 시 헤어라인 놓치기',
      '자극적인 헤어 케어 제품',
      '한쪽으로만 계속 자기',
    ],
    relatedMetrics: ['hydration', 'trouble', 'pores'],
  },

  // ============================================
  // 눈가 영역 (2존)
  // ============================================

  eye_left: {
    zoneId: 'eye_left',
    zoneName: '왼쪽 눈가',
    zoneCharacteristic:
      '얼굴에서 피부가 가장 얇은 부위(0.5mm)로, 노화 징후가 가장 먼저 나타나요. 혈관이 비쳐 보이기 쉽고, 콜라겐 감소에 민감해요.',
    concerns: [
      '다크서클 (색소형/혈관형/구조형)',
      '잔주름 및 눈꺼풀 처짐',
      '건조함으로 인한 각질',
      '눈가 부기 (눈 붓기)',
      '피로 징후가 바로 드러남',
    ],
    measurementDetails: [
      {
        indicator: '피부 두께',
        normalRange: '0.3-0.5mm',
        description: '볼 피부의 1/4 두께밖에 안 돼요. 특별히 부드러운 관리가 필요해요.',
      },
      {
        indicator: '수분도',
        normalRange: '50-70%',
        description: '피지선이 거의 없어 쉽게 건조해져요. 수분 공급이 매우 중요한 부위예요.',
      },
      {
        indicator: '탄력도',
        normalRange: '콜라겐/엘라스틴 밀도',
        description: '20대 중반부터 탄력이 서서히 감소해요. 조기 관리가 효과적이에요.',
      },
    ],
    recommendations: [
      '전용 아이크림 사용 (약지로 부드럽게 도포)',
      '비타민K 함유 제품으로 다크서클 개선',
      '레티놀 아이크림으로 잔주름 예방 (저농도부터)',
      '냉찜질로 부기 완화',
      '선글라스로 자외선 차단',
    ],
    avoidance: [
      '눈 비비기 및 과도한 마찰',
      '일반 크림을 눈가에 바르기 (자극 성분 주의)',
      '두꺼운 제형의 메이크업',
      '클렌징 시 강하게 문지르기',
      '수면 부족 (혈액순환 저하)',
    ],
    relatedMetrics: ['hydration', 'wrinkles', 'elasticity', 'pigmentation'],
  },

  eye_right: {
    zoneId: 'eye_right',
    zoneName: '오른쪽 눈가',
    zoneCharacteristic:
      '왼쪽 눈가와 동일하게 가장 섬세한 관리가 필요한 영역이에요. 표정을 지을 때 주름이 생기기 쉽고, 피로가 바로 드러나요.',
    concerns: [
      '다크서클 (색소형/혈관형/구조형)',
      '까마귀 발자국 (눈꼬리 주름)',
      '건조함으로 인한 미세 각질',
      '눈가 색소침착',
      '탄력 저하로 인한 눈꺼풀 처짐',
    ],
    measurementDetails: [
      {
        indicator: '주름 깊이',
        normalRange: '0.1mm 이하',
        description: '웃을 때 생기는 주름이 0.1mm를 넘으면 관리가 필요해요.',
      },
      {
        indicator: '다크서클 지수',
        normalRange: 'L값 60 이상',
        description: '피부 밝기를 측정해요. 60 미만이면 다크서클이 눈에 띄는 상태예요.',
      },
      {
        indicator: '부기 정도',
        normalRange: '아침 기준 1시간 내 완화',
        description: '1시간 이상 부기가 지속되면 림프 순환에 문제가 있을 수 있어요.',
      },
    ],
    recommendations: [
      '전용 아이크림 사용 (펩타이드 성분 추천)',
      '카페인 함유 제품으로 부기 완화',
      '아이 마사지로 림프 순환 촉진',
      '충분한 수면 (7-8시간)',
      'SPF 차단 + 선글라스 착용',
    ],
    avoidance: [
      '눈을 자주 비비거나 만지기',
      '저녁에 수분 과다 섭취 (부기 유발)',
      '짠 음식 과다 섭취',
      '늦은 밤 스마트폰 사용',
      '방부제가 많은 아이 메이크업',
    ],
    relatedMetrics: ['hydration', 'wrinkles', 'elasticity', 'pigmentation'],
  },

  // ============================================
  // 볼 영역 (2존)
  // ============================================

  cheek_left: {
    zoneId: 'cheek_left',
    zoneName: '왼쪽 볼',
    zoneCharacteristic:
      'U존에 속하며 T존보다 건조하고 민감한 편이에요. 혈관이 확장되면 홍조가 나타나기 쉽고, 색소침착이나 기미가 생기기 쉬운 부위예요.',
    concerns: [
      '홍조 및 쉽게 붉어지는 피부',
      '모공 확대 (특히 콧방울 옆)',
      '기미, 주근깨, 색소침착',
      '건조함으로 인한 당김',
      '외부 자극에 민감한 반응',
    ],
    measurementDetails: [
      {
        indicator: '피지 분비량',
        normalRange: '50-100 ug/cm2',
        description: 'T존의 절반 수준으로 피지가 적어요. 건조해지기 쉬운 영역이에요.',
      },
      {
        indicator: '홍조 지수',
        normalRange: 'a값 10 이하',
        description: '피부 붉은기를 측정해요. 10 이상이면 홍조 관리가 필요할 수 있어요.',
      },
      {
        indicator: '색소침착 정도',
        normalRange: '주변 피부와 균일',
        description: '자외선 노출이 많은 부위라 색소침착이 생기기 쉬워요.',
      },
    ],
    recommendations: [
      '진정 성분 (센텔라, 판테놀) 제품 사용',
      '보습 강화 (세라마이드, 히알루론산)',
      '자외선 차단제 필수 (SPF 50+ 추천)',
      '비타민C 세럼으로 색소침착 개선',
      '미온수로 부드럽게 세안',
    ],
    avoidance: [
      '고온의 사우나나 찜질방',
      '자극적인 각질 제거 (물리적 스크럽)',
      '알코올 함유 토너',
      '뜨거운 물로 세안',
      '자외선 차단 없이 외출',
    ],
    relatedMetrics: ['hydration', 'pigmentation', 'pores', 'elasticity'],
  },

  cheek_right: {
    zoneId: 'cheek_right',
    zoneName: '오른쪽 볼',
    zoneCharacteristic:
      '왼쪽 볼과 마찬가지로 U존에 속해요. 통화할 때 휴대폰이 닿는 부분이라 트러블이 생길 수 있고, 수면 자세에 따라 상태가 달라져요.',
    concerns: [
      '휴대폰 접촉으로 인한 트러블',
      '베개 마찰로 인한 민감함',
      '홍조 및 모세혈관 확장',
      '건조함 및 각질',
      '비대칭적 색소침착',
    ],
    measurementDetails: [
      {
        indicator: '수분도',
        normalRange: '50-70%',
        description: '건조해지기 쉬운 부위예요. 수분이 50% 미만이면 보습이 필요해요.',
      },
      {
        indicator: '모공 크기',
        normalRange: '0.02-0.04mm',
        description: '볼의 모공은 T존보다 작지만, 탄력 저하로 커 보일 수 있어요.',
      },
      {
        indicator: '탄력도',
        normalRange: '반발력 측정',
        description: '볼살의 탄력은 전체적인 인상에 큰 영향을 미쳐요.',
      },
    ],
    recommendations: [
      '휴대폰 청소 및 이어폰 사용',
      '베개 커버 자주 교체',
      '진정 + 보습 듀얼 케어',
      '선크림 자주 덧바르기',
      '탄력 세럼 (펩타이드, 콜라겐)',
    ],
    avoidance: [
      '더러운 휴대폰을 볼에 대기',
      '한쪽으로만 수면하기',
      '볼을 손으로 괴기',
      '강한 마사지 및 문지르기',
      '자극적인 성분의 제품',
    ],
    relatedMetrics: ['hydration', 'pigmentation', 'elasticity', 'trouble'],
  },

  // ============================================
  // 코 영역 (2존)
  // ============================================

  nose_bridge: {
    zoneId: 'nose_bridge',
    zoneName: '콧등',
    zoneCharacteristic:
      'T존의 중심부로 피지 분비가 매우 활발해요. 블랙헤드와 각질이 쌓이기 쉽고, 모공이 눈에 잘 띄는 영역이에요.',
    concerns: [
      '블랙헤드 (산화된 피지)',
      '화이트헤드 (막힌 모공)',
      '각질 축적 및 거친 피부결',
      '모공 확대',
      '피지로 인한 번들거림',
    ],
    measurementDetails: [
      {
        indicator: '피지 분비량',
        normalRange: '200-250 ug/cm2',
        description: '얼굴에서 피지 분비가 두 번째로 많은 부위예요.',
      },
      {
        indicator: '블랙헤드 밀도',
        normalRange: 'cm2당 5개 이하',
        description: '5개 이상이면 딥 클렌징과 각질 관리가 필요해요.',
      },
      {
        indicator: '각질 두께',
        normalRange: '정상 턴오버 유지',
        description: '각질이 두꺼워지면 모공이 막히고 블랙헤드가 생겨요.',
      },
    ],
    recommendations: [
      'BHA(살리실산) 토너로 모공 속 청소',
      '주 1회 클레이 마스크로 피지 흡착',
      '주 1-2회 부드러운 각질 제거',
      '피지 조절 세럼 (나이아신아마이드)',
      '코 전용 모공 패드 사용',
    ],
    avoidance: [
      '손으로 블랙헤드 짜기',
      '너무 강한 코팩 (피부 손상)',
      '오일 클렌징 후 방치',
      '과도한 각질 제거',
      '두꺼운 메이크업',
    ],
    relatedMetrics: ['oil', 'pores', 'trouble', 'hydration'],
  },

  nose_tip: {
    zoneId: 'nose_tip',
    zoneName: '코끝',
    zoneCharacteristic:
      '피지선이 가장 밀집된 부위 중 하나로, 모공이 크고 눈에 띄어요. 딸기코(피지 필라멘트)가 생기기 쉬운 영역이에요.',
    concerns: [
      '피지 과다 (가장 많은 영역)',
      '넓은 모공 (육안으로 보임)',
      '피지 필라멘트 (딸기코)',
      '블랙헤드 및 화이트헤드',
      '붉은 코끝 (로사세아 초기)',
    ],
    measurementDetails: [
      {
        indicator: '피지 분비량',
        normalRange: '250-300 ug/cm2',
        description: '얼굴에서 피지가 가장 많이 나오는 부위예요.',
      },
      {
        indicator: '모공 크기',
        normalRange: '0.03-0.05mm',
        description: '모공이 크게 보이기 쉬운 부위예요. 피지 관리가 핵심이에요.',
      },
      {
        indicator: '피지 필라멘트',
        normalRange: '밝은 회색 ~ 연한 노란색',
        description: '어두운 색이면 블랙헤드로 진행된 상태예요. 정기적 관리가 필요해요.',
      },
    ],
    recommendations: [
      'BHA 토너로 매일 피지 관리',
      '주 1회 효소 클렌저 사용',
      '클레이 마스크 후 모공 수렴',
      '논코메도제닉 제품 사용',
      '레티놀로 모공 개선 (주 2-3회)',
    ],
    avoidance: [
      '손으로 코 자주 만지기',
      '모공 패치 매일 사용 (피부 손상)',
      '기름진 선크림',
      '두꺼운 파운데이션',
      '과도한 유분 제품',
    ],
    relatedMetrics: ['oil', 'pores', 'trouble'],
  },

  // ============================================
  // 턱 영역 (3존)
  // ============================================

  chin_center: {
    zoneId: 'chin_center',
    zoneName: '턱 중앙',
    zoneCharacteristic:
      '호르몬성 여드름이 가장 잘 생기는 부위예요. 특히 생리 전이나 스트레스를 받으면 트러블이 올라오기 쉬워요.',
    concerns: [
      '호르몬성 여드름 (낭포성)',
      '성인 여드름 (반복 발생)',
      '피지 과다 (T존 연장선)',
      '염증성 트러블',
      '색소침착 (트러블 흔적)',
    ],
    measurementDetails: [
      {
        indicator: '트러블 발생 빈도',
        normalRange: '월 0-2개',
        description: '3개 이상이면 호르몬 밸런스나 스트레스 관리가 필요해요.',
      },
      {
        indicator: '피지 분비량',
        normalRange: '150-200 ug/cm2',
        description: 'T존에서 이어지는 피지 분비가 많은 영역이에요.',
      },
      {
        indicator: '염증 지수',
        normalRange: '붉은기 최소화',
        description: '염증이 있으면 흉터가 남을 수 있어 조기 관리가 중요해요.',
      },
    ],
    recommendations: [
      '저자극 클렌징으로 부드럽게 세안',
      '스팟 트리트먼트 (벤조일 퍼옥사이드, 티트리)',
      '호르몬 밸런스 관리 (생활 습관)',
      '손으로 절대 짜지 않기',
      '나이아신아마이드로 피지 조절',
    ],
    avoidance: [
      '턱을 손으로 괴기',
      '여드름 짜기 (흉터 위험)',
      '자극적인 세안제',
      '유제품 과다 섭취 (연구 연관성)',
      '스트레스 방치',
    ],
    relatedMetrics: ['trouble', 'oil', 'pigmentation'],
  },

  chin_left: {
    zoneId: 'chin_left',
    zoneName: '왼쪽 턱선',
    zoneCharacteristic:
      '턱선 탄력과 윤곽에 영향을 미치는 부위예요. 나이가 들면서 처지기 시작하고, 수면 자세에 따라 비대칭이 생길 수 있어요.',
    concerns: [
      '턱선 탄력 저하 (더블친 위험)',
      '수면 자세로 인한 비대칭',
      '건조함 및 당김',
      '목과 연결 부위 관리 소홀',
      '림프 순환 저하로 인한 붓기',
    ],
    measurementDetails: [
      {
        indicator: '탄력도',
        normalRange: '반발력 측정',
        description: '턱선 탄력은 얼굴 윤곽에 큰 영향을 미쳐요. 25세 이후 관리 시작 권장.',
      },
      {
        indicator: '수분도',
        normalRange: '45-60%',
        description: '세안이나 보습 시 놓치기 쉬운 부위예요. 건조해지기 쉬워요.',
      },
      {
        indicator: '림프 순환',
        normalRange: '붓기 없음',
        description: '림프 순환이 안 되면 윤곽이 뭉툭해 보여요.',
      },
    ],
    recommendations: [
      '턱선까지 꼼꼼히 보습',
      '리프팅 마사지 (위로 쓸어올리기)',
      '탄력 세럼 (펩타이드, DMAE)',
      '림프 마사지로 순환 촉진',
      '콜라겐 부스팅 (레티놀, 비타민C)',
    ],
    avoidance: [
      '한쪽으로만 잠자기',
      '턱을 손으로 괴기',
      '목과 턱선 보습 건너뛰기',
      '급격한 다이어트 (탄력 손실)',
      '고개 숙이고 스마트폰 보기',
    ],
    relatedMetrics: ['elasticity', 'hydration', 'wrinkles'],
  },

  chin_right: {
    zoneId: 'chin_right',
    zoneName: '오른쪽 턱선',
    zoneCharacteristic:
      '왼쪽 턱선과 마찬가지로 얼굴 윤곽을 결정하는 중요한 부위예요. V라인 관리의 핵심 영역이에요.',
    concerns: [
      '턱선 탄력 저하',
      '좌우 비대칭',
      '건조함 및 각질',
      '목주름과 연결되는 부위',
      '이중턱 형성 위험',
    ],
    measurementDetails: [
      {
        indicator: '탄력도',
        normalRange: '반발력 측정',
        description: '콜라겐과 엘라스틴 감소로 탄력이 떨어지면 윤곽이 무너져요.',
      },
      {
        indicator: '지방층 두께',
        normalRange: '적정 수준 유지',
        description: '지방이 축적되면 이중턱처럼 보일 수 있어요.',
      },
      {
        indicator: '피부 밀도',
        normalRange: '조밀한 상태',
        description: '피부가 얇아지면 처짐이 빨리 와요.',
      },
    ],
    recommendations: [
      '턱선 리프팅 마사지 (매일 1분)',
      '목과 함께 케어 (같은 피부)',
      '탄력 에센스/크림 사용',
      '자세 교정 (고개 숙이지 않기)',
      '페이셜 요가 (턱선 운동)',
    ],
    avoidance: [
      '턱선 보습 건너뛰기',
      '목을 당기는 자세',
      '과도한 음주 (탄력 저하)',
      '수분 섭취 부족',
      '갑작스러운 체중 변화',
    ],
    relatedMetrics: ['elasticity', 'hydration', 'wrinkles'],
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 특정 존의 상세 설명 가져오기
 */
export function getZoneExplanation(zoneId: DetailedZoneId): ZoneDetailedExplanation {
  return ZONE_DETAILED_EXPLANATIONS[zoneId];
}

/**
 * 모든 존의 상세 설명 목록 가져오기
 */
export function getAllZoneExplanations(): ZoneDetailedExplanation[] {
  return Object.values(ZONE_DETAILED_EXPLANATIONS);
}

/**
 * 특정 지표와 관련된 존들 찾기
 */
export function getZonesByMetric(metric: string): ZoneDetailedExplanation[] {
  return Object.values(ZONE_DETAILED_EXPLANATIONS).filter((zone) =>
    zone.relatedMetrics.includes(metric)
  );
}

/**
 * T존 영역인지 확인
 */
export function isTZone(zoneId: DetailedZoneId): boolean {
  return ['forehead_center', 'nose_bridge', 'nose_tip'].includes(zoneId);
}

/**
 * U존 영역인지 확인
 */
export function isUZone(zoneId: DetailedZoneId): boolean {
  return ['cheek_left', 'cheek_right', 'chin_left', 'chin_right'].includes(zoneId);
}

/**
 * 눈가 영역인지 확인
 */
export function isEyeZone(zoneId: DetailedZoneId): boolean {
  return ['eye_left', 'eye_right'].includes(zoneId);
}
