'use client';

import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';

interface FoodAnalysisLoadingProps {
  onComplete: () => void;
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
  return (
    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
      <span>• 음식 인식</span>
      <span>• 칼로리</span>
      <span>• 탄수화물</span>
      <span>• 단백질</span>
      <span>• 지방</span>
      <span>• 신호등 분류</span>
    </div>
  );
}

/**
 * N-1 음식 분석 로딩 컴포넌트
 * AnalysisLoadingBase를 활용하여 음식 분석 진행 상태 표시
 */
export default function FoodAnalysisLoading({ onComplete }: FoodAnalysisLoadingProps) {
  return (
    <AnalysisLoadingBase
      onComplete={onComplete}
      tips={LOADING_TIPS}
      analysisItems={<FoodAnalysisItems />}
      accentColor="purple"
      duration={3000}
      loadingMessage="AI가 음식을 분석하고 있어요..."
    />
  );
}
