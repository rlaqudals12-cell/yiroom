import { useAuth } from '@clerk/clerk-expo';
import { Alert } from 'react-native';

import {
  ContentReportApiError,
  submitContentReport,
  type ContentReportTargetType,
} from '@/lib/api/reports';

import { ReportModal, type ReportReason } from '../social/ReportModal';

export interface ContentReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ContentReportTargetType;
  targetId: string;
  contentExcerpt?: string;
  title: string;
}

/** 기존 신고 사유 UI를 재사용해 AI 생성 콘텐츠를 앱 안에서 접수한다. */
export function ContentReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  contentExcerpt,
  title,
}: ContentReportModalProps): React.JSX.Element {
  const { getToken } = useAuth();

  const handleSubmit = async (
    reportedTargetId: string,
    reason: ReportReason,
    description?: string
  ): Promise<void> => {
    let token: string | null;
    try {
      token = await getToken();
    } catch {
      throw new ContentReportApiError(
        '로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해주세요.',
        0,
        'AUTH_TOKEN_ERROR'
      );
    }
    if (!token) {
      throw new ContentReportApiError('로그인이 필요해요.', 401, 'AUTH_ERROR');
    }
    await submitContentReport(
      {
        targetType,
        targetId: reportedTargetId,
        reason,
        ...(description ? { description } : {}),
        ...(contentExcerpt ? { contentExcerpt: contentExcerpt.slice(0, 2000) } : {}),
      },
      token
    );
  };

  return (
    <ReportModal
      onClose={onClose}
      onError={(error) => {
        Alert.alert(
          '신고 접수 실패',
          error instanceof Error
            ? error.message
            : '신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.'
        );
      }}
      onSubmit={handleSubmit}
      onSuccess={() => {
        Alert.alert('신고가 접수됐어요', '내용을 확인한 뒤 필요한 조치를 진행할게요.');
      }}
      postId={targetId}
      title={title}
      visible={visible}
    />
  );
}
