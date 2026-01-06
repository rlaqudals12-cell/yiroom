/**
 * M-1 정신건강 트래킹 API
 *
 * GET /api/mental-health?date=YYYY-MM-DD - 특정 날짜 체크인 조회
 * GET /api/mental-health?period=week|month - 트렌드 조회
 * POST /api/mental-health - 체크인 저장 (upsert)
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { trackActivity } from '@/lib/levels';
import type {
  MoodScore,
  StressLevel,
  SleepQuality,
  EnergyLevel,
} from '@/lib/api/mental-health';

// 유효한 점수 범위 검증
function isValidMoodScore(score: number): score is MoodScore {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

function isValidStressLevel(level: number): level is StressLevel {
  return Number.isInteger(level) && level >= 1 && level <= 10;
}

function isValidSleepQuality(quality: number): quality is SleepQuality {
  return Number.isInteger(quality) && quality >= 1 && quality <= 5;
}

function isValidEnergyLevel(level: number): level is EnergyLevel {
  return Number.isInteger(level) && level >= 1 && level <= 5;
}

/**
 * GET /api/mental-health
 * - ?date=YYYY-MM-DD: 특정 날짜 체크인 조회
 * - ?period=week|month: 트렌드 통계 조회
 * - 없으면: 오늘 체크인 + 요약 조회
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const periodParam = searchParams.get('period');

    const supabase = createServiceRoleClient();

    // 트렌드 조회 모드
    if (periodParam) {
      if (periodParam !== 'week' && periodParam !== 'month') {
        return NextResponse.json(
          { error: 'Invalid period. Use "week" or "month"' },
          { status: 400 }
        );
      }

      const days = periodParam === 'week' ? 7 : 30;
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      const { data: logs, error } = await supabase
        .from('mental_health_logs')
        .select('*')
        .eq('clerk_user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('[M-1] Trend fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch trend' }, { status: 500 });
      }

      // 평균 계산
      const moodScores = logs?.filter((l) => l.mood_score !== null).map((l) => l.mood_score) || [];
      const stressLevels =
        logs?.filter((l) => l.stress_level !== null).map((l) => l.stress_level) || [];
      const sleepHours = logs?.filter((l) => l.sleep_hours !== null).map((l) => l.sleep_hours) || [];
      const sleepQualities =
        logs?.filter((l) => l.sleep_quality !== null).map((l) => l.sleep_quality) || [];
      const energyLevels =
        logs?.filter((l) => l.energy_level !== null).map((l) => l.energy_level) || [];

      const avg = (arr: number[]) =>
        arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;

      return NextResponse.json({
        period: periodParam,
        startDate,
        endDate,
        totalLogs: logs?.length || 0,
        avgMoodScore: avg(moodScores),
        avgStressLevel: avg(stressLevels),
        avgSleepHours: avg(sleepHours),
        avgSleepQuality: avg(sleepQualities),
        avgEnergyLevel: avg(energyLevels),
        logs:
          logs?.map((log) => ({
            id: log.id,
            logDate: log.log_date,
            moodScore: log.mood_score,
            stressLevel: log.stress_level,
            sleepHours: log.sleep_hours,
            sleepQuality: log.sleep_quality,
            energyLevel: log.energy_level,
            notes: log.notes,
            createdAt: log.created_at,
          })) || [],
      });
    }

    // 특정 날짜 또는 오늘 조회
    let targetDate: string;
    if (dateParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      targetDate = dateParam;
    } else {
      // 오늘 (한국 시간)
      const now = new Date();
      const koreaOffset = 9 * 60;
      const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
      targetDate = koreaTime.toISOString().split('T')[0];
    }

    const { data: log, error } = await supabase
      .from('mental_health_logs')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('log_date', targetDate)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[M-1] Log fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 });
    }

    // 연속 체크인 일수 계산 (오늘 조회 시에만)
    let streak = 0;
    if (!dateParam && log) {
      streak = 1;
      // 최근 30일 조회하여 연속 일수 계산
      const { data: recentLogs } = await supabase
        .from('mental_health_logs')
        .select('log_date')
        .eq('clerk_user_id', userId)
        .gte('log_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('log_date', targetDate)
        .order('log_date', { ascending: false });

      if (recentLogs) {
        const today = new Date(targetDate);
        for (let i = 1; i < 30; i++) {
          const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
          const hasLog = recentLogs.some((l) => l.log_date === checkDate);
          if (hasLog) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return NextResponse.json({
      date: targetDate,
      hasCheckin: !!log,
      streak,
      log: log
        ? {
            id: log.id,
            logDate: log.log_date,
            moodScore: log.mood_score,
            stressLevel: log.stress_level,
            sleepHours: log.sleep_hours,
            sleepQuality: log.sleep_quality,
            energyLevel: log.energy_level,
            notes: log.notes,
            createdAt: log.created_at,
            updatedAt: log.updated_at,
          }
        : null,
    });
  } catch (error) {
    console.error('[M-1] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/mental-health
 * 정신건강 체크인 저장 (upsert - 같은 날짜면 업데이트)
 *
 * Body:
 * - logDate?: string (YYYY-MM-DD, 없으면 오늘)
 * - moodScore?: number (1-5)
 * - stressLevel?: number (1-10)
 * - sleepHours?: number (0-24)
 * - sleepQuality?: number (1-5)
 * - energyLevel?: number (1-5)
 * - notes?: string
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { logDate, moodScore, stressLevel, sleepHours, sleepQuality, energyLevel, notes } = body;

    // 날짜 검증
    let targetDate: string;
    if (logDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
        return NextResponse.json(
          { error: 'Invalid logDate format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      targetDate = logDate;
    } else {
      const now = new Date();
      const koreaOffset = 9 * 60;
      const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
      targetDate = koreaTime.toISOString().split('T')[0];
    }

    // 점수 검증
    if (moodScore !== undefined && !isValidMoodScore(moodScore)) {
      return NextResponse.json(
        { error: 'Invalid moodScore. Must be 1-5' },
        { status: 400 }
      );
    }

    if (stressLevel !== undefined && !isValidStressLevel(stressLevel)) {
      return NextResponse.json(
        { error: 'Invalid stressLevel. Must be 1-10' },
        { status: 400 }
      );
    }

    if (sleepHours !== undefined) {
      if (typeof sleepHours !== 'number' || sleepHours < 0 || sleepHours > 24) {
        return NextResponse.json(
          { error: 'Invalid sleepHours. Must be 0-24' },
          { status: 400 }
        );
      }
    }

    if (sleepQuality !== undefined && !isValidSleepQuality(sleepQuality)) {
      return NextResponse.json(
        { error: 'Invalid sleepQuality. Must be 1-5' },
        { status: 400 }
      );
    }

    if (energyLevel !== undefined && !isValidEnergyLevel(energyLevel)) {
      return NextResponse.json(
        { error: 'Invalid energyLevel. Must be 1-5' },
        { status: 400 }
      );
    }

    if (notes !== undefined && typeof notes !== 'string') {
      return NextResponse.json({ error: 'Invalid notes. Must be a string' }, { status: 400 });
    }

    // 최소 하나의 값은 있어야 함
    if (
      moodScore === undefined &&
      stressLevel === undefined &&
      sleepHours === undefined &&
      sleepQuality === undefined &&
      energyLevel === undefined &&
      notes === undefined
    ) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Upsert (같은 날짜면 업데이트)
    const { data: log, error } = await supabase
      .from('mental_health_logs')
      .upsert(
        {
          clerk_user_id: userId,
          log_date: targetDate,
          mood_score: moodScore,
          stress_level: stressLevel,
          sleep_hours: sleepHours,
          sleep_quality: sleepQuality,
          energy_level: energyLevel,
          notes: notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_user_id,log_date',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[M-1] Upsert error:', error);
      return NextResponse.json({ error: 'Failed to save checkin' }, { status: 500 });
    }

    // 등급 시스템: 활동 트래킹 (정신건강 체크인은 'checkin' 타입으로 기록)
    await trackActivity(supabase, userId, 'checkin', log?.id);

    return NextResponse.json({
      success: true,
      log: {
        id: log.id,
        logDate: log.log_date,
        moodScore: log.mood_score,
        stressLevel: log.stress_level,
        sleepHours: log.sleep_hours,
        sleepQuality: log.sleep_quality,
        energyLevel: log.energy_level,
        notes: log.notes,
        createdAt: log.created_at,
        updatedAt: log.updated_at,
      },
    });
  } catch (error) {
    console.error('[M-1] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
