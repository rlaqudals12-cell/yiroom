/**
 * workoutInputStore 테스트
 * @description 운동 온보딩 입력 상태 관리 스토어 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import type { PersonalColorSeason, BodyTypeData } from '@/types/workout';

describe('workoutInputStore', () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 리셋
    useWorkoutInputStore.getState().resetAll();
  });

  describe('초기 상태', () => {
    it('기본값이 올바르게 설정된다', () => {
      const state = useWorkoutInputStore.getState();

      expect(state.currentStep).toBe(1);
      expect(state.bodyTypeData).toBeNull();
      expect(state.personalColor).toBeNull();
      expect(state.goals).toEqual([]);
      expect(state.concerns).toEqual([]);
      expect(state.frequency).toBe('');
      expect(state.location).toBe('');
      expect(state.equipment).toEqual([]);
      expect(state.targetWeight).toBeUndefined();
      expect(state.targetDate).toBeUndefined();
      expect(state.injuries).toEqual([]);
    });
  });

  describe('setStep', () => {
    it('현재 단계를 설정한다', () => {
      useWorkoutInputStore.getState().setStep(3);
      expect(useWorkoutInputStore.getState().currentStep).toBe(3);
    });

    it('단계를 순차적으로 변경할 수 있다', () => {
      const { setStep } = useWorkoutInputStore.getState();

      setStep(2);
      expect(useWorkoutInputStore.getState().currentStep).toBe(2);

      setStep(5);
      expect(useWorkoutInputStore.getState().currentStep).toBe(5);

      setStep(1);
      expect(useWorkoutInputStore.getState().currentStep).toBe(1);
    });
  });

  describe('setBodyTypeData', () => {
    it('체형 데이터를 설정한다', () => {
      const bodyTypeData: BodyTypeData = {
        type: 'hourglass',
        proportions: { shoulder: 38, waist: 26, hip: 38 },
        height: 165,
        weight: 55,
      };

      useWorkoutInputStore.getState().setBodyTypeData(bodyTypeData);
      expect(useWorkoutInputStore.getState().bodyTypeData).toEqual(bodyTypeData);
    });

    it('체형 데이터를 null로 설정할 수 있다', () => {
      useWorkoutInputStore.getState().setBodyTypeData({
        type: 'rectangle',
        proportions: { shoulder: 36, waist: 30, hip: 36 },
      });
      useWorkoutInputStore.getState().setBodyTypeData(null);
      expect(useWorkoutInputStore.getState().bodyTypeData).toBeNull();
    });
  });

  describe('setPersonalColor', () => {
    it('퍼스널 컬러를 설정한다', () => {
      const color: PersonalColorSeason = 'Spring';
      useWorkoutInputStore.getState().setPersonalColor(color);
      expect(useWorkoutInputStore.getState().personalColor).toBe('Spring');
    });

    it('모든 시즌을 설정할 수 있다', () => {
      const seasons: PersonalColorSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

      seasons.forEach(season => {
        useWorkoutInputStore.getState().setPersonalColor(season);
        expect(useWorkoutInputStore.getState().personalColor).toBe(season);
      });
    });

    it('null로 설정할 수 있다', () => {
      useWorkoutInputStore.getState().setPersonalColor('Summer');
      useWorkoutInputStore.getState().setPersonalColor(null);
      expect(useWorkoutInputStore.getState().personalColor).toBeNull();
    });
  });

  describe('setGoals', () => {
    it('운동 목표를 설정한다', () => {
      const goals = ['weight_loss', 'muscle_gain'];
      useWorkoutInputStore.getState().setGoals(goals);
      expect(useWorkoutInputStore.getState().goals).toEqual(goals);
    });

    it('빈 배열로 설정할 수 있다', () => {
      useWorkoutInputStore.getState().setGoals(['flexibility']);
      useWorkoutInputStore.getState().setGoals([]);
      expect(useWorkoutInputStore.getState().goals).toEqual([]);
    });

    it('최대 2개 목표를 설정할 수 있다', () => {
      const goals = ['strength', 'endurance'];
      useWorkoutInputStore.getState().setGoals(goals);
      expect(useWorkoutInputStore.getState().goals).toHaveLength(2);
    });
  });

  describe('setConcerns', () => {
    it('신체 고민을 설정한다', () => {
      const concerns = ['back_pain', 'shoulder_stiff', 'weak_core'];
      useWorkoutInputStore.getState().setConcerns(concerns);
      expect(useWorkoutInputStore.getState().concerns).toEqual(concerns);
    });

    it('빈 배열로 설정할 수 있다', () => {
      useWorkoutInputStore.getState().setConcerns(['neck_pain']);
      useWorkoutInputStore.getState().setConcerns([]);
      expect(useWorkoutInputStore.getState().concerns).toEqual([]);
    });
  });

  describe('setFrequency', () => {
    it('운동 빈도를 설정한다', () => {
      useWorkoutInputStore.getState().setFrequency('3-4');
      expect(useWorkoutInputStore.getState().frequency).toBe('3-4');
    });

    it('다양한 빈도를 설정할 수 있다', () => {
      const frequencies = ['1-2', '3-4', '5-6', '7'];

      frequencies.forEach(freq => {
        useWorkoutInputStore.getState().setFrequency(freq);
        expect(useWorkoutInputStore.getState().frequency).toBe(freq);
      });
    });
  });

  describe('setLocation', () => {
    it('운동 장소를 설정한다', () => {
      useWorkoutInputStore.getState().setLocation('home');
      expect(useWorkoutInputStore.getState().location).toBe('home');
    });

    it('다양한 장소를 설정할 수 있다', () => {
      const locations = ['home', 'gym', 'outdoor'];

      locations.forEach(loc => {
        useWorkoutInputStore.getState().setLocation(loc);
        expect(useWorkoutInputStore.getState().location).toBe(loc);
      });
    });
  });

  describe('setEquipment', () => {
    it('장비를 설정한다', () => {
      const equipment = ['dumbbell', 'mat', 'resistance_band'];
      useWorkoutInputStore.getState().setEquipment(equipment);
      expect(useWorkoutInputStore.getState().equipment).toEqual(equipment);
    });

    it('빈 배열로 설정할 수 있다 (맨몸운동)', () => {
      useWorkoutInputStore.getState().setEquipment(['kettlebell']);
      useWorkoutInputStore.getState().setEquipment([]);
      expect(useWorkoutInputStore.getState().equipment).toEqual([]);
    });
  });

  describe('setTargetWeight', () => {
    it('목표 체중을 설정한다', () => {
      useWorkoutInputStore.getState().setTargetWeight(60);
      expect(useWorkoutInputStore.getState().targetWeight).toBe(60);
    });

    it('undefined로 설정할 수 있다', () => {
      useWorkoutInputStore.getState().setTargetWeight(55);
      useWorkoutInputStore.getState().setTargetWeight(undefined);
      expect(useWorkoutInputStore.getState().targetWeight).toBeUndefined();
    });
  });

  describe('setTargetDate', () => {
    it('목표 날짜를 설정한다', () => {
      const targetDate = '2025-03-01';
      useWorkoutInputStore.getState().setTargetDate(targetDate);
      expect(useWorkoutInputStore.getState().targetDate).toBe(targetDate);
    });

    it('undefined로 설정할 수 있다', () => {
      useWorkoutInputStore.getState().setTargetDate('2025-06-01');
      useWorkoutInputStore.getState().setTargetDate(undefined);
      expect(useWorkoutInputStore.getState().targetDate).toBeUndefined();
    });
  });

  describe('setInjuries', () => {
    it('부상/통증을 설정한다', () => {
      const injuries = ['knee', 'lower_back'];
      useWorkoutInputStore.getState().setInjuries(injuries);
      expect(useWorkoutInputStore.getState().injuries).toEqual(injuries);
    });

    it('빈 배열로 설정할 수 있다 (부상 없음)', () => {
      useWorkoutInputStore.getState().setInjuries(['ankle']);
      useWorkoutInputStore.getState().setInjuries([]);
      expect(useWorkoutInputStore.getState().injuries).toEqual([]);
    });
  });

  describe('resetAll', () => {
    it('모든 상태를 초기값으로 리셋한다', () => {
      // 상태 설정
      const store = useWorkoutInputStore.getState();
      store.setStep(5);
      store.setBodyTypeData({
        type: 'triangle',
        proportions: { shoulder: 34, waist: 28, hip: 40 },
      });
      store.setPersonalColor('Autumn');
      store.setGoals(['strength']);
      store.setConcerns(['back_pain']);
      store.setFrequency('5-6');
      store.setLocation('gym');
      store.setEquipment(['barbell']);
      store.setTargetWeight(70);
      store.setTargetDate('2025-12-31');
      store.setInjuries(['shoulder']);

      // 리셋
      store.resetAll();

      // 검증
      const state = useWorkoutInputStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.bodyTypeData).toBeNull();
      expect(state.personalColor).toBeNull();
      expect(state.goals).toEqual([]);
      expect(state.concerns).toEqual([]);
      expect(state.frequency).toBe('');
      expect(state.location).toBe('');
      expect(state.equipment).toEqual([]);
      expect(state.targetWeight).toBeUndefined();
      expect(state.targetDate).toBeUndefined();
      expect(state.injuries).toEqual([]);
    });
  });

  describe('getInputData', () => {
    it('현재 입력 데이터를 반환한다', () => {
      const store = useWorkoutInputStore.getState();

      const bodyTypeData: BodyTypeData = {
        type: 'hourglass',
        proportions: { shoulder: 38, waist: 26, hip: 38 },
        height: 165,
        weight: 55,
      };

      store.setBodyTypeData(bodyTypeData);
      store.setPersonalColor('Spring');
      store.setGoals(['weight_loss', 'flexibility']);
      store.setConcerns(['lower_body']);
      store.setFrequency('3-4');
      store.setLocation('home');
      store.setEquipment(['mat', 'dumbbell']);
      store.setTargetWeight(52);
      store.setTargetDate('2025-06-01');
      store.setInjuries([]);

      const inputData = store.getInputData();

      expect(inputData).toEqual({
        bodyTypeData,
        personalColor: 'Spring',
        goals: ['weight_loss', 'flexibility'],
        concerns: ['lower_body'],
        frequency: '3-4',
        location: 'home',
        equipment: ['mat', 'dumbbell'],
        targetWeight: 52,
        targetDate: '2025-06-01',
        injuries: [],
      });
    });

    it('초기 상태에서도 올바른 형태를 반환한다', () => {
      const inputData = useWorkoutInputStore.getState().getInputData();

      expect(inputData).toEqual({
        bodyTypeData: null,
        personalColor: null,
        goals: [],
        concerns: [],
        frequency: '',
        location: '',
        equipment: [],
        targetWeight: undefined,
        targetDate: undefined,
        injuries: [],
      });
    });
  });

  describe('온보딩 플로우 시나리오', () => {
    it('7단계 온보딩 전체 플로우를 테스트한다', () => {
      const store = useWorkoutInputStore.getState();

      // Step 1: 체형/PC 데이터
      store.setStep(1);
      store.setBodyTypeData({
        type: 'rectangle',
        proportions: { shoulder: 38, waist: 32, hip: 38 },
        height: 170,
        weight: 65,
      });
      store.setPersonalColor('Summer');

      // Step 2: 운동 목표
      store.setStep(2);
      store.setGoals(['muscle_gain', 'strength']);

      // Step 3: 신체 고민
      store.setStep(3);
      store.setConcerns(['upper_body', 'posture']);

      // Step 4: 운동 빈도
      store.setStep(4);
      store.setFrequency('5-6');

      // Step 5: 운동 장소/장비
      store.setStep(5);
      store.setLocation('gym');
      store.setEquipment(['barbell', 'dumbbell', 'cable_machine']);

      // Step 6: 목표 설정
      store.setStep(6);
      store.setTargetWeight(70);
      store.setTargetDate('2025-06-01');

      // Step 7: 부상/통증
      store.setStep(7);
      store.setInjuries([]);

      // 최종 데이터 검증
      const inputData = store.getInputData();
      expect(inputData.bodyTypeData?.type).toBe('rectangle');
      expect(inputData.personalColor).toBe('Summer');
      expect(inputData.goals).toHaveLength(2);
      expect(inputData.concerns).toHaveLength(2);
      expect(inputData.frequency).toBe('5-6');
      expect(inputData.location).toBe('gym');
      expect(inputData.equipment).toHaveLength(3);
      expect(inputData.targetWeight).toBe(70);
      expect(inputData.injuries).toHaveLength(0);
    });
  });
});
