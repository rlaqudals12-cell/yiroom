/**
 * ShareButton — 공유 버튼
 *
 * RN Share API를 통한 콘텐츠 공유.
 * 분석 결과, 코디 추천 등 다양한 콘텐츠 공유 지원.
 */
import * as Haptics from 'expo-haptics';
import { Share as ShareIcon } from 'lucide-react-native';
import { Pressable, Share, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme , spacing } from '../../lib/theme';

interface ShareButtonProps {
  /** 공유할 텍스트 */
  message: string;
  /** 공유할 URL (선택) */
  url?: string;
  /** 버튼 라벨 (기본: '공유') */
  label?: string;
  /** 아이콘만 표시 */
  iconOnly?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function ShareButton({
  message,
  url,
  label = '공유',
  iconOnly = false,
  style,
  testID,
}: ShareButtonProps): React.JSX.Element {
  const { colors, spacing, radii, typography, brand } = useTheme();

  const handleShare = async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: url ? `${message}\n${url}` : message,
      });
    } catch {
      // 사용자가 공유 취소한 경우 무시
    }
  };

  if (iconOnly) {
    return (
      <Pressable
        testID={testID}
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel="공유"
        style={({ pressed }) => [
          styles.iconButton,
          { opacity: pressed ? 0.7 : 1 },
          style,
        ]}
      >
        <ShareIcon size={20} color={colors.mutedForeground} />
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={handleShare}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: brand.primary + '15',
          borderRadius: radii.xl,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <ShareIcon size={16} color={brand.primary} />
      <Text
        style={{
          marginLeft: 6,
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: brand.primary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: spacing.sm,
  },
});
