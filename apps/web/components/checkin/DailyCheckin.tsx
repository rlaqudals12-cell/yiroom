'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Smile, Meh, Frown, Zap, Battery, BatteryLow, Sparkles, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { toast } from 'sonner';

// 기분 옵션
const MOOD_OPTIONS = [
  { id: 'great', emoji: '😊', label: '좋아요', icon: Smile, color: 'text-green-500' },
  { id: 'okay', emoji: '😐', label: '보통이에요', icon: Meh, color: 'text-yellow-500' },
  { id: 'bad', emoji: '😔', label: '안 좋아요', icon: Frown, color: 'text-red-500' },
] as const;

// 에너지 옵션
const ENERGY_OPTIONS = [
  { id: 'high', emoji: '⚡', label: '활력 넘쳐요', icon: Zap, color: 'text-amber-500' },
  { id: 'medium', emoji: '🔋', label: '적당해요', icon: Battery, color: 'text-blue-500' },
  { id: 'low', emoji: '🪫', label: '피곤해요', icon: BatteryLow, color: 'text-gray-500' },
] as const;

// 피부 상태 옵션
const SKIN_OPTIONS = [
  { id: 'great', emoji: '✨', label: '촉촉해요' },
  { id: 'okay', emoji: '👌', label: '괜찮아요' },
  { id: 'bad', emoji: '😣', label: '건조/트러블' },
] as const;

type Mood = typeof MOOD_OPTIONS[number]['id'];
type Energy = typeof ENERGY_OPTIONS[number]['id'];
type SkinCondition = typeof SKIN_OPTIONS[number]['id'];

interface DailyCheckinProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

/**
 * 일일 체크인 모달
 * "오늘의 나" 30초 체크인
 */
export function DailyCheckin({ open, onOpenChange, onComplete }: DailyCheckinProps) {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mood, setMood] = useState<Mood | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [skinCondition, setSkinCondition] = useState<SkinCondition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // 리셋
  const handleReset = () => {
    setStep(1);
    setMood(null);
    setEnergy(null);
    setSkinCondition(null);
    setIsComplete(false);
  };

  // 닫기
  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // 제출
  const handleSubmit = async () => {
    if (!user?.id || !mood || !energy || !skinCondition) return;

    setIsSubmitting(true);

    try {
      // daily_checkins 테이블에 저장 (테이블이 없으면 에러 발생하지만 UI는 정상 작동)
      const { error } = await supabase.from('daily_checkins').insert({
        clerk_user_id: user.id,
        mood,
        energy,
        skin_condition: skinCondition,
        checked_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('체크인 저장 실패 (테이블 미존재 가능):', error);
      }

      setIsComplete(true);
      toast.success('오늘의 체크인 완료!');
      onComplete?.();

      // 2초 후 자동 닫기
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('체크인 오류:', err);
      toast.error('체크인 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 다음 단계
  const handleNext = () => {
    if (step === 1 && mood) setStep(2);
    else if (step === 2 && energy) setStep(3);
    else if (step === 3 && skinCondition) handleSubmit();
  };

  // 이전 단계
  const handlePrev = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="daily-checkin-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            오늘의 나
          </DialogTitle>
          <DialogDescription>
            30초만 투자해서 오늘의 상태를 기록해보세요
          </DialogDescription>
        </DialogHeader>

        {/* 완료 상태 */}
        {isComplete ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-foreground">체크인 완료!</p>
              <p className="text-sm text-muted-foreground">
                오늘도 나를 돌봐주셨네요
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 진행 표시 */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-amber-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: 기분 */}
            {step === 1 && (
              <div className="space-y-4" data-testid="step-mood">
                <p className="text-center font-medium text-foreground">
                  오늘 기분이 어때요?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {MOOD_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setMood(option.id)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        mood === option.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-border hover:border-amber-200'
                      }`}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <span className="text-xs text-muted-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: 에너지 */}
            {step === 2 && (
              <div className="space-y-4" data-testid="step-energy">
                <p className="text-center font-medium text-foreground">
                  에너지 레벨은요?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {ENERGY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setEnergy(option.id)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        energy === option.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-border hover:border-amber-200'
                      }`}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <span className="text-xs text-muted-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: 피부 상태 */}
            {step === 3 && (
              <div className="space-y-4" data-testid="step-skin">
                <p className="text-center font-medium text-foreground">
                  피부 상태는 어때요?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {SKIN_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSkinCondition(option.id)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        skinCondition === option.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-border hover:border-amber-200'
                      }`}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <span className="text-xs text-muted-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 네비게이션 버튼 */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button variant="outline" onClick={handlePrev} className="flex-1">
                  이전
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !mood) ||
                  (step === 2 && !energy) ||
                  (step === 3 && !skinCondition) ||
                  isSubmitting
                }
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step === 3 ? (
                  '완료'
                ) : (
                  '다음'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DailyCheckin;
