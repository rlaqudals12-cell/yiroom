'use client';

import { Sun, User, CircleOff, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PHOTO_GUIDE_TIPS } from '@/lib/mock/personal-color';

interface LightingGuideProps {
  onContinue: () => void;
  onSkip?: () => void;
}

// 아이콘 매핑
const iconMap = {
  sun: Sun,
  face: User,
  shadow: CircleOff,
  position: Move,
} as const;

export default function LightingGuide({ onContinue, onSkip }: LightingGuideProps) {
  return (
    <div data-testid="lighting-guide" className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          정확한 진단을 위한 촬영 가이드
        </h2>
        <p className="text-sm text-muted-foreground">
          아래 조건에서 촬영하면 더 정확한 결과를 받을 수 있어요
        </p>
      </div>

      {/* 가이드 일러스트 */}
      <div className="relative mx-auto w-48 h-48 bg-gradient-to-br from-amber-50 to-sky-50 rounded-2xl overflow-hidden border border-border">
        {/* 창문 표현 */}
        <div className="absolute top-2 right-2 w-12 h-16 bg-sky-200 rounded-sm border-2 border-sky-300">
          <div className="absolute inset-1 bg-gradient-to-b from-sky-100 to-sky-200 rounded-sm" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-sky-300" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sky-300" />
        </div>

        {/* 빛 표현 */}
        <div className="absolute top-4 right-16 w-20 h-20 bg-amber-100/50 rounded-full blur-xl" />

        {/* 얼굴 실루엣 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="w-20 h-24 bg-rose-100 rounded-t-full border-2 border-rose-200 flex items-center justify-center">
            <div className="w-16 h-20 flex flex-col items-center pt-4">
              {/* 눈 */}
              <div className="flex gap-4 mb-2">
                <div className="w-2 h-1 bg-rose-300 rounded-full" />
                <div className="w-2 h-1 bg-rose-300 rounded-full" />
              </div>
              {/* 코 */}
              <div className="w-1 h-3 bg-rose-200 rounded-full mb-2" />
              {/* 입 */}
              <div className="w-4 h-1 bg-rose-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* 체크 표시 */}
        <div className="absolute top-2 left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* 가이드 팁 목록 */}
      <div className="grid grid-cols-2 gap-3">
        {PHOTO_GUIDE_TIPS.map((tip) => {
          const Icon = iconMap[tip.icon as keyof typeof iconMap] || Sun;
          return (
            <div
              key={tip.icon}
              className="p-4 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-module-personal-color/10 rounded-full flex items-center justify-center">
                  <Icon className="w-4 h-4 text-module-personal-color" />
                </div>
                <span className="font-medium text-sm text-foreground">{tip.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tip.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 주의사항 */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
              자연광이 가장 좋아요
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              형광등이나 백열등 아래에서는 피부색이 왜곡될 수 있어요.
              낮 시간에 창문 근처에서 촬영해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="space-y-2">
        <Button
          onClick={onContinue}
          className="w-full h-12 bg-gradient-personal-color hover:opacity-90 text-white font-medium"
        >
          촬영하기
        </Button>
        {onSkip && (
          <Button
            onClick={onSkip}
            variant="ghost"
            className="w-full h-10 text-muted-foreground hover:text-foreground"
          >
            이미 퍼스널컬러를 알고 있어요
          </Button>
        )}
      </div>
    </div>
  );
}
