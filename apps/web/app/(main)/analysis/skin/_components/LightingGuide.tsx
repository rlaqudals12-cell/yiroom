'use client';

import { Sun, User, ZapOff, Move, Camera, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SKIN_PHOTO_GUIDE_TIPS } from '@/lib/mock/skin-analysis';

interface LightingGuideProps {
  onContinue: () => void;
  onSkip?: () => void; // 기존 피부 타입 입력으로 이동
}

// 아이콘 매핑
const iconMap = {
  sun: Sun,
  face: User,
  shadow: ZapOff,
  position: Move,
} as const;

export default function LightingGuide({ onContinue, onSkip }: LightingGuideProps) {
  return (
    <div data-testid="skin-lighting-guide" className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          정확한 분석을 위한 촬영 가이드
        </h2>
        <p className="text-sm text-muted-foreground">
          아래 조건에서 촬영하면 더 정확한 결과를 받을 수 있어요
        </p>
      </div>

      {/* 가이드 일러스트 - 모던 & 미니멀 스타일 */}
      <div className="relative mx-auto w-48 h-48 rounded-full flex items-center justify-center border border-border overflow-hidden shadow-sm">
        {/* 배경 그라데이션 (은은한 민트/그린) */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50/50" />

        {/* 장식용 내부 원형 라인 */}
        <div className="absolute inset-3 border border-white/50 rounded-full" />
        <div className="absolute inset-8 border border-white/30 rounded-full" />

        {/* 중앙 아이콘 그룹 */}
        <div className="relative z-10">
          <Camera className="w-20 h-20 text-slate-700 stroke-[1]" />

          {/* 우측 상단 전구 아이콘 (실내 조명 강조) */}
          <div className="absolute -top-5 -right-5 animate-pulse">
            <div className="relative">
              <Lightbulb className="w-10 h-10 text-amber-400 fill-amber-50 stroke-[1.5]" />
              {/* 빛 번짐 효과 */}
              <div className="absolute inset-0 bg-amber-200 blur-xl opacity-40 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 가이드 팁 목록 */}
      <div className="grid grid-cols-2 gap-3">
        {SKIN_PHOTO_GUIDE_TIPS.map((tip) => {
          const Icon = iconMap[tip.icon as keyof typeof iconMap] || Sun;
          return (
            <div
              key={tip.icon}
              className="p-3 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" />
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
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">
              밝은 실내에서 촬영해주세요
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              형광등 바로 아래보다는 조명이 고르게 퍼지는 곳이 좋아요.
              플래시는 피부 상태를 왜곡시키니 꺼주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <Button
        onClick={onContinue}
        className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-xl hover:-translate-y-0.5 transition-all shadow-sm"
      >
        촬영하기
      </Button>

      {/* 기존 피부 타입 알고 있는 경우 */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          이미 피부 타입을 알고 있어요
        </button>
      )}
    </div>
  );
}
