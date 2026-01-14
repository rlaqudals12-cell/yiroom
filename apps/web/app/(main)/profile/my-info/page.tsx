'use client';

/**
 * 내 정보 관리 페이지
 * - 성별, 키, 몸무게, 알러지 통합 관리
 * - 설정 페이지의 기능을 더 접근하기 쉽게 제공
 */

import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useUserProfile, type GenderType } from '@/hooks/useUserProfile';
import { PhysicalInfoCard, AllergyInfoCard } from '@/components/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 성별 옵션
const GENDER_OPTIONS: { value: GenderType; label: string; description: string }[] = [
  { value: 'female', label: '여성', description: '여성 맞춤 추천' },
  { value: 'male', label: '남성', description: '남성 맞춤 추천' },
  { value: 'neutral', label: '중립', description: '성별 구분 없이' },
];

export default function MyInfoPage() {
  const { profile, updateGender, updateHeight, updateWeight, updateAllergies, isLoading } =
    useUserProfile();

  return (
    <div className="bg-background min-h-screen pb-8" data-testid="my-info-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/profile"
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">내 정보 관리</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* 프로필 완성도 안내 */}
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 mb-3">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold mb-1">내 정보를 완성해보세요</h2>
          <p className="text-muted-foreground text-sm">
            정보를 입력하면 더 정확한 맞춤 추천을 받을 수 있어요
          </p>
        </div>

        {/* 성별 선택 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-5 h-5" aria-hidden="true" />
              성별
            </CardTitle>
            <CardDescription>맞춤 추천에 활용됩니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {GENDER_OPTIONS.map((option) => {
                const isSelected = profile.gender === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateGender(option.value)}
                    disabled={isLoading}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
                      isLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-lg font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 신체 정보 */}
        <PhysicalInfoCard
          heightCm={profile.heightCm}
          weightKg={profile.weightKg}
          onHeightChange={updateHeight}
          onWeightChange={updateWeight}
          isLoading={isLoading}
        />

        {/* 알러지 정보 */}
        <AllergyInfoCard
          allergies={profile.allergies}
          onAllergiesChange={updateAllergies}
          isLoading={isLoading}
        />

        {/* 추가 링크 */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">
            더 많은 설정은 설정 페이지에서 확인하세요
          </p>
          <div className="flex gap-2">
            <Link
              href="/profile/settings"
              className="flex-1 text-center py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
            >
              전체 설정
            </Link>
            <Link
              href="/terms"
              className="flex-1 text-center py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
            >
              이용약관
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
