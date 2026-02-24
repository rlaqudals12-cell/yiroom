/**
 * 뷰티 탭
 * 피부 프로필 + 필터 + 제품 피드 + 분석 모듈 네비게이션
 */
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Palette,
  Droplets,
  Calendar,
  Scissors,
  Brush,
  SmilePlus,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  SkinProfileCard,
  SkinConcernFilter,
  CategoryFilter,
  BeautyProductFeed,
} from '../../components/beauty';
import type { BeautyProduct } from '../../components/beauty';
import { EmptyState } from '../../components/common/EmptyState';
import { CollapsibleSection, MenuCard, GradientBackground, SectionHeader } from '../../components/ui';
import { useUserAnalyses } from '../../hooks/useUserAnalyses';
import { TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';

// 샘플 제품 데이터 — 추후 API 연동 시 교체
const SAMPLE_PRODUCTS: BeautyProduct[] = [
  {
    id: 'p1',
    name: '히알루론산 수분 세럼',
    brand: '이니스프리',
    matchRate: 92,
    rating: 4.5,
    category: 'skincare',
    concerns: ['dryness', 'wrinkles'],
  },
  {
    id: 'p2',
    name: '티트리 시카 진정 토너',
    brand: '닥터지',
    matchRate: 88,
    rating: 4.3,
    category: 'skincare',
    concerns: ['acne', 'sensitivity'],
  },
  {
    id: 'p3',
    name: '비타민C 브라이트닝 앰플',
    brand: '클레어스',
    matchRate: 85,
    rating: 4.7,
    category: 'skincare',
    concerns: ['pigmentation', 'dryness'],
  },
  {
    id: 'p4',
    name: '톤업 선크림 SPF50+',
    brand: '라운드랩',
    matchRate: 80,
    rating: 4.4,
    category: 'suncare',
    concerns: ['sensitivity'],
  },
  {
    id: 'p5',
    name: '글로우 쿠션 파운데이션',
    brand: '에스티로더',
    matchRate: 78,
    rating: 4.2,
    category: 'makeup',
    concerns: ['dryness', 'pores'],
  },
  {
    id: 'p6',
    name: 'BHA 블랙헤드 파워 리퀴드',
    brand: '코스알엑스',
    matchRate: 91,
    rating: 4.6,
    category: 'skincare',
    concerns: ['pores', 'oiliness', 'acne'],
  },
  {
    id: 'p7',
    name: '아르간 오일 헤어 에센스',
    brand: '미쟝센',
    matchRate: 76,
    rating: 4.1,
    category: 'haircare',
    concerns: ['dryness'],
  },
  {
    id: 'p8',
    name: '시카 수분 크림',
    brand: '라네즈',
    matchRate: 87,
    rating: 4.5,
    category: 'skincare',
    concerns: ['sensitivity', 'dryness'],
  },
];

export default function BeautyTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, module: moduleColors } = useTheme();
  const { skinAnalysis, isLoading } = useUserAnalyses();

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  // 매치율순 정렬
  const sortedProducts = useMemo(
    () => [...SAMPLE_PRODUCTS].sort((a, b) => b.matchRate - a.matchRate),
    []
  );

  const hasSkinData = skinAnalysis !== null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="beauty-tab"
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <View style={{ padding: spacing.md }}>
        {/* 히어로 헤더 */}
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <GradientBackground
            variant="personalColor"
            style={{
              borderRadius: 20,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <SectionHeader
              title="뷰티"
              style={{ marginBottom: 4 }}
              titleStyle={{ color: colors.overlayForeground, fontSize: 24, fontWeight: '700' }}
            />
          </GradientBackground>
        </Animated.View>

        {/* 피부 프로필 카드 */}
        {isLoading ? (
          <View
            testID="skin-profile-skeleton"
            accessibilityLabel="피부 프로필 로딩 중"
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: spacing.md,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted }} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <View style={{ width: 80, height: 14, borderRadius: 7, backgroundColor: colors.muted }} />
                <View style={{ width: 60, height: 10, borderRadius: 5, backgroundColor: colors.muted, marginTop: 6 }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
              <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.muted }} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ width: 100, height: 18, borderRadius: 9, backgroundColor: colors.muted }} />
                <View style={{ width: 70, height: 12, borderRadius: 6, backgroundColor: colors.muted, marginTop: 6 }} />
              </View>
            </View>
          </View>
        ) : hasSkinData ? (
          <SkinProfileCard
            skinType={skinAnalysis.skinType}
            overallScore={skinAnalysis.overallScore}
            concerns={skinAnalysis.concerns}
            createdAt={skinAnalysis.createdAt}
            style={{ marginBottom: spacing.lg }}
            testID="skin-profile-card"
          />
        ) : (
          <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
            <EmptyState
              icon={<Droplets size={28} color={moduleColors.skin.base} />}
              title="피부 분석을 해보세요"
              description="AI가 피부 상태를 분석하고 맞춤 케어를 추천해줘요"
              actionLabel="피부 분석 시작"
              onAction={() => router.push('/(analysis)/skin')}
              testID="skin-empty-cta"
            />
          </Animated.View>
        )}

        {/* 추천 제품 섹션 */}
        <CollapsibleSection
          title="추천 제품"
          trailing={`${sortedProducts.length}개`}
          defaultOpen
          style={{ marginBottom: spacing.lg }}
          testID="product-section"
        >
          <CategoryFilter
            selected={selectedCategory}
            onSelectionChange={setSelectedCategory}
            style={{ marginBottom: spacing.sm + 2 }}
            testID="category-filter"
          />
          <SkinConcernFilter
            selected={selectedConcerns}
            onSelectionChange={setSelectedConcerns}
            style={{ marginBottom: spacing.md }}
            testID="concern-filter"
          />
          <BeautyProductFeed
            products={sortedProducts}
            categoryFilter={selectedCategory}
            concernFilter={selectedConcerns}
            onProductPress={(p) => router.push(`/products/${p.id}`)}
            testID="product-feed"
          />
        </CollapsibleSection>

        {/* 분석 모듈 네비게이션 */}
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <SectionHeader title="분석" style={{ marginBottom: spacing.sm + 4 }} />
        </Animated.View>

        <View style={{ gap: spacing.sm + 4 }}>
          <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
            <MenuCard
              icon={<Droplets size={20} color={moduleColors.skin.dark} />}
              iconBg={moduleColors.skin.light + '30'}
              title="피부 분석"
              description="AI가 피부 상태를 분석하고 맞춤 케어를 추천해요"
              onPress={() => router.push('/(analysis)/skin')}
              testID="menu-skin"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
            <MenuCard
              icon={<Calendar size={20} color={moduleColors.skin.base} />}
              iconBg={moduleColors.skin.light + '30'}
              title="스킨케어 루틴"
              description="내 피부에 맞는 아침/저녁 스킨케어 루틴을 확인해요"
              onPress={() => router.push('/(analysis)/skin/routine')}
              testID="menu-routine"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250).duration(TIMING.normal)}>
            <MenuCard
              icon={<Palette size={20} color={moduleColors.personalColor.dark} />}
              iconBg={moduleColors.personalColor.light + '30'}
              title="퍼스널 컬러"
              description="나에게 어울리는 색상을 찾아보세요"
              onPress={() => router.push('/(analysis)/personal-color')}
              testID="menu-personal-color"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
            <MenuCard
              icon={<Scissors size={20} color={moduleColors.hair.dark} />}
              iconBg={moduleColors.hair.light + '30'}
              title="헤어 분석"
              description="모발 유형과 두피 상태를 분석하고 케어 루틴을 추천해요"
              onPress={() => router.push('/(analysis)/hair')}
              testID="menu-hair"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(350).duration(TIMING.normal)}>
            <MenuCard
              icon={<Brush size={20} color={moduleColors.makeup.dark} />}
              iconBg={moduleColors.makeup.light + '30'}
              title="메이크업 분석"
              description="얼굴형과 톤에 맞는 메이크업 스타일을 찾아보세요"
              onPress={() => router.push('/(analysis)/makeup')}
              testID="menu-makeup"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(TIMING.normal)}>
            <MenuCard
              icon={<SmilePlus size={20} color={moduleColors.oralHealth.dark} />}
              iconBg={moduleColors.oralHealth.light + '30'}
              title="구강건강 분석"
              description="치아 색상과 잇몸 건강을 체크해요"
              onPress={() => router.push('/(analysis)/oral-health')}
              testID="menu-oral-health"
            />
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
}
