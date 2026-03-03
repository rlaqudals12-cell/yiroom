/**
 * 의류 아이템 편집 화면
 */
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';

import { useTheme } from '@/lib/theme';
import { ScreenContainer } from '@/components/ui';
import { useCloset, type ClothingMetadata } from '@/lib/inventory';

const CATEGORIES = [
  { key: 'top', label: '상의' },
  { key: 'bottom', label: '하의' },
  { key: 'outer', label: '아우터' },
  { key: 'dress', label: '원피스' },
  { key: 'shoes', label: '신발' },
  { key: 'bag', label: '가방' },
  { key: 'accessory', label: '악세서리' },
  { key: 'other', label: '기타' },
];

const SEASONS = ['봄', '여름', '가을', '겨울'];
const OCCASIONS = ['데일리', '출근', '데이트', '운동', '여행', '포멀'];

export default function EditClosetItemScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem } = useCloset();

  const item = items.find((i: { id: string }) => i.id === id);
  const meta = (item?.metadata ?? {}) as Partial<ClothingMetadata>;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [size, setSize] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.subCategory || '');
      setItemBrand(item.brand || '');
      setSize(meta.size || '');
      setSelectedSeasons(meta.season || []);
      setSelectedOccasions(meta.occasion || []);
    }
  }, [item, meta.size, meta.season, meta.occasion]);

  const toggleSeason = useCallback((season: string) => {
    Haptics.selectionAsync();
    setSelectedSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  }, []);

  const toggleOccasion = useCallback((occasion: string) => {
    Haptics.selectionAsync();
    setSelectedOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!id || !name.trim()) {
      Alert.alert('입력 확인', '이름은 필수 항목이에요.');
      return;
    }

    setIsSaving(true);
    try {
      await updateItem(id, {
        name: name.trim(),
        subCategory: category,
        brand: itemBrand.trim() || null,
        metadata: {
          ...meta,
          size: size.trim() || undefined,
          season: selectedSeasons,
          occasion: selectedOccasions,
        } as unknown as Record<string, unknown>,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('저장 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }, [id, name, category, itemBrand, size, selectedSeasons, selectedOccasions, updateItem]);

  if (!item) {
    return (
      <ScreenContainer testID="edit-closet-item-not-found">
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>👕</Text>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            아이템을 찾을 수 없어요
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="edit-closet-item-screen" scrollable={false} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* 이름 */}
          <Animated.View entering={FadeInDown.delay(0).duration(300)}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              이름 *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="아이템 이름"
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="아이템 이름"
            />
          </Animated.View>

          {/* 카테고리 */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              카테고리
            </Text>
            <View style={[styles.chipGrid, { gap: spacing.sm }]}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? brand.primary : colors.card,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderRadius: radii.full,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategory(cat.key);
                    }}
                    accessibilityRole="radio"
                    accessibilityLabel={cat.label}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        color: isSelected ? brand.primaryForeground : colors.foreground,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* 브랜드 */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              브랜드
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              value={itemBrand}
              onChangeText={setItemBrand}
              placeholder="브랜드명 (선택)"
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="브랜드명"
            />
          </Animated.View>

          {/* 사이즈 */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              사이즈
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              value={size}
              onChangeText={setSize}
              placeholder="예: M, 95, 260"
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="사이즈"
            />
          </Animated.View>

          {/* 계절 */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              계절
            </Text>
            <View style={[styles.chipGrid, { gap: spacing.sm }]}>
              {SEASONS.map((season) => {
                const isSelected = selectedSeasons.includes(season);
                return (
                  <Pressable
                    key={season}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? brand.primary : colors.card,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderRadius: radii.full,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      },
                    ]}
                    onPress={() => toggleSeason(season)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={season}
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        color: isSelected ? brand.primaryForeground : colors.foreground,
                      }}
                    >
                      {season}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* 착용 상황 */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)} style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              착용 상황
            </Text>
            <View style={[styles.chipGrid, { gap: spacing.sm }]}>
              {OCCASIONS.map((occasion) => {
                const isSelected = selectedOccasions.includes(occasion);
                return (
                  <Pressable
                    key={occasion}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? brand.primary : colors.card,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderRadius: radii.full,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      },
                    ]}
                    onPress={() => toggleOccasion(occasion)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={occasion}
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        color: isSelected ? brand.primaryForeground : colors.foreground,
                      }}
                    >
                      {occasion}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {/* 저장/취소 버튼 */}
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              padding: spacing.md,
              gap: spacing.sm,
            },
          ]}
        >
          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                padding: spacing.md,
                flex: 1,
              },
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="취소"
          >
            <X size={18} color={colors.foreground} />
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginLeft: spacing.xs,
              }}
            >
              취소
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: brand.primary,
                borderRadius: radii.xl,
                padding: spacing.md,
                flex: 2,
              },
            ]}
            onPress={handleSave}
            disabled={isSaving || !name.trim()}
            accessibilityRole="button"
            accessibilityLabel="저장"
            accessibilityState={{ disabled: isSaving || !name.trim() }}
          >
            <Check size={18} color={brand.primaryForeground} />
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: brand.primaryForeground,
                marginLeft: spacing.xs,
              }}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    height: 44,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
