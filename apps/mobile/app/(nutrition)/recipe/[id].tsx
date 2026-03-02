/**
 * 레시피 상세 화면
 *
 * 개별 레시피의 재료, 조리법, 영양 정보를 표시한다.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '../../../lib/theme';

interface Ingredient {
  name: string;
  amount: string;
}

interface NutritionInfo {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

// 예시 데이터
const MOCK_RECIPE = {
  name: '닭가슴살 샐러드',
  emoji: '🥗',
  category: '점심',
  prepTime: '15분',
  servings: 1,
  difficulty: '쉬움',
  description: '고단백 저칼로리 샐러드로, 다이어트 중에도 포만감을 줄 수 있어요.',
  ingredients: [
    { name: '닭가슴살', amount: '150g' },
    { name: '양상추', amount: '3장' },
    { name: '방울토마토', amount: '6개' },
    { name: '아보카도', amount: '1/2개' },
    { name: '올리브 오일', amount: '1큰술' },
    { name: '레몬즙', amount: '1큰술' },
    { name: '소금/후추', amount: '약간' },
  ] as Ingredient[],
  steps: [
    '닭가슴살을 소금/후추로 간하고 팬에서 중불로 양면 6분씩 구워요.',
    '양상추를 한입 크기로 뜯고, 방울토마토는 반으로 잘라요.',
    '아보카도를 슬라이스해요.',
    '올리브 오일과 레몬즙을 섞어 드레싱을 만들어요.',
    '접시에 양상추를 깔고 닭가슴살, 토마토, 아보카도를 올려요.',
    '드레싱을 뿌려서 완성해요.',
  ],
  nutrition: { calories: 450, carbs: 15, protein: 42, fat: 24 } as NutritionInfo,
};

export default function RecipeDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, module: moduleColors, nutrient: nutrientColors } = useTheme();

  const recipe = MOCK_RECIPE;
  const totalMacro = recipe.nutrition.carbs + recipe.nutrition.protein + recipe.nutrition.fat;

  return (
    <ScrollView
      testID="recipe-detail-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      {/* 레시피 헤더 */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ fontSize: 64 }}>{recipe.emoji}</Text>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginTop: spacing.sm,
          }}
        >
          {recipe.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>⏱ {recipe.prepTime}</Text>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>👤 {recipe.servings}인분</Text>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>📊 {recipe.difficulty}</Text>
        </View>
      </View>

      <Text style={{ fontSize: typography.size.base, color: colors.mutedForeground, marginBottom: spacing.lg, lineHeight: 22 }}>
        {recipe.description}
      </Text>

      {/* 영양 정보 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        영양 정보
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: typography.size['3xl'],
            fontWeight: typography.weight.bold,
            color: moduleColors.nutrition.base,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
        >
          {recipe.nutrition.calories} kcal
        </Text>

        {/* 매크로 바 */}
        <View style={{ flexDirection: 'row', height: 8, borderRadius: radii.full, overflow: 'hidden', marginBottom: spacing.sm }}>
          <View style={{ flex: recipe.nutrition.carbs, backgroundColor: nutrientColors.carbs }} />
          <View style={{ flex: recipe.nutrition.protein, backgroundColor: nutrientColors.protein }} />
          <View style={{ flex: recipe.nutrition.fat, backgroundColor: nutrientColors.fat }} />
        </View>

        <View style={{ flexDirection: 'row' }}>
          {[
            { label: '탄수화물', value: `${recipe.nutrition.carbs}g`, color: nutrientColors.carbs },
            { label: '단백질', value: `${recipe.nutrition.protein}g`, color: nutrientColors.protein },
            { label: '지방', value: `${recipe.nutrition.fat}g`, color: nutrientColors.fat },
          ].map((macro) => (
            <View key={macro.label} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: macro.color, marginBottom: spacing.xxs }} />
              <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.foreground }}>
                {macro.value}
              </Text>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>{macro.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 재료 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        재료
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        {recipe.ingredients.map((ingredient, index) => (
          <View
            key={ingredient.name}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: spacing.xs,
              borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: typography.size.base, color: colors.foreground }}>{ingredient.name}</Text>
            <Text style={{ fontSize: typography.size.base, color: colors.mutedForeground }}>{ingredient.amount}</Text>
          </View>
        ))}
      </View>

      {/* 조리법 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        조리법
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {recipe.steps.map((step, index) => (
          <View key={index} style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: radii.smx,
                backgroundColor: moduleColors.nutrition.base,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.smx,
              }}
            >
              <Text style={{ fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: colors.overlayForeground }}>
                {index + 1}
              </Text>
            </View>
            <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 }}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* 식사 기록 CTA */}
      <Pressable
        accessibilityLabel="이 레시피로 식사 기록하기"
        onPress={() => router.push('/(nutrition)/record')}
        style={{
          backgroundColor: moduleColors.nutrition.base,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.overlayForeground }}>
          식사 기록하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
