'use client';

import { useState } from 'react';
import { ArrowRight, Ruler, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface UserBodyInput {
  height: number;
  weight: number;
  targetWeight?: number;
}

interface InputFormProps {
  onSubmit: (data: UserBodyInput) => void;
}

export default function InputForm({ onSubmit }: InputFormProps) {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});

  // 입력값 검증
  const validate = (): boolean => {
    const newErrors: { height?: string; weight?: string } = {};

    const heightNum = Number(height);
    const weightNum = Number(weight);

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
  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      height: Number(height),
      weight: Number(weight),
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
    });
  };

  // BMI 미리보기 계산
  const previewBMI = (): string | null => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w || h < 100 || w < 20) return null;
    const bmi = w / ((h / 100) ** 2);
    return bmi.toFixed(1);
  };

  const bmi = previewBMI();

  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="text-center">
        <p className="text-muted-foreground">
          정확한 체형 분석을 위해
          <br />
          기본 정보를 입력해주세요
        </p>
      </div>

      {/* 입력 폼 */}
      <div className="space-y-4">
        {/* 키 입력 */}
        <div>
          <label
            htmlFor="height"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2"
          >
            <Ruler className="w-4 h-4" />
            키 (cm) <span className="text-red-500">*</span>
          </label>
          <input
            id="height"
            type="number"
            inputMode="numeric"
            placeholder="예: 165"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-module-body ${
              errors.height ? 'border-red-500' : 'border-border'
            }`}
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
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-module-body ${
              errors.weight ? 'border-red-500' : 'border-border'
            }`}
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

      {/* 다음 버튼 */}
      <Button
        onClick={handleSubmit}
        className="w-full h-14 text-base gap-2"
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
