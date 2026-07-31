'use client';

import { Sun, User, Shirt, Ruler, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BodyPhotographyGuideProps {
  onContinue: () => void;
}

export default function BodyPhotographyGuide({ onContinue }: BodyPhotographyGuideProps) {
  return (
    <div data-testid="body-photography-guide" className="space-y-8 animate-fade-in-up">
      {/* 1. 헤더 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          Step 1. 촬영 환경 체크
        </div>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          정확한 체형 분석을 위해
          <br />
          <span className="text-primary">전신 촬영</span>이 필요해요
        </h2>
        <p className="text-muted-foreground">
          옷차림과 자세에 따라 결과가 달라질 수 있어요.
          <br />
          아래 가이드를 꼭 확인해주세요.
        </p>
      </div>

      {/* 2. 메인 비주얼: 전신 뷰파인더 UI — 웜 섀도 토큰(raised)·글로우/블러 금지 */}
      <div className="relative mx-auto w-56 h-80 bg-card rounded-[2rem] overflow-hidden shadow-lg dark:shadow-none border-4 border-background ring-1 ring-border">
        {/* 배경: 지면과의 명도 단차 */}
        <div className="absolute inset-0 bg-muted/50" />

        {/* 가이드 라인 (전신) */}
        <div className="absolute inset-6 border-2 border-dashed border-primary/30 rounded-[1.5rem]" />

        {/* 상단 텍스트 */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <span className="text-[10px] font-medium text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">
            전신 촬영
          </span>
        </div>

        {/* 중앙 아이콘 (전신 실루엣) */}
        <div className="absolute inset-0 flex items-center justify-center pt-4">
          <div className="relative">
            {/* 사람 형상 */}
            <User className="w-32 h-32 text-muted-foreground/40" strokeWidth={1} />

            {/* 체크 표시 */}
            <div className="absolute bottom-0 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm dark:shadow-none z-20 animate-scale-in">
              <Check className="w-5 h-5 text-primary-foreground stroke-[3]" />
            </div>
          </div>
        </div>

        {/* 하단 카메라 아이콘 */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-50">
          <Camera className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>

      {/* 3. 가이드 팁 리스트 */}
      <div className="grid grid-cols-1 gap-3">
        {/* Tip 1: 전신 촬영 & 조명 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm dark:shadow-none">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">밝은 곳에서 전신 촬영</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              머리부터 발끝까지 전신이 잘 보이는 밝은 곳에서 촬영해주세요.
            </p>
          </div>
        </div>

        {/* Tip 2: 옷차림 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm dark:shadow-none">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Shirt className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">몸에 붙는 옷 권장</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              체형 라인이 잘 드러나는 레깅스나 타이트한 티셔츠를 입어주세요.
            </p>
          </div>
        </div>

        {/* Tip 3: 자세 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm dark:shadow-none">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Ruler className="w-5 h-5 text-muted-foreground" />
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
          className="w-full h-14 text-lg bg-primary hover:opacity-90 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 font-bold"
        >
          촬영하기
        </Button>
      </div>
    </div>
  );
}
