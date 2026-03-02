/**
 * ChatMessage -- 채팅 메시지 버블
 *
 * 사용자 메시지는 오른쪽 정렬(브랜드 색상 배경),
 * AI 메시지는 왼쪽 정렬(카드 배경).
 * isLoading 상태에서 타이핑 인디케이터 표시.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  style?: ViewStyle;
}

/** 시간을 "오후 3:42" 형식으로 변환 */
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? '오후' : '오전';
  const displayHour = hours % 12 || 12;
  return `${period} ${displayHour}:${minutes}`;
}

/** AI 타이핑 인디케이터 (점 3개 애니메이션) */
function TypingIndicator(): React.JSX.Element {
  const { colors } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number): Animated.CompositeAnimation =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );

    const animation = Animated.parallel([
      createDotAnimation(dot1, 0),
      createDotAnimation(dot2, 150),
      createDotAnimation(dot3, 300),
    ]);
    animation.start();

    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value): Animated.WithAnimatedObject<ViewStyle> => ({
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.mutedForeground,
    marginHorizontal: 2,
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View style={typingStyles.container} accessibilityLabel="AI가 답변을 작성 중이에요">
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});

export function ChatMessage({
  content,
  isUser,
  timestamp,
  isLoading = false,
  style,
}: ChatMessageProps): React.JSX.Element {
  const { colors, spacing, typography, radii, brand, isDark } = useTheme();

  // AI 로딩 상태
  if (!isUser && isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.aiContainer,
          style,
        ]}
        testID="chat-message-loading"
        accessibilityLabel="AI가 답변을 작성 중이에요"
      >
        <View
          style={[
            styles.bubble,
            styles.aiBubble,
            {
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <TypingIndicator />
        </View>
      </View>
    );
  }

  // 사용자 메시지: 브랜드 색상 배경
  // AI 메시지: 카드 배경 + 테두리
  const bubbleBackgroundColor = isUser
    ? brand.primary
    : colors.card;
  const textColor = isUser
    ? brand.primaryForeground
    : colors.foreground;

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
        style,
      ]}
      testID="chat-message"
      accessibilityLabel={`${isUser ? '나' : 'AI'}: ${content}`}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          {
            backgroundColor: bubbleBackgroundColor,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.smd,
          },
          // AI 버블에만 테두리
          !isUser && {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={{
            fontSize: typography.size.sm,
            lineHeight: typography.size.sm * typography.lineHeight.normal,
            color: textColor,
          }}
        >
          {content}
        </Text>
      </View>

      {/* 타임스탬프 */}
      <Text
        style={[
          styles.timestamp,
          {
            fontSize: typography.size.xs - 1,
            color: colors.mutedForeground,
            marginTop: spacing.xxs,
          },
          isUser ? styles.timestampRight : styles.timestampLeft,
        ]}
      >
        {formatTime(timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
  },
  userBubble: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.sm,
  },
  aiBubble: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomLeftRadius: radii.sm,
    borderBottomRightRadius: radii.xl,
  },
  timestamp: {},
  timestampRight: {
    textAlign: 'right',
  },
  timestampLeft: {
    textAlign: 'left',
  },
});
