/**
 * AI 웰니스 코치 프롬프트
 * @description 사용자 맞춤 웰니스 조언을 위한 프롬프트 템플릿
 */

import type { UserContext } from './context';

/**
 * 코치 시스템 프롬프트 생성
 */
export function buildCoachSystemPrompt(userContext: UserContext | null): string {
  const contextSection = userContext ? buildUserContextSection(userContext) : '';

  return `당신은 이룸(Yiroom)의 AI 웰니스 코치입니다. 사용자의 건강, 운동, 영양, 피부 관리에 대한 질문에 친절하고 전문적으로 답변합니다.

## 역할
- 운동, 영양, 피부 관리에 대한 맞춤형 조언 제공
- 사용자의 분석 결과와 기록을 바탕으로 개인화된 추천
- 과학적 근거를 바탕으로 하되 쉽게 설명
- 의료적 진단이나 처방은 피하고 전문가 상담 권유

## 응답 가이드라인
1. 한국어로 자연스럽고 친근하게 대화
2. 200자 이내로 간결하게 핵심만 전달
3. 실천 가능한 구체적인 조언 제공
4. 불확실한 내용은 솔직하게 "확실하지 않아요"라고 표현
5. 이모지는 최소한으로 사용 (답변당 1-2개)

${contextSection}

## 주의사항
- 의료적 조언, 약물 복용 관련 질문은 "전문의와 상담하세요"로 안내
- 극단적인 다이어트나 위험한 운동 방법은 권장하지 않음
- 개인정보 보호를 위해 민감한 정보는 저장하지 않음
`;
}

/**
 * 사용자 컨텍스트 섹션 생성
 */
function buildUserContextSection(context: UserContext): string {
  const sections: string[] = ['## 사용자 정보'];

  // 퍼스널 컬러
  if (context.personalColor) {
    sections.push(`- 퍼스널 컬러: ${context.personalColor.season} (${context.personalColor.tone || '기본톤'})`);
  }

  // 피부 분석
  if (context.skinAnalysis) {
    sections.push(`- 피부 타입: ${context.skinAnalysis.skinType}`);
    if (context.skinAnalysis.concerns?.length) {
      sections.push(`- 피부 고민: ${context.skinAnalysis.concerns.join(', ')}`);
    }
  }

  // 체형 분석
  if (context.bodyAnalysis) {
    sections.push(`- 체형: ${context.bodyAnalysis.bodyType}`);
    if (context.bodyAnalysis.bmi) {
      sections.push(`- BMI: ${context.bodyAnalysis.bmi.toFixed(1)}`);
    }
  }

  // 운동 정보
  if (context.workout) {
    if (context.workout.workoutType) {
      sections.push(`- 운동 타입: ${context.workout.workoutType}`);
    }
    if (context.workout.goal) {
      sections.push(`- 운동 목표: ${context.workout.goal}`);
    }
    if (context.workout.streak !== undefined) {
      sections.push(`- 운동 연속 기록: ${context.workout.streak}일`);
    }
  }

  // 영양 정보
  if (context.nutrition) {
    if (context.nutrition.goal) {
      sections.push(`- 영양 목표: ${context.nutrition.goal}`);
    }
    if (context.nutrition.targetCalories) {
      sections.push(`- 목표 칼로리: ${context.nutrition.targetCalories}kcal`);
    }
    if (context.nutrition.streak !== undefined) {
      sections.push(`- 식단 연속 기록: ${context.nutrition.streak}일`);
    }
  }

  // 최근 활동
  if (context.recentActivity) {
    sections.push('');
    sections.push('## 최근 활동');
    if (context.recentActivity.todayWorkout) {
      sections.push(`- 오늘 운동: ${context.recentActivity.todayWorkout}`);
    }
    if (context.recentActivity.todayCalories !== undefined) {
      sections.push(`- 오늘 섭취 칼로리: ${context.recentActivity.todayCalories}kcal`);
    }
    if (context.recentActivity.waterIntake !== undefined) {
      sections.push(`- 오늘 수분 섭취: ${context.recentActivity.waterIntake}ml`);
    }
  }

  return sections.join('\n');
}

/**
 * 질문별 특화 프롬프트 힌트 생성
 */
export function getQuestionHint(question: string): string {
  const lowerQ = question.toLowerCase();

  // 운동 관련
  if (lowerQ.includes('운동') || lowerQ.includes('헬스') || lowerQ.includes('트레이닝')) {
    return '운동 관련 질문입니다. 사용자의 체형과 운동 목표를 고려해 답변하세요.';
  }

  // 영양/식단 관련
  if (lowerQ.includes('먹') || lowerQ.includes('음식') || lowerQ.includes('칼로리') || lowerQ.includes('다이어트')) {
    return '영양/식단 관련 질문입니다. 사용자의 목표 칼로리와 영양 목표를 참고하세요.';
  }

  // 피부 관련
  if (lowerQ.includes('피부') || lowerQ.includes('화장품') || lowerQ.includes('스킨케어')) {
    return '피부 관련 질문입니다. 사용자의 피부 타입과 고민을 고려해 답변하세요.';
  }

  // 제품 추천
  if (lowerQ.includes('추천') || lowerQ.includes('어떤')) {
    return '추천 질문입니다. 구체적이고 실행 가능한 제안을 해주세요.';
  }

  return '';
}

/**
 * 빠른 질문 템플릿
 */
export const QUICK_QUESTIONS = [
  '오늘 운동 뭐하면 좋을까요?',
  '다이어트할 때 간식 뭐 먹어요?',
  '아침에 일어나면 뭐부터 해야 해요?',
  '물은 하루에 얼마나 마셔야 해요?',
  '운동 후에 뭘 먹어야 효과적이에요?',
  '피부가 건조할 때 어떻게 해요?',
];

/**
 * 카테고리별 빠른 질문
 */
export const QUICK_QUESTIONS_BY_CATEGORY = {
  workout: [
    '오늘 운동 뭐하면 좋을까요?',
    '근육통이 있는데 운동해도 돼요?',
    '집에서 할 수 있는 운동 추천해요',
    '살 빼려면 유산소? 근력?',
  ],
  nutrition: [
    '다이어트할 때 간식 뭐 먹어요?',
    '운동 후에 뭘 먹어야 효과적이에요?',
    '단백질 얼마나 먹어야 해요?',
    '야식이 당길 땐 어떡해요?',
  ],
  skin: [
    '피부가 건조할 때 어떻게 해요?',
    '트러블이 났는데 어떻게 해요?',
    '선크림 꼭 발라야 해요?',
    '제 피부에 맞는 루틴 알려줘요',
  ],
  general: [
    '물은 하루에 얼마나 마셔야 해요?',
    '수면이 건강에 얼마나 중요해요?',
    '스트레스 관리는 어떻게 해요?',
    '건강한 습관 만들려면 어떻게 해요?',
  ],
};
