/**
 * 운동 플랜 템플릿 테스트
 * 5-Type 운동 시스템 기반 주간 플랜 생성 로직 검증
 */

import {
  generateWeeklyPlan,
  estimatePlanMinutes,
  getExercisesForType,
  type PlanExercise,
  type WeeklyPlan,
} from '../../../lib/workout/planTemplates';

const ALL_TYPES = ['toner', 'builder', 'burner', 'mover', 'flexer'] as const;
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ============================================================
// generateWeeklyPlan
// ============================================================
describe('generateWeeklyPlan', () => {
  describe('기본 구조', () => {
    it('7일(월~일)에 대한 DayPlan을 반환한다', () => {
      const plan = generateWeeklyPlan('toner', 3);

      expect(Object.keys(plan)).toHaveLength(7);
      for (const day of DAY_KEYS) {
        expect(plan[day]).toBeDefined();
        expect(plan[day]).toHaveProperty('exercises');
        expect(Array.isArray(plan[day].exercises)).toBe(true);
      }
    });

    it.each(ALL_TYPES)('운동 타입 "%s"에 대해 플랜을 생성한다', (type) => {
      const plan = generateWeeklyPlan(type, 3);

      expect(Object.keys(plan)).toHaveLength(7);
      const workoutDays = DAY_KEYS.filter((d) => plan[d].exercises.length > 0);
      expect(workoutDays.length).toBe(3);
    });
  });

  describe('빈도별 운동 요일 수', () => {
    it.each([
      [2, 2],
      [3, 3],
      [4, 4],
      [5, 5],
      [6, 6],
    ])('frequency %i일 때 운동 요일이 %i일이다', (frequency, expectedDays) => {
      const plan = generateWeeklyPlan('toner', frequency);
      const workoutDayCount = DAY_KEYS.filter((d) => plan[d].exercises.length > 0).length;

      expect(workoutDayCount).toBe(expectedDays);
    });

    it('휴식일에는 exercises가 빈 배열이다', () => {
      const plan = generateWeeklyPlan('toner', 2);
      const restDays = DAY_KEYS.filter((d) => plan[d].exercises.length === 0);

      expect(restDays.length).toBe(5);
      for (const day of restDays) {
        expect(plan[day].exercises).toEqual([]);
      }
    });
  });

  describe('빈도 클램핑 (경계값)', () => {
    it('frequency가 1이면 최소 2로 클램핑된다', () => {
      const plan = generateWeeklyPlan('toner', 1);
      const workoutDayCount = DAY_KEYS.filter((d) => plan[d].exercises.length > 0).length;

      expect(workoutDayCount).toBe(2);
    });

    it('frequency가 0이면 최소 2로 클램핑된다', () => {
      const plan = generateWeeklyPlan('toner', 0);
      const workoutDayCount = DAY_KEYS.filter((d) => plan[d].exercises.length > 0).length;

      expect(workoutDayCount).toBe(2);
    });

    it('frequency가 음수면 최소 2로 클램핑된다', () => {
      const plan = generateWeeklyPlan('builder', -5);
      const workoutDayCount = DAY_KEYS.filter((d) => plan[d].exercises.length > 0).length;

      expect(workoutDayCount).toBe(2);
    });

    it('frequency가 7이면 최대 6으로 클램핑된다', () => {
      const plan = generateWeeklyPlan('toner', 7);
      const workoutDayCount = DAY_KEYS.filter((d) => plan[d].exercises.length > 0).length;

      expect(workoutDayCount).toBe(6);
    });

    it('frequency가 100이면 최대 6으로 클램핑된다', () => {
      const plan = generateWeeklyPlan('burner', 100);
      const workoutDayCount = DAY_KEYS.filter((d) => plan[d].exercises.length > 0).length;

      expect(workoutDayCount).toBe(6);
    });
  });

  describe('요일별 운동 배정', () => {
    it('toner/builder/burner/mover는 운동일에 4개 운동이 배정된다', () => {
      const nonFlexerTypes = ['toner', 'builder', 'burner', 'mover'] as const;

      for (const type of nonFlexerTypes) {
        const plan = generateWeeklyPlan(type, 3);
        const workoutDays = DAY_KEYS.filter((d) => plan[d].exercises.length > 0);

        for (const day of workoutDays) {
          expect(plan[day].exercises).toHaveLength(4);
        }
      }
    });

    it('flexer는 운동일에 5개 운동이 배정된다', () => {
      const plan = generateWeeklyPlan('flexer', 3);
      const workoutDays = DAY_KEYS.filter((d) => plan[d].exercises.length > 0);

      for (const day of workoutDays) {
        expect(plan[day].exercises).toHaveLength(5);
      }
    });
  });

  describe('배정된 운동 유효성', () => {
    it('배정된 운동이 해당 타입의 운동 목록에 포함된다', () => {
      const plan = generateWeeklyPlan('builder', 4);
      const validExercises = getExercisesForType('builder');
      const validIds = validExercises.map((e) => e.id);

      for (const day of DAY_KEYS) {
        for (const ex of plan[day].exercises) {
          expect(validIds).toContain(ex.id);
        }
      }
    });

    it('각 운동은 올바른 PlanExercise 구조를 가진다', () => {
      const plan = generateWeeklyPlan('toner', 3);

      for (const day of DAY_KEYS) {
        for (const ex of plan[day].exercises) {
          expect(ex).toHaveProperty('id');
          expect(ex).toHaveProperty('name');
          expect(ex).toHaveProperty('sets');
          expect(ex).toHaveProperty('reps');
          expect(ex).toHaveProperty('rest_seconds');
          expect(ex).toHaveProperty('category');
          expect(typeof ex.id).toBe('string');
          expect(typeof ex.name).toBe('string');
          expect(typeof ex.sets).toBe('number');
          expect(typeof ex.reps).toBe('number');
          expect(typeof ex.rest_seconds).toBe('number');
          expect(typeof ex.category).toBe('string');
        }
      }
    });
  });

  describe('요일 스케줄 분배', () => {
    it('frequency 2일 때 월/목에 운동이 배정된다', () => {
      const plan = generateWeeklyPlan('toner', 2);

      expect(plan.monday.exercises.length).toBeGreaterThan(0);
      expect(plan.thursday.exercises.length).toBeGreaterThan(0);
      expect(plan.tuesday.exercises).toEqual([]);
      expect(plan.wednesday.exercises).toEqual([]);
      expect(plan.friday.exercises).toEqual([]);
      expect(plan.saturday.exercises).toEqual([]);
      expect(plan.sunday.exercises).toEqual([]);
    });

    it('frequency 3일 때 월/수/금에 운동이 배정된다', () => {
      const plan = generateWeeklyPlan('toner', 3);

      expect(plan.monday.exercises.length).toBeGreaterThan(0);
      expect(plan.wednesday.exercises.length).toBeGreaterThan(0);
      expect(plan.friday.exercises.length).toBeGreaterThan(0);
    });

    it('일요일은 frequency 6에서도 휴식일이다', () => {
      const plan = generateWeeklyPlan('toner', 6);
      expect(plan.sunday.exercises).toEqual([]);
    });
  });
});

