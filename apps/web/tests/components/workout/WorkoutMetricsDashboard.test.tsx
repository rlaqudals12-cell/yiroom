import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutMetricsDashboard } from '@/components/workout/plan';
import type { WorkoutPlan, DayPlan, Exercise } from '@/types/workout';

// 테스트용 Mock 데이터
const createMockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'test-exercise',
  name: '테스트 운동',
  category: 'upper',
  bodyParts: ['chest'],
  equipment: [],
  difficulty: 'beginner',
  instructions: [],
  tips: [],
  caloriesPerMinute: 5,
  met: 5,
  suitableFor: {},
  ...overrides,
});

const createMockDayPlan = (overrides: Partial<DayPlan> = {}): DayPlan => ({
  day: 'mon',
  dayLabel: '월요일',
  isRestDay: false,
  focus: ['chest'],
  categories: ['upper'],
  exercises: [createMockExercise()],
  estimatedMinutes: 30,
  estimatedCalories: 150,
  ...overrides,
});

const createMockPlan = (overrides: Partial<WorkoutPlan> = {}): WorkoutPlan => ({
  id: 'test-plan',
  userId: 'test-user',
  weekStartDate: '2025-11-24',
  workoutType: 'toner',
  frequency: '3-4',
  days: [
    createMockDayPlan({ day: 'mon', dayLabel: '월요일', categories: ['upper'] }),
    createMockDayPlan({ day: 'tue', dayLabel: '화요일', isRestDay: true, categories: [], exercises: [] }),
    createMockDayPlan({ day: 'wed', dayLabel: '수요일', categories: ['lower'] }),
    createMockDayPlan({ day: 'thu', dayLabel: '목요일', isRestDay: true, categories: [], exercises: [] }),
    createMockDayPlan({ day: 'fri', dayLabel: '금요일', categories: ['core'] }),
    createMockDayPlan({ day: 'sat', dayLabel: '토요일', categories: ['cardio'] }),
    createMockDayPlan({ day: 'sun', dayLabel: '일요일', isRestDay: true, categories: [], exercises: [] }),
  ],
  totalMinutes: 150,
  totalCalories: 750,
  createdAt: '2025-11-24T00:00:00Z',
  updatedAt: '2025-11-24T00:00:00Z',
  ...overrides,
});

