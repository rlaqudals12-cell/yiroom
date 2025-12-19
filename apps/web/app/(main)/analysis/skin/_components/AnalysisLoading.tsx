'use client';

import { LOADING_TIPS } from '@/lib/mock/skin-analysis';
import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';

interface AnalysisLoadingProps {
  onComplete: () => void;
}

// S-1 피부 분석 항목 목록
function SkinAnalysisItems() {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
      <span>• 수분도</span>
      <span>• 유분도</span>
      <span>• 모공</span>
      <span>• 주름</span>
      <span>• 탄력</span>
      <span>• 색소침착</span>
      <span>• 트러블</span>
    </div>
  );
}

export default function AnalysisLoading({ onComplete }: AnalysisLoadingProps) {
  return (
    <AnalysisLoadingBase
      onComplete={onComplete}
      tips={LOADING_TIPS}
      analysisItems={<SkinAnalysisItems />}
      accentColor="blue"
    />
  );
}
