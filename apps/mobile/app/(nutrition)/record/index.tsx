/**
 * N-1 식사 기록 화면 (음식 촬영 분석)
 */
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { moduleColors, useTheme } from '@/lib/theme';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: '아침', emoji: '🌅' },
  { type: 'lunch', label: '점심', emoji: '☀️' },
  { type: 'dinner', label: '저녁', emoji: '🌙' },
  { type: 'snack', label: '간식', emoji: '🍪' },
];

// 샘플 음식 데이터
const QUICK_ADD_FOODS = [
  { name: '밥 1공기', calories: 300, emoji: '🍚' },
  { name: '김치찌개', calories: 180, emoji: '🍲' },
  { name: '삼겹살 100g', calories: 330, emoji: '🥓' },
  { name: '사과 1개', calories: 95, emoji: '🍎' },
  { name: '아메리카노', calories: 5, emoji: '☕' },
  { name: '계란 1개', calories: 80, emoji: '🥚' },
];

export default function NutritionRecordScreen() {
  const { colors } = useTheme();

  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [searchText, setSearchText] = useState('');
  const [addedFoods, setAddedFoods] = useState<{ name: string; calories: number; emoji: string }[]>(
    []
  );

  const totalCalories = addedFoods.reduce((sum, food) => sum + food.calories, 0);

  const handleTakePhoto = () => {
    Alert.alert('음식 촬영', '카메라로 음식을 촬영하면 AI가 자동으로 음식을 인식합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '촬영하기',
        onPress: () => {
          // TODO: 카메라 연동
          Alert.alert('준비 중', 'AI 음식 인식 기능은 준비 중입니다.');
        },
      },
    ]);
  };

  const handleAddFood = (food: { name: string; calories: number; emoji: string }) => {
    setAddedFoods((prev) => [...prev, food]);
  };

  const handleRemoveFood = (index: number) => {
    setAddedFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (addedFoods.length === 0) {
      Alert.alert('알림', '음식을 추가해주세요.');
      return;
    }

    Alert.alert(
      '저장 완료',
      `${MEAL_TYPES.find((m) => m.type === selectedMealType)?.label} 식사가 기록되었습니다.\n총 ${totalCalories} kcal`,
      [{ text: '확인', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 식사 타입 선택 */}
        <View style={styles.mealTypeContainer}>
          {MEAL_TYPES.map((meal) => (
            <TouchableOpacity
              key={meal.type}
              style={[
                styles.mealTypeButton,
                { backgroundColor: colors.card },
                selectedMealType === meal.type && styles.mealTypeButtonActive,
              ]}
              onPress={() => setSelectedMealType(meal.type)}
            >
              <Text style={styles.mealTypeEmoji}>{meal.emoji}</Text>
              <Text
                style={[
                  styles.mealTypeLabel,
                  { color: colors.mutedForeground },
                  selectedMealType === meal.type && styles.mealTypeLabelActive,
                ]}
              >
                {meal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 촬영 버튼 */}
        <TouchableOpacity
          style={[styles.photoButton, { backgroundColor: colors.card }]}
          onPress={handleTakePhoto}
        >
          <Text style={styles.photoIcon}>📷</Text>
          <View>
            <Text style={[styles.photoTitle, { color: colors.foreground }]}>음식 촬영하기</Text>
            <Text style={[styles.photoSubtitle, { color: colors.mutedForeground }]}>
              AI가 자동으로 음식을 인식합니다
            </Text>
          </View>
        </TouchableOpacity>

        {/* 검색 */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="음식 검색"
            placeholderTextColor={colors.mutedForeground}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 빠른 추가 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>빠른 추가</Text>
          <View style={styles.quickAddGrid}>
            {QUICK_ADD_FOODS.map((food, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickAddItem, { backgroundColor: colors.muted }]}
                onPress={() => handleAddFood(food)}
              >
                <Text style={styles.quickAddEmoji}>{food.emoji}</Text>
                <Text style={[styles.quickAddName, { color: colors.foreground }]} numberOfLines={1}>
                  {food.name}
                </Text>
                <Text style={[styles.quickAddCalories, { color: colors.mutedForeground }]}>
                  {food.calories} kcal
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 추가된 음식 */}
        {addedFoods.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>추가된 음식</Text>
            {addedFoods.map((food, index) => (
              <View
                key={index}
                style={[styles.addedFoodItem, { borderBottomColor: colors.border }]}
              >
                <Text style={styles.addedFoodEmoji}>{food.emoji}</Text>
                <Text style={[styles.addedFoodName, { color: colors.foreground }]}>
                  {food.name}
                </Text>
                <Text style={[styles.addedFoodCalories, { color: colors.mutedForeground }]}>
                  {food.calories} kcal
                </Text>
                <TouchableOpacity onPress={() => handleRemoveFood(index)}>
                  <Text style={[styles.removeButton, { color: colors.mutedForeground }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>총 칼로리</Text>
              <Text style={styles.totalValue}>{totalCalories} kcal</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 저장 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>기록 저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  mealTypeButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeButtonActive: {
    borderColor: moduleColors.nutrition.dark,
    backgroundColor: '#f0fdf4',
  },
  mealTypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  mealTypeLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  mealTypeLabelActive: {
    color: moduleColors.nutrition.dark,
    fontWeight: '600',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 16,
  },
  photoIcon: {
    fontSize: 40,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  photoSubtitle: {
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddItem: {
    width: '30%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickAddEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickAddName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickAddCalories: {
    fontSize: 11,
  },
  addedFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  addedFoodEmoji: {
    fontSize: 24,
  },
  addedFoodName: {
    flex: 1,
    fontSize: 15,
  },
  addedFoodCalories: {
    fontSize: 14,
  },
  removeButton: {
    fontSize: 16,
    padding: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: moduleColors.nutrition.dark,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: moduleColors.nutrition.dark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
