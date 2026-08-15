/**
 * 의류 아이템 편집 화면
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, X } from 'lucide-react-native';
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
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import {
  CLOTHING_CATEGORY_LABELS,
  OCCASION_LABELS,
  SEASON_LABELS,
  resolveClothingCategory,
  useCloset,
  type ClothingCategory,
  type ClothingMetadata,
  type Occasion,
  type Season,
} from '@/lib/inventory';
import { useTheme } from '@/lib/theme';

// 카테고리 선택지 — 값은 웹 계약(영문 대분류), 라벨은 정본 상수 재사용.
// 타입을 박아 'other' 같은 조립기가 모르는 값이 다시 새어 들어오는 걸 컴파일에서 막는다
// (등록 화면 add.tsx와 동일한 7종 계약)
const CATEGORIES: { key: ClothingCategory; label: string }[] = [
  { key: 'top', label: CLOTHING_CATEGORY_LABELS.top },
  { key: 'bottom', label: CLOTHING_CATEGORY_LABELS.bottom },
  { key: 'outer', label: CLOTHING_CATEGORY_LABELS.outer },
  { key: 'dress', label: CLOTHING_CATEGORY_LABELS.dress },
  { key: 'shoes', label: CLOTHING_CATEGORY_LABELS.shoes },
  { key: 'bag', label: CLOTHING_CATEGORY_LABELS.bag },
  { key: 'accessory', label: CLOTHING_CATEGORY_LABELS.accessory },
];

/** 선택값이 조립기가 아는 대분류인지 판정 (무효값을 metadata에 남기지 않기 위한 게이트) */
function isClothingCategory(value: string): value is ClothingCategory {
  return CATEGORIES.some((category) => category.key === value);
}

// 저장 값은 웹 계약 어휘(영문), 화면에는 라벨만 보여준다.
// 한글을 그대로 저장하면 매칭 로직이 못 읽어 계절·TPO 점수가 기본값으로 주저앉는다
const SEASONS = Object.keys(SEASON_LABELS) as Season[];
const OCCASIONS = Object.keys(OCCASION_LABELS) as Occasion[];

export default function EditClosetItemScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem } = useCloset();

  const item = items.find((i: { id: string }) => i.id === id);
  const meta = (item?.metadata ?? {}) as Partial<ClothingMetadata>;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [size, setSize] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      // 칩은 정규화된 대분류를 보여준다 — 저장된 값이 한글 세부종류('티셔츠')여도
      // 조립기가 실제로 쓰는 분류와 화면이 어긋나지 않게 한다 (미매핑이면 미선택)
      setCategory(resolveClothingCategory(item) ?? '');
      setItemBrand(item.brand || '');
      setSize(meta.size || '');
      setSelectedSeasons(meta.season || []);
      setSelectedOccasions(meta.occasion || []);
    }
  }, [item, meta.size, meta.season, meta.occasion]);

  const toggleSeason = useCallback((season: Season) => {
    Haptics.selectionAsync();
    setSelectedSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  }, []);

  const toggleOccasion = useCallback((occasion: Occasion) => {
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
      const isValidCategory = isClothingCategory(category);

      // 정규화 1순위 키(metadata.clothingCategory)를 함께 갱신하지 않으면,
      // 카테고리를 바꿔도 코디 슬롯·필터가 옛 대분류를 계속 따라간다.
      const nextMetadata: Record<string, unknown> = {
        ...(item?.metadata ?? {}),
        size: size.trim() || undefined,
        season: selectedSeasons,
        occasion: selectedOccasions,
      };
      if (isValidCategory) {
        nextMetadata.clothingCategory = category;
      } else {
        // 무효값을 대신 심으면 그 아이템은 어느 슬롯에도 안 잡힌다 —
        // 키를 지워 sub_category 폴백(한글 세부종류 역매핑)이 살아나게 한다
        delete nextMetadata.clothingCategory;
      }

      // 칩을 실제로 바꿨을 때만 sub_category를 새 대분류로 덮는다.
      // (안 바꿨는데 덮으면 '티셔츠' 같은 사용자 어휘가 'top'으로 소실된다)
      const storedCategory = item ? resolveClothingCategory(item) : null;
      const categoryChanged = isValidCategory && category !== storedCategory;

      await updateItem(id, {
        name: name.trim(),
        subCategory: categoryChanged ? category : (item?.subCategory ?? null),
        brand: itemBrand.trim() || null,
        metadata: nextMetadata,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('저장 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }, [id, item, name, category, itemBrand, size, selectedSeasons, selectedOccasions, updateItem]);

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
    <ScreenContainer
      testID="edit-closet-item-screen"
      backgroundGradient="style"
      scrollable={false}
      edges={['bottom']}
    >
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
          <Animated.View entering={FadeInUp.delay(0).duration(TIMING.normal)}>
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
          <Animated.View
            entering={FadeInUp.delay(50).duration(TIMING.normal)}
            style={{ marginTop: spacing.lg }}
          >
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
          <Animated.View
            entering={FadeInUp.delay(100).duration(TIMING.normal)}
            style={{ marginTop: spacing.lg }}
          >
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
          <Animated.View
            entering={FadeInUp.delay(150).duration(TIMING.normal)}
            style={{ marginTop: spacing.lg }}
          >
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
          <Animated.View
            entering={FadeInUp.delay(200).duration(TIMING.normal)}
            style={{ marginTop: spacing.lg }}
          >
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
                    accessibilityLabel={SEASON_LABELS[season]}
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
          <Animated.View
            entering={FadeInUp.delay(250).duration(TIMING.normal)}
            style={{ marginTop: spacing.lg }}
          >
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
                    accessibilityLabel={OCCASION_LABELS[occasion]}
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
