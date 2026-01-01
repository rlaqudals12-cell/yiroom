/**
 * N-1 영양 대시보드 화면
 */
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 샘플 데이터
const DAILY_GOAL = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65,
  fiber: 25,
};

const SAMPLE_MEALS = [
  {
    id: 1,
    type: '아침',
    time: '08:30',
    foods: ['토스트', '스크램블 에그', '우유'],
    calories: 450,
  },
  {
    id: 2,
    type: '점심',
    time: '12:30',
    foods: ['비빔밥', '된장국'],
    calories: 620,
  },
  {
    id: 3,
    type: '간식',
    time: '15:00',
    foods: ['사과', '아몬드'],
    calories: 180,
  },
];

export default function NutritionDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentNutrients] = useState({
    calories: 1250,
    protein: 45,
    carbs: 160,
    fat: 42,
    fiber: 18,
  });

  const caloriePercentage = Math.min(
    (currentNutrients.calories / DAILY_GOAL.calories) * 100,
    100
  );
  const remainingCalories = DAILY_GOAL.calories - currentNutrients.calories;

  const handleRecordMeal = () => {
    router.push('/(nutrition)/record');
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 칼로리 프로그레스 */}
        <View style={[styles.calorieCard, isDark && styles.cardDark]}>
          <Text style={[styles.dateText, isDark && styles.textMuted]}>
            오늘
          </Text>
          <View style={styles.calorieRing}>
            <View style={styles.ringOuter}>
              <View
                style={[
                  styles.ringProgress,
                  {
                    transform: [
                      { rotate: `${(caloriePercentage / 100) * 360}deg` },
                    ],
                  },
                ]}
              />
              <View style={[styles.ringInner, isDark && styles.ringInnerDark]}>
                <Text style={[styles.calorieValue, isDark && styles.textLight]}>
                  {currentNutrients.calories}
                </Text>
                <Text style={[styles.calorieUnit, isDark && styles.textMuted]}>
                  kcal
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.remainingText, isDark && styles.textMuted]}>
            {remainingCalories > 0
              ? `${remainingCalories} kcal 더 섭취 가능`
              : '목표 달성!'}
          </Text>
        </View>

        {/* 영양소 바 차트 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            영양소 현황
          </Text>
          <NutrientBar
            label="단백질"
            current={currentNutrients.protein}
            goal={DAILY_GOAL.protein}
            unit="g"
            color="#ef4444"
            isDark={isDark}
          />
          <NutrientBar
            label="탄수화물"
            current={currentNutrients.carbs}
            goal={DAILY_GOAL.carbs}
            unit="g"
            color="#f59e0b"
            isDark={isDark}
          />
          <NutrientBar
            label="지방"
            current={currentNutrients.fat}
            goal={DAILY_GOAL.fat}
            unit="g"
            color="#10b981"
            isDark={isDark}
          />
          <NutrientBar
            label="식이섬유"
            current={currentNutrients.fiber}
            goal={DAILY_GOAL.fiber}
            unit="g"
            color="#6366f1"
            isDark={isDark}
          />
        </View>

        {/* 오늘의 식사 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              오늘의 식사
            </Text>
            <TouchableOpacity onPress={handleRecordMeal}>
              <Text style={styles.addButton}>+ 추가</Text>
            </TouchableOpacity>
          </View>
          {SAMPLE_MEALS.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <View style={styles.mealInfo}>
                <Text style={[styles.mealType, isDark && styles.textLight]}>
                  {meal.type}
                </Text>
                <Text style={[styles.mealTime, isDark && styles.textMuted]}>
                  {meal.time}
                </Text>
              </View>
              <View style={styles.mealFoods}>
                <Text
                  style={[styles.mealFoodText, isDark && styles.textMuted]}
                  numberOfLines={1}
                >
                  {meal.foods.join(', ')}
                </Text>
              </View>
              <Text style={[styles.mealCalories, isDark && styles.textLight]}>
                {meal.calories} kcal
              </Text>
            </View>
          ))}
        </View>

        {/* 식사 기록 버튼 */}
        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleRecordMeal}
        >
          <Text style={styles.recordButtonText}>식사 기록하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function NutrientBar({
  label,
  current,
  goal,
  unit,
  color,
  isDark,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  isDark: boolean;
}) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <View style={styles.nutrientItem}>
      <View style={styles.nutrientHeader}>
        <Text style={[styles.nutrientLabel, isDark && styles.textLight]}>
          {label}
        </Text>
        <Text style={[styles.nutrientValue, isDark && styles.textMuted]}>
          {current} / {goal} {unit}
        </Text>
      </View>
      <View style={[styles.nutrientBarBg, isDark && styles.nutrientBarBgDark]}>
        <View
          style={[
            styles.nutrientBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
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
  content: {
    padding: 20,
  },
  calorieCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  calorieRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringProgress: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: '#ef4444',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ringInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInnerDark: {
    backgroundColor: '#1a1a1a',
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
  },
  calorieUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  remainingText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  addButton: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  nutrientItem: {
    marginBottom: 16,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutrientLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  nutrientValue: {
    fontSize: 13,
    color: '#666',
  },
  nutrientBarBg: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  nutrientBarBgDark: {
    backgroundColor: '#333',
  },
  nutrientBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealInfo: {
    width: 60,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  mealTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  mealFoods: {
    flex: 1,
    marginHorizontal: 12,
  },
  mealFoodText: {
    fontSize: 14,
    color: '#666',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  recordButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
