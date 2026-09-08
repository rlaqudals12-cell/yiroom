import { describe, expect, it } from 'vitest';

import { detectQuestionCategory, isHiddenCoachContent } from '@/lib/coach/intent';

/**
 * 숨김 모듈(W-1 운동·N-1 영양·자세·날씨/피드/배지) 범위 가드의 경계 고정.
 *
 * 왜 필요한가: 이 가드는 코치 요청과 모델 응답 양쪽에 걸리고, 걸리면 답변 전체가
 * 범위 안내로 대체된다. 어휘 존재만 보던 시절에는 "운동 후 세안", "식단이 피부에
 * 영향 줘요?" 같은 **정당한 뷰티 질문이 통째로 반려**됐다. 뷰티 상담은 수면·식단·땀·날씨를
 * 정상적으로 언급하므로, 뷰티 신호가 있으면 통과시키고 숨김 전용 어휘만 차단해야 한다.
 */

const ALLOWED = [
  '식단이 피부에 영향 줘요?',
  '다이어트 하면서 피부가 푸석해요',
  '수면 부족하면 다크서클 생기나요?',
  '운동하고 나서 모공이 넓어진 것 같아요',
  '간식 먹고 여드름 났어요',
  '날씨 추운데 보습 어떻게 해요?',
  '땀 많이 흘리면 선크림 다시 발라야 해요?',
  '단백질 먹으면 피부 좋아지나요?',
  '피부 타입이 뭐야',
  '내일 뭐 입을까',
  '탈모 때문에 샴푸 바꿔야 할까요?',
  'Which sunscreen for oily skin after exercise?',
  'Does sleep affect my skin?',
];

const BLOCKED = [
  '운동 루틴 짜줘',
  '홈트 추천해줘',
  '오늘 칼로리 얼마나 먹어야 해?',
  '영양제 뭐 먹을까?',
  '물 얼마나 마셔야 해?',
  '스쿼트 자세 알려줘',
  '자세 교정 어떻게 해?',
  'What should I eat for my diet?',
  'Give me a workout plan',
];

describe('코치 숨김 범위 가드', () => {
  it.each(ALLOWED)('뷰티 질문은 통과한다: %s', (question) => {
    expect(isHiddenCoachContent(question)).toBe(false);
  });

  it.each(BLOCKED)('숨김 모듈 요청은 차단한다: %s', (question) => {
    expect(isHiddenCoachContent(question)).toBe(true);
  });

  it('뷰티 어휘가 섞인 숨김 요청은 뷰티 문맥을 우선한다', () => {
    // '운동'이 들어가도 피부 신호(모공)가 있으면 상담을 이어간다.
    expect(detectQuestionCategory('운동하고 나서 모공이 넓어진 것 같아요')).toBe('skin');
    expect(isHiddenCoachContent('운동하고 나서 모공이 넓어진 것 같아요')).toBe(false);

    // 반대로 '루틴'만 겹치는 운동 요청은 차단한다.
    expect(isHiddenCoachContent('운동 루틴 짜줘')).toBe(true);
  });

  it('모델 응답에 정상적으로 등장하는 어휘로 답변을 폐기하지 않는다', () => {
    const answer =
      '건성 피부는 세라마이드 크림으로 보습하고, 충분한 수면을 취하면 도움이 돼요. ' +
      '자외선 차단제는 2~3시간마다 덧발라 주세요.';

    expect(isHiddenCoachContent(answer)).toBe(false);
  });
});
