/**
 * 운동기구 추천 API
 * POST - 목표/수준 기반 운동기구 추천
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getEquipmentRecommendations,
  getHomeGymSetup,
  type WorkoutGoal,
  type BudgetLevel,
  type SpaceSize,
} from '@/lib/smart-matching/equipment-recommend';
import type { ExerciseDifficulty } from '@/types/workout';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { type, goal, fitnessLevel, homeGym, budget, spaceSize, goals } = body;

    // 추천 타입 분기
    if (type === 'equipment') {
      // 단일 목표 기반 기구 추천
      if (!goal || !fitnessLevel) {
        return NextResponse.json(
          { error: '필수 필드가 누락되었습니다. (goal, fitnessLevel)' },
          { status: 400 }
        );
      }

      // 목표 유효성 검사
      const validGoals: WorkoutGoal[] = [
        'weight_loss',
        'muscle_gain',
        'endurance',
        'flexibility',
        'health',
        'body_shaping',
      ];
      if (!validGoals.includes(goal)) {
        return NextResponse.json({ error: '유효하지 않은 목표입니다.' }, { status: 400 });
      }

      // 수준 유효성 검사
      const validLevels: ExerciseDifficulty[] = ['beginner', 'intermediate', 'advanced'];
      if (!validLevels.includes(fitnessLevel)) {
        return NextResponse.json({ error: '유효하지 않은 수준입니다.' }, { status: 400 });
      }

      const recommendation = getEquipmentRecommendations(
        goal as WorkoutGoal,
        fitnessLevel as ExerciseDifficulty,
        homeGym ?? true
      );

      return NextResponse.json({
        success: true,
        recommendation,
      });
    } else if (type === 'home_gym') {
      // 홈짐 세트업 추천
      if (!budget || !spaceSize || !goals || !Array.isArray(goals) || goals.length === 0) {
        return NextResponse.json(
          { error: '필수 필드가 누락되었습니다. (budget, spaceSize, goals)' },
          { status: 400 }
        );
      }

      // 예산 유효성 검사
      const validBudgets: BudgetLevel[] = ['basic', 'intermediate', 'advanced'];
      if (!validBudgets.includes(budget)) {
        return NextResponse.json({ error: '유효하지 않은 예산 수준입니다.' }, { status: 400 });
      }

      // 공간 유효성 검사
      const validSpaces: SpaceSize[] = ['small', 'medium', 'large'];
      if (!validSpaces.includes(spaceSize)) {
        return NextResponse.json({ error: '유효하지 않은 공간 크기입니다.' }, { status: 400 });
      }

      const setup = getHomeGymSetup(
        budget as BudgetLevel,
        spaceSize as SpaceSize,
        goals as WorkoutGoal[]
      );

      return NextResponse.json({
        success: true,
        setup,
      });
    } else {
      return NextResponse.json(
        { error: 'type은 "equipment" 또는 "home_gym"이어야 합니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API] EquipmentRecommend error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
