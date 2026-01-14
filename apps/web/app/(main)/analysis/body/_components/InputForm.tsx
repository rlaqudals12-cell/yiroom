'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Ruler, Scale, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUserProfile, type GenderType } from '@/hooks/useUserProfile';

export interface UserBodyInput {
  height: number;
  weight: number;
  targetWeight?: number;
  gender?: GenderType;
}

interface InputFormProps {
  onSubmit: (data: UserBodyInput) => void;
}

export default function InputForm({ onSubmit }: InputFormProps) {
  const {
    profile,
    updateGender,
    updatePhysicalInfo,
    isLoading: isProfileLoading,
  } = useUserProfile();
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<GenderType | null>(null);
  const [isGenderSaving, setIsGenderSaving] = useState(false);
  const [errors, setErrors] = useState<{ height?: string; weight?: string; gender?: string }>({});

  // 사용자 프로필에서 기존 정보 로드
  useEffect(() => {
    if (!isProfileLoading) {
      if (profile.gender) {
        setSelectedGender(profile.gender);
      }
      if (profile.heightCm) {
        setHeight(profile.heightCm.toString());
      }
      if (profile.weightKg) {
        setWeight(profile.weightKg.toString());
      }
    }
  }, [isProfileLoading, profile.gender, profile.heightCm, profile.weightKg]);

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

  // 입력값 검증
  const validate = (): boolean => {
    const newErrors: { height?: string; weight?: string; gender?: string } = {};
    const heightNum = Number(height);
    const weightNum = Number(weight);

    if (!selectedGender) {
      newErrors.gender = '성별을 선택해주세요';
    }
    if (!height || isNaN(heightNum)) {
      newErrors.height = '키를 입력해주세요';
    } else if (heightNum < 100 || heightNum > 250) {
      newErrors.height = '100~250cm 사이로 입력해주세요';
    }
    if (!weight || isNaN(weightNum)) {
      newErrors.weight = '몸무게를 입력해주세요';
    } else if (weightNum < 20 || weightNum > 200) {
      newErrors.weight = '20~200kg 사이로 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 제출 핸들러
  const handleSubmit = async () => {
    if (!validate()) return;
    const heightNum = Number(height);
    const weightNum = Number(weight);
    await updatePhysicalInfo(heightNum, weightNum);
    onSubmit({
      height: heightNum,
      weight: weightNum,
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
      gender: selectedGender || undefined,
    });
  };

  // BMI 미리보기 계산
  const previewBMI = (): string | null => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w || h < 100 || w < 20) return null;
    const bmi = w / (h / 100) ** 2;
    return bmi.toFixed(1);
  };

  const bmi = previewBMI();
  const canProceed = selectedGender !== null && height && weight;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          정확한 체형 분석을 위해
          <br />
          기본 정보를 입력해주세요
        </p>
      </div>

      <div className="space-y-4">
        {/* 성별 선택 */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-module-body/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-module-body" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                성별 <span className="text-red-500">*</span>
              </p>
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
                    ? 'bg-module-body text-white border-module-body shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                  (isGenderSaving || isProfileLoading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.gender && <p className="mt-2 text-sm text-red-500">{errors.gender}</p>}
        </div>

        {/* 키 입력 */}
        <div>
          <label
            htmlFor="height"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2"
          >
            <Ruler className="w-4 h-4" />키 (cm) <span className="text-red-500">*</span>
          </label>
          <input
            id="height"
            type="number"
            inputMode="numeric"
            placeholder="예: 165"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-module-body ${errors.height ? 'border-red-500' : 'border-border'}`}
            aria-describedby={errors.height ? 'height-error' : undefined}
            aria-invalid={!!errors.height}
          />
          {errors.height && (
            <p id="height-error" className="mt-1 text-sm text-red-500">
              {errors.height}
            </p>
          )}
        </div>

        {/* 몸무게 입력 */}
        <div>
          <label
            htmlFor="weight"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2"
          >
            <Scale className="w-4 h-4" />
            몸무게 (kg) <span className="text-red-500">*</span>
          </label>
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder="예: 55"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-module-body ${errors.weight ? 'border-red-500' : 'border-border'}`}
            aria-describedby={errors.weight ? 'weight-error' : undefined}
            aria-invalid={!!errors.weight}
          />
          {errors.weight && (
            <p id="weight-error" className="mt-1 text-sm text-red-500">
              {errors.weight}
            </p>
          )}
        </div>

        {/* 목표 몸무게 입력 (선택) */}
        <div>
          <label
            htmlFor="targetWeight"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2"
          >
            <Scale className="w-4 h-4" />
            목표 몸무게 (kg) <span className="text-muted-foreground">(선택)</span>
          </label>
          <input
            id="targetWeight"
            type="number"
            inputMode="decimal"
            placeholder="예: 50"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-module-body"
          />
        </div>
      </div>

      {/* BMI 미리보기 */}
      {bmi && (
        <div className="bg-module-body-light rounded-lg p-4">
          <p className="text-sm text-module-body-dark font-medium">BMI 미리보기</p>
          <p className="text-2xl font-bold text-module-body">{bmi}</p>
          <p className="text-xs text-module-body mt-1">
            {Number(bmi) < 18.5
              ? '저체중'
              : Number(bmi) < 23
                ? '정상'
                : Number(bmi) < 25
                  ? '과체중'
                  : '비만'}
          </p>
        </div>
      )}

      {/* 필수 정보 미입력 시 안내 메시지 */}
      {!canProceed && !isProfileLoading && (
        <p className="text-xs text-center text-amber-600 dark:text-amber-400">
          성별, 키, 몸무게를 모두 입력해주세요
        </p>
      )}

      {/* 다음 버튼 */}
      <Button
        onClick={handleSubmit}
        disabled={!canProceed || isGenderSaving}
        className={cn(
          'w-full h-14 text-base gap-2',
          (!canProceed || isGenderSaving) && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="다음 단계로 이동하여 사진 업로드하기"
      >
        다음: 사진 업로드
        <ArrowRight className="w-5 h-5" />
      </Button>

      {/* 안내 */}
      <p className="text-center text-xs text-muted-foreground">
        입력하신 정보는 체형 분석에만 사용되며
        <br />
        다른 용도로 활용되지 않습니다
      </p>
    </div>
  );
}
