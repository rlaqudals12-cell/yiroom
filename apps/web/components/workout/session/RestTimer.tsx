'use client';

import { useEffect, useState, useCallback } from 'react';
import { Timer, Minus, Plus, SkipForward, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  defaultSeconds?: number;  // 기본값 버튼에 표시할 시간 (운동 타입에 따라 달라짐)
  onComplete: () => void;
  onSkip: () => void;
  onAdjust?: (delta: number) => void;
}

/**
 * 휴식 타이머 컴포넌트
 * - 세트 완료 후 자동 시작
 * - 10초 단위 조절
 * - 사운드/진동 알림
 */
export function RestTimer({
  initialSeconds,
  defaultSeconds = 60,
  onComplete,
  onSkip,
  onAdjust,
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 시간 포맷팅 (mm:ss)
  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }, []);

  // 진행률 계산
  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

  // 타이머 동작
  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          // 완료 사운드
          if (soundEnabled && typeof window !== 'undefined') {
            try {
              const audio = new Audio('/sounds/timer-complete.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch {
              // 사운드 재생 실패 무시
            }
            // 진동 (모바일)
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
          }
          setTimeout(onComplete, 100);
          return 0;
        }
        // 10초 전 알림
        if (prev === 11 && soundEnabled && typeof window !== 'undefined') {
          try {
            const audio = new Audio('/sounds/timer-warning.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {
            // 사운드 재생 실패 무시
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, seconds, soundEnabled, onComplete]);

  // 시간 조절 (스펙: 30초 ~ 3분)
  const adjustTime = (delta: number) => {
    const newTime = Math.max(30, Math.min(180, seconds + delta));
    setSeconds(newTime);
    onAdjust?.(delta);
  };

  // 기본 시간으로 리셋
  const resetToDefault = () => {
    setSeconds(defaultSeconds);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center"
      data-testid="rest-timer"
    >
      {/* 상단 헤더 */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-white/80">
          <Timer className="w-5 h-5" />
          <span className="text-sm font-medium">휴식 시간</span>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label={soundEnabled ? '소리 끄기' : '소리 켜기'}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-white/80" />
          ) : (
            <VolumeX className="w-5 h-5 text-white/40" />
          )}
        </button>
      </div>

      {/* 타이머 원형 */}
      <div className="relative w-64 h-64">
        {/* 배경 원 */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* 진행 원 */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke={seconds <= 10 ? '#ef4444' : '#6366f1'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className="transition-all duration-1000"
          />
        </svg>

        {/* 중앙 시간 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-6xl font-bold ${
              seconds <= 10 ? 'text-red-500' : 'text-white'
            }`}
          >
            {formatTime(seconds)}
          </span>
          {seconds <= 10 && seconds > 0 && (
            <span className="text-red-400 text-sm mt-2 animate-pulse">
              곧 다음 세트!
            </span>
          )}
        </div>
      </div>

      {/* 시간 조절 버튼 */}
      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={() => adjustTime(-10)}
          className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={seconds <= 30}
          aria-label="10초 감소"
        >
          <Minus className="w-5 h-5 text-white" />
          <span className="text-white text-sm">10초</span>
        </button>
        <button
          onClick={resetToDefault}
          className="px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 flex items-center gap-2 transition-colors"
          aria-label={`기본 ${defaultSeconds}초로 리셋`}
        >
          <RotateCcw className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">기본 {defaultSeconds}초</span>
        </button>
        <button
          onClick={() => adjustTime(10)}
          className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={seconds >= 180}
          aria-label="10초 증가"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-white text-sm">10초</span>
        </button>
      </div>

      {/* 건너뛰기 버튼 */}
      <button
        onClick={onSkip}
        className="mt-12 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors"
      >
        <SkipForward className="w-5 h-5 text-white" />
        <span className="text-white font-medium">휴식 건너뛰기</span>
      </button>

      {/* 하단 안내 */}
      <p className="absolute bottom-8 text-white/40 text-sm">
        다음 세트 준비하세요
      </p>
    </div>
  );
}
