'use client';

import { useState, useEffect } from 'react';
import { User, ZapOff, Smartphone, Check, Lightbulb, ImageIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUserProfile, type GenderType } from '@/hooks/useUserProfile';

interface LightingGuideProps {
  onContinue: () => void;
  /** 갤러리에서 선택 핸들러 */
  onGallery?: () => void;
}

export default function LightingGuide({ onContinue, onGallery }: LightingGuideProps) {
  // 사용자 프로필에서 성별 정보 가져오기
  const { profile, updateGender, isLoading: isProfileLoading } = useUserProfile();
  const [selectedGender, setSelectedGender] = useState<GenderType | null>(null);
  const [isGenderSaving, setIsGenderSaving] = useState(false);
  const [autoSkipped, setAutoSkipped] = useState(false);

  // 프로필에서 성별 로드 및 자동 진행
  useEffect(() => {
    if (!isProfileLoading && profile.gender && !autoSkipped) {
      setSelectedGender(profile.gender);
      // 성별이 이미 설정되어 있으면 자동으로 다음 단계로
      setAutoSkipped(true);
      onContinue();
    }
  }, [isProfileLoading, profile.gender, autoSkipped, onContinue]);

  // 성별 선택 핸들러
  const handleGenderSelect = async (gender: GenderType) => {
    setSelectedGender(gender);
    setIsGenderSaving(true);
    try {
      await updateGender(gender);
    } finally {
      setIsGenderSaving(false);
    }
  };

  // 성별이 선택되었는지 확인 (진행 가능 여부)
  const canProceed = selectedGender !== null;

  // 로딩 중이면 로딩 표시
  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div data-testid="skin-lighting-guide" className="space-y-8 animate-fade-in-up">
      {/* 1. 헤더: 전문적인 느낌 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold mb-2">
          Step 1. 촬영 환경 체크
        </div>
        <h2 className="text-2xl font-bold text-foreground leading-tight">
          정확한 분석을 위해
          <br />
          <span className="text-emerald-500">밝은 실내</span>가 좋아요
        </h2>
        <p className="text-muted-foreground">
          조명에 따라 결과가 달라질 수 있어요.
          <br />
          밝은 곳에서 촬영할 준비가 되셨나요?
        </p>
      </div>

      {/* 2. 메인 비주얼: 뷰파인더 UI (Emerald 테마) */}
      <div className="relative mx-auto w-64 h-64 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white dark:border-zinc-800 ring-1 ring-black/5">
        {/* 배경: 부드러운 민트 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-cyan-50/50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20" />

        {/* 가이드 라인 (뷰파인더) */}
        <div className="absolute inset-6 border-2 border-dashed border-emerald-500/30 rounded-3xl" />
        <div className="absolute top-8 left-0 right-0 text-center">
          <span className="text-[10px] font-medium text-muted-foreground bg-white/50 dark:bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm tracking-wider">
            BRIGHT INDOOR
          </span>
        </div>

        {/* 중앙 아이콘 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -top-8 -right-8 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl animate-pulse-light" />

            <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center relative z-10">
              <User className="w-10 h-10 text-muted-foreground/40" />
            </div>

            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md z-20 animate-scale-in">
              <Check className="w-5 h-5 text-white stroke-[3]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 가이드 팁 리스트 */}
      <div className="grid grid-cols-1 gap-3">
        {/* Tip 1 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-card/40 border border-border/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">밝은 실내</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              조명이 얼굴을 고르게 비추는 밝은 곳에서 촬영해주세요.
            </p>
          </div>
        </div>

        {/* Tip 2 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-card/40 border border-border/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">맨 얼굴 권장</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              메이크업 없이 본연의 피부가 보이면 더 정확해요.
            </p>
          </div>
        </div>

        {/* Tip 3 & 4 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
            <div className="w-8 h-8 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
              <ZapOff className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs font-bold mb-0.5">플래시 OFF</p>
            <p className="text-[10px] text-muted-foreground">피부색 왜곡 주의</p>
          </div>
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
            <div className="w-8 h-8 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
              <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs font-bold mb-0.5">기본 카메라</p>
            <p className="text-[10px] text-muted-foreground">필터 사용 자제</p>
          </div>
        </div>
      </div>

      {/* 성별 선택 */}
      <div className="p-4 rounded-2xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">성별 선택</p>
            <p className="text-xs text-muted-foreground">맞춤 스킨케어 추천에 활용돼요</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'male' as GenderType, label: '남성' },
            { id: 'female' as GenderType, label: '여성' },
            { id: 'neutral' as GenderType, label: '선택 안함' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => handleGenderSelect(option.id)}
              disabled={isGenderSaving || isProfileLoading}
              className={cn(
                'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all',
                selectedGender === option.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                (isGenderSaving || isProfileLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="pt-2 space-y-3">
        {/* 성별 미선택 시 안내 메시지 */}
        {!canProceed && !isProfileLoading && (
          <p className="text-xs text-center text-amber-600 dark:text-amber-400">
            성별을 선택해주세요
          </p>
        )}

        <Button
          onClick={onContinue}
          disabled={!canProceed || isGenderSaving}
          className={cn(
            'w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 hover:opacity-90 shadow-lg shadow-emerald-500/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 font-bold text-white',
            (!canProceed || isGenderSaving) && 'opacity-50 cursor-not-allowed'
          )}
        >
          촬영하기
        </Button>

        {onGallery && (
          <Button
            variant="outline"
            onClick={onGallery}
            disabled={!canProceed || isGenderSaving}
            className={cn(
              'w-full h-12 text-base gap-2 rounded-xl',
              (!canProceed || isGenderSaving) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ImageIcon className="w-5 h-5" />
            갤러리에서 선택
          </Button>
        )}
      </div>
    </div>
  );
}
