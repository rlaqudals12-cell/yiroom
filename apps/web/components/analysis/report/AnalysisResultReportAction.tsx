'use client';

import { ContentReportDialog } from '@/components/content-report';

interface AnalysisResultReportActionProps {
  targetId: string;
}

/**
 * 진단 결과 공통 신고 진입점.
 * 결과 저장 ID는 각 축 호스트가 알고 있으므로 공통 푸터까지 명시적으로 전달한다.
 */
export function AnalysisResultReportAction({
  targetId,
}: AnalysisResultReportActionProps): React.JSX.Element {
  return (
    <span data-html2canvas-ignore="true" className="print:hidden">
      <ContentReportDialog
        targetType="analysis_result"
        targetId={targetId}
        triggerLabel="이 결과 신고"
        testId="analysis-result-report-trigger"
      />
    </span>
  );
}
