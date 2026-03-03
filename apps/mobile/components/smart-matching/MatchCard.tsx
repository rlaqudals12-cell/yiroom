/**
 * MatchCard -- 제품 매칭 카드
 *
 * AI 매칭 결과로 추천된 제품을 매칭률 뱃지, 추천 사유,
 * 가격과 함께 표시하는 카드. 매칭률에 따라 색상이 변화.
 *
 * 매칭률 색상 기준:
 * - 80% 이상: 녹색 (success)
 * - 60% 이상: 노란색 (warning)
 * - 60% 미만: 회색 (mutedForeground)
 */
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii, typography, statusColors } from '../../lib/theme';

export interface MatchCardData {
  productName: string;
  brand: string;
  imageUri?: string;
  matchRate: number;
  reasons: string[];
  price?: number;
}

interface MatchCardProps extends MatchCardData {
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/** 매칭률 → 색상 결정 */
function getMatchColor(rate: number, mutedColor: string): string {
  if (rate >= 80) return statusColors.success;
  if (rate >= 60) return statusColors.warning;
  return mutedColor;
}

/** 매칭률 → 라벨 */
function getMatchLabel(rate: number): string {
  if (rate >= 90) return '최고 매칭';
  if (rate >= 80) return '좋은 매칭';
  if (rate >= 60) return '보통';
  return '낮은 매칭';
}

export function MatchCard({
  productName,
  brand,
  imageUri,
  matchRate,
  reasons,
  price,
  onPress,
  style,
  testID,
}: MatchCardProps): React.JSX.Element {
  const { colors, shadows } = useTheme();

  const matchColor = getMatchColor(matchRate, colors.mutedForeground);
  const matchLabel = getMatchLabel(matchRate);

  return (
    <Pressable
      testID={testID ?? 'match-card'}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${brand} ${productName}, 매칭률 ${matchRate}%, ${matchLabel}`}
    >
      <View style={styles.row}>
        {/* 제품 이미지 */}
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.xl,
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`${productName} 이미지`}
            />
          ) : (
            <Text style={styles.placeholderIcon} accessibilityLabel="기본 제품 아이콘">
              {'💄'}
            </Text>
          )}

          {/* 매칭률 뱃지 (이미지 위) */}
          <View
            style={[
              styles.matchBadge,
              {
                backgroundColor: matchColor,
                borderRadius: radii.sm,
              },
            ]}
          >
            <Text style={styles.matchBadgeText}>{matchRate}%</Text>
          </View>
        </View>

        {/* 제품 정보 */}
        <View style={[styles.info, { marginLeft: spacing.smx }]}>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
            }}
            numberOfLines={1}
          >
            {brand}
          </Text>

          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginTop: spacing.xxs,
            }}
            numberOfLines={2}
          >
            {productName}
          </Text>

          {/* 가격 */}
          {price !== undefined && (
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginTop: spacing.xs,
              }}
            >
              {price.toLocaleString()}원
            </Text>
          )}

          {/* 매칭 라벨 */}
          <View
            style={[
              styles.matchLabelBadge,
              {
                backgroundColor: `${matchColor}18`,
                borderRadius: radii.sm,
                marginTop: spacing.xs,
                alignSelf: 'flex-start',
              },
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: matchColor,
              }}
            >
              {matchLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* 추천 사유 */}
      {reasons.length > 0 && (
        <View style={[styles.reasonsContainer, { marginTop: spacing.smx }]}>
          {reasons.map((reason, index) => (
            <View
              key={`reason-${index}`}
              style={[styles.reasonRow, { marginTop: index > 0 ? spacing.xxs : 0 }]}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: matchColor,
                  marginRight: spacing.xs,
                }}
              >
                {'✓'}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  lineHeight: typography.size.xs * typography.lineHeight.normal,
                }}
              >
                {reason}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: 88,
    height: 88,
  },
  placeholderIcon: {
    fontSize: 32,
  },
  matchBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  matchBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  matchLabelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  reasonsContainer: {
    // 사유 목록
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
