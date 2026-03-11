/**
 * 응원 보내기 버튼 + 바텀시트 (모바일)
 * - 프리셋 응원 메시지 5종
 * - 커스텀 메시지 입력
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

import { useTheme, brand } from '../../lib/theme';

const PRESET_MESSAGES = [
  '오늘도 화이팅!',
  '잘하고 있어요!',
  '멋져요!',
  '응원할게요!',
  '함께 해요!',
];

export interface SendEncouragementProps {
  toUserId: string;
  toUserName: string;
  activityType?: string;
  activityId?: string;
  className?: string;
  onSuccess?: () => void;
}

export function SendEncouragement({
  toUserId,
  toUserName,
  activityType,
  activityId,
  onSuccess,
}: SendEncouragementProps): React.JSX.Element {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSend = async (customMessage?: string): Promise<void> => {
    const finalMessage = customMessage || message;
    if (!finalMessage.trim()) return;

    try {
      setIsLoading(true);

      // Thin Client: 웹 API 호출
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/encouragements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId,
          message: finalMessage,
          messageType: customMessage ? 'preset' : 'custom',
          activityType,
          activityId,
        }),
      });

      if (res.ok) {
        setIsSent(true);
        setMessage('');
        onSuccess?.();

        // 1.5초 후 성공 상태 리셋
        setTimeout(() => {
          setIsSent(false);
          setIsOpen(false);
        }, 1500);
      }
    } catch (error) {
      console.error('[SendEncouragement] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoading) {
      setIsOpen(false);
      setMessage('');
      setIsSent(false);
    }
  };

  return (
    <>
      {/* 트리거 버튼 */}
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: colors.accent }}
        testID="send-encouragement-button"
      >
        <Text style={{ color: brand.primary }}>♥</Text>
        <Text className="text-sm" style={{ color: colors.foreground }}>
          응원
        </Text>
      </Pressable>

      {/* 응원 바텀시트 */}
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
        <Pressable className="flex-1 justify-end bg-black/50" onPress={handleClose}>
          <Pressable
            className="rounded-t-2xl px-5 pt-5 pb-8"
            style={{ backgroundColor: colors.card }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <Text className="text-lg font-bold mb-1" style={{ color: colors.foreground }}>
              {toUserName}님에게 응원 보내기
            </Text>
            <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
              따뜻한 응원 메시지를 보내보세요
            </Text>

            {isSent ? (
              // 성공 상태
              <View className="items-center py-8">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: '#dcfce7' }}
                >
                  <Text className="text-3xl">♥</Text>
                </View>
                <Text className="text-lg font-medium" style={{ color: colors.foreground }}>
                  응원을 보냈어요!
                </Text>
              </View>
            ) : (
              <ScrollView>
                {/* 프리셋 메시지 */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {PRESET_MESSAGES.map((preset) => (
                    <Pressable
                      key={preset}
                      onPress={() => handleSend(preset)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-full border"
                      style={{
                        borderColor: colors.border,
                        opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      <Text className="text-sm" style={{ color: colors.foreground }}>
                        {preset}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* 구분선 */}
                <View className="flex-row items-center gap-2 mb-4">
                  <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                  <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                    또는
                  </Text>
                  <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                </View>

                {/* 커스텀 메시지 */}
                <TextInput
                  placeholder="직접 응원 메시지를 작성해보세요"
                  placeholderTextColor={colors.mutedForeground}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  className="px-4 py-3 rounded-lg border text-sm mb-4"
                  style={{
                    borderColor: colors.border,
                    color: colors.foreground,
                    textAlignVertical: 'top',
                    minHeight: 80,
                  }}
                />

                {/* 전송 버튼 */}
                <Pressable
                  onPress={() => handleSend()}
                  disabled={isLoading || !message.trim()}
                  className="py-3 rounded-lg items-center"
                  style={{
                    backgroundColor: isLoading || !message.trim() ? colors.muted : brand.primary,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.foreground} />
                  ) : (
                    <Text className="font-medium" style={{ color: colors.foreground }}>
                      응원 보내기
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
