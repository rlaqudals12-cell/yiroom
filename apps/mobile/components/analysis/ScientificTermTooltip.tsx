/**
 * 과학 용어 툴팁
 *
 * 피부/건강 분석에서 전문 용어(TEWL, pH 등) 인라인 설명
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTheme, spacing} from '../../lib/theme';

export interface ScientificTermTooltipProps {
  /** 과학 용어 (예: "TEWL", "pH") */
  term: string;
  /** 한국어 정의 */
  definition: string;
  /** 인라인 표시 여부 */
  inline?: boolean;
}

export function ScientificTermTooltip({
  term,
  definition,
  inline = true,
}: ScientificTermTooltipProps): React.ReactElement {
  const { colors, brand, typography, radii, spacing } = useTheme();
  const [visible, setVisible] = useState(false);

  const handleOpen = useCallback(() => setVisible(true), []);
  const handleClose = useCallback(() => setVisible(false), []);

  return (
    <View testID="scientific-term-tooltip" style={inline ? styles.inline : undefined}>
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={`${term}: ${definition}`}
        accessibilityHint="탭하여 용어 설명 보기"
      >
        <Text
          style={[
            styles.term,
            {
              color: brand.primary,
              fontSize: typography.size.sm,
              backgroundColor: `${brand.primary}15`,
              borderRadius: radii.sm,
              paddingHorizontal: spacing.xs,
              paddingVertical: spacing.xxs,
            },
          ]}
        >
          {term}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <View
            style={[
              styles.tooltip,
              {
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                borderColor: colors.border,
                padding: spacing.md,
              },
            ]}
          >
            <Text
              style={[
                styles.tooltipTerm,
                { color: brand.primary, fontSize: typography.size.lg },
              ]}
            >
              {term}
            </Text>
            <Text
              style={[
                styles.tooltipDef,
                { color: colors.foreground, fontSize: typography.size.sm },
              ]}
            >
              {definition}
            </Text>
            <Text
              style={[
                styles.closeHint,
                { color: colors.mutedForeground, fontSize: typography.size.xs },
              ]}
            >
              탭하여 닫기
            </Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  term: {
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tooltip: {
    width: '80%',
    maxWidth: 320,
    borderWidth: 1,
    elevation: 8,
  },
  tooltipTerm: {
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  tooltipDef: {
    lineHeight: 22,
    marginBottom: spacing.smx,
  },
  closeHint: {
    textAlign: 'center',
  },
});
