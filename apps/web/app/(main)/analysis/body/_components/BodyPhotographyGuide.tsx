'use client';

import { Sun, User, Shirt, Ruler, Camera, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BODY_PHOTO_GUIDE_TIPS } from '@/lib/mock/body-analysis';

interface BodyPhotographyGuideProps {
  onContinue: () => void;
  onSkip?: () => void; // 기존 체형 타입 입력으로 이동
}

// 아이콘 매핑
const iconMap = {
  sun: Sun,
  shirt: Shirt,
  user: User,
  ruler: Ruler,
} as const;

export default function BodyPhotographyGuide({ onContinue, onSkip }: BodyPhotographyGuideProps) {
  return (
    <div data-testid="body-photography-guide" className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          정확한 분석을 위한 촬영 가이드
        </h2>
        <p className="text-sm text-muted-foreground">
          아래 조건에서 촬영하면 더 정확한 결과를 받을 수 있어요
        </p>
      </div>

      {/* 가이드 일러스트 - 전신 실루엣 */}
      <div className="relative mx-auto w-48 h-64 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-300 overflow-hidden">
        {/* 배경 그라데이션 (은은한 블루) */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/50" />

        {/* 전신 가이드 라인 */}
        <div className="absolute inset-4 border border-blue-200/50 rounded-xl" />

        {/* 중앙 아이콘 그룹 */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          {/* 전신 실루엣 */}
          <User className="w-24 h-24 text-slate-400 stroke-[1]" />

          {/* 카메라 아이콘 (하단) */}
          <div className="flex items-center gap-1 text-blue-500">
            <Camera className="w-5 h-5" />
            <span className="text-xs font-medium">전신 촬영</span>
          </div>
        </div>

        {/* 우측 상단 전구 아이콘 */}
        <div className="absolute top-3 right-3 animate-pulse">
          <div className="relative">
            <Lightbulb className="w-8 h-8 text-amber-400 fill-amber-50 stroke-[1.5]" />
            {/* 빛 번짐 효과 */}
            <div className="absolute inset-0 bg-amber-200 blur-lg opacity-40 rounded-full" />
          </div>
        </div>
      </div>

      {/* 가이드 팁 목록 */}
      <div className="grid grid-cols-2 gap-3">
        {BODY_PHOTO_GUIDE_TIPS.map((tip) => {
          const Icon = iconMap[tip.icon as keyof typeof iconMap] || Sun;
          return (
            <div
              key={tip.icon}
              className="p-3 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
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
      <div className="p-4 bg-secondary/30 rounded-xl border border-border">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shirt className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">
              체형이 잘 드러나는 옷을 입어주세요
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              레깅스, 타이트한 티셔츠 등 몸에 붙는 옷을 입으면
              어깨, 허리, 골반 라인을 정확하게 분석할 수 있어요.
            </p>
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <Button
        onClick={onContinue}
        className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-xl hover:-translate-y-0.5 transition-all shadow-sm"
      >
        다음
      </Button>

      {/* 기존 체형 타입 알고 있는 경우 */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          이미 체형 타입을 알고 있어요
        </button>
      )}
    </div>
  );
}
