'use client';

import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';
import { useTranslations } from 'next-intl';

interface FoodAnalysisLoadingProps {
  isApiComplete?: boolean;
  onComplete?: () => void;
}

// N-1 음식 분석 로딩 팁
const LOADING_TIPS = [
  '음식에 포함된 영양소를 분석하고 있어요',
  '칼로리와 영양 정보를 계산 중이에요',
  '맞춤 건강 조언을 준비하고 있어요',
  '신호등 색상으로 음식을 분류해요',
];

// N-1 음식 분석 항목 목록
function FoodAnalysisItems() {
  const t = useTranslations('nutritionUI');
  return (
    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
      <span>{t('foodAnalysisLoading0')}</span>
      <span>{t('foodAnalysisLoading1')}</span>
      <span>{t('foodAnalysisLoading2')}</span>
      <span>{t('foodAnalysisLoading3')}</span>
      <span>{t('foodAnalysisLoading4')}</span>
      <span>{t('foodAnalysisLoading5')}</span>
    </div>
  );
}

/**
 * N-1 음식 분석 로딩 컴포넌트
 * AnalysisLoadingBase를 활용하여 음식 분석 진행 상태 표시
 */
export default function FoodAnalysisLoading({
  isApiComplete,
  onComplete,
}: FoodAnalysisLoadingProps) {
  return (
    <AnalysisLoadingBase
      isApiComplete={isApiComplete}
      onComplete={onComplete}
      tips={LOADING_TIPS}
      analysisItems={<FoodAnalysisItems />}
      accentColor="purple"
      loadingMessage="AI가 음식을 분석하고 있어요..."
    />
  );
}
