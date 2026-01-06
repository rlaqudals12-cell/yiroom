'use client';

import { Sun, User, Shirt, Ruler, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BodyPhotographyGuideProps {
  onContinue: () => void;
  onSkip?: () => void;
}

export default function BodyPhotographyGuide({ onContinue, onSkip }: BodyPhotographyGuideProps) {
  return (
    <div data-testid="body-photography-guide" className="space-y-8 animate-fade-in-up">
      {/* 1. 헤더 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold mb-2">
          Step 1. 촬영 환경 체크
        </div>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          정확한 체형 분석을 위해
          <br />
          <span className="text-blue-500">전신 촬영</span>이 필요해요
        </h2>
        <p className="text-muted-foreground">
          옷차림과 자세에 따라 결과가 달라질 수 있어요.
          <br />
          아래 가이드를 꼭 확인해주세요.
        </p>
      </div>

      {/* 2. 메인 비주얼: 전신 뷰파인더 UI (Blue 테마) */}
      <div className="relative mx-auto w-56 h-80 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white dark:border-zinc-800 ring-1 ring-black/5">
        {/* 배경: 인디고/블루 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-violet-50/50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20" />

        {/* 가이드 라인 (전신) */}
        <div className="absolute inset-6 border-2 border-dashed border-blue-500/30 rounded-[1.5rem]" />

        {/* 상단 텍스트 */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <span className="text-[10px] font-medium text-muted-foreground bg-white/50 dark:bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm tracking-wider">
            FULL BODY SHOT
          </span>
        </div>

        {/* 중앙 아이콘 (전신 실루엣) */}
        <div className="absolute inset-0 flex items-center justify-center pt-4">
          <div className="relative">
            {/* 빛 효과 */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse-light" />

            {/* 사람 형상 */}
            <User className="w-32 h-32 text-slate-400/40" strokeWidth={1} />

            {/* 체크 표시 */}
            <div className="absolute bottom-0 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md z-20 animate-scale-in">
              <Check className="w-5 h-5 text-white stroke-[3]" />
            </div>
          </div>
        </div>

        {/* 하단 카메라 아이콘 */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-50">
          <Camera className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* 3. 가이드 팁 리스트 */}
      <div className="grid grid-cols-1 gap-3">
        {/* Tip 1: 전신 촬영 & 조명 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-card/40 border border-border/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">밝은 곳에서 전신 촬영</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              머리부터 발끝까지 전신이 잘 보이는 밝은 곳에서 촬영해주세요.
            </p>
          </div>
        </div>

        {/* Tip 2: 옷차림 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-card/40 border border-border/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Shirt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">몸에 붙는 옷 권장</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              체형 라인이 잘 드러나는 레깅스나 타이트한 티셔츠를 입어주세요.
            </p>
          </div>
        </div>

        {/* Tip 3: 자세 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-card/40 border border-border/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Ruler className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">바른 자세 유지</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              다리를 모으고 팔을 자연스럽게 내린 정면 자세가 가장 정확해요.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="pt-2 space-y-3">
        <Button
          onClick={onContinue}
          className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 hover:opacity-90 shadow-lg shadow-blue-500/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 font-bold text-white"
        >
          촬영하기
        </Button>

        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-center text-sm text-muted-foreground hover:text-blue-600 transition-colors py-2"
          >
            이미 체형 타입을 알고 있어요
          </button>
        )}
      </div>
    </div>
  );
}
