/**
 * AI 코치 모듈 테스트
 */

import {
  CoachMessage,
  QUICK_QUESTIONS,
  getMockResponse,
} from '../../lib/coach';

describe('CoachMessage', () => {
  it('메시지 구조가 올바라야 함', () => {
    const message: CoachMessage = {
      id: 'msg-123',
      role: 'user',
      content: '오늘 운동 뭐하면 좋을까?',
      timestamp: new Date(),
    };

    expect(message.id).toBeDefined();
    expect(message.role).toBe('user');
    expect(message.content).toBeTruthy();
    expect(message.timestamp).toBeInstanceOf(Date);
  });

  it('assistant 역할 메시지가 올바라야 함', () => {
    const message: CoachMessage = {
      id: 'msg-456',
      role: 'assistant',
      content: '오늘은 유산소 운동을 추천드려요!',
      timestamp: new Date(),
    };

    expect(message.role).toBe('assistant');
  });
});

describe('QUICK_QUESTIONS', () => {
  it('모든 카테고리가 존재해야 함', () => {
    expect(QUICK_QUESTIONS.general).toBeDefined();
    expect(QUICK_QUESTIONS.workout).toBeDefined();
    expect(QUICK_QUESTIONS.nutrition).toBeDefined();
    expect(QUICK_QUESTIONS.skin).toBeDefined();
  });

  it('각 카테고리에 질문이 있어야 함', () => {
    expect(QUICK_QUESTIONS.general.length).toBeGreaterThan(0);
    expect(QUICK_QUESTIONS.workout.length).toBeGreaterThan(0);
    expect(QUICK_QUESTIONS.nutrition.length).toBeGreaterThan(0);
    expect(QUICK_QUESTIONS.skin.length).toBeGreaterThan(0);
  });

  it('질문이 문자열이어야 함', () => {
    QUICK_QUESTIONS.general.forEach((q) => {
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(0);
    });
  });
});

describe('getMockResponse', () => {
  it('운동 관련 질문에 운동 응답을 반환해야 함', () => {
    const response = getMockResponse('오늘 운동 뭐하면 좋을까?');
    expect(response.message).toContain('운동');
    expect(response.suggestedQuestions).toBeDefined();
    expect(response.suggestedQuestions?.length).toBeGreaterThan(0);
  });

  it('영양 관련 질문에 영양 응답을 반환해야 함', () => {
    const response = getMockResponse('다이어트 음식 추천해줘');
    expect(response.message).toContain('영양');
  });

  it('피부 관련 질문에 피부 응답을 반환해야 함', () => {
    const response = getMockResponse('스킨케어 루틴 알려줘');
    expect(response.message).toContain('피부');
  });

  it('기타 질문에 기본 응답을 반환해야 함', () => {
    const response = getMockResponse('안녕하세요');
    expect(response.message).toBeTruthy();
    expect(response.suggestedQuestions).toBeDefined();
  });
});
