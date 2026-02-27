/**
 * 스타일 탭
 * 체형 프로필 + 옷장 프리뷰 + 오늘의 코디 + 분석/스타일링 메뉴
 */
import { useRouter } from 'expo-router';
import {
  Shirt,
  Ruler,
  ShoppingBag,
  Package,
  Wand2,
  PersonStanding,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { EmptyState } from '../../components/common/EmptyState';
import { BodyProfileCard, ClosetPreviewStrip, TodayOutfitSuggestion } from '../../components/style';
import { MenuCard, GradientBackground, ScreenContainer, SectionHeader } from '../../components/ui';
import { useUserAnalyses } from '../../hooks';
import { staggeredEntry, TIMING } from '../../lib/animations';
import { useCloset, useClosetMatcher, type PersonalColorSeason, type BodyType3 } from '../../lib/inventory';
import { useTheme, typography, radii, ICON_BG_OPACITY, borderGlow } from '../../lib/theme';

export default function StyleTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, radii, typography, brand, module: moduleColors, shadows, status } = useTheme();

  // 분석 데이터
  const { bodyAnalysis, personalColor, refetch: refetchAnalyses } = useUserAnalyses();

  // 옷장 데이터
  const { items: closetItems, refetch: refetchCloset } = useCloset();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAnalyses(), refetchCloset()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnalyses, refetchCloset]);

  // 코디 매칭
  const { getOutfitSuggestion } = useClosetMatcher({
    personalColor: (personalColor?.season as PersonalColorSeason) ?? null,
    bodyType: (bodyAnalysis?.bodyType as BodyType3) ?? null,
  });

  const outfitSuggestion = getOutfitSuggestion();

  return (
    <ScreenContainer testID="style-tab" refreshing={refreshing} onRefresh={handleRefresh}>
        {/* 히어로 헤더 */}
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <GradientBackground
            variant="body"
            style={{
              borderRadius: radii.xl + spacing.xs,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <SectionHeader
              title="스타일"
              style={{ marginBottom: spacing.xs }}
              titleStyle={{ color: colors.overlayForeground, fontSize: typography.size['2xl'], fontWeight: typography.weight.bold }}
            />
          </GradientBackground>
        </Animated.View>

        {/* 체형 프로필 카드 or CTA */}
        {bodyAnalysis ? (
          <BodyProfileCard
            bodyType={bodyAnalysis.bodyType}
            height={bodyAnalysis.height}
            weight={bodyAnalysis.weight}
            bmi={bodyAnalysis.bmi}
            createdAt={bodyAnalysis.createdAt}
            style={{ marginBottom: spacing.md, ...borderGlow.purple }}
            testID="body-profile"
          />
        ) : (
          <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
            <EmptyState
              icon={<Ruler size={28} color={moduleColors.body.dark} />}
              title="체형 분석을 해보세요"
              description="AI가 체형을 분석하고 어울리는 스타일을 추천해요"
              actionLabel="분석 시작"
              onAction={() => router.push('/(analysis)/body')}
              testID="body-analysis-cta"
            />
          </Animated.View>
        )}

        {/* 옷장 프리뷰 */}
        <ClosetPreviewStrip
          items={closetItems}
          onItemPress={(item) => router.push(`/(closet)/${item.id}`)}
          onViewAll={() => router.push('/(closet)')}
          style={{ marginBottom: spacing.md }}
          testID="closet-preview"
        />

        {/* 오늘의 코디 */}
        {outfitSuggestion && (
          <TodayOutfitSuggestion
            suggestion={outfitSuggestion}
            onPress={() => router.push('/(closet)/recommend')}
            style={{ marginBottom: spacing.md }}
            testID="outfit-suggestion"
          />
        )}

        {/* 분석 */}
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <SectionHeader title="분석" gradient="body" style={{ marginBottom: spacing.sm + 4 }} />
        </Animated.View>

        <View style={{ gap: spacing.sm + 4 }}>
          <Animated.View entering={staggeredEntry(0)}>
            <MenuCard
              icon={<Ruler size={20} color={moduleColors.body.dark} />}
              iconBg={moduleColors.body.light + ICON_BG_OPACITY}
              title="체형 분석"
              description="AI가 체형을 분석하고 어울리는 스타일을 추천해요"
              onPress={() => router.push('/(analysis)/body')}
              testID="menu-body"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(1)}>
            <MenuCard
              icon={<PersonStanding size={20} color={moduleColors.posture.dark} />}
              iconBg={moduleColors.posture.light + ICON_BG_OPACITY}
              title="자세 분석"
              description="자세 유형을 분석하고 교정 운동을 추천해요"
              onPress={() => router.push('/(analysis)/posture')}
              testID="menu-posture"
            />
          </Animated.View>
        </View>

        {/* 스타일링 */}
        <Animated.View entering={FadeInUp.delay(250).duration(TIMING.normal)}>
          <SectionHeader
            title="스타일링"
            style={{ marginTop: spacing.lg, marginBottom: spacing.sm + 4 }}
          />
        </Animated.View>

        <View style={{ gap: spacing.sm + 4, marginBottom: spacing.lg }}>
          <Animated.View entering={staggeredEntry(0)}>
            <MenuCard
              icon={<Shirt size={20} color={moduleColors.body.base} />}
              iconBg={moduleColors.body.light + ICON_BG_OPACITY}
              title="패션 추천"
              description="체형과 퍼스널 컬러에 맞는 옷을 추천받으세요"
              onPress={() => router.push('/products?category=fashion')}
              testID="menu-fashion"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(1)}>
            <MenuCard
              icon={<Package size={20} color={moduleColors.body.dark} />}
              iconBg={moduleColors.body.light + ICON_BG_OPACITY}
              title="내 옷장"
              description="옷장을 관리하고 AI 코디 추천을 받으세요"
              onPress={() => router.push('/(closet)')}
              testID="menu-closet"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(2)}>
            <MenuCard
              icon={<Wand2 size={20} color={moduleColors.personalColor.dark} />}
              iconBg={moduleColors.personalColor.light + ICON_BG_OPACITY}
              title="오늘의 코디"
              description="퍼스널컬러와 체형에 맞는 코디를 추천받으세요"
              onPress={() => router.push('/(closet)/recommend')}
              testID="menu-coord"
            />
          </Animated.View>

          <Animated.View entering={staggeredEntry(3)}>
            <MenuCard
              icon={<ShoppingBag size={20} color={status.success} />}
              iconBg={status.success + ICON_BG_OPACITY}
              title="제품 둘러보기"
              description="인기 제품과 할인 정보를 확인하세요"
              onPress={() => router.push('/products')}
              testID="menu-shopping"
            />
          </Animated.View>
        </View>
    </ScreenContainer>
  );
}
