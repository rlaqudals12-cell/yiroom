'use client';

import { LOADING_TIPS } from '@/lib/mock/body-analysis';
import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';

interface AnalysisLoadingProps {
  onComplete: () => void;
}

// C-1 체형 분석 항목 목록
function BodyAnalysisItems() {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
      <span>• 어깨 너비</span>
      <span>• 허리 라인</span>
      <span>• 골반 너비</span>
      <span>• 상체 비율</span>
      <span>• 하체 비율</span>
      <span>• 체형 타입</span>
    </div>
  );
}

export default function AnalysisLoading({ onComplete }: AnalysisLoadingProps) {
  return (
    <div data-testid="body-analysis-loading">
      <AnalysisLoadingBase
        onComplete={onComplete}
        tips={LOADING_TIPS}
        analysisItems={<BodyAnalysisItems />}
        accentColor="purple"
      />
    </div>
  );
}
