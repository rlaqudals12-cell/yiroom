/**
 * AI 코치 프롬프트 테스트
 *
 * @module tests/lib/coach/prompts
 * @description 프롬프트 빌더 함수 및 질문 힌트 검증
 */

import { describe, it, expect } from 'vitest';
import {
  buildCoachSystemPrompt,
  getQuestionHint,
  QUICK_QUESTIONS,
  QUICK_QUESTIONS_BY_CATEGORY,
} from '@/lib/coach/prompts';
import type { UserContext } from '@/lib/coach/types';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockFullContext: UserContext = {
  personalColor: {
    season: '봄 웜톤',
    tone: 'bright',
  },
  skinAnalysis: {
    skinType: '복합성',
    concerns: ['모공', '피지'],
    scores: {
      moisture: 65,
      oil: 70,
      sensitivity: 30,
    },
    recentCondition: 3.5,
    routineCompletionRate: {
      morning: 80,
      evening: 60,
    },
    recentFactors: {
      avgSleep: 7.2,
      avgWater: 1500,
      avgStress: 2.5,
    },
  },
  bodyAnalysis: {
    bodyType: '직사각형',
    bmi: 22.5,
    height: 170,
    weight: 65,
  },
  hairAnalysis: {
    hairType: '직모',
    scalpType: '지성',
    overallScore: 75,
    concerns: ['탈모', '비듬'],
  },
  makeupAnalysis: {
    undertone: '웜톤',
    faceShape: '계란형',
    eyeShape: '쌍꺼풀',
    overallScore: 80,
    recommendedStyles: ['내추럴', '코랄'],
  },
  workout: {
    workoutType: '근력 운동',
    goal: '근육 증가',
    frequency: 4,
    streak: 15,
  },
  nutrition: {
    goal: '벌크업',
    targetCalories: 2500,
    streak: 10,
  },
  recentActivity: {
    todayWorkout: '스쿼트 (30분)',
    todayCalories: 1800,
    waterIntake: 1200,
  },
};

// =============================================================================
// 테스트
// =============================================================================

