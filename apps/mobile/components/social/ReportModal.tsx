/**
 * 신고 모달 (모바일)
 * - 신고 사유 5종 선택
 * - 선택적 상세 설명 입력
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { useTheme } from '../../lib/theme';

type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'misinformation' | 'other';

const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'spam', label: '스팸/광고' },
  { key: 'harassment', label: '괴롭힘/욕설' },
  { key: 'inappropriate_content', label: '부적절한 콘텐츠' },
  { key: 'misinformation', label: '잘못된 정보' },
  { key: 'other', label: '기타' },
];

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  onSubmit: (postId: string, reason: ReportReason, description?: string) => Promise<void>;
}

export function ReportModal({
  visible,
  onClose,
  postId,
  onSubmit,
}: ReportModalProps): React.JSX.Element | null {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(postId, selectedReason, description || undefined);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50" testID="report-modal">
        <View
          className="rounded-t-2xl px-5 pt-5 pb-8 max-h-[80%]"
          style={{ backgroundColor: colors.card }}
        >
          {/* 헤더 */}
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.foreground }}>
              게시물 신고
            </Text>
          </View>
          <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
            신고 사유를 선택해주세요.
          </Text>

          <ScrollView>
            {/* 사유 선택 */}
            <View className="gap-2 mb-4">
              {REPORT_REASONS.map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setSelectedReason(key)}
                  className="px-4 py-3 rounded-lg border"
                  style={{
                    borderColor: selectedReason === key ? colors.foreground : colors.border,
                    backgroundColor: selectedReason === key ? colors.accent : 'transparent',
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: selectedReason === key ? colors.foreground : colors.mutedForeground,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 상세 설명 */}
            {selectedReason && (
              <TextInput
                placeholder="추가 설명이 있으면 입력해주세요 (선택)"
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
                className="px-4 py-3 rounded-lg border text-sm mb-4"
                style={{
                  borderColor: colors.border,
                  color: colors.foreground,
                  textAlignVertical: 'top',
                  minHeight: 80,
                }}
              />
            )}
          </ScrollView>

          {/* 버튼 */}
          <View className="flex-row gap-3 mt-2">
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3 rounded-lg border items-center"
              style={{ borderColor: colors.border }}
            >
              <Text style={{ color: colors.foreground }}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="flex-1 py-3 rounded-lg items-center"
              style={{
                backgroundColor:
                  !selectedReason || isSubmitting ? colors.muted : colors.destructive,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-medium" style={{ color: '#fff' }}>
                  신고하기
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
