'use client';

import type { AnalysisType } from '@/types/analysis-history';
import { ConsentAwareImageStorageNotice } from './ConsentAwareImageStorageNotice';

interface AnalysisCompareImageNoticeProps {
  afterImageUrl?: string;
  analysisType: AnalysisType;
  beforeImageUrl?: string;
  testId?: string;
}

export function AnalysisCompareImageNotice({
  afterImageUrl,
  analysisType,
  beforeImageUrl,
  testId = 'analysis-compare-image-storage-notice',
}: AnalysisCompareImageNoticeProps): React.JSX.Element | null {
  const hasMissingImage = !beforeImageUrl || !afterImageUrl;

  return (
    <ConsentAwareImageStorageNotice
      analysisHref={`/analysis/${analysisType}`}
      analysisLinkLabel="사진 저장에 동의하고 새 분석 기록 만들기"
      analysisType={analysisType}
      consentRequiredMessage="사진 저장에 동의한 분석 기록이 쌓이면 사진 비교를 볼 수 있어요."
      enabled={hasMissingImage}
      featureLabel="사진 비교"
      storageChoiceSupported={analysisType !== 'body'}
      testId={testId}
    />
  );
}
