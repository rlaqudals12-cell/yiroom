/**
 * N-1 음식 검색 화면
 * 음식명 검색 → 선택 → 기록
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

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

// 음식 DB Mock
const FOOD_DATABASE: FoodItem[] = [
  // 밥/면류
  {
    id: '1',
    name: '흰쌀밥',
    calories: 300,
    protein: 6,
    carbs: 65,
    fat: 1,
    trafficLight: 'yellow',
    category: '밥',
  },
  {
    id: '2',
    name: '현미밥',
    calories: 280,
    protein: 7,
    carbs: 58,
    fat: 2,
    trafficLight: 'green',
    category: '밥',
  },
  {
    id: '3',
    name: '잡곡밥',
    calories: 290,
    protein: 8,
    carbs: 60,
    fat: 2,
    trafficLight: 'green',
    category: '밥',
  },
  {
    id: '4',
    name: '비빔밥',
    calories: 550,
    protein: 18,
    carbs: 65,
    fat: 12,
    trafficLight: 'yellow',
    category: '밥',
  },
  {
    id: '5',
    name: '김밥',
    calories: 320,
    protein: 8,
    carbs: 45,
    fat: 12,
    trafficLight: 'yellow',
    category: '밥',
  },
  {
    id: '6',
    name: '라면',
    calories: 500,
    protein: 10,
    carbs: 70,
    fat: 18,
    trafficLight: 'red',
    category: '면',
  },
  {
    id: '7',
    name: '짜장면',
    calories: 600,
    protein: 15,
    carbs: 85,
    fat: 20,
    trafficLight: 'red',
    category: '면',
  },
  {
    id: '8',
    name: '냉면',
    calories: 450,
    protein: 12,
    carbs: 80,
    fat: 8,
    trafficLight: 'yellow',
    category: '면',
  },
  // 국/찌개
  {
    id: '9',
    name: '된장찌개',
    calories: 120,
    protein: 9,
    carbs: 8,
    fat: 5,
    trafficLight: 'green',
    category: '국',
  },
  {
    id: '10',
    name: '김치찌개',
    calories: 150,
    protein: 12,
    carbs: 10,
    fat: 6,
    trafficLight: 'green',
    category: '국',
  },
  {
    id: '11',
    name: '부대찌개',
    calories: 350,
    protein: 20,
    carbs: 25,
    fat: 18,
    trafficLight: 'yellow',
    category: '국',
  },
  {
    id: '12',
    name: '미역국',
    calories: 80,
    protein: 5,
    carbs: 6,
    fat: 3,
    trafficLight: 'green',
    category: '국',
  },
  // 고기
  {
    id: '13',
    name: '불고기',
    calories: 350,
    protein: 28,
    carbs: 15,
    fat: 20,
    trafficLight: 'yellow',
    category: '고기',
  },
  {
    id: '14',
    name: '삼겹살',
    calories: 500,
    protein: 25,
    carbs: 2,
    fat: 45,
    trafficLight: 'red',
    category: '고기',
  },
  {
    id: '15',
    name: '닭가슴살',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 4,
    trafficLight: 'green',
    category: '고기',
  },
  {
    id: '16',
    name: '치킨',
    calories: 450,
    protein: 35,
    carbs: 15,
    fat: 28,
    trafficLight: 'red',
    category: '고기',
  },
  {
    id: '17',
    name: '제육볶음',
    calories: 380,
    protein: 22,
    carbs: 20,
    fat: 24,
    trafficLight: 'yellow',
    category: '고기',
  },
  // 채소/샐러드
  {
    id: '18',
    name: '샐러드',
    calories: 80,
    protein: 3,
    carbs: 10,
    fat: 3,
    trafficLight: 'green',
    category: '채소',
  },
  {
    id: '19',
    name: '시금치나물',
    calories: 50,
    protein: 4,
    carbs: 5,
    fat: 2,
    trafficLight: 'green',
    category: '채소',
  },
  {
    id: '20',
    name: '콩나물무침',
    calories: 40,
    protein: 4,
    carbs: 4,
    fat: 1,
    trafficLight: 'green',
    category: '채소',
  },
  // 분식
  {
    id: '21',
    name: '떡볶이',
    calories: 380,
    protein: 6,
    carbs: 65,
    fat: 10,
    trafficLight: 'red',
    category: '분식',
  },
  {
    id: '22',
    name: '순대',
    calories: 250,
    protein: 12,
    carbs: 30,
    fat: 10,
    trafficLight: 'yellow',
    category: '분식',
  },
  {
    id: '23',
    name: '튀김',
    calories: 300,
    protein: 5,
    carbs: 35,
    fat: 16,
    trafficLight: 'red',
    category: '분식',
  },
  // 음료
  {
    id: '24',
    name: '아메리카노',
    calories: 10,
    protein: 0,
    carbs: 2,
    fat: 0,
    trafficLight: 'green',
    category: '음료',
  },
  {
    id: '25',
    name: '카페라떼',
    calories: 150,
    protein: 8,
    carbs: 12,
    fat: 8,
    trafficLight: 'yellow',
    category: '음료',
  },
  {
    id: '26',
    name: '콜라',
    calories: 140,
    protein: 0,
    carbs: 35,
    fat: 0,
    trafficLight: 'red',
    category: '음료',
  },
];

// 식사 타입
const MEAL_TYPES = [
  { id: 'breakfast', label: '아침', icon: '🍳' },
  { id: 'lunch', label: '점심', icon: '🍱' },
  { id: 'dinner', label: '저녁', icon: '🍝' },
  { id: 'snack', label: '간식', icon: '🍪' },
];

// 카테고리
const CATEGORIES = ['전체', '밥', '면', '국', '고기', '채소', '분식', '음료'];

interface SelectedFood extends FoodItem {
  portion: number;
}

export default function FoodSearchScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 필터링된 음식 목록
  const filteredFoods = useMemo(() => {
    return FOOD_DATABASE.filter((food) => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '전체' || food.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      {/* 검색 바 */}
      <View style={styles.searchSection}>
        <TextInput
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          placeholder="음식 이름 검색"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* 식사 타입 */}
      <View style={styles.mealTypeRow}>
        {MEAL_TYPES.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[
              styles.mealTypeChip,
              isDark && styles.mealTypeChipDark,
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
                isDark && styles.textMuted,
                selectedMealType === meal.id && styles.mealTypeLabelSelected,
              ]}
            >
              {meal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 카테고리 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              isDark && styles.categoryChipDark,
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
                isDark && styles.textMuted,
                selectedCategory === category && styles.categoryTextSelected,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 음식 목록 */}
      <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
        {filteredFoods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, isDark && styles.textMuted]}>검색 결과가 없습니다</Text>
          </View>
        ) : (
          filteredFoods.map((food) => {
            const isSelected = selectedFoods.some((f) => f.id === food.id);
            const selectedFood = selectedFoods.find((f) => f.id === food.id);

            return (
              <TouchableOpacity
                key={food.id}
                style={[
                  styles.foodItem,
                  isDark && styles.foodItemDark,
                  isSelected && styles.foodItemSelected,
                ]}
                onPress={() => handleToggleFood(food)}
              >
                <Text style={styles.trafficLight}>{getTrafficLightEmoji(food.trafficLight)}</Text>
                <View style={styles.foodInfo}>
                  <Text style={[styles.foodName, isDark && styles.textLight]}>{food.name}</Text>
                  <Text style={[styles.foodMeta, isDark && styles.textMuted]}>
                    {food.calories}kcal · 탄{food.carbs}g 단{food.protein}g 지{food.fat}g
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.portionControls}>
                    <TouchableOpacity
                      style={styles.portionButton}
                      onPress={() => handlePortionChange(food.id, -0.5)}
                    >
                      <Text style={styles.portionButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.portionValue, isDark && styles.textLight]}>
                      {selectedFood?.portion}
                    </Text>
                    <TouchableOpacity
                      style={styles.portionButton}
                      onPress={() => handlePortionChange(food.id, 0.5)}
                    >
                      <Text style={styles.portionButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {!isSelected && (
                  <View style={styles.addBadge}>
                    <Text style={styles.addBadgeText}>+</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 선택된 음식 요약 및 저장 버튼 */}
      {selectedFoods.length > 0 && (
        <View style={[styles.footer, isDark && styles.footerDark]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerCount, isDark && styles.textLight]}>
              {selectedFoods.length}개 선택
            </Text>
            <Text style={styles.footerCalories}>{Math.round(totalNutrition.calories)} kcal</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>기록하기</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchInputDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
    color: '#fff',
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mealTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 4,
  },
  mealTypeChipDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  mealTypeChipSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  mealTypeIcon: {
    fontSize: 16,
  },
  mealTypeLabel: {
    fontSize: 13,
    color: '#333',
  },
  mealTypeLabelSelected: {
    color: '#fff',
  },
  categoryScroll: {
    maxHeight: 44,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  categoryChipDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  categoryChipSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  categoryText: {
    fontSize: 13,
    color: '#333',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  foodList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  foodItemDark: {
    backgroundColor: '#1a1a1a',
  },
  foodItemSelected: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  trafficLight: {
    fontSize: 18,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
    marginBottom: 2,
  },
  foodMeta: {
    fontSize: 12,
    color: '#666',
  },
  portionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  portionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionButtonText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  portionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    minWidth: 24,
    textAlign: 'center',
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadgeText: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  footerDark: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
  },
  footerInfo: {
    flex: 1,
  },
  footerCount: {
    fontSize: 14,
    color: '#111',
    marginBottom: 2,
  },
  footerCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