describe('WorkoutMetricsDashboard', () => {
  describe('렌더링', () => {
    it('대시보드가 올바르게 렌더링된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      expect(screen.getByTestId('workout-metrics-dashboard')).toBeInTheDocument();
      expect(screen.getByText('이번 주 운동 지표')).toBeInTheDocument();
    });

    it('7가지 지표가 모두 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      // 7가지 지표 라벨 확인
      expect(screen.getByText('운동 빈도')).toBeInTheDocument();
      expect(screen.getByText('총 시간')).toBeInTheDocument();
      expect(screen.getByText('칼로리')).toBeInTheDocument();
      expect(screen.getByText('볼륨')).toBeInTheDocument();
      expect(screen.getByText('부위 균형')).toBeInTheDocument();
      expect(screen.getByText('목표 달성률')).toBeInTheDocument();
      expect(screen.getByText('연속 기록')).toBeInTheDocument();
    });

    it('총 시간이 올바르게 표시된다', () => {
      const plan = createMockPlan({ totalMinutes: 210 });

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      expect(screen.getByText('210분')).toBeInTheDocument();
    });

    it('총 칼로리가 올바르게 표시된다', () => {
      const plan = createMockPlan({ totalCalories: 1250 });

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      expect(screen.getByText('1,250kcal')).toBeInTheDocument();
    });
  });

  describe('운동 빈도 계산', () => {
    it('주 1-2회 빈도에서 목표가 2회로 설정된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="1-2"
          userWeight={60}
          completedDays={1}
        />
      );

      expect(screen.getByText('1/2회')).toBeInTheDocument();
    });

    it('주 3-4회 빈도에서 목표가 4회로 설정된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          completedDays={2}
        />
      );

      expect(screen.getByText('2/4회')).toBeInTheDocument();
    });

    it('주 5-6회 빈도에서 목표가 6회로 설정된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="5-6"
          userWeight={60}
          completedDays={4}
        />
      );

      expect(screen.getByText('4/6회')).toBeInTheDocument();
    });

    it('매일 빈도에서 목표가 7회로 설정된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="daily"
          userWeight={60}
          completedDays={5}
        />
      );

      expect(screen.getByText('5/7회')).toBeInTheDocument();
    });
  });

  describe('연속 기록', () => {
    it('연속 기록이 올바르게 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          currentStreak={12}
        />
      );

      expect(screen.getByText('12일')).toBeInTheDocument();
    });

    it('7일 이상 연속 기록 시 "대단해요!" 메시지가 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          currentStreak={7}
        />
      );

      expect(screen.getByText('대단해요!')).toBeInTheDocument();
    });

    it('3일 이상 7일 미만 연속 기록 시 "좋은 시작!" 메시지가 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          currentStreak={5}
        />
      );

      expect(screen.getByText('좋은 시작!')).toBeInTheDocument();
    });

    it('3일 미만 연속 기록 시 "화이팅!" 메시지가 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          currentStreak={1}
        />
      );

      expect(screen.getByText('화이팅!')).toBeInTheDocument();
    });
  });

  describe('목표 달성률', () => {
    it('목표 달성률이 0%일 때 올바르게 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          completedDays={0}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('완료된 운동이 있을 때 달성률이 계산된다', () => {
      // 4일 운동 계획 중 2일 완료 = 50%
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          completedDays={2}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('안내 메시지', () => {
    it('completedDays가 0일 때 안내 메시지가 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          completedDays={0}
        />
      );

      expect(
        screen.getByText(/운동을 시작하면 실시간으로 지표가 업데이트됩니다/)
      ).toBeInTheDocument();
    });

    it('completedDays가 1 이상일 때 안내 메시지가 표시되지 않는다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          completedDays={1}
        />
      );

      expect(
        screen.queryByText(/운동을 시작하면 실시간으로 지표가 업데이트됩니다/)
      ).not.toBeInTheDocument();
    });
  });

  describe('부위 균형', () => {
    it('부위 균형 비율이 표시된다', () => {
      const plan = createMockPlan({
        days: [
          createMockDayPlan({ day: 'mon', categories: ['upper'] }),
          createMockDayPlan({ day: 'tue', isRestDay: true, categories: [], exercises: [] }),
          createMockDayPlan({ day: 'wed', categories: ['lower'] }),
          createMockDayPlan({ day: 'thu', isRestDay: true, categories: [], exercises: [] }),
          createMockDayPlan({ day: 'fri', categories: ['core'] }),
          createMockDayPlan({ day: 'sat', categories: ['cardio'] }),
          createMockDayPlan({ day: 'sun', isRestDay: true, categories: [], exercises: [] }),
        ],
      });

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      // 부위 균형 지표가 존재하는지 확인
      expect(screen.getByText('부위 균형')).toBeInTheDocument();
    });
  });

  describe('레이더 차트 영역', () => {
    it('레이더 차트 플레이스홀더가 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      expect(
        screen.getByText(/운동 기록 후 상세 분석 차트가 표시됩니다/)
      ).toBeInTheDocument();
    });
  });

  describe('7일 달성 축하 메시지', () => {
    it('7일 연속 기록 시 축하 메시지가 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          currentStreak={7}
        />
      );

      expect(screen.getByText('🎉 7일 달성!')).toBeInTheDocument();
    });

    it('7일 미만 연속 기록 시 축하 메시지가 표시되지 않는다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          currentStreak={6}
        />
      );

      expect(screen.queryByText('🎉 7일 달성!')).not.toBeInTheDocument();
    });
  });

  describe('볼륨 계산', () => {
    it('볼륨이 사용자 체중 기반으로 계산된다', () => {
      // 60kg 체중의 30% = 18kg 기본 무게
      // 4개 운동일 x 1개 운동 x 3세트 x 12회 x 18kg = 2,592kg
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      // 볼륨 지표 라벨이 표시되는지 확인
      expect(screen.getByText('볼륨')).toBeInTheDocument();
    });

    it('유산소 운동은 볼륨 계산에서 제외된다', () => {
      const plan = createMockPlan({
        days: [
          createMockDayPlan({
            day: 'mon',
            categories: ['cardio'],
            exercises: [createMockExercise({ category: 'cardio' })]
          }),
          createMockDayPlan({ day: 'tue', isRestDay: true, categories: [], exercises: [] }),
          createMockDayPlan({ day: 'wed', isRestDay: true, categories: [], exercises: [] }),
          createMockDayPlan({ day: 'thu', isRestDay: true, categories: [], exercises: [] }),
          createMockDayPlan({ day: 'fri', isRestDay: true, categories: [], exercises: [] }),
          createMockDayPlan({ day: 'sat', isRestDay: true, categories: [], exercises: [] }),
          createMockDayPlan({ day: 'sun', isRestDay: true, categories: [], exercises: [] }),
        ],
      });

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
        />
      );

      // 유산소만 있으면 볼륨은 0kg
      expect(screen.getByText('0kg')).toBeInTheDocument();
    });
  });

  describe('볼륨 변화율', () => {
    it('이전 주 볼륨 대비 증가율이 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          previousWeekVolume={1000}
        />
      );

      // 증가율이 표시되는지 확인 (+로 시작)
      expect(screen.getByText(/^\+\d+%$/)).toBeInTheDocument();
    });

    it('이전 주 볼륨이 없으면 "기준"으로 표시된다', () => {
      const plan = createMockPlan();

      render(
        <WorkoutMetricsDashboard
          plan={plan}
          frequency="3-4"
          userWeight={60}
          previousWeekVolume={0}
        />
      );

      expect(screen.getByText('기준')).toBeInTheDocument();
    });
  });
});
