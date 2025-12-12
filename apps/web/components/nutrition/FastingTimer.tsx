/**
 * N-1 간헐적 단식 타이머 컴포넌트
 * Task 2.17: 간헐적 단식 타이머
 *
 * 기능:
 * - 현재 단식/식사 상태 표시
 * - 남은 시간 카운트다운
 * - 단식 진행률 표시
 * - 설정 페이지 연결
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Utensils, Settings, Clock } from 'lucide-react';

// Props 타입 정의
export interface FastingTimerProps {
  enabled: boolean;
  fastingType: '16:8' | '18:6' | '20:4' | 'custom' | null;
  fastingStartTime: string | null; // HH:mm 형식
  eatingWindowHours: number | null;
  compact?: boolean;
}

// 단식 유형 표시 텍스트
const FASTING_TYPE_LABELS: Record<string, string> = {
  '16:8': '16:8',
  '18:6': '18:6',
  '20:4': '20:4',
  custom: '커스텀',
};

// 시간 파싱 유틸리티
const parseTime = (timeStr: string): { hour: number; minute: number } => {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
};

// 분 단위로 시간 변환
const timeToMinutes = (hour: number, minute: number): number => {
  return hour * 60 + minute;
};

// 분을 시간:분 문자열로 변환
const formatRemainingTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}분`;
  }
  if (mins === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${mins}분`;
};

// 시간 포맷팅 (HH:mm)
const formatTime = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export default function FastingTimer({
  enabled,
  fastingType,
  fastingStartTime,
  eatingWindowHours,
  compact = false,
}: FastingTimerProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1분마다 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분

    return () => clearInterval(interval);
  }, []);

  // 설정 페이지로 이동
  const handleSettingsClick = useCallback(() => {
    router.push('/nutrition/fasting');
  }, [router]);

  // 식사 가능 시간대 계산
  const { eatingStartHour, eatingStartMinute, eatingEndHour, eatingEndMinute } =
    useMemo(() => {
      if (!fastingStartTime || !eatingWindowHours) {
        return {
          eatingStartHour: 0,
          eatingStartMinute: 0,
          eatingEndHour: 0,
          eatingEndMinute: 0,
        };
      }

      const { hour: startHour, minute: startMinute } = parseTime(fastingStartTime);
      const fastingHours = 24 - eatingWindowHours;

      // 식사 시작 시간 = 단식 시작 시간 + 단식 시간
      const eatingStartTotalMinutes =
        (timeToMinutes(startHour, startMinute) + fastingHours * 60) % (24 * 60);
      const eatingStartH = Math.floor(eatingStartTotalMinutes / 60);
      const eatingStartM = eatingStartTotalMinutes % 60;

      // 식사 종료 시간 = 단식 시작 시간
      return {
        eatingStartHour: eatingStartH,
        eatingStartMinute: eatingStartM,
        eatingEndHour: startHour,
        eatingEndMinute: startMinute,
      };
    }, [fastingStartTime, eatingWindowHours]);

  // 현재 상태 계산 (단식 중 / 식사 가능)
  const { isFasting, remainingMinutes, progressPercent } = useMemo(() => {
    if (!enabled || !fastingStartTime || !eatingWindowHours) {
      return { isFasting: false, remainingMinutes: 0, progressPercent: 0 };
    }

    const currentMinutes = timeToMinutes(
      currentTime.getHours(),
      currentTime.getMinutes()
    );
    const eatingStartMinutes = timeToMinutes(eatingStartHour, eatingStartMinute);
    const eatingEndMinutes = timeToMinutes(eatingEndHour, eatingEndMinute);

    // 식사 시간이 자정을 넘는지 확인
    const eatingCrossesMidnight = eatingStartMinutes > eatingEndMinutes;

    let isInEatingWindow: boolean;
    if (eatingCrossesMidnight) {
      // 예: 식사 시간 22:00 ~ 06:00
      isInEatingWindow =
        currentMinutes >= eatingStartMinutes || currentMinutes < eatingEndMinutes;
    } else {
      // 예: 식사 시간 12:00 ~ 20:00
      isInEatingWindow =
        currentMinutes >= eatingStartMinutes && currentMinutes < eatingEndMinutes;
    }

    const fasting = !isInEatingWindow;
    let remaining: number;
    let progress: number;

    const fastingHours = 24 - eatingWindowHours;
    const totalFastingMinutes = fastingHours * 60;
    const totalEatingMinutes = eatingWindowHours * 60;

    if (fasting) {
      // 단식 중: 남은 단식 시간 계산
      if (eatingCrossesMidnight) {
        if (currentMinutes >= eatingEndMinutes && currentMinutes < eatingStartMinutes) {
          // 단식 시간 내 (자정 포함 케이스)
          remaining = eatingStartMinutes - currentMinutes;
        } else {
          remaining = 0;
        }
      } else {
        // 단식 시간이 자정을 넘는 경우
        if (currentMinutes >= eatingEndMinutes) {
          // 저녁 ~ 자정
          remaining = (24 * 60 - currentMinutes) + eatingStartMinutes;
        } else {
          // 자정 ~ 식사 시작
          remaining = eatingStartMinutes - currentMinutes;
        }
      }

      // 단식 진행률 계산
      const elapsedFasting = totalFastingMinutes - remaining;
      progress = Math.min(100, Math.max(0, (elapsedFasting / totalFastingMinutes) * 100));
    } else {
      // 식사 가능: 남은 식사 가능 시간 계산
      if (eatingCrossesMidnight) {
        if (currentMinutes >= eatingStartMinutes) {
          remaining = (24 * 60 - currentMinutes) + eatingEndMinutes;
        } else {
          remaining = eatingEndMinutes - currentMinutes;
        }
      } else {
        remaining = eatingEndMinutes - currentMinutes;
      }

      // 식사 시간 진행률
      const elapsedEating = totalEatingMinutes - remaining;
      progress = Math.min(100, Math.max(0, (elapsedEating / totalEatingMinutes) * 100));
    }

    return {
      isFasting: fasting,
      remainingMinutes: Math.max(0, remaining),
      progressPercent: progress,
    };
  }, [
    enabled,
    fastingStartTime,
    eatingWindowHours,
    currentTime,
    eatingStartHour,
    eatingStartMinute,
    eatingEndHour,
    eatingEndMinute,
  ]);

  // 비활성화 상태
  if (!enabled) {
    return (
      <div
        data-testid="fasting-timer"
        className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Moon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900">간헐적 단식</p>
              <p className="text-sm text-gray-500">단식 타이머를 활성화하세요</p>
            </div>
          </div>
          <button
            onClick={handleSettingsClick}
            className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            설정하기
          </button>
        </div>
      </div>
    );
  }

  // 컴팩트 모드
  if (compact) {
    return (
      <div
        data-testid="fasting-timer-compact"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm border border-gray-100"
      >
        <div
          data-testid="fasting-status-icon"
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isFasting ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
          }`}
        >
          {isFasting ? (
            <Moon className="w-3 h-3" />
          ) : (
            <Utensils className="w-3 h-3" />
          )}
        </div>
        <span className="text-sm font-medium">
          {isFasting ? '단식 중' : '식사 가능'}
        </span>
        <span
          data-testid="remaining-time"
          className="text-sm text-gray-500"
        >
          {formatRemainingTime(remainingMinutes)}
        </span>
      </div>
    );
  }

  // 전체 모드
  return (
    <div
      data-testid="fasting-timer"
      className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">간헐적 단식</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            {fastingType ? FASTING_TYPE_LABELS[fastingType] : ''}
          </span>
        </div>
        <button
          onClick={handleSettingsClick}
          aria-label="단식 설정"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center gap-4 mb-4">
        <div
          data-testid="fasting-status-icon"
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isFasting ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
          }`}
        >
          {isFasting ? (
            <Moon className="w-6 h-6" />
          ) : (
            <Utensils className="w-6 h-6" />
          )}
        </div>
        <div>
          <p className={`text-lg font-bold ${isFasting ? 'text-purple-700' : 'text-green-700'}`}>
            {isFasting ? '단식 중' : '식사 가능'}
          </p>
          <p
            data-testid="remaining-time"
            className="text-sm text-gray-600 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            남은 시간: {formatRemainingTime(remainingMinutes)}
          </p>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div
        data-testid="fasting-progress"
        className="mb-4"
      >
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFasting ? 'bg-purple-500' : 'bg-green-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 시간 정보 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 text-xs">단식 시작</p>
          <p className="font-medium text-gray-900">{fastingStartTime}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500 text-xs">식사 가능 시간</p>
          <p className="font-medium text-gray-900">
            {formatTime(eatingStartHour, eatingStartMinute)} ~ {formatTime(eatingEndHour, eatingEndMinute)}
          </p>
        </div>
      </div>
    </div>
  );
}
