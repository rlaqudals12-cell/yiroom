'use client';

import { useState, useEffect } from 'react';
import { Sun, User, LightbulbOff, Smartphone, Check, ImageIcon, Shirt, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useUserProfile, type GenderType } from '@/hooks/useUserProfile';

interface LightingGuideProps {
  onContinue: (consentToSaveImage: boolean) => void;
  onSkip?: () => void;
  /** 갤러리에서 선택 핸들러 */
  onGallery?: (consentToSaveImage: boolean) => void;
}

export default function LightingGuide({ onContinue, onSkip, onGallery }: LightingGuideProps) {
  // 기본값: 체크됨 (드레이핑 기능 활성화)
  const [consentToSaveImage, setConsentToSaveImage] = useState(true);

  // 사용자 프로필에서 성별 정보 가져오기
  const { profile, updateGender, isLoading: isProfileLoading } = useUserProfile();
  const [selectedGender, setSelectedGender] = useState<GenderType | null>(null);
  const [isGenderSaving, setIsGenderSaving] = useState(false);

  // 프로필에서 성별 로드
  useEffect(() => {
    if (!isProfileLoading && profile.gender) {
      setSelectedGender(profile.gender);
    }
  }, [isProfileLoading, profile.gender]);

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

      {/* 성별 선택 */}
      <div className="p-4 rounded-2xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">성별 선택</p>
            <p className="text-xs text-muted-foreground">맞춤 스타일 추천에 활용돼요</p>
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
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                (isGenderSaving || isProfileLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 이미지 저장 동의 체크박스 */}
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="consent-save-image"
            checked={consentToSaveImage}
            onCheckedChange={(checked) => setConsentToSaveImage(checked === true)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shirt className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                드레이핑 시뮬레이션 사용
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              분석 이미지를 30일간 저장하여 다양한 색상을 얼굴에 비교해볼 수 있어요.
              <br />
              <span className="text-primary/80">미동의 시 드레이핑 기능을 사용할 수 없습니다.</span>
            </p>
          </div>
        </label>
      </div>

      {/* 하단 버튼: 그라디언트 및 그림자 효과 강화 */}
      <div className="pt-4 space-y-3">
        {/* 성별 미선택 시 안내 메시지 */}
        {!canProceed && !isProfileLoading && (
          <p className="text-xs text-center text-amber-600 dark:text-amber-400">
            성별을 선택해주세요
          </p>
        )}

        <Button
          onClick={() => onContinue(consentToSaveImage)}
          disabled={!canProceed || isGenderSaving}
          className={cn(
            'w-full h-14 text-lg bg-gradient-brand hover:opacity-90 shadow-lg shadow-primary/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 font-bold',
            (!canProceed || isGenderSaving) && 'opacity-50 cursor-not-allowed'
          )}
        >
          촬영 시작하기
        </Button>

        {onGallery && (
          <Button
            variant="outline"
            onClick={() => onGallery(consentToSaveImage)}
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
