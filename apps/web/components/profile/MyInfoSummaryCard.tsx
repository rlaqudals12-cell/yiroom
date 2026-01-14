'use client';

import Link from 'next/link';
import { User, Ruler, Scale, AlertTriangle, ChevronRight } from 'lucide-react';
import { useUserProfile, type GenderType } from '@/hooks/useUserProfile';

// BMI 계산
const calculateBMI = (heightCm: number | null, weightKg: number | null): number | null => {
  if (!heightCm || !weightKg || heightCm < 100) return null;
  return weightKg / (heightCm / 100) ** 2;
};

// 성별 라벨
const GENDER_LABELS: Record<GenderType, string> = {
  male: '남성',
  female: '여성',
  neutral: '중립',
};

/**
 * 내 정보 요약 카드
 * 프로필 페이지에서 신체 정보와 알러지 정보 요약 표시
 */
export function MyInfoSummaryCard() {
  const { profile, isLoading } = useUserProfile();

  // BMI 계산
  const bmi = calculateBMI(profile.heightCm, profile.weightKg);

  // 입력된 정보 개수 계산
  const filledCount = [
    profile.gender,
    profile.heightCm,
    profile.weightKg,
    profile.allergies.length > 0,
  ].filter(Boolean).length;
  const totalCount = 4;
  const progress = Math.round((filledCount / totalCount) * 100);

  if (isLoading) {
    return (
      <section className="bg-card rounded-2xl border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </section>
    );
  }

  // 정보가 하나도 없으면 입력 유도
  const hasNoInfo = filledCount === 0;

  return (
    <section className="bg-card rounded-2xl border p-4" data-testid="my-info-summary-card">
      <Link href="/profile/my-info" className="block">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-foreground flex items-center gap-2 font-semibold">
            <User className="h-5 w-5 text-indigo-500" />내 정보
          </h3>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {hasNoInfo ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-2">아직 등록된 정보가 없어요</p>
            <span className="text-primary text-sm font-medium">정보 입력하기 →</span>
          </div>
        ) : (
          <>
            {/* 진행률 바 */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">프로필 완성도</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 정보 요약 */}
            <div className="space-y-2">
              {/* 성별 + 신체 정보 */}
              <div className="flex items-center gap-4 text-sm">
                {profile.gender && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{GENDER_LABELS[profile.gender]}</span>
                  </div>
                )}
                {profile.heightCm && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Ruler className="h-3.5 w-3.5" />
                    <span>{profile.heightCm}cm</span>
                  </div>
                )}
                {profile.weightKg && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Scale className="h-3.5 w-3.5" />
                    <span>{profile.weightKg}kg</span>
                  </div>
                )}
                {bmi && (
                  <div className="text-muted-foreground">
                    <span>BMI {bmi.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* 알러지 */}
              {profile.allergies.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {profile.allergies.slice(0, 3).map((allergy) => (
                      <span
                        key={allergy}
                        className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded"
                      >
                        {allergy}
                      </span>
                    ))}
                    {profile.allergies.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{profile.allergies.length - 3}개
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Link>
    </section>
  );
}
