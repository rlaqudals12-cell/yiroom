/**
 * ScanResult -- 바코드 스캔 제품 결과 카드
 *
 * 스캔된 제품의 기본 정보(이름, 브랜드, 바코드)와
 * 성분 안전성 목록을 표시하는 카드 컴포넌트.
 */
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii, typography, statusColors } from '../../lib/theme';

// 성분 안전성 등급
export type IngredientSafety = 'safe' | 'caution' | 'danger';

export interface ScannedIngredient {
  name: string;
  safety: IngredientSafety;
}

interface ScanResultProps {
  productName: string;
  brand: string;
  barcode: string;
  ingredients: ScannedIngredient[];
  imageUri?: string;
  onSave?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

// 성분 안전성 → 색상/라벨 매핑
const SAFETY_CONFIG: Record<IngredientSafety, { color: string; label: string }> = {
  safe: { color: statusColors.success, label: '안전' },
  caution: { color: statusColors.warning, label: '주의' },
  danger: { color: statusColors.error, label: '위험' },
};

export function ScanResult({
  productName,
  brand,
  barcode,
  ingredients,
  imageUri,
  onSave,
  onDismiss,
  style,
}: ScanResultProps): React.JSX.Element {
  const { colors, shadows } = useTheme();

  return (
    <View
      testID="scan-result"
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
        },
        style,
      ]}
      accessibilityLabel={`스캔 결과: ${brand} ${productName}`}
      accessibilityRole="summary"
    >
      {/* 제품 헤더 */}
      <View style={styles.header}>
        {imageUri ? (
          <View
            style={[
              styles.imageContainer,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
              },
            ]}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`${productName} 제품 이미지`}
            />
          </View>
        ) : (
          <View
            style={[
              styles.imageContainer,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
              },
            ]}
          >
            <Text style={styles.placeholderIcon} accessibilityLabel="기본 제품 아이콘">
              {'📦'}
            </Text>
          </View>
        )}

        <View style={[styles.headerInfo, { marginLeft: spacing.smx }]}>
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
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginTop: spacing.xxs,
            }}
            numberOfLines={2}
          >
            {productName}
          </Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginTop: spacing.xs,
            }}
          >
            바코드: {barcode}
          </Text>
        </View>
      </View>

      {/* 구분선 */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: colors.border,
            marginVertical: spacing.md,
          },
        ]}
      />

      {/* 성분 목록 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        성분 분석
      </Text>

      {ingredients.length > 0 ? (
        <View style={styles.ingredientList}>
          {ingredients.map((ingredient, index) => {
            const config = SAFETY_CONFIG[ingredient.safety];
            return (
              <View
                key={`${ingredient.name}-${index}`}
                style={[
                  styles.ingredientRow,
                  {
                    paddingVertical: spacing.xs,
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < ingredients.length - 1 ? 1 : 0,
                  },
                ]}
                accessibilityLabel={`${ingredient.name}: ${config.label}`}
              >
                {/* 안전성 인디케이터 */}
                <View
                  style={[
                    styles.safetyDot,
                    { backgroundColor: config.color },
                  ]}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: typography.size.sm,
                    color: colors.foreground,
                    marginLeft: spacing.sm,
                  }}
                  numberOfLines={1}
                >
                  {ingredient.name}
                </Text>
                <View
                  style={[
                    styles.safetyBadge,
                    {
                      backgroundColor: `${config.color}18`,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      fontWeight: typography.weight.semibold,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
            paddingVertical: spacing.md,
          }}
        >
          성분 정보가 없습니다
        </Text>
      )}

      {/* 액션 버튼 */}
      <View style={[styles.actions, { marginTop: spacing.md }]}>
        {onDismiss && (
          <Pressable
            testID="scan-result-dismiss"
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
            >
              닫기
            </Text>
          </Pressable>
        )}

        {onSave && (
          <Pressable
            testID="scan-result-save"
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed ? '#E8B4C8' : '#F8C8DC',
                borderRadius: radii.xl,
                marginLeft: onDismiss ? spacing.sm : 0,
              },
            ]}
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel="저장하기"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: '#0A0A0A',
              }}
            >
              저장하기
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 80,
  },
  placeholderIcon: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  divider: {
    height: 1,
  },
  ingredientList: {
    // FlatList 대신 정적 리스트 (성분 수 < 20 예상)
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  safetyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.smx,
  },
});
