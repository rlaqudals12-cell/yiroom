/**
 * 점진적 공개 컴포넌트
 *
 * 상세 정보를 접기/펼치기로 관리
 * CollapsibleSection과 달리 "더 보기/접기" 패턴에 특화
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

export interface ProgressiveDisclosureProps {
  /** 항상 보이는 콘텐츠 */
  summary: React.ReactNode;
  /** 펼쳤을 때 보이는 상세 콘텐츠 */
  detail: React.ReactNode;
  /** 펼치기 버튼 텍스트 */
  expandLabel?: string;
  /** 접기 버튼 텍스트 */
  collapseLabel?: string;
  /** 초기 펼침 상태 */
  defaultExpanded?: boolean;
  /** 상태 변경 콜백 */
  onToggle?: (expanded: boolean) => void;
}

export function ProgressiveDisclosure({
  summary,
  detail,
  expandLabel = '자세히 보기',
  collapseLabel = '접기',
  defaultExpanded = false,
  onToggle,
}: ProgressiveDisclosureProps): React.ReactElement {
  const { colors, brand, typography } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const opacity = useSharedValue(defaultExpanded ? 1 : 0);

  const handleToggle = useCallback(() => {
    const newState = !expanded;
    setExpanded(newState);
    opacity.value = withTiming(newState ? 1 : 0, { duration: 200 });
    onToggle?.(newState);
  }, [expanded, onToggle, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View testID="progressive-disclosure">
      {/* 항상 보이는 요약 */}
      {summary}

      {/* 펼쳤을 때 상세 */}
      {expanded && (
        <Animated.View style={[styles.detailContainer, animatedStyle]}>
          {detail}
        </Animated.View>
      )}

      {/* 토글 버튼 */}
      <Pressable
        onPress={handleToggle}
        style={styles.toggleButton}
        accessibilityRole="button"
        accessibilityLabel={expanded ? collapseLabel : expandLabel}
        accessibilityState={{ expanded }}
        testID="progressive-disclosure-toggle"
      >
        <Text style={[styles.toggleText, { color: brand.primary, fontSize: typography.size.sm }]}>
          {expanded ? collapseLabel : expandLabel}
        </Text>
        <Text style={[styles.toggleArrow, { color: brand.primary }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  detailContainer: {
    marginTop: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  toggleText: {
    fontWeight: '500',
  },
  toggleArrow: {
    marginLeft: 4,
    fontSize: 10,
  },
});
