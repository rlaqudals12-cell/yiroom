'use client';

import { Sun, User, LightbulbOff, Smartphone, Check, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LightingGuideProps {
  onContinue: () => void;
  onSkip?: () => void;
  /** 갤러리에서 선택 핸들러 */
  onGallery?: () => void;
}

export default function LightingGuide({ onContinue, onSkip, onGallery }: LightingGuideProps) {
  return (
    <div data-testid="lighting-guide" className="space-y-8 animate-fade-in-up">
      {/* 1. 헤더: 전문적인 느낌의 뱃지와 타이포그래피 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          Step 1. 촬영 환경 체크
        </div>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          더 정확한 분석을 위해
          <br />
          <span className="text-primary">자연광</span> 아래가 좋아요
        </h2>
        <p className="text-muted-foreground">
          조명에 따라 결과가 달라질 수 있어요.
          <br />
          밝은 곳에서 촬영할 준비가 되셨나요?
        </p>
      </div>

      {/* 2. 메인 비주얼: 유치한 그림 대신 세련된 뷰파인더 UI 적용 */}
      <div className="relative mx-auto w-64 h-64 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white dark:border-zinc-800 ring-1 ring-black/5">
        {/* 배경: 부드러운 그라디언트 (피부톤 암시) */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 via-amber-50/50 to-sky-100/50 dark:from-rose-900/20 dark:via-amber-900/20 dark:to-sky-900/20" />

        {/* 가이드 라인 (뷰파인더) */}
        <div className="absolute inset-6 border-2 border-dashed border-primary/30 rounded-3xl" />
        <div className="absolute top-8 left-0 right-0 text-center">
          <span className="text-[10px] font-medium text-muted-foreground bg-white/50 dark:bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm tracking-wider">
            NATURAL LIGHT ONLY
          </span>
        </div>

        {/* 중앙 아이콘 (추상적 표현) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* 빛 효과 애니메이션 */}
            <div className="absolute -top-8 -right-8 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse-light" />

            <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center relative z-10">
              <User className="w-10 h-10 text-muted-foreground/40" />
            </div>

            {/* 체크 표시 뱃지 */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md z-20 animate-scale-in">
              <Check className="w-5 h-5 text-white stroke-[3]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 가이드 비교 (Good vs Bad): 시각적 대비 강조 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Good Case */}
        <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 text-center transition-colors hover:bg-green-50 dark:hover:bg-green-900/20">
          <div className="w-10 h-10 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
            <Sun className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-bold text-sm text-foreground mb-1">자연광 추천</p>
          <p className="text-xs text-muted-foreground">창가 앞이 가장 좋아요</p>
        </div>

        {/* Bad Case */}
        <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-center transition-colors hover:bg-red-50 dark:hover:bg-red-900/20">
          <div className="w-10 h-10 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
            <LightbulbOff className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="font-bold text-sm text-foreground mb-1">어두운 곳 X</p>
          <p className="text-xs text-muted-foreground">그림자가 생겨요</p>
        </div>
      </div>

      {/* 4. 추가 팁 리스트: 가독성 높은 레이아웃 */}
      <div className="space-y-3">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">맨 얼굴 권장</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              정확한 진단을 위해 메이크업이나 컬러 렌즈는 잠시 제거해주세요.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">기본 카메라 사용</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              필터가 있는 앱은 피부색을 왜곡시켜요. 기본 카메라를 사용해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 버튼: 그라디언트 및 그림자 효과 강화 */}
      <div className="pt-4 space-y-3">
        <Button
          onClick={onContinue}
          className="w-full h-14 text-lg bg-gradient-brand hover:opacity-90 shadow-lg shadow-primary/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 font-bold"
        >
          촬영 시작하기
        </Button>

        {onGallery && (
          <Button
            variant="outline"
            onClick={onGallery}
            className="w-full h-12 text-base gap-2 rounded-xl"
          >
            <ImageIcon className="w-5 h-5" />
            갤러리에서 선택
          </Button>
        )}

        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors py-2"
          >
            이미 퍼스널 컬러를 알고 있어요
          </button>
        )}
      </div>
    </div>
  );
}
