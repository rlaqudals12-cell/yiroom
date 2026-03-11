/**
 * 차단 확인 다이얼로그 (모바일)
 * - 차단 시 양방향으로 게시물 비노출
 */

import { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface BlockConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  authorName: string;
  blockedUserId: string;
  onConfirm: (blockedUserId: string) => Promise<void>;
}

export function BlockConfirmDialog({
  visible,
  onClose,
  authorName,
  blockedUserId,
  onConfirm,
}: BlockConfirmDialogProps): React.JSX.Element | null {
  const { colors } = useTheme();
  const [isBlocking, setIsBlocking] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    setIsBlocking(true);
    try {
      await onConfirm(blockedUserId);
      onClose();
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 justify-center items-center bg-black/50"
        testID="block-confirm-dialog"
      >
        <View
          className="mx-6 rounded-2xl px-6 py-5 w-[85%] max-w-sm"
          style={{ backgroundColor: colors.card }}
        >
          {/* 제목 */}
          <Text className="text-lg font-bold mb-2" style={{ color: colors.foreground }}>
            {authorName}님을 차단할까요?
          </Text>

          {/* 설명 */}
          <Text className="text-sm mb-1" style={{ color: colors.mutedForeground }}>
            차단하면 다음과 같이 적용돼요.
          </Text>
          <View className="mb-5 gap-1">
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              • 상대방의 게시물이 피드에서 보이지 않아요
            </Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              • 상대방도 내 게시물을 볼 수 없어요
            </Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              • 설정에서 언제든 차단을 해제할 수 있어요
            </Text>
          </View>

          {/* 버튼 */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-lg border items-center"
              style={{ borderColor: colors.border }}
            >
              <Text style={{ color: colors.foreground }}>취소</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={isBlocking}
              className="flex-1 py-3 rounded-lg items-center"
              style={{
                backgroundColor: isBlocking ? colors.muted : colors.destructive,
              }}
            >
              {isBlocking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="font-medium" style={{ color: '#fff' }}>
                  차단하기
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
