/**
 * N-1 음식 검색 화면
 * DB foods 테이블에서 검색 -> 선택 -> 기록
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { moduleColors, useTheme, spacing, radii, typography } from '@/lib/theme';

import { useClerkSupabaseClient } from '../../../lib/supabase';
import { nutritionLogger } from '../../../lib/utils/logger';

// 스톱라이트 타입
type TrafficLight = 'green' | 'yellow' | 'red';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  trafficLight: TrafficLight;
  category: string;
}

// DB 조회 실패 시 사용하는 기본 음식 데이터
const FALLBACK_FOODS: FoodItem[] = [
  { id: '1', name: '흰쌀밥', calories: 300, protein: 6, carbs: 65, fat: 1, trafficLight: 'yellow', category: '밥' },
  { id: '2', name: '현미밥', calories: 280, protein: 7, carbs: 58, fat: 2, trafficLight: 'green', category: '밥' },
  { id: '3', name: '비빔밥', calories: 550, protein: 18, carbs: 65, fat: 12, trafficLight: 'yellow', category: '밥' },
  { id: '4', name: '라면', calories: 500, protein: 10, carbs: 70, fat: 18, trafficLight: 'red', category: '면' },
  { id: '5', name: '된장찌개', calories: 120, protein: 9, carbs: 8, fat: 5, trafficLight: 'green', category: '국' },
  { id: '6', name: '김치찌개', calories: 150, protein: 12, carbs: 10, fat: 6, trafficLight: 'green', category: '국' },
  { id: '7', name: '불고기', calories: 350, protein: 28, carbs: 15, fat: 20, trafficLight: 'yellow', category: '고기' },
  { id: '8', name: '닭가슴살', calories: 165, protein: 31, carbs: 0, fat: 4, trafficLight: 'green', category: '고기' },
  { id: '9', name: '삼겹살', calories: 500, protein: 25, carbs: 2, fat: 45, trafficLight: 'red', category: '고기' },
  { id: '10', name: '샐러드', calories: 80, protein: 3, carbs: 10, fat: 3, trafficLight: 'green', category: '채소' },
  { id: '11', name: '떡볶이', calories: 380, protein: 6, carbs: 65, fat: 10, trafficLight: 'red', category: '분식' },
  { id: '12', name: '아메리카노', calories: 10, protein: 0, carbs: 2, fat: 0, trafficLight: 'green', category: '음료' },
];

// 식사 타입
const MEAL_TYPES = [
  { id: 'breakfast', label: '아침', icon: '🍳' },
  { id: 'lunch', label: '점심', icon: '🍱' },
  { id: 'dinner', label: '저녁', icon: '🍝' },
  { id: 'snack', label: '간식', icon: '🍪' },
];

// 기본 카테고리 (DB 카테고리가 비었을 때 폴백)
const DEFAULT_CATEGORIES = ['전체', '밥', '면', '국', '고기', '채소', '분식', '음료'];

interface SelectedFood extends FoodItem {
  portion: number;
}

export default function FoodSearchScreen() {
  const { colors, typography } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dbFoods, setDbFoods] = useState<FoodItem[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(true);

  // DB에서 음식 데이터 로드
  const loadFoods = useCallback(async () => {
    setFoodsLoading(true);
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('id, name, category, calories, protein, carbs, fat, traffic_light')
        .order('name')
        .limit(200);

      if (error) throw error;

      if (data && data.length > 0) {
        setDbFoods(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            calories: row.calories ?? 0,
            protein: row.protein ?? 0,
            carbs: row.carbs ?? 0,
            fat: row.fat ?? 0,
            trafficLight: (row.traffic_light as TrafficLight) ?? 'yellow',
            category: row.category ?? '기타',
          }))
        );
      }
    } catch (err) {
      nutritionLogger.error('Failed to load foods from DB:', err);
    } finally {
      setFoodsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // DB 데이터 있으면 사용, 없으면 폴백
  const foodDatabase = dbFoods.length > 0 ? dbFoods : FALLBACK_FOODS;

  // DB에서 가져온 카테고리 동적 생성
  const categories = useMemo(() => {
    const cats = new Set(foodDatabase.map((f) => f.category));
    return ['전체', ...Array.from(cats).sort()];
  }, [foodDatabase]);

  // 필터링된 음식 목록
  const filteredFoods = useMemo(() => {
    return foodDatabase.filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '전체' || food.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, foodDatabase]);

  // 총 영양 정보
  const totalNutrition = useMemo(() => {
    return selectedFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories * food.portion,
        protein: acc.protein + food.protein * food.portion,
        carbs: acc.carbs + food.carbs * food.portion,
        fat: acc.fat + food.fat * food.portion,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedFoods]);

  // 음식 선택/해제
  const handleToggleFood = (food: FoodItem) => {
    Haptics.selectionAsync();
    setSelectedFoods((prev) => {
      const exists = prev.find((f) => f.id === food.id);
      if (exists) {
        return prev.filter((f) => f.id !== food.id);
      }
      return [...prev, { ...food, portion: 1 }];
    });
  };

  // 수량 변경
  const handlePortionChange = (foodId: string, delta: number) => {
    Haptics.selectionAsync();
    setSelectedFoods((prev) =>
      prev.map((food) =>
        food.id === foodId
          ? {
              ...food,
              portion: Math.max(0.5, Math.min(5, food.portion + delta)),
            }
          : food
      )
    );
  };

  // 저장
  const handleSave = async () => {
    if (!user?.id || selectedFoods.length === 0) return;

    setIsSaving(true);

    try {
      const foods = selectedFoods.map((food) => ({
        food_id: food.id,
        food_name: food.name,
        portion: food.portion,
        calories: food.calories * food.portion,
        protein: food.protein * food.portion,
        carbs: food.carbs * food.portion,
        fat: food.fat * food.portion,
        traffic_light: food.trafficLight,
      }));

      const { error } = await supabase.from('meal_records').insert({
        clerk_user_id: user.id,
        meal_type: selectedMealType,
        meal_date: new Date().toISOString().split('T')[0],
        meal_time: new Date().toTimeString().split(' ')[0],
        record_type: 'search',
        foods,
        total_calories: Math.round(totalNutrition.calories),
        total_protein: Math.round(totalNutrition.protein * 10) / 10,
        total_carbs: Math.round(totalNutrition.carbs * 10) / 10,
        total_fat: Math.round(totalNutrition.fat * 10) / 10,
        user_confirmed: true,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('완료', '식사가 기록되었습니다!', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      nutritionLogger.error('Failed to save meal record:', error);
      Alert.alert('오류', '식사 기록 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 스톱라이트 이모지
  const getTrafficLightEmoji = (light: TrafficLight) => {
    switch (light) {
      case 'green':
        return '🟢';
      case 'yellow':
        return '🟡';
      case 'red':
        return '🔴';
    }
  };

  return (
    <SafeAreaView
      testID="nutrition-search-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* 검색 바 */}
      <View style={styles.searchSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="음식 이름 검색"
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* 식사 타입 */}
      <View style={styles.mealTypeRow}>
        {MEAL_TYPES.map((meal) => (
          <Pressable
            key={meal.id}
            style={[
              styles.mealTypeChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedMealType === meal.id && styles.mealTypeChipSelected,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedMealType(meal.id);
            }}
          >
            <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
            <Text
              style={[
                styles.mealTypeLabel,
                { color: selectedMealType === meal.id ? colors.overlayForeground : colors.mutedForeground },
              ]}
            >
              {meal.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 카테고리 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {(categories.length > 1 ? categories : DEFAULT_CATEGORIES).map((category) => (
          <Pressable
            key={category}
            style={[
              styles.categoryChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedCategory === category && styles.categoryChipSelected,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCategory(category);
            }}
          >
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === category ? colors.overlayForeground : colors.mutedForeground },
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 음식 목록 */}
      <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
        {foodsLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={moduleColors.nutrition.dark} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, marginTop: 8 }]}>
              음식 데이터를 불러오는 중...
            </Text>
          </View>
        ) : filteredFoods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              검색 결과가 없습니다
            </Text>
          </View>
        ) : (
          filteredFoods.map((food) => {
            const isSelected = selectedFoods.some((f) => f.id === food.id);
            const selectedFood = selectedFoods.find((f) => f.id === food.id);

            return (
              <Pressable
                key={food.id}
                style={[
                  styles.foodItem,
                  { backgroundColor: colors.card },
                  isSelected && styles.foodItemSelected,
                ]}
                onPress={() => handleToggleFood(food)}
              >
                <Text style={styles.trafficLight}>{getTrafficLightEmoji(food.trafficLight)}</Text>
                <View style={styles.foodInfo}>
                  <Text style={[styles.foodName, { color: colors.foreground }]}>{food.name}</Text>
                  <Text style={[styles.foodMeta, { color: colors.mutedForeground }]}>
                    {food.calories}kcal · 탄{food.carbs}g 단{food.protein}g 지{food.fat}g
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.portionControls}>
                    <Pressable
                      style={[styles.portionButton, { backgroundColor: colors.muted }]}
                      onPress={() => handlePortionChange(food.id, -0.5)}
                    >
                      <Text style={styles.portionButtonText}>−</Text>
                    </Pressable>
                    <Text style={[styles.portionValue, { color: colors.foreground }]}>
                      {selectedFood?.portion}
                    </Text>
                    <Pressable
                      style={[styles.portionButton, { backgroundColor: colors.muted }]}
                      onPress={() => handlePortionChange(food.id, 0.5)}
                    >
                      <Text style={styles.portionButtonText}>+</Text>
                    </Pressable>
                  </View>
                )}
                {!isSelected && (
                  <View style={[styles.addBadge, { backgroundColor: colors.muted }]}>
                    <Text style={styles.addBadgeText}>+</Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* 선택된 음식 요약 및 저장 버튼 */}
      {selectedFoods.length > 0 && (
        <View
          style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}
        >
          <View style={styles.footerInfo}>
            <Text style={[styles.footerCount, { color: colors.foreground }]}>
              {selectedFoods.length}개 선택
            </Text>
            <Text style={styles.footerCalories}>{Math.round(totalNutrition.calories)} kcal</Text>
          </View>
          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.overlayForeground} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.overlayForeground }]}>기록하기</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: typography.size.base,
    borderWidth: 1,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
  },
  mealTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  mealTypeChipSelected: {
    backgroundColor: moduleColors.nutrition.dark,
    borderColor: moduleColors.nutrition.dark,
  },
  mealTypeIcon: {
    fontSize: typography.size.base,
  },
  mealTypeLabel: {
    fontSize: 13,
  },
  categoryScroll: {
    maxHeight: 44,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  categoryChipSelected: {
    backgroundColor: moduleColors.nutrition.dark,
    borderColor: moduleColors.nutrition.dark,
  },
  categoryText: {
    fontSize: 13,
  },
  foodList: {
    flex: 1,
    padding: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: typography.size.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: spacing.sm,
  },
  foodItemSelected: {
    borderWidth: 2,
    borderColor: moduleColors.nutrition.dark,
  },
  trafficLight: {
    fontSize: typography.size.lg,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
    marginBottom: 2,
  },
  foodMeta: {
    fontSize: typography.size.xs,
  },
  portionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  portionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionButtonText: {
    fontSize: typography.size.base,
    color: moduleColors.nutrition.dark,
    fontWeight: typography.weight.semibold,
  },
  portionValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    minWidth: spacing.lg,
    textAlign: 'center',
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadgeText: {
    fontSize: typography.size.lg,
    color: moduleColors.nutrition.dark,
    fontWeight: typography.weight.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
  },
  footerInfo: {
    flex: 1,
  },
  footerCount: {
    fontSize: typography.size.sm,
    marginBottom: 2,
  },
  footerCalories: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: moduleColors.nutrition.dark,
  },
  saveButton: {
    backgroundColor: moduleColors.nutrition.dark,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
