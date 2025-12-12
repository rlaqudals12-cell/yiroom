'use client';

import { LOADING_TIPS } from '@/lib/mock/personal-color';
import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';

interface AnalysisLoadingProps {
  onComplete: () => void;
}

// PC-1 퍼스널 컬러 분석 항목 목록
function PersonalColorAnalysisItems() {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
      <span>• 피부톤</span>
      <span>• 혈관 색</span>
      <span>• 눈동자 색</span>
      <span>• 머리카락 색</span>
      <span>• 입술 색</span>
      <span>• 계절 타입</span>
    </div>
  );
}

export default function AnalysisLoading({ onComplete }: AnalysisLoadingProps) {
  return (
    <AnalysisLoadingBase
      onComplete={onComplete}
      tips={LOADING_TIPS}
      analysisItems={<PersonalColorAnalysisItems />}
      accentColor="pink"
    />
  );
}
