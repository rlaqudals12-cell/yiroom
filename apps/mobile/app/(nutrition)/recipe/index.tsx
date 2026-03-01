/**
 * 레시피 목록 화면
 *
 * 영양 균형 맞춤 레시피를 탐색한다.
 */
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '../../../lib/theme';

type RecipeCategory = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  category: RecipeCategory;
  calories: number;
  prepTime: string;
  difficulty: string;
  tags: string[];
}

const CATEGORY_TABS: { id: RecipeCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'breakfast', label: '아침' },
  { id: 'lunch', label: '점심' },
  { id: 'dinner', label: '저녁' },
  { id: 'snack', label: '간식' },
];

const MOCK_RECIPES: Recipe[] = [
  { id: '1', name: '그릭 요거트 보울', emoji: '🥣', category: 'breakfast', calories: 320, prepTime: '5분', difficulty: '쉬움', tags: ['고단백', '저지방'] },
  { id: '2', name: '닭가슴살 샐러드', emoji: '🥗', category: 'lunch', calories: 450, prepTime: '15분', difficulty: '쉬움', tags: ['고단백', '다이어트'] },
  { id: '3', name: '연어 아보카도 덮밥', emoji: '🍣', category: 'lunch', calories: 520, prepTime: '20분', difficulty: '보통', tags: ['오메가3', '건강식'] },
  { id: '4', name: '두부 스테이크', emoji: '🍽️', category: 'dinner', calories: 380, prepTime: '25분', difficulty: '보통', tags: ['저칼로리', '채식'] },
  { id: '5', name: '고구마 스무디', emoji: '🥤', category: 'snack', calories: 180, prepTime: '5분', difficulty: '쉬움', tags: ['식이섬유', '간식'] },
  { id: '6', name: '오트밀 팬케이크', emoji: '🥞', category: 'breakfast', calories: 290, prepTime: '10분', difficulty: '쉬움', tags: ['통곡물', '식이섬유'] },
  { id: '7', name: '새우 볶음면', emoji: '🍜', category: 'dinner', calories: 480, prepTime: '20분', difficulty: '보통', tags: ['고단백', '균형식'] },
  { id: '8', name: '견과류 에너지바', emoji: '🍫', category: 'snack', calories: 150, prepTime: '30분', difficulty: '쉬움', tags: ['건강 간식', '에너지'] },
];

export default function RecipeListScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, module: moduleColors, nutrient: nutrientColors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<RecipeCategory>('all');

  const filteredRecipes = activeCategory === 'all'
    ? MOCK_RECIPES
    : MOCK_RECIPES.filter((r) => r.category === activeCategory);

  return (
    <ScrollView
      testID="recipe-list-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        맞춤 레시피
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        영양 균형 잡힌 레시피를 찾아보세요
      </Text>

      {/* 카테고리 탭 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {CATEGORY_TABS.map((tab) => {
            const active = activeCategory === tab.id;
            return (
              <Pressable
                key={tab.id}
                accessibilityLabel={`${tab.label} 레시피`}
                onPress={() => setActiveCategory(tab.id)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: active ? moduleColors.nutrition.base : colors.secondary,
                }}
              >
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: active ? typography.weight.semibold : typography.weight.normal,
                    color: active ? '#FFFFFF' : colors.foreground,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 레시피 목록 */}
      <View style={{ gap: spacing.sm }}>
        {filteredRecipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            accessibilityLabel={`${recipe.name}, ${recipe.calories}kcal`}
            onPress={() => router.push({ pathname: '/(nutrition)/recipe/[id]' as never, params: { id: recipe.id } })}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 32, marginRight: spacing.smx }}>{recipe.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                  {recipe.name}
                </Text>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  {recipe.calories}kcal · {recipe.prepTime} · {recipe.difficulty}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xxs,
                    borderRadius: radii.full,
                    backgroundColor: moduleColors.nutrition.base + '15',
                  }}
                >
                  <Text style={{ fontSize: typography.size.xs, color: moduleColors.nutrition.base }}>{tag}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
