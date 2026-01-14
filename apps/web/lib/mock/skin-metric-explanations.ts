/**
 * S-1 피부 분석 7개 지표 상세 설명 Mock 데이터
 * @description Progressive Disclosure 분석 시스템용 과학적 근거 데이터
 * @version 1.0
 * @date 2026-01-13
 */

import type { MetricExplanationTemplate, SkinMetricId } from '@/types/skin-detailed';

/**
 * 7개 지표별 상세 설명 데이터
 * @description 각 지표의 측정 기준, 과학적 배경, 솔루션 정보 제공
 * @usage 결과 페이지에서 점수와 함께 조합하여 MetricDetailedExplanation 생성
 */
export const METRIC_EXPLANATIONS: Record<SkinMetricId, MetricExplanationTemplate> = {
  // ============================================
  // 1. 수분도 (Hydration)
  // ============================================
  hydration: {
    metricId: 'hydration',
    simpleDescription: '피부에 수분이 얼마나 있는지 측정해요',
    detailedAnalysis: {
      measurementBasis: '각질층(Stratum Corneum)의 수분 함량을 기준으로 측정',
      normalRange: '정상 범위: 70-85%',
      userStatus: '', // 동적으로 계산
      possibleCauses: [
        '세안 후 보습제 미사용',
        '건조한 환경(냉난방, 건조한 날씨)',
        '수분 섭취 부족',
        '피부 장벽 손상',
        '과도한 각질 제거',
        '알코올 함유 제품 사용',
      ],
    },
    scientificBackground: {
      explanation:
        '피부의 가장 바깥층인 각질층은 약 30%의 수분을 함유해야 건강한 상태예요. 수분이 부족하면 피부 장벽이 약해지고, 외부 자극에 취약해지며 잔주름이 생기기 쉬워요. 피부 속 수분은 천연보습인자(NMF)가 붙잡고 있는데, 이 성분이 부족하면 수분이 쉽게 증발해요.',
      technicalTerms: [
        {
          term: 'TEWL (경피수분손실량)',
          definition:
            'Trans-Epidermal Water Loss의 약자로, 피부를 통해 대기 중으로 증발하는 수분량을 말해요. 수치가 높을수록 피부 장벽이 약해진 상태예요.',
        },
        {
          term: 'NMF (천연보습인자)',
          definition:
            'Natural Moisturizing Factor의 약자로, 각질층에 존재하는 수용성 보습 성분이에요. 아미노산, 요소, 젖산 등으로 구성되어 수분을 끌어당기고 유지해요.',
        },
        {
          term: '각질층 (Stratum Corneum)',
          definition:
            '피부의 가장 바깥층으로, 약 15-20겹의 죽은 세포(각질세포)로 이루어져 있어요. 피부 장벽 기능의 핵심이에요.',
        },
      ],
      reference: 'J Dermatol Sci. 2024;113(2):45-52 "Skin Hydration and Barrier Function"',
    },
    solutions: {
      ingredients: [
        {
          name: '히알루론산',
          benefit: '자기 무게의 1000배 수분을 흡수하여 피부에 수분을 공급하고 유지해요',
        },
        {
          name: '세라마이드',
          benefit: '피부 장벽을 구성하는 지질 성분으로, 수분 증발을 막아줘요',
        },
        {
          name: '글리세린',
          benefit: '대기 중 수분을 끌어당겨 피부에 수분을 공급하는 보습제예요',
        },
        {
          name: '판테놀(비타민 B5)',
          benefit: '피부 깊숙이 침투해 수분을 공급하고 장벽을 강화해요',
        },
      ],
      products: ['하이드레이팅 토너', '수분 세럼', '수분 크림', '수면팩', '미스트'],
      lifestyle: [
        '하루 2L 이상 물 마시기',
        '가습기 사용 (실내 습도 50-60% 유지)',
        '미온수로 세안하기 (뜨거운 물 피하기)',
        '세안 후 3분 이내 보습제 바르기',
        '주 1-2회 시트 마스크 사용',
      ],
    },
  },

  // ============================================
  // 2. 유분도 (Oil/Sebum)
  // ============================================
  oil: {
    metricId: 'oil',
    simpleDescription: '피부의 피지(기름기) 분비량을 측정해요',
    detailedAnalysis: {
      measurementBasis: 'T존(이마, 코)과 U존(볼, 턱)의 피지 분비량 측정',
      normalRange: '정상 범위: 균형 잡힌 상태 40-60',
      userStatus: '',
      possibleCauses: [
        '호르몬 변화 (사춘기, 생리 주기, 스트레스)',
        '고당분/고지방 식단',
        '과도한 세안으로 인한 피지막 손상',
        '수분 부족으로 피지 과잉 분비',
        '유전적 요인',
        '습하고 더운 환경',
      ],
    },
    scientificBackground: {
      explanation:
        '피지는 피지선에서 분비되는 기름 성분으로, 적당량은 피부를 보호하고 촉촉하게 유지해요. 하지만 과다 분비되면 모공을 막아 여드름이 생기고, 부족하면 피부가 건조해져요. 재미있는 사실은 피부가 건조하면 오히려 피지가 더 많이 분비된다는 거예요!',
      technicalTerms: [
        {
          term: '피지선 (Sebaceous Gland)',
          definition:
            '모낭에 붙어 있는 분비샘으로, 피지를 생성해요. 얼굴, 특히 T존에 많이 분포해 있어요.',
        },
        {
          term: '피지막 (Sebum Film)',
          definition:
            '피부 표면을 덮고 있는 얇은 유분층으로, 수분 증발을 막고 외부 자극으로부터 피부를 보호해요.',
        },
        {
          term: '스쿠알렌 (Squalene)',
          definition:
            '피지의 주요 성분 중 하나로, 산화되면 모공을 막는 코메도제닉 물질로 변할 수 있어요.',
        },
      ],
      reference: 'Int J Cosmet Sci. 2023;45(4):321-335 "Sebum Production and Skin Health"',
    },
    solutions: {
      ingredients: [
        {
          name: '나이아신아마이드',
          benefit: '피지 분비를 조절하고 모공을 줄여주는 효과가 있어요',
        },
        { name: 'BHA (살리실산)', benefit: '지용성이라 모공 속 피지를 녹여 제거해요' },
        {
          name: '징크 (아연)',
          benefit: '피지 분비를 억제하고 항염 효과가 있어요',
        },
        {
          name: '그린티 추출물',
          benefit: '항산화 작용과 함께 피지 산화를 막아줘요',
        },
      ],
      products: ['오일 컨트롤 토너', '가벼운 젤 타입 보습제', '클레이 마스크', '매트 프라이머'],
      lifestyle: [
        '하루 2회 세안 (과도한 세안 피하기)',
        '기름진 음식, 당분 줄이기',
        '유분기 적은 제품 선택하기',
        '흡유지/파우더로 T존 관리',
        '스트레스 관리하기',
      ],
    },
  },

  // ============================================
  // 3. 모공 (Pores)
  // ============================================
  pores: {
    metricId: 'pores',
    simpleDescription: '모공의 크기와 상태를 측정해요',
    detailedAnalysis: {
      measurementBasis: '모공 직경, 밀도, 막힘 정도를 종합 분석',
      normalRange: '정상 모공 직경: 0.02-0.05mm',
      userStatus: '',
      possibleCauses: [
        '과다한 피지 분비로 모공 확장',
        '노화로 인한 피부 탄력 저하',
        '블랙헤드/화이트헤드 축적',
        '자외선 손상으로 콜라겐 파괴',
        '유전적 요인 (피지선 크기)',
        '잘못된 클렌징 습관',
      ],
    },
    scientificBackground: {
      explanation:
        '모공은 피지와 땀이 배출되는 통로예요. 모공이 커 보이는 이유는 크게 세 가지인데, 피지가 많이 분비되거나, 모공 주변 피부 탄력이 떨어지거나, 모공에 노폐물이 쌓여서예요. 한 번 늘어난 모공은 완전히 줄이기 어렵지만, 꾸준한 관리로 눈에 덜 띄게 할 수 있어요.',
      technicalTerms: [
        {
          term: '모낭 (Hair Follicle)',
          definition:
            '털이 자라는 피부 구조물로, 피지선과 연결되어 있어요. 모공은 이 모낭의 입구예요.',
        },
        {
          term: '코메돈 (Comedo)',
          definition:
            '피지와 각질이 모공을 막아 생긴 덩어리예요. 블랙헤드(열린 코메돈)와 화이트헤드(닫힌 코메돈)가 있어요.',
        },
        {
          term: '피지 플러그 (Sebum Plug)',
          definition: '모공을 막고 있는 굳은 피지 덩어리로, 산화되면 검게 변해 블랙헤드가 돼요.',
        },
      ],
      reference:
        'Skin Res Technol. 2024;30(1):e13567 "Facial Pore Size: Measurement and Treatment"',
    },
    solutions: {
      ingredients: [
        {
          name: 'BHA (살리실산)',
          benefit: '모공 속으로 들어가 피지와 각질을 녹여 제거해요',
        },
        {
          name: '레티놀',
          benefit: '세포 재생을 촉진하고 모공 주변 탄력을 개선해요',
        },
        {
          name: '나이아신아마이드',
          benefit: '모공 입구를 조여주고 피지 분비를 조절해요',
        },
        {
          name: '클레이 (카올린/벤토나이트)',
          benefit: '흡착력으로 모공 속 노폐물과 피지를 빼내요',
        },
      ],
      products: ['BHA 토너/세럼', '클레이 마스크', '모공 수렴 팩', '레티놀 크림'],
      lifestyle: [
        '더블 클렌징으로 깨끗한 세안',
        '주 1-2회 딥 클렌징',
        '자외선 차단제 필수 사용',
        '손으로 모공 짜지 않기',
        '논코메도제닉 제품 선택',
      ],
    },
  },

  // ============================================
  // 4. 주름 (Wrinkles)
  // ============================================
  wrinkles: {
    metricId: 'wrinkles',
    simpleDescription: '피부의 주름과 잔주름 상태를 측정해요',
    detailedAnalysis: {
      measurementBasis: '표정주름, 잔주름, 깊은 주름의 깊이와 개수 분석',
      normalRange: '20대: 잔주름 최소 / 30대 이후: 점진적 증가',
      userStatus: '',
      possibleCauses: [
        '자외선 노출로 인한 광노화',
        '콜라겐/엘라스틴 감소 (자연 노화)',
        '반복적인 표정 근육 사용',
        '건조함으로 인한 수분 주름',
        '흡연, 음주',
        '수면 부족, 스트레스',
      ],
    },
    scientificBackground: {
      explanation:
        '주름은 피부 속 콜라겐과 엘라스틴이 줄어들면서 생겨요. 20대 중반부터 콜라겐 생성이 매년 1%씩 감소하고, 자외선에 노출되면 더 빨리 분해돼요. 잔주름은 주로 건조함 때문에 생기고, 깊은 주름은 반복적인 표정과 피부 탄력 저하로 생겨요. 조기 예방이 가장 효과적이에요!',
      technicalTerms: [
        {
          term: '콜라겐 (Collagen)',
          definition:
            '피부의 70-80%를 구성하는 단백질로, 피부에 탄탄함과 구조를 제공해요. 나이 들면 생성이 줄어요.',
        },
        {
          term: '엘라스틴 (Elastin)',
          definition: '피부에 탄력을 주는 단백질이에요. 손상되면 회복이 어려워 예방이 중요해요.',
        },
        {
          term: '광노화 (Photoaging)',
          definition:
            '자외선에 의해 발생하는 피부 노화로, 주름, 색소침착, 탄력 저하가 특징이에요. 자연 노화보다 더 큰 영향을 미쳐요.',
        },
        {
          term: 'MMP (기질금속단백분해효소)',
          definition:
            'Matrix Metalloproteinases의 약자로, 콜라겐을 분해하는 효소예요. 자외선이 MMP 활성을 증가시켜요.',
        },
      ],
      reference: 'J Invest Dermatol. 2024;144(3):567-580 "Mechanisms of Skin Aging"',
    },
    solutions: {
      ingredients: [
        {
          name: '레티놀 (비타민 A)',
          benefit: '세포 재생을 촉진하고 콜라겐 생성을 자극해요. 안티에이징의 골드 스탠다드!',
        },
        {
          name: '펩타이드',
          benefit: '콜라겐 합성을 촉진하는 신호를 보내 주름을 개선해요',
        },
        {
          name: '비타민 C',
          benefit: '콜라겐 합성에 필수적이고, 항산화로 노화를 늦춰요',
        },
        {
          name: '아데노신',
          benefit: '주름 개선 기능성 인증 성분으로, 탄력을 높여줘요',
        },
      ],
      products: ['레티놀 세럼/크림', '펩타이드 세럼', '아이크림', '자외선 차단제 (SPF 50+)'],
      lifestyle: [
        '자외선 차단제 매일 바르기 (실내에서도!)',
        '충분한 수면 (7-8시간)',
        '항산화 식품 섭취 (베리류, 녹차)',
        '금연, 절주',
        '옆으로 자지 않기 (압박 주름 방지)',
      ],
    },
  },

  // ============================================
  // 5. 탄력 (Elasticity)
  // ============================================
  elasticity: {
    metricId: 'elasticity',
    simpleDescription: '피부가 얼마나 탱탱하고 탄력 있는지 측정해요',
    detailedAnalysis: {
      measurementBasis: '피부를 눌렀다 놓았을 때 원래 상태로 돌아오는 속도와 정도 측정',
      normalRange: '탄력 지수: 20대 기준 80-90',
      userStatus: '',
      possibleCauses: [
        '콜라겐/엘라스틴 감소 (노화)',
        '급격한 체중 변화',
        '자외선 손상',
        '수분 부족',
        '영양 불균형 (단백질 부족)',
        '운동 부족',
      ],
    },
    scientificBackground: {
      explanation:
        '피부 탄력은 진피층의 콜라겐과 엘라스틴 섬유가 결정해요. 이 섬유들이 피부를 탱탱하게 받쳐주는데, 나이가 들면 양도 줄고 질도 떨어져요. 특히 엘라스틴은 한 번 손상되면 재생이 거의 안 돼서 예방이 정말 중요해요. 자외선이 탄력 저하의 가장 큰 원인이에요!',
      technicalTerms: [
        {
          term: '진피 (Dermis)',
          definition:
            '표피 아래층으로, 콜라겐, 엘라스틴, 히알루론산이 있어요. 피부 탄력과 구조를 담당해요.',
        },
        {
          term: '섬유아세포 (Fibroblast)',
          definition: '진피에서 콜라겐과 엘라스틴을 만드는 세포예요. 나이 들면 활동이 줄어들어요.',
        },
        {
          term: '당화 (Glycation)',
          definition:
            '단백질과 당이 결합하는 반응으로, 콜라겐을 뻣뻣하게 만들어 탄력을 떨어뜨려요.',
        },
        {
          term: 'ECM (세포외기질)',
          definition:
            'Extracellular Matrix의 약자로, 세포 사이를 채우는 구조물이에요. 콜라겐, 엘라스틴 등으로 구성돼요.',
        },
      ],
      reference: 'Exp Dermatol. 2024;33(2):e14892 "Skin Elasticity and Dermal Structure"',
    },
    solutions: {
      ingredients: [
        {
          name: '레티놀',
          benefit: '섬유아세포를 자극해 콜라겐 생성을 촉진해요',
        },
        {
          name: '펩타이드 (팔미토일 펜타펩타이드 등)',
          benefit: '콜라겐과 엘라스틴 합성을 촉진하는 시그널을 보내요',
        },
        {
          name: 'DMAE',
          benefit: '피부 긴장도를 높여 리프팅 효과를 줘요',
        },
        {
          name: '바쿠치올',
          benefit: '식물성 레티놀 대안으로, 자극 없이 탄력을 개선해요',
        },
      ],
      products: ['리프팅 세럼', '탄력 크림', '고농축 앰플', '마사지 오일'],
      lifestyle: [
        '단백질 충분히 섭취하기',
        '비타민 C 풍부한 과일 먹기',
        '얼굴 마사지로 혈액 순환 촉진',
        '적절한 운동 (유산소 + 근력)',
        '당분 섭취 줄이기 (당화 방지)',
      ],
    },
  },

  // ============================================
  // 6. 색소침착 (Pigmentation)
  // ============================================
  pigmentation: {
    metricId: 'pigmentation',
    simpleDescription: '기미, 잡티, 다크스팟 등 색소 불균형을 측정해요',
    detailedAnalysis: {
      measurementBasis: '멜라닌 분포의 균일도, 색소 병변의 크기와 개수 분석',
      normalRange: '균일한 피부 톤, 눈에 띄는 색소 병변 최소',
      userStatus: '',
      possibleCauses: [
        '자외선 노출 (광노화)',
        '호르몬 변화 (임신, 피임약)',
        '염증 후 색소침착 (여드름 자국)',
        '피부 손상/마찰',
        '유전적 요인',
        '특정 약물 복용',
      ],
    },
    scientificBackground: {
      explanation:
        '색소침착은 멜라닌이 과다 생성되어 피부에 축적된 상태예요. 멜라닌은 자외선으로부터 피부를 보호하는 역할을 하지만, 과하게 만들어지면 기미나 잡티로 나타나요. 자외선이 가장 큰 원인이고, 호르몬이나 염증도 멜라닌 생성을 자극해요. 예방이 치료보다 효과적이에요!',
      technicalTerms: [
        {
          term: '멜라닌 (Melanin)',
          definition:
            '피부, 머리카락의 색을 결정하는 색소예요. 자외선을 흡수해 피부를 보호하지만, 과다 생성되면 색소침착이 돼요.',
        },
        {
          term: '멜라노사이트 (Melanocyte)',
          definition:
            '멜라닌을 만드는 세포로, 표피 기저층에 위치해요. 자외선 등 자극을 받으면 활성화돼요.',
        },
        {
          term: '타이로시나제 (Tyrosinase)',
          definition:
            '멜라닌 합성의 핵심 효소예요. 이 효소를 억제하면 멜라닌 생성이 줄어들어요. 대부분의 미백 성분이 여기를 타깃으로 해요.',
        },
        {
          term: 'PIH (염증 후 색소침착)',
          definition:
            'Post-Inflammatory Hyperpigmentation의 약자로, 여드름, 상처 등 염증이 생긴 자리에 생기는 색소침착이에요.',
        },
      ],
      reference: 'Pigment Cell Melanoma Res. 2024;37(1):78-94 "Mechanisms of Hyperpigmentation"',
    },
    solutions: {
      ingredients: [
        {
          name: '비타민 C (아스코르브산)',
          benefit: '타이로시나제를 억제하고 멜라닌 산화를 막아 미백 효과를 줘요',
        },
        {
          name: '나이아신아마이드',
          benefit: '멜라닌이 피부 표면으로 이동하는 것을 막아 색소침착을 줄여요',
        },
        {
          name: '알부틴',
          benefit: '타이로시나제 활성을 억제해 멜라닌 생성을 줄여요',
        },
        {
          name: '트라넥삼산',
          benefit: '멜라노사이트 활성화를 막아 기미 개선에 효과적이에요',
        },
      ],
      products: [
        '미백 세럼 (비타민 C)',
        '브라이트닝 에센스',
        '선크림 (SPF 50+ PA++++)',
        '스팟 트리트먼트',
      ],
      lifestyle: [
        '자외선 차단제 철저히 바르기 (2시간마다 덧바름)',
        '모자, 선글라스 착용',
        '피부 자극 최소화 (마찰, 긁기 금지)',
        '여드름 압출 피하기',
        '비타민 C 풍부한 식품 섭취',
      ],
    },
  },

  // ============================================
  // 7. 트러블 (Trouble/Acne)
  // ============================================
  trouble: {
    metricId: 'trouble',
    simpleDescription: '여드름, 뾰루지 등 피부 트러블 상태를 측정해요',
    detailedAnalysis: {
      measurementBasis: '활성 여드름, 염증성 병변, 비염증성 병변의 수와 심각도 분석',
      normalRange: '활성 트러블 최소, 염증 없음',
      userStatus: '',
      possibleCauses: [
        '과다한 피지 분비',
        '모공 막힘 (각질, 메이크업)',
        '여드름균(C. acnes) 증식',
        '호르몬 불균형',
        '스트레스',
        '잘못된 스킨케어 제품 사용',
        '고당분/유제품 과다 섭취',
      ],
    },
    scientificBackground: {
      explanation:
        '여드름은 모공이 막히고, 피지가 쌓이고, 세균이 증식해서 염증이 생기는 과정으로 발생해요. 피지선이 과활성화되고, 각질이 제대로 탈락하지 않으면 모공이 막혀요. 거기에 여드름균이 피지를 먹고 자라면서 염증을 일으키는 거예요. 단계별로 면포 → 구진 → 농포 → 결절 순으로 심해져요.',
      technicalTerms: [
        {
          term: 'C. acnes (여드름균)',
          definition:
            'Cutibacterium acnes (구 P. acnes)의 약자로, 모공 속에 사는 세균이에요. 피지를 분해하면서 염증을 유발하는 물질을 만들어요.',
        },
        {
          term: '면포 (Comedo)',
          definition:
            '모공이 막혀 피지가 쌓인 상태예요. 열린 면포는 블랙헤드, 닫힌 면포는 화이트헤드라고 불러요.',
        },
        {
          term: '구진 (Papule)',
          definition: '붉고 솟아오른 염증성 여드름이에요. 고름이 보이지 않아요.',
        },
        {
          term: '농포 (Pustule)',
          definition: '고름이 찬 여드름이에요. 흔히 "노란 여드름"이라고 불러요.',
        },
        {
          term: '결절/낭종 (Nodule/Cyst)',
          definition: '피부 깊숙이 생기는 크고 아픈 여드름이에요. 흉터를 남기기 쉬워요.',
        },
      ],
      reference: 'J Am Acad Dermatol. 2024;90(2):256-270 "Pathophysiology of Acne Vulgaris"',
    },
    solutions: {
      ingredients: [
        {
          name: 'BHA (살리실산)',
          benefit: '모공 속으로 침투해 피지를 녹이고 항염 효과가 있어요',
        },
        {
          name: '벤조일 퍼옥사이드',
          benefit: '여드름균을 죽이는 강력한 항균 성분이에요',
        },
        {
          name: '티트리 오일',
          benefit: '천연 항균, 항염 성분으로 여드름균 증식을 억제해요',
        },
        {
          name: '나이아신아마이드',
          benefit: '피지 조절과 항염 효과로 여드름 예방에 도움을 줘요',
        },
        {
          name: '아젤라산',
          benefit: '각질 정상화, 항균, 항염 작용을 해요. 민감 피부에도 사용 가능해요',
        },
      ],
      products: ['BHA 토너/세럼', '스팟 트리트먼트', '저자극 클렌저', '논코메도제닉 보습제'],
      lifestyle: [
        '하루 2회 순한 클렌저로 세안',
        '베개 커버, 수건 자주 교체하기',
        '손으로 얼굴 만지지 않기',
        '여드름 짜지 않기 (흉터 방지)',
        '고당분 음식, 유제품 줄이기',
        '스트레스 관리하기',
      ],
    },
  },

  // ============================================
  // 8. 민감도 (Sensitivity)
  // ============================================
  sensitivity: {
    metricId: 'sensitivity',
    simpleDescription: '외부 자극에 대한 피부 반응 정도를 측정해요',
    detailedAnalysis: {
      measurementBasis: '홍조, 자극 반응, 피부 장벽 상태 분석',
      normalRange: '외부 자극에 과민 반응 없음',
      userStatus: '',
      possibleCauses: [
        '손상된 피부 장벽',
        '알레르기 반응',
        '강한 성분의 스킨케어 제품 사용',
        '환경적 자극 (추위, 바람, 오염)',
        '스트레스',
        '호르몬 변화',
      ],
    },
    scientificBackground: {
      explanation:
        '민감성 피부는 피부 장벽이 약해져 외부 자극이 쉽게 침투하는 상태예요. 세라마이드, 지방산, 콜레스테롤로 이루어진 피부 장벽이 손상되면 수분이 빠져나가고 자극물이 들어와서 염증 반응이 일어나요.',
      technicalTerms: [
        {
          term: '피부 장벽 (Skin Barrier)',
          definition: '피부의 가장 바깥층으로, 수분 손실을 막고 외부 자극으로부터 보호해요.',
        },
        {
          term: '세라마이드 (Ceramide)',
          definition: '피부 장벽을 구성하는 지질 성분으로, 수분 유지에 핵심적인 역할을 해요.',
        },
        {
          term: 'TEWL (경피 수분 손실)',
          definition: '피부를 통해 수분이 증발하는 정도를 나타내요. 민감 피부는 TEWL이 높아요.',
        },
      ],
      reference: 'J Eur Acad Dermatol Venereol. 2023;37(5):890-902 "Sensitive Skin Syndrome"',
    },
    solutions: {
      ingredients: [
        {
          name: '세라마이드',
          benefit: '피부 장벽을 복구하고 강화해요',
        },
        {
          name: '판테놀',
          benefit: '진정과 보습 효과로 피부를 안정시켜요',
        },
        {
          name: '알란토인',
          benefit: '자극받은 피부를 진정시키고 회복을 도와요',
        },
        {
          name: '센텔라 아시아티카',
          benefit: '항염 및 피부 재생 효과가 있어요',
        },
      ],
      products: ['저자극 클렌저', '세라마이드 크림', '진정 세럼', '무향료 보습제'],
      lifestyle: [
        '향료/알코올이 없는 제품 사용',
        '새 제품은 먼저 패치 테스트',
        '자극적인 성분(레티놀, AHA) 사용 주의',
        '극단적 온도 변화 피하기',
        '스트레스 관리',
      ],
    },
  },
};