describe('lib/coach/prompts', () => {
  // ---------------------------------------------------------------------------
  // buildCoachSystemPrompt
  // ---------------------------------------------------------------------------

  describe('buildCoachSystemPrompt', () => {
    it('should include base system prompt', () => {
      const prompt = buildCoachSystemPrompt(null);

      expect(prompt).toContain('이룸(Yiroom)의 AI 웰니스 코치');
      expect(prompt).toContain('역할');
      expect(prompt).toContain('응답 가이드라인');
      expect(prompt).toContain('주의사항');
    });

    it('should include 200자 이내 guideline', () => {
      const prompt = buildCoachSystemPrompt(null);

      expect(prompt).toContain('200자 이내');
    });

    it('should include medical disclaimer', () => {
      const prompt = buildCoachSystemPrompt(null);

      expect(prompt).toContain('전문의와 상담');
    });

    it('should return prompt without user section when context is null', () => {
      const prompt = buildCoachSystemPrompt(null);

      expect(prompt).not.toContain('## 사용자 정보');
    });

    it('should include personal color info', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('퍼스널 컬러');
      expect(prompt).toContain('봄 웜톤');
      expect(prompt).toContain('bright');
    });

    it('should include skin analysis info', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('피부 타입');
      expect(prompt).toContain('복합성');
      expect(prompt).toContain('피부 고민');
      expect(prompt).toContain('모공');
    });

    it('should include skin diary data (Phase D)', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('최근 7일 피부 컨디션');
      expect(prompt).toContain('3.5/5점');
      expect(prompt).toContain('루틴 완료율');
      expect(prompt).toContain('아침 80%');
      expect(prompt).toContain('저녁 60%');
    });

    it('should include recent lifestyle factors', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('최근 생활 요인');
      expect(prompt).toContain('수면 7.2시간');
      expect(prompt).toContain('수분 1500ml');
      expect(prompt).toContain('스트레스 2.5/5');
    });

    it('should include body analysis info', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('체형');
      expect(prompt).toContain('직사각형');
      expect(prompt).toContain('BMI');
      expect(prompt).toContain('22.5');
    });

    it('should include hair analysis info', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('헤어 타입');
      expect(prompt).toContain('직모');
      expect(prompt).toContain('두피 타입');
      expect(prompt).toContain('지성');
      expect(prompt).toContain('헤어 고민');
      expect(prompt).toContain('탈모');
    });

    it('should include makeup analysis info', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('언더톤');
      expect(prompt).toContain('웜톤');
      expect(prompt).toContain('얼굴형');
      expect(prompt).toContain('계란형');
      expect(prompt).toContain('눈 모양');
      expect(prompt).toContain('쌍꺼풀');
      expect(prompt).toContain('추천 스타일');
      expect(prompt).toContain('내추럴');
    });

    it('should include workout info', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('운동 타입');
      expect(prompt).toContain('근력 운동');
      expect(prompt).toContain('운동 목표');
      expect(prompt).toContain('근육 증가');
      expect(prompt).toContain('운동 연속 기록');
      expect(prompt).toContain('15일');
    });

    it('should include nutrition info', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('영양 목표');
      expect(prompt).toContain('벌크업');
      expect(prompt).toContain('목표 칼로리');
      expect(prompt).toContain('2500kcal');
      expect(prompt).toContain('식단 연속 기록');
      expect(prompt).toContain('10일');
    });

    it('should include recent activity section', () => {
      const prompt = buildCoachSystemPrompt(mockFullContext);

      expect(prompt).toContain('## 최근 활동');
      expect(prompt).toContain('오늘 운동');
      expect(prompt).toContain('스쿼트 (30분)');
      expect(prompt).toContain('오늘 섭취 칼로리');
      expect(prompt).toContain('1800kcal');
      expect(prompt).toContain('오늘 수분 섭취');
      expect(prompt).toContain('1200ml');
    });

    it('should handle partial context (skin only)', () => {
      const partialContext: UserContext = {
        skinAnalysis: {
          skinType: '건성',
        },
      };

      const prompt = buildCoachSystemPrompt(partialContext);

      expect(prompt).toContain('피부 타입');
      expect(prompt).toContain('건성');
      expect(prompt).not.toContain('퍼스널 컬러');
      expect(prompt).not.toContain('체형');
    });

    it('should handle empty concerns array', () => {
      const contextWithEmptyConcerns: UserContext = {
        skinAnalysis: {
          skinType: '정상',
          concerns: [],
        },
      };

      const prompt = buildCoachSystemPrompt(contextWithEmptyConcerns);

      expect(prompt).toContain('피부 타입');
      expect(prompt).not.toContain('피부 고민');
    });
  });

  // ---------------------------------------------------------------------------
  // getQuestionHint
  // ---------------------------------------------------------------------------

  describe('getQuestionHint', () => {
    it('should return workout hint for exercise questions', () => {
      const questions = [
        '오늘 운동 뭐하면 좋을까요?',
        '헬스장에서 뭐할까요?',
        '트레이닝 방법 알려줘',
      ];

      questions.forEach((q) => {
        const hint = getQuestionHint(q);
        expect(hint).toContain('운동');
        expect(hint).toContain('체형');
      });
    });

    it('should return nutrition hint for food questions', () => {
      const questions = [
        '다이어트할 때 뭐 먹어요?',
        '맛있는 음식 추천해줘',
        '칼로리 낮은 간식 뭐가 있어요?',
      ];

      questions.forEach((q) => {
        const hint = getQuestionHint(q);
        expect(hint).toContain('영양');
        expect(hint).toContain('칼로리');
      });
    });

    it('should return skin hint for skincare questions', () => {
      const questions = ['피부가 건조해요', '화장품 추천해줘', '스킨케어 루틴 알려줘'];

      questions.forEach((q) => {
        const hint = getQuestionHint(q);
        expect(hint).toContain('피부');
      });
    });

    it('should return hair hint for hair questions', () => {
      const questions = [
        '머리가 빠져요',
        '헤어 스타일 추천해줘',
        '두피가 가려워요',
        '탈모 예방법 알려줘',
      ];

      questions.forEach((q) => {
        const hint = getQuestionHint(q);
        expect(hint).toContain('헤어');
      });
    });

    it('should return makeup hint for makeup questions', () => {
      const questions = [
        '메이크업 팁 알려줘',
        '화장법 추천해줘',
        '립스틱 색상 추천해줘',
        '아이섀도 조합 알려줘',
      ];

      questions.forEach((q) => {
        const hint = getQuestionHint(q);
        expect(hint).toContain('메이크업');
      });
    });

    it('should return personal color hint for color questions', () => {
      // 메이크업 키워드가 포함되지 않은 순수 퍼스널컬러 질문만 테스트
      // (메이크업 키워드가 먼저 매칭되면 메이크업 힌트 반환)
      const questions = [
        '내 퍼스널컬러에 맞는 색',
        '퍼스널 컬러 알고 싶어요',
        '웜톤인데 어울리는 색',
        '내 시즌에 맞는 옷',
        '어울리는 색 추천해줘',
      ];

      questions.forEach((q) => {
        const hint = getQuestionHint(q);
        expect(hint).toContain('퍼스널 컬러');
      });
    });

    it('should return makeup hint when question contains both makeup and color keywords', () => {
      // 메이크업 키워드가 먼저 매칭됨
      const hint = getQuestionHint('쿨톤 메이크업');
      expect(hint).toContain('메이크업');
    });

    it('should return fashion hint for clothing questions', () => {
      const questions = [
        '옷 추천해줘',
        '코디 조합 알려줘',
        '스타일 추천해줘',
        '오늘 뭐 입을까',
        '패션 조언해줘',
      ];

      questions.forEach((q) => {
        const hint = getQuestionHint(q);
        expect(hint).toContain('패션');
      });
    });

    it('should return recommendation hint for general recommendations', () => {
      const hint1 = getQuestionHint('추천해줘');
      const hint2 = getQuestionHint('어떤 게 좋아요?');

      expect(hint1).toContain('추천');
      expect(hint2).toContain('추천');
    });

    it('should return empty string for unmatched questions', () => {
      const hint = getQuestionHint('안녕하세요');

      expect(hint).toBe('');
    });

    it('should be case insensitive', () => {
      const hint1 = getQuestionHint('운동');
      const hint2 = getQuestionHint('WORKOUT'); // English would not match in Korean context

      expect(hint1).toContain('운동');
      // English 'WORKOUT' won't match Korean keywords
      expect(hint2).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  describe('QUICK_QUESTIONS', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(QUICK_QUESTIONS)).toBe(true);
      expect(QUICK_QUESTIONS.length).toBeGreaterThan(0);
      QUICK_QUESTIONS.forEach((q) => {
        expect(typeof q).toBe('string');
      });
    });

    it('should contain common wellness questions', () => {
      const allQuestions = QUICK_QUESTIONS.join(' ');

      expect(allQuestions).toContain('운동');
      expect(allQuestions).toContain('다이어트');
      expect(allQuestions).toContain('물');
    });
  });

  describe('QUICK_QUESTIONS_BY_CATEGORY', () => {
    it('should have all expected categories', () => {
      const expectedCategories = [
        'workout',
        'nutrition',
        'skin',
        'hair',
        'makeup',
        'general',
        'personalColor',
        'fashion',
      ];

      expectedCategories.forEach((cat) => {
        expect(QUICK_QUESTIONS_BY_CATEGORY).toHaveProperty(cat);
        expect(
          Array.isArray(
            QUICK_QUESTIONS_BY_CATEGORY[cat as keyof typeof QUICK_QUESTIONS_BY_CATEGORY]
          )
        ).toBe(true);
      });
    });

    it('should have at least 3 questions per category', () => {
      Object.entries(QUICK_QUESTIONS_BY_CATEGORY).forEach(([, questions]) => {
        expect(questions.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have workout questions about exercise', () => {
      const workoutQuestions = QUICK_QUESTIONS_BY_CATEGORY.workout.join(' ');

      expect(workoutQuestions).toContain('운동');
    });

    it('should have nutrition questions about food', () => {
      const nutritionQuestions = QUICK_QUESTIONS_BY_CATEGORY.nutrition.join(' ');

      expect(nutritionQuestions).toContain('먹');
    });

    it('should have skin questions about skincare', () => {
      const skinQuestions = QUICK_QUESTIONS_BY_CATEGORY.skin.join(' ');

      expect(skinQuestions).toContain('피부');
    });

    it('should have personal color questions (Phase K)', () => {
      const pcQuestions = QUICK_QUESTIONS_BY_CATEGORY.personalColor.join(' ');

      expect(pcQuestions).toContain('퍼스널컬러');
    });

    it('should have fashion questions (Phase K)', () => {
      const fashionQuestions = QUICK_QUESTIONS_BY_CATEGORY.fashion.join(' ');

      // 코디 또는 옷 관련 단어가 포함되어야 함
      expect(fashionQuestions).toMatch(/코디|옷|스타일|패션/);
    });
  });
});