// ============================================================
// estimatePlanMinutes
// ============================================================
describe('estimatePlanMinutes', () => {
  describe('정상 케이스', () => {
    it('유효한 플랜에 대해 양수 분을 반환한다', () => {
      const plan = generateWeeklyPlan('toner', 3);
      const minutes = estimatePlanMinutes(plan);

      expect(minutes).toBeGreaterThan(0);
    });

    it.each(ALL_TYPES)('"%s" 타입 플랜의 총 시간이 합리적이다', (type) => {
      const plan = generateWeeklyPlan(type, 3);
      const minutes = estimatePlanMinutes(plan);

      // 최소 10분, 최대 600분 (10시간) 범위 내
      expect(minutes).toBeGreaterThanOrEqual(10);
      expect(minutes).toBeLessThanOrEqual(600);
    });

    it('빈도가 높을수록 총 시간이 증가한다', () => {
      const plan2 = generateWeeklyPlan('toner', 2);
      const plan5 = generateWeeklyPlan('toner', 5);

      expect(estimatePlanMinutes(plan5)).toBeGreaterThan(estimatePlanMinutes(plan2));
    });
  });

  describe('빈 플랜 처리', () => {
    it('모든 요일이 빈 운동인 플랜은 0분을 반환한다', () => {
      const emptyPlan: WeeklyPlan = {};
      for (const day of DAY_KEYS) {
        emptyPlan[day] = { exercises: [] };
      }

      expect(estimatePlanMinutes(emptyPlan)).toBe(0);
    });

    it('빈 객체 플랜은 0분을 반환한다', () => {
      const emptyPlan: WeeklyPlan = {};
      expect(estimatePlanMinutes(emptyPlan)).toBe(0);
    });
  });

  describe('duration 기반 운동 vs reps 기반 운동', () => {
    it('duration이 있는 운동은 duration 값을 사용한다', () => {
      const durationExercise: PlanExercise = {
        id: 'run',
        name: '러닝',
        sets: 1,
        reps: 1,
        rest_seconds: 0,
        duration: 1800, // 30분 = 1800초
        category: 'cardio',
      };

      const plan: WeeklyPlan = {
        monday: { exercises: [durationExercise] },
        tuesday: { exercises: [] },
        wednesday: { exercises: [] },
        thursday: { exercises: [] },
        friday: { exercises: [] },
        saturday: { exercises: [] },
        sunday: { exercises: [] },
      };

      // 1800초 / 60 = 30분
      expect(estimatePlanMinutes(plan)).toBe(30);
    });

    it('duration이 없는 운동은 sets * (reps * 3 + rest_seconds)로 계산한다', () => {
      const repsExercise: PlanExercise = {
        id: 'squat',
        name: '스쿼트',
        sets: 3,
        reps: 15,
        rest_seconds: 45,
        category: 'lower',
      };

      const plan: WeeklyPlan = {
        monday: { exercises: [repsExercise] },
        tuesday: { exercises: [] },
        wednesday: { exercises: [] },
        thursday: { exercises: [] },
        friday: { exercises: [] },
        saturday: { exercises: [] },
        sunday: { exercises: [] },
      };

      // 3 * (15 * 3 + 45) = 3 * (45 + 45) = 3 * 90 = 270초 = 4.5 -> round(4.5) = 5분 (또는 4분)
      const expected = Math.round((3 * (15 * 3 + 45)) / 60);
      expect(estimatePlanMinutes(plan)).toBe(expected);
    });

    it('duration 기반과 reps 기반 운동이 혼합된 플랜을 올바르게 계산한다', () => {
      const durationEx: PlanExercise = {
        id: 'run',
        name: '러닝',
        sets: 1,
        reps: 1,
        rest_seconds: 0,
        duration: 600, // 10분
        category: 'cardio',
      };
      const repsEx: PlanExercise = {
        id: 'squat',
        name: '스쿼트',
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        category: 'lower',
      };

      const plan: WeeklyPlan = {
        monday: { exercises: [durationEx, repsEx] },
        tuesday: { exercises: [] },
        wednesday: { exercises: [] },
        thursday: { exercises: [] },
        friday: { exercises: [] },
        saturday: { exercises: [] },
        sunday: { exercises: [] },
      };

      // duration: 600초
      // reps: 3 * (10*3 + 60) = 3 * 90 = 270초
      // 합계: 870초 / 60 = 14.5 -> round = 15분 (또는 14분)
      const expected = Math.round((600 + 3 * (10 * 3 + 60)) / 60);
      expect(estimatePlanMinutes(plan)).toBe(expected);
    });
  });

  describe('mover 타입 (duration 중심)', () => {
    it('mover 타입 플랜은 duration 기반 운동이 시간의 대부분을 차지한다', () => {
      const plan = generateWeeklyPlan('mover', 3);
      const totalMinutes = estimatePlanMinutes(plan);

      // mover는 러닝(30분), 사이클(30분), 로잉(20분), 수영(30분) 등
      // 운동일당 30분+ 예상
      expect(totalMinutes).toBeGreaterThan(60);
    });
  });
});

