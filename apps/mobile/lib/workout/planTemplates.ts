/**
 * 운동 타입별 플랜 템플릿
 * 5-Type 운동 시스템 (toner/builder/burner/mover/flexer)
 * 각 타입별 운동 목록 + 주간 플랜 생성 로직
 */
import type { WorkoutType } from '@yiroom/shared';

export interface PlanExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  duration?: number;
  category: string;
}

export interface DayPlan {
  exercises: PlanExercise[];
}

export type WeeklyPlan = Record<string, DayPlan>;

// 운동 타입별 운동 데이터베이스
const EXERCISE_DB: Record<WorkoutType, PlanExercise[]> = {
  toner: [
    { id: 'squat', name: '스쿼트', sets: 3, reps: 15, rest_seconds: 45, category: 'lower' },
    { id: 'lunge', name: '런지', sets: 3, reps: 12, rest_seconds: 45, category: 'lower' },
    { id: 'pushup', name: '푸시업', sets: 3, reps: 12, rest_seconds: 45, category: 'upper' },
    { id: 'plank', name: '플랭크', sets: 3, reps: 30, rest_seconds: 30, category: 'core' },
    { id: 'bridge', name: '힙 브릿지', sets: 3, reps: 15, rest_seconds: 45, category: 'lower' },
    { id: 'superman', name: '슈퍼맨', sets: 3, reps: 12, rest_seconds: 30, category: 'back' },
    { id: 'leg_raise', name: '레그레이즈', sets: 3, reps: 12, rest_seconds: 30, category: 'core' },
    { id: 'wall_sit', name: '월 싯', sets: 3, reps: 30, rest_seconds: 45, category: 'lower' },
    { id: 'dip', name: '딥스', sets: 3, reps: 10, rest_seconds: 45, category: 'upper' },
    { id: 'calf_raise', name: '카프레이즈', sets: 3, reps: 20, rest_seconds: 30, category: 'lower' },
  ],
  builder: [
    { id: 'squat_deep', name: '딥 스쿼트', sets: 4, reps: 10, rest_seconds: 90, category: 'lower' },
    { id: 'deadlift', name: '데드리프트', sets: 4, reps: 8, rest_seconds: 120, category: 'back' },
    { id: 'bench_press', name: '벤치프레스', sets: 4, reps: 8, rest_seconds: 90, category: 'chest' },
    { id: 'overhead_press', name: '오버헤드 프레스', sets: 4, reps: 8, rest_seconds: 90, category: 'shoulder' },
    { id: 'barbell_row', name: '바벨 로우', sets: 4, reps: 10, rest_seconds: 90, category: 'back' },
    { id: 'pull_up', name: '풀업', sets: 3, reps: 8, rest_seconds: 90, category: 'back' },
    { id: 'leg_press', name: '레그프레스', sets: 4, reps: 12, rest_seconds: 90, category: 'lower' },
    { id: 'dumbbell_curl', name: '덤벨 컬', sets: 3, reps: 12, rest_seconds: 60, category: 'arm' },
    { id: 'tricep_ext', name: '트라이셉 익스텐션', sets: 3, reps: 12, rest_seconds: 60, category: 'arm' },
    { id: 'lateral_raise', name: '레터럴 레이즈', sets: 3, reps: 12, rest_seconds: 60, category: 'shoulder' },
  ],
  burner: [
    { id: 'burpee', name: '버피', sets: 3, reps: 10, rest_seconds: 30, category: 'cardio' },
    { id: 'jump_squat', name: '점프 스쿼트', sets: 3, reps: 15, rest_seconds: 30, category: 'lower' },
    { id: 'mountain_climber', name: '마운틴 클라이머', sets: 3, reps: 20, rest_seconds: 30, category: 'cardio' },
    { id: 'jumping_jack', name: '점핑잭', sets: 3, reps: 30, rest_seconds: 20, category: 'cardio' },
    { id: 'high_knees', name: '하이니즈', sets: 3, reps: 20, rest_seconds: 20, category: 'cardio' },
    { id: 'box_jump', name: '박스 점프', sets: 3, reps: 10, rest_seconds: 45, category: 'lower' },
    { id: 'battle_rope', name: '배틀로프', sets: 3, reps: 30, rest_seconds: 30, category: 'cardio' },
    { id: 'sprint', name: '스프린트', sets: 5, reps: 30, rest_seconds: 60, duration: 30, category: 'cardio' },
    { id: 'plank_jack', name: '플랭크 잭', sets: 3, reps: 20, rest_seconds: 30, category: 'core' },
    { id: 'tuck_jump', name: '턱 점프', sets: 3, reps: 10, rest_seconds: 45, category: 'cardio' },
  ],
  mover: [
    { id: 'running', name: '러닝', sets: 1, reps: 1, rest_seconds: 0, duration: 1800, category: 'cardio' },
    { id: 'cycling', name: '사이클', sets: 1, reps: 1, rest_seconds: 0, duration: 1800, category: 'cardio' },
    { id: 'jump_rope', name: '줄넘기', sets: 3, reps: 100, rest_seconds: 60, category: 'cardio' },
    { id: 'walking_lunge', name: '워킹 런지', sets: 3, reps: 20, rest_seconds: 45, category: 'lower' },
    { id: 'step_up', name: '스텝업', sets: 3, reps: 15, rest_seconds: 45, category: 'lower' },
    { id: 'rowing', name: '로잉머신', sets: 1, reps: 1, rest_seconds: 0, duration: 1200, category: 'cardio' },
    { id: 'elliptical', name: '일립티컬', sets: 1, reps: 1, rest_seconds: 0, duration: 1500, category: 'cardio' },
    { id: 'swimming', name: '수영', sets: 1, reps: 1, rest_seconds: 0, duration: 1800, category: 'cardio' },
  ],
  flexer: [
    { id: 'cat_cow', name: '고양이 자세', sets: 2, reps: 10, rest_seconds: 15, category: 'stretch' },
    { id: 'downward_dog', name: '다운도그', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
    { id: 'pigeon_pose', name: '비둘기 자세', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
    { id: 'hamstring_stretch', name: '햄스트링 스트레칭', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
    { id: 'child_pose', name: '차일드 포즈', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
    { id: 'foam_rolling', name: '폼롤링', sets: 1, reps: 1, rest_seconds: 0, duration: 600, category: 'recovery' },
    { id: 'hip_opener', name: '힙 오프너', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
    { id: 'shoulder_stretch', name: '어깨 스트레칭', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
    { id: 'spinal_twist', name: '척추 트위스트', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
    { id: 'warrior_pose', name: '전사 자세', sets: 2, reps: 30, rest_seconds: 15, category: 'stretch' },
  ],
};

// 요일 키 (월~일)
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * 운동 타입과 빈도에 따라 주간 플랜 생성
 * @param workoutType 운동 타입 (5-Type)
 * @param frequency 주당 운동 횟수 (2-6)
 * @returns 주간 플랜 JSONB
 */
export function generateWeeklyPlan(workoutType: WorkoutType, frequency: number): WeeklyPlan {
  const exercises = EXERCISE_DB[workoutType];
  const clampedFreq = Math.max(2, Math.min(6, frequency));

  // 운동 요일 결정 (빈도에 따라 분배)
  const workoutDays = selectWorkoutDays(clampedFreq);

  const plan: WeeklyPlan = {};
  let exercisePool = [...exercises];
  let poolIndex = 0;

  for (const dayKey of DAY_KEYS) {
    if (workoutDays.includes(dayKey)) {
      // 요일별 4-5개 운동 배정
      const dayExerciseCount = workoutType === 'flexer' ? 5 : 4;
      const dayExercises: PlanExercise[] = [];

      for (let i = 0; i < dayExerciseCount; i++) {
        dayExercises.push(exercisePool[poolIndex % exercisePool.length]);
        poolIndex++;
      }

      plan[dayKey] = { exercises: dayExercises };
    } else {
      // 휴식일
      plan[dayKey] = { exercises: [] };
    }
  }

  return plan;
}

/**
 * 빈도에 따라 운동 요일 선택
 * 쉬는 날이 연속되지 않도록 분배
 */
function selectWorkoutDays(frequency: number): string[] {
  const schedules: Record<number, string[]> = {
    2: ['monday', 'thursday'],
    3: ['monday', 'wednesday', 'friday'],
    4: ['monday', 'tuesday', 'thursday', 'friday'],
    5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
    6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  };
  return schedules[frequency] || schedules[3];
}

/**
 * 플랜의 총 운동 시간 추정 (분)
 */
export function estimatePlanMinutes(plan: WeeklyPlan): number {
  let totalSeconds = 0;

  for (const dayKey of DAY_KEYS) {
    const day = plan[dayKey];
    if (!day?.exercises.length) continue;

    for (const ex of day.exercises) {
      if (ex.duration) {
        totalSeconds += ex.duration;
      } else {
        // 세트 * (레피티션 시간 + 휴식)
        const repTime = ex.reps * 3; // 1rep ≈ 3초
        totalSeconds += ex.sets * (repTime + ex.rest_seconds);
      }
    }
  }

  return Math.round(totalSeconds / 60);
}

/**
 * 운동 타입에 맞는 전체 운동 목록 반환 (로그 화면용)
 */
export function getExercisesForType(workoutType: WorkoutType): PlanExercise[] {
  return EXERCISE_DB[workoutType] || EXERCISE_DB.toner;
}
