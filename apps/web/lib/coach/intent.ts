import { isFeatureEnabled } from '@yiroom/shared';

export type QuestionCategory =
  | 'workout'
  | 'nutrition'
  | 'skin'
  | 'personalColor'
  | 'fashion'
  | 'hair'
  | 'makeup'
  | 'default';

// 한국어 조사는 허용하되 단어 내부의 '입', '먹' 같은 글자로 도메인을 추론하지 않는다.
function hasTerm(text: string, terms: string[]): boolean {
  return terms.some((term) =>
    new RegExp(
      `(?:^|[^가-힣a-z])${term}(?:$|[^가-힣a-z]|은|는|이|가|을|를|에|의|도|과|와|하고|으로|에서|부터|보다|만|인데|면)`,
      'iu'
    ).test(text)
  );
}

const SKIN_TERMS = [
  '피부',
  '화장품',
  '스킨케어',
  '보습',
  '트러블',
  '여드름',
  '좁쌀',
  '건조',
  '건조하고',
  '지성',
  '민감',
  '주름',
  '모공',
  '홍조',
  '각질',
  '잡티',
  '기미',
  '다크서클',
  '탄력',
  '미백',
  '루틴',
  '클렌징',
  '세안',
  '토너',
  '세럼',
  '크림',
  '선크림',
  '로션',
  '레티놀',
  '살리실산',
  '나이아신',
  '히알루론',
  '세라마이드',
  'aha',
  'bha',
  '면도',
  '광과민',
  'led',
];

export function detectQuestionCategory(question: string): QuestionCategory {
  const text = question.normalize('NFKC').toLowerCase();
  // 피부 문맥이 명시되면 '타입/약 먹는데' 같은 표현보다 우선한다.
  if (hasTerm(text, SKIN_TERMS)) return 'skin';
  if (
    hasTerm(text, ['퍼스널컬러', '퍼스널 컬러', '웜톤', '쿨톤', '시즌', '어울리는 색', '색 조합'])
  )
    return 'personalColor';
  if (
    hasTerm(text, [
      '옷',
      '코디',
      '패션',
      '옷장',
      '상의',
      '하의',
      '아우터',
      '면접룩',
      '데이트룩',
      '출근룩',
    ]) ||
    /(?:^|\s)뭐(?:를)?\s+입[을어지]/u.test(text)
  )
    return 'fashion';
  if (hasTerm(text, ['헤어', '머리', '두피', '탈모', '비듬', '모발', '샴푸', '염색', '펌']))
    return 'hair';
  if (
    hasTerm(text, [
      '메이크업',
      '화장',
      '립',
      '립스틱',
      '틴트',
      '파운데이션',
      '쿠션',
      '아이섀도',
      '블러셔',
      '눈썹',
    ])
  )
    return 'makeup';
  if (hasTerm(text, ['운동', '헬스', '근육', '스트레칭', '홈트', '스쿼트', '요가', '필라테스']))
    return 'workout';
  if (
    hasTerm(text, [
      '영양',
      '식단',
      '음식',
      '칼로리',
      '다이어트',
      '단백질',
      '레시피',
      '요리',
      '간식',
      '영양제',
    ])
  )
    return 'nutrition';
  return 'default';
}

/** 숨김 모듈은 요청뿐 아니라 모델 본문과 후속 질문에도 같은 서버 정책을 적용한다. */
/**
 * 숨김 모듈(W-1 운동·N-1 영양·자세·날씨/피드/배지)에만 속하는 어휘.
 * 뷰티 상담에서는 거의 쓰이지 않으므로 단독으로도 차단 근거가 된다.
 */
const HIDDEN_MODULE_TERMS = [
  '운동',
  '헬스',
  '스트레칭',
  '홈트',
  '스쿼트',
  '요가',
  '필라테스',
  '러닝',
  '유산소',
  '다이어트',
  '칼로리',
  '영양제',
  '배지',
  'ダイエット',
  '運動',
  '減量',
  '减肥',
  '运动',
];

/**
 * 숨김 모듈과 스킨케어 상담이 함께 쓰는 어휘.
 * "수면 부족하면 다크서클이 생기나요", "땀 흘린 뒤 선크림", "식단이 피부에 영향을 주나요"처럼
 * 정당한 피부 질문에 그대로 등장하므로, **이 단어들만으로는 차단하지 않는다**.
 * (과거에는 이 목록이 숨김 어휘와 섞여 있어 정상 뷰티 질문이 범위 안내로 반려됐다.)
 */
const SHARED_WELLNESS_TERMS = ['식단', '단백질', '간식', '수면', '날씨', '食事', '饮食'];

