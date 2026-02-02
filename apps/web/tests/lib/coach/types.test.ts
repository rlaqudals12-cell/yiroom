/**
 * Coach 공유 타입 및 유틸리티 테스트
 *
 * @module tests/lib/coach/types
 * @description summarizeContext 함수 및 타입 정합성 테스트
 */

import { describe, it, expect } from 'vitest';
import { summarizeContext, type UserContext, type SkinScores } from '@/lib/coach/types';

describe('lib/coach/types', () => {
  // =========================================
  // summarizeContext 테스트
  // =========================================

  describe('summarizeContext', () => {
    it('null 입력 시 "컨텍스트 없음"을 반환한다', () => {
      const result = summarizeContext(null);
      expect(result).toBe('컨텍스트 없음');
    });

    it('빈 컨텍스트 시 "기본 정보만"을 반환한다', () => {
      const context: UserContext = {};
      const result = summarizeContext(context);
      expect(result).toBe('기본 정보만');
    });

    it('퍼스널컬러 정보를 요약한다', () => {
      const context: UserContext = {
        personalColor: {
          season: '봄 웜톤',
          tone: 'bright',
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('PC:봄 웜톤');
    });

    it('피부 분석 정보를 요약한다', () => {
      const context: UserContext = {
        skinAnalysis: {
          skinType: '복합성',
          concerns: ['모공', '피지'],
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('피부:복합성');
    });

    it('체형 분석 정보를 요약한다', () => {
      const context: UserContext = {
        bodyAnalysis: {
          bodyType: '직사각형',
          bmi: 22.5,
          height: 170,
          weight: 65,
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('체형:직사각형');
    });

    it('헤어 분석 정보를 요약한다', () => {
      const context: UserContext = {
        hairAnalysis: {
          hairType: '직모',
          scalpType: '지성',
          overallScore: 75,
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('헤어:직모');
    });

    it('메이크업 분석 정보를 요약한다', () => {
      const context: UserContext = {
        makeupAnalysis: {
          undertone: '웜톤',
          faceShape: '계란형',
          overallScore: 80,
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('메이크업:웜톤');
    });

    it('운동 스트릭 정보를 요약한다', () => {
      const context: UserContext = {
        workout: {
          streak: 15,
          workoutType: '근력',
          goal: '근육 증가',
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('운동스트릭:15일');
    });

    it('운동 스트릭 없으면 운동 정보를 포함하지 않는다', () => {
      const context: UserContext = {
        workout: {
          workoutType: '유산소',
          goal: '체중 감량',
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('기본 정보만');
    });

    it('영양 스트릭 정보를 요약한다', () => {
      const context: UserContext = {
        nutrition: {
          streak: 7,
          goal: '다이어트',
          targetCalories: 1800,
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('영양스트릭:7일');
    });

    it('영양 스트릭 없으면 영양 정보를 포함하지 않는다', () => {
      const context: UserContext = {
        nutrition: {
          goal: '벌크업',
          targetCalories: 2500,
        },
      };
      const result = summarizeContext(context);
      expect(result).toBe('기본 정보만');
    });

    it('여러 정보를 쉼표로 구분하여 요약한다', () => {
      const context: UserContext = {
        personalColor: { season: '여름 쿨톤' },
        skinAnalysis: { skinType: '건성' },
        bodyAnalysis: { bodyType: '삼각형', height: 165, weight: 55 },
      };
      const result = summarizeContext(context);
      expect(result).toBe('PC:여름 쿨톤, 피부:건성, 체형:삼각형');
    });

    it('모든 정보가 있을 때 전체를 요약한다', () => {
      const context: UserContext = {
        personalColor: { season: '가을 웜톤' },
        skinAnalysis: { skinType: '지성' },
        bodyAnalysis: { bodyType: '모래시계', height: 160, weight: 50 },
        hairAnalysis: { hairType: '곱슬', scalpType: '건성', overallScore: 70 },
        makeupAnalysis: { undertone: '쿨톤', faceShape: '둥근형', overallScore: 85 },
        workout: { streak: 30, goal: '체력 증진' },
        nutrition: { streak: 14, goal: '균형 식단' },
      };
      const result = summarizeContext(context);
      expect(result).toContain('PC:가을 웜톤');
      expect(result).toContain('피부:지성');
      expect(result).toContain('체형:모래시계');
      expect(result).toContain('헤어:곱슬');
      expect(result).toContain('메이크업:쿨톤');
      expect(result).toContain('운동스트릭:30일');
      expect(result).toContain('영양스트릭:14일');
    });

    it('streak이 0이면 스트릭 정보를 포함하지 않는다', () => {
      const context: UserContext = {
        workout: { streak: 0 },
        nutrition: { streak: 0 },
      };
      const result = summarizeContext(context);
      expect(result).toBe('기본 정보만');
    });
  });

  // =========================================
  // 타입 정합성 테스트 (컴파일 타임 체크)
  // =========================================

  describe('UserContext 타입 정합성', () => {
    it('최소 UserContext는 빈 객체를 허용한다', () => {
      const context: UserContext = {};
      expect(context).toBeDefined();
    });

    it('personalColor는 season만 필수이다', () => {
      const context: UserContext = {
        personalColor: {
          season: 'spring',
        },
      };
      expect(context.personalColor?.season).toBe('spring');
      expect(context.personalColor?.tone).toBeUndefined();
    });

    it('skinAnalysis는 다양한 필드를 가질 수 있다', () => {
      const scores: SkinScores = {
        moisture: 70,
        oil: 40,
        sensitivity: 20,
      };

      const context: UserContext = {
        skinAnalysis: {
          skinType: '복합성',
          concerns: ['주름', '색소침착'],
          scores,
          recentCondition: 4,
          routineCompletionRate: {
            morning: 80,
            evening: 90,
          },
          recentFactors: {
            avgSleep: 7,
            avgWater: 2000,
            avgStress: 2,
          },
        },
      };

      expect(context.skinAnalysis?.skinType).toBe('복합성');
      expect(context.skinAnalysis?.scores?.moisture).toBe(70);
      expect(context.skinAnalysis?.recentCondition).toBe(4);
      expect(context.skinAnalysis?.routineCompletionRate?.morning).toBe(80);
      expect(context.skinAnalysis?.recentFactors?.avgSleep).toBe(7);
    });

    it('workout은 다양한 fitnessLevel을 가질 수 있다', () => {
      const levels: Array<'beginner' | 'intermediate' | 'advanced'> = [
        'beginner',
        'intermediate',
        'advanced',
      ];

      levels.forEach((level) => {
        const context: UserContext = {
          workout: { fitnessLevel: level },
        };
        expect(context.workout?.fitnessLevel).toBe(level);
      });
    });

    it('recentActivity는 오늘 활동 정보를 담는다', () => {
      const context: UserContext = {
        recentActivity: {
          todayWorkout: '스쿼트 30분',
          todayCalories: 1500,
          waterIntake: 1800,
        },
      };
      expect(context.recentActivity?.todayWorkout).toBe('스쿼트 30분');
      expect(context.recentActivity?.todayCalories).toBe(1500);
      expect(context.recentActivity?.waterIntake).toBe(1800);
    });

    it('weeklySummary는 주간 요약 정보를 담는다', () => {
      const context: UserContext = {
        weeklySummary: {
          workoutCount: 5,
          avgCalories: 1800,
          avgProtein: 80,
          avgCarbs: 200,
          avgFat: 60,
        },
      };
      expect(context.weeklySummary?.workoutCount).toBe(5);
      expect(context.weeklySummary?.avgProtein).toBe(80);
    });
  });

  // =========================================
  // SkinScores 타입 테스트
  // =========================================

  describe('SkinScores 타입 정합성', () => {
    it('모든 필드가 선택적이다', () => {
      const scores: SkinScores = {};
      expect(scores.moisture).toBeUndefined();
      expect(scores.oil).toBeUndefined();
      expect(scores.sensitivity).toBeUndefined();
    });

    it('moisture만 설정할 수 있다', () => {
      const scores: SkinScores = { moisture: 65 };
      expect(scores.moisture).toBe(65);
    });

    it('oil만 설정할 수 있다', () => {
      const scores: SkinScores = { oil: 80 };
      expect(scores.oil).toBe(80);
    });

    it('sensitivity만 설정할 수 있다', () => {
      const scores: SkinScores = { sensitivity: 15 };
      expect(scores.sensitivity).toBe(15);
    });

    it('모든 필드를 설정할 수 있다', () => {
      const scores: SkinScores = {
        moisture: 70,
        oil: 50,
        sensitivity: 30,
      };
      expect(scores.moisture).toBe(70);
      expect(scores.oil).toBe(50);
      expect(scores.sensitivity).toBe(30);
    });
  });
});
