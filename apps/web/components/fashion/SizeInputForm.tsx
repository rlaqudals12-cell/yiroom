'use client';

/**
 * K-2 사이즈 입력 폼 컴포넌트
 *
 * @description 사용자 신체 치수 입력 폼 (체형 기반 사이즈 추천용)
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md K-2
 */

import { useState, useCallback } from 'react';
import { Ruler, Scale, User, Footprints, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserMeasurements, Gender } from '@/lib/fashion';

export interface SizeInputFormProps {
  /** 초기값 (기존 데이터가 있는 경우) */
  initialValues?: Partial<UserMeasurements & { gender: Gender }>;
  /** 폼 제출 핸들러 */
  onSubmit: (data: UserMeasurements & { gender: Gender }) => Promise<void>;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 컴팩트 모드 (필수 항목만 표시) */
  compact?: boolean;
}

interface FormState {
  gender: Gender | '';
  height: string;
  weight: string;
  chest: string;
  waist: string;
  hip: string;
  footLength: string;
  shoulderWidth: string;
}

interface FormErrors {
  gender?: string;
  height?: string;
  weight?: string;
  chest?: string;
  waist?: string;
  hip?: string;
  footLength?: string;
  shoulderWidth?: string;
}

export function SizeInputForm({
  initialValues,
  onSubmit,
  isLoading = false,
  compact = false,
}: SizeInputFormProps) {
  const [formState, setFormState] = useState<FormState>({
    gender: initialValues?.gender || '',
    height: initialValues?.height?.toString() || '',
    weight: initialValues?.weight?.toString() || '',
    chest: initialValues?.chest?.toString() || '',
    waist: initialValues?.waist?.toString() || '',
    hip: initialValues?.hip?.toString() || '',
    footLength: initialValues?.footLength?.toString() || '',
    shoulderWidth: initialValues?.shoulderWidth?.toString() || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // 입력 핸들러
  const handleInputChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
      // 에러 클리어
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // 성별 선택 핸들러
  const handleGenderChange = useCallback(
    (value: string) => {
      setFormState((prev) => ({ ...prev, gender: value as Gender }));
      if (errors.gender) {
        setErrors((prev) => ({ ...prev, gender: undefined }));
      }
    },
    [errors.gender]
  );

  // 유효성 검사
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // 필수: 성별
    if (!formState.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    // 필수: 키 (100~250cm)
    const height = parseFloat(formState.height);
    if (!formState.height || isNaN(height)) {
      newErrors.height = '키를 입력해주세요';
    } else if (height < 100 || height > 250) {
      newErrors.height = '100~250cm 범위로 입력해주세요';
    }

    // 필수: 몸무게 (30~200kg)
    const weight = parseFloat(formState.weight);
    if (!formState.weight || isNaN(weight)) {
      newErrors.weight = '몸무게를 입력해주세요';
    } else if (weight < 30 || weight > 200) {
      newErrors.weight = '30~200kg 범위로 입력해주세요';
    }

    // 선택: 가슴둘레 (60~150cm)
    if (formState.chest) {
      const chest = parseFloat(formState.chest);
      if (isNaN(chest) || chest < 60 || chest > 150) {
        newErrors.chest = '60~150cm 범위로 입력해주세요';
      }
    }

    // 선택: 허리둘레 (50~130cm)
    if (formState.waist) {
      const waist = parseFloat(formState.waist);
      if (isNaN(waist) || waist < 50 || waist > 130) {
        newErrors.waist = '50~130cm 범위로 입력해주세요';
      }
    }

    // 선택: 엉덩이둘레 (60~150cm)
    if (formState.hip) {
      const hip = parseFloat(formState.hip);
      if (isNaN(hip) || hip < 60 || hip > 150) {
        newErrors.hip = '60~150cm 범위로 입력해주세요';
      }
    }

    // 선택: 발길이 (200~320mm)
    if (formState.footLength) {
      const footLength = parseFloat(formState.footLength);
      if (isNaN(footLength) || footLength < 200 || footLength > 320) {
        newErrors.footLength = '200~320mm 범위로 입력해주세요';
      }
    }

    // 선택: 어깨너비 (30~60cm)
    if (formState.shoulderWidth) {
      const shoulderWidth = parseFloat(formState.shoulderWidth);
      if (isNaN(shoulderWidth) || shoulderWidth < 30 || shoulderWidth > 60) {
        newErrors.shoulderWidth = '30~60cm 범위로 입력해주세요';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  // 폼 제출
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      const measurements: UserMeasurements = {
        height: parseFloat(formState.height),
        weight: parseFloat(formState.weight),
        ...(formState.chest && { chest: parseFloat(formState.chest) }),
        ...(formState.waist && { waist: parseFloat(formState.waist) }),
        ...(formState.hip && { hip: parseFloat(formState.hip) }),
        ...(formState.footLength && { footLength: parseFloat(formState.footLength) }),
        ...(formState.shoulderWidth && { shoulderWidth: parseFloat(formState.shoulderWidth) }),
      };

      await onSubmit({
        ...measurements,
        gender: formState.gender as Gender,
      });
    },
    [formState, validate, onSubmit]
  );

  return (
    <Card data-testid="size-input-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          신체 정보 입력
        </CardTitle>
        <CardDescription>
          정확한 사이즈 추천을 위해 신체 정보를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 성별 선택 */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              성별 <span className="text-destructive">*</span>
            </Label>
            <Select value={formState.gender} onValueChange={handleGenderChange}>
              <SelectTrigger id="gender" className={errors.gender ? 'border-destructive' : ''}>
                <SelectValue placeholder="성별을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남성</SelectItem>
                <SelectItem value="female">여성</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
          </div>

          {/* 키/몸무게 (필수) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                키 (cm) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={formState.height}
                onChange={handleInputChange('height')}
                className={errors.height ? 'border-destructive' : ''}
              />
              {errors.height && <p className="text-sm text-destructive">{errors.height}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                몸무게 (kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="65"
                value={formState.weight}
                onChange={handleInputChange('weight')}
                className={errors.weight ? 'border-destructive' : ''}
              />
              {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
            </div>
          </div>

          {/* 선택적 치수 (컴팩트 모드에서는 숨김) */}
          {!compact && (
            <>
              {/* 상체 치수 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chest">가슴둘레 (cm)</Label>
                  <Input
                    id="chest"
                    type="number"
                    placeholder="95"
                    value={formState.chest}
                    onChange={handleInputChange('chest')}
                    className={errors.chest ? 'border-destructive' : ''}
                  />
                  {errors.chest && <p className="text-sm text-destructive">{errors.chest}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shoulderWidth">어깨너비 (cm)</Label>
                  <Input
                    id="shoulderWidth"
                    type="number"
                    placeholder="45"
                    value={formState.shoulderWidth}
                    onChange={handleInputChange('shoulderWidth')}
                    className={errors.shoulderWidth ? 'border-destructive' : ''}
                  />
                  {errors.shoulderWidth && (
                    <p className="text-sm text-destructive">{errors.shoulderWidth}</p>
                  )}
                </div>
              </div>

              {/* 하체 치수 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waist">허리둘레 (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    placeholder="78"
                    value={formState.waist}
                    onChange={handleInputChange('waist')}
                    className={errors.waist ? 'border-destructive' : ''}
                  />
                  {errors.waist && <p className="text-sm text-destructive">{errors.waist}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hip">엉덩이둘레 (cm)</Label>
                  <Input
                    id="hip"
                    type="number"
                    placeholder="95"
                    value={formState.hip}
                    onChange={handleInputChange('hip')}
                    className={errors.hip ? 'border-destructive' : ''}
                  />
                  {errors.hip && <p className="text-sm text-destructive">{errors.hip}</p>}
                </div>
              </div>

              {/* 발 치수 */}
              <div className="space-y-2">
                <Label htmlFor="footLength" className="flex items-center gap-2">
                  <Footprints className="w-4 h-4" />
                  발길이 (mm)
                </Label>
                <Input
                  id="footLength"
                  type="number"
                  placeholder="260"
                  value={formState.footLength}
                  onChange={handleInputChange('footLength')}
                  className={errors.footLength ? 'border-destructive' : ''}
                />
                {errors.footLength && (
                  <p className="text-sm text-destructive">{errors.footLength}</p>
                )}
              </div>
            </>
          )}

          {/* 제출 버튼 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                분석 중...
              </>
            ) : (
              '사이즈 추천 받기'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