// ============================================================
// getExercisesForType
// ============================================================
describe('getExercisesForType', () => {
  describe('유효한 운동 타입', () => {
    it.each(ALL_TYPES)('"%s" 타입에 대해 운동 배열을 반환한다', (type) => {
      const exercises = getExercisesForType(type);

      expect(Array.isArray(exercises)).toBe(true);
      expect(exercises.length).toBeGreaterThan(0);
    });

    it.each(ALL_TYPES)('"%s" 타입의 모든 운동이 유효한 PlanExercise 구조를 가진다', (type) => {
      const exercises = getExercisesForType(type);

      for (const ex of exercises) {
        expect(ex.id).toBeTruthy();
        expect(ex.name).toBeTruthy();
        expect(ex.sets).toBeGreaterThan(0);
        expect(ex.reps).toBeGreaterThan(0);
        expect(ex.rest_seconds).toBeGreaterThanOrEqual(0);
        expect(ex.category).toBeTruthy();
      }
    });
  });

  describe('타입별 운동 특성', () => {
    it('toner 운동은 중간 세트/반복 구성이다', () => {
      const exercises = getExercisesForType('toner');

      for (const ex of exercises) {
        expect(ex.sets).toBeGreaterThanOrEqual(2);
        expect(ex.sets).toBeLessThanOrEqual(4);
      }
    });

    it('builder 운동은 높은 세트와 긴 휴식 시간을 가진다', () => {
      const exercises = getExercisesForType('builder');

      // builder는 대부분 4세트, 60초 이상 휴식
      const avgRest = exercises.reduce((sum, ex) => sum + ex.rest_seconds, 0) / exercises.length;
      expect(avgRest).toBeGreaterThanOrEqual(60);
    });

    it('burner 운동은 짧은 휴식 시간을 가진다', () => {
      const exercises = getExercisesForType('burner');

      const avgRest = exercises.reduce((sum, ex) => sum + ex.rest_seconds, 0) / exercises.length;
      // burner 평균 휴식: 대부분 20-45초
      expect(avgRest).toBeLessThanOrEqual(50);
    });

    it('mover 운동 중 duration 기반 운동이 존재한다', () => {
      const exercises = getExercisesForType('mover');
      const durationBased = exercises.filter((ex) => ex.duration !== undefined);

      expect(durationBased.length).toBeGreaterThan(0);
    });

    it('flexer 운동은 대부분 stretch 카테고리이다', () => {
      const exercises = getExercisesForType('flexer');
      const stretchCount = exercises.filter((ex) => ex.category === 'stretch').length;

      expect(stretchCount).toBeGreaterThan(exercises.length / 2);
    });
  });

  describe('폴백 동작', () => {
    it('유효하지 않은 타입은 toner 운동 목록을 반환한다', () => {
      const tonerExercises = getExercisesForType('toner');
      // unknown 타입 전달 시 toner로 폴백
      const fallback = getExercisesForType('invalid_type' as any);

      expect(fallback).toEqual(tonerExercises);
    });

    it('빈 문자열 타입은 toner 운동 목록을 반환한다', () => {
      const tonerExercises = getExercisesForType('toner');
      const fallback = getExercisesForType('' as any);

      expect(fallback).toEqual(tonerExercises);
    });
  });

  describe('운동 ID 고유성', () => {
    it.each(ALL_TYPES)('"%s" 타입 내 운동 ID가 모두 고유하다', (type) => {
      const exercises = getExercisesForType(type);
      const ids = exercises.map((ex) => ex.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('운동 이름 (한국어)', () => {
    it.each(ALL_TYPES)('"%s" 타입의 모든 운동에 한국어 이름이 있다', (type) => {
      const exercises = getExercisesForType(type);

      for (const ex of exercises) {
        // 빈 문자열이 아닌 유의미한 이름인지 확인
        expect(ex.name.length).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================
// 통합 시나리오
// ============================================================
describe('통합 시나리오', () => {
  it('플랜 생성 후 시간 추정까지 전체 플로우가 동작한다', () => {
    // 1. 운동 목록 조회
    const exercises = getExercisesForType('builder');
    expect(exercises.length).toBeGreaterThan(0);

    // 2. 주간 플랜 생성
    const plan = generateWeeklyPlan('builder', 4);
    expect(Object.keys(plan)).toHaveLength(7);

    // 3. 시간 추정
    const minutes = estimatePlanMinutes(plan);
    expect(minutes).toBeGreaterThan(0);
  });

  it('모든 운동 타입에 대해 플랜 생성 + 시간 추정이 정상 동작한다', () => {
    for (const type of ALL_TYPES) {
      for (const freq of [2, 3, 4, 5, 6]) {
        const plan = generateWeeklyPlan(type, freq);
        const minutes = estimatePlanMinutes(plan);

        expect(Object.keys(plan)).toHaveLength(7);
        expect(minutes).toBeGreaterThan(0);
      }
    }
  });
});