/** 숨김 모듈 어휘가 들어 있는지 — 뷰티 문맥 판정과 함께 써야 한다. */
export function hasHiddenModuleTerm(text: string): boolean {
  if (isFeatureEnabled('WELLNESS_PHASE2')) return false;
  return (
    hasTerm(text, HIDDEN_MODULE_TERMS) ||
    /자세\s*교정/u.test(text) ||
    /\b(?:workout|nutrition|calories|exercise)\b/iu.test(text)
  );
}

/** 영어 뷰티 어휘 — 정규식 하나로 몰면 복잡도가 커져 단어 목록으로 둔다. */
const ENGLISH_BEAUTY_WORDS = [
  'skin',
  'skincare',
  'sunscreen',
  'spf',
  'moisturizer',
  'moisturiser',
  'cleanser',
  'toner',
  'serum',
  'retinol',
  'acne',
  'pore',
  'pores',
  'makeup',
  'lipstick',
  'foundation',
  'hair',
  'scalp',
  'shampoo',
  'outfit',
  'wardrobe',
];

function hasEnglishBeautyWord(text: string): boolean {
  const words = text.toLowerCase().match(/[a-z]+/gu) ?? [];
  if (words.some((word) => ENGLISH_BEAUTY_WORDS.includes(word))) return true;
  return /personal\s+colou?r/iu.test(text);
}

/**
 * 뷰티 5축 어휘가 하나라도 있는지. 분류기의 '승자' 대신 신호 유무를 본다.
 * "운동하고 나서 모공이 넓어졌어요"처럼 두 영역 어휘가 함께 오는 질문을
 * 숨김 모듈로 오인해 반려하지 않기 위한 판정이다.
 */
/** 뷰티 밖에서도 흔히 쓰여 단독으로는 뷰티 근거가 되지 못하는 어휘. */
const AMBIGUOUS_BEAUTY_TERMS = new Set(['루틴', '머리', '크림', '건조']);

function hasBeautySignal(text: string, options?: { strict?: boolean }): boolean {
  const skinTerms = options?.strict
    ? SKIN_TERMS.filter((term) => !AMBIGUOUS_BEAUTY_TERMS.has(term))
    : SKIN_TERMS;
  return (
    hasTerm(text, skinTerms) ||
    hasTerm(text, [
      '퍼스널컬러',
      '퍼스널 컬러',
      '웜톤',
      '쿨톤',
      '시즌',
      '어울리는 색',
      '색 조합',
    ]) ||
    hasTerm(text, [
      '옷',
      '코디',
      '패션',
      '옷장',
      '상의',
      '하의',
      '아우터',
      '면접룩',
      '데이트룩',
      '출근룩',
    ]) ||
    hasTerm(text, ['헤어', '머리', '두피', '탈모', '비듬', '모발', '샴푸', '염색', '펌']) ||
    hasTerm(text, [
      '메이크업',
      '화장',
      '립',
      '립스틱',
      '틴트',
      '파운데이션',
      '쿠션',
      '아이섀도',
      '블러셔',
      '눈썹',
    ]) ||
    hasEnglishBeautyWord(text)
  );
}

/**
 * 요청·응답이 숨김 모듈(W-1 운동·N-1 영양·자세·날씨/피드/배지) 영역인지 판정한다.
 * 뷰티 신호가 하나라도 있으면 통과시킨다 — 뷰티 상담은 수면·식단·땀을 정상적으로 언급한다.
 * (과거에는 이 판정이 어휘 존재만 봐서 "운동 후 세안", "식단이 피부에 영향 줘요?" 같은
 *  정당한 질문까지 범위 안내로 반려했다.)
 */
export function isHiddenCoachContent(text: string): boolean {
  if (isFeatureEnabled('WELLNESS_PHASE2')) return false;

  // 1) 확실한 뷰티 어휘가 있으면 통과 — 숨김 어휘가 섞여 있어도 뷰티 상담이다.
  if (hasBeautySignal(text, { strict: true })) return false;
  // 2) 숨김 모듈 전용 어휘는 차단 — "운동 루틴"의 '루틴'처럼 모호한 뷰티 어휘보다 우선한다.
  if (hasHiddenModuleTerm(text)) return true;
  // 3) 모호한 뷰티 어휘만 있으면 뷰티로 본다.
  if (hasBeautySignal(text)) return false;

  return (
    hasTerm(text, SHARED_WELLNESS_TERMS) ||
    /수분\s*섭취|물\s*얼마/u.test(text) ||
    /\b(?:diet|sleep)\b/iu.test(text)
  );
}