/**
 * 지표 점수에 따른 상태 텍스트 생성
 * @param metricId 지표 ID
 * @param score 점수 (0-100)
 * @returns 상태 텍스트 (예: "당신의 상태: 약간 건조함 (58%)")
 */
export function generateUserStatus(metricId: SkinMetricId, score: number): string {
  const thresholds = {
    hydration: {
      good: '촉촉하고 건강해요',
      normal: '약간 건조해요',
      warning: '수분이 많이 부족해요',
    },
    oil: {
      good: '피지 밸런스가 좋아요',
      normal: '약간 번들거려요',
      warning: '피지 분비가 과다해요',
    },
    pores: {
      good: '모공이 깨끗해요',
      normal: '모공이 약간 눈에 띄어요',
      warning: '모공이 확장되어 있어요',
    },
    wrinkles: {
      good: '주름이 거의 없어요',
      normal: '잔주름이 약간 있어요',
      warning: '주름 관리가 필요해요',
    },
    elasticity: {
      good: '피부가 탱탱해요',
      normal: '탄력이 약간 떨어져요',
      warning: '탄력 개선이 필요해요',
    },
    pigmentation: {
      good: '피부 톤이 균일해요',
      normal: '약간의 색소침착이 있어요',
      warning: '색소침착 관리가 필요해요',
    },
    trouble: {
      good: '트러블 없이 깨끗해요',
      normal: '가벼운 트러블이 있어요',
      warning: '트러블 집중 케어가 필요해요',
    },
    sensitivity: {
      good: '피부가 건강하고 안정적이에요',
      normal: '약간 민감한 편이에요',
      warning: '피부가 예민해요',
    },
  };

  const statusKey = score >= 71 ? 'good' : score >= 41 ? 'normal' : 'warning';
  const statusText = thresholds[metricId][statusKey];

  return `당신의 상태: ${statusText} (${score}점)`;
}

/**
 * 지표 ID로 전체 설명 데이터 가져오기
 * @param metricId 지표 ID
 * @param score 점수
 * @returns MetricDetailedExplanation (점수/상태 포함)
 */
export function getMetricExplanation(
  metricId: SkinMetricId,
  score: number
): MetricExplanationTemplate & { score: number; status: 'good' | 'normal' | 'warning' } {
  const template = METRIC_EXPLANATIONS[metricId];
  const status = score >= 71 ? 'good' : score >= 41 ? 'normal' : 'warning';

  return {
    ...template,
    score,
    status,
    detailedAnalysis: {
      ...template.detailedAnalysis,
      userStatus: generateUserStatus(metricId, score),
    },
  };
}

/**
 * 모든 지표 ID 목록
 */
export const ALL_METRIC_IDS: SkinMetricId[] = [
  'hydration',
  'oil',
  'pores',
  'wrinkles',
  'elasticity',
  'pigmentation',
  'trouble',
];
