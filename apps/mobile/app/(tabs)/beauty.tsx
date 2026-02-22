/**
 * 뷰티 탭
 * 피부·헤어·메이크업·구강 분석, 스킨케어 루틴, 퍼스널 컬러, 추천 제품
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
import { ScrollView, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { MenuCard, GradientBackground, SectionHeader } from '../../components/ui';
import { TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';

export default function BeautyTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, module: moduleColors } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} testID="beauty-tab">
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
              titleStyle={{ color: '#fff', fontSize: 24, fontWeight: '700' }}
            />
          </GradientBackground>
        </Animated.View>

        {/* 분석 모듈 */}
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

          <Animated.View entering={FadeInUp.delay(450).duration(TIMING.normal)}>
            <MenuCard
              icon={<Sparkles size={20} color={moduleColors.personalColor.base} />}
              iconBg={moduleColors.personalColor.light + '20'}
              title="추천 제품"
              description="내 피부 타입에 맞는 화장품을 추천받으세요"
              onPress={() => router.push('/products?category=skincare')}
              testID="menu-products"
            />
          </Animated.View>
        </View>
      </View>
    </ScrollView>
  );
}
