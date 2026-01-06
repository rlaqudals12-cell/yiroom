'use client';

import { POSTURE_LOADING_TIPS } from '@/lib/mock/posture-analysis';
import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';

interface AnalysisLoadingProps {
  onComplete: () => void;
}

// A-1 자세 분석 항목 목록
function PostureAnalysisItems() {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
      <span>- 어깨 대칭</span>
      <span>- 골반 대칭</span>
      <span>- 목 전방 경사</span>
      <span>- 등 굽음</span>
      <span>- 허리 만곡</span>
      <span>- 골반 기울기</span>
    </div>
  );
}

export default function AnalysisLoading({ onComplete }: AnalysisLoadingProps) {
  return (
    <AnalysisLoadingBase
      onComplete={onComplete}
      tips={POSTURE_LOADING_TIPS}
      analysisItems={<PostureAnalysisItems />}
      accentColor="blue"
    />
  );
}
