/**
 * 뷰티 탭
 * 피부 분석, 스킨케어 루틴, 퍼스널 컬러, 추천 제품
 */
import { useRouter } from 'expo-router';
import { Sparkles, Palette, Droplets, Calendar } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MenuCard } from '../../components/ui';
import { useTheme } from '../../lib/theme';

export default function BeautyTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, typography, module: moduleColors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="beauty-tab"
    >
      <View style={{ padding: spacing.md }}>
        <Text
          style={[
            styles.heading,
            {
              color: colors.foreground,
              fontSize: typography.size['2xl'],
              fontWeight: typography.weight.bold,
              marginBottom: spacing.lg,
            },
          ]}
        >
          뷰티
        </Text>

        <View style={{ gap: spacing.sm + 4 }}>
          <MenuCard
            icon={<Droplets size={20} color={moduleColors.skin.dark} />}
            iconBg={moduleColors.skin.light + '30'}
            title="피부 분석"
            description="AI가 피부 상태를 분석하고 맞춤 케어를 추천해요"
            onPress={() => router.push('/(analysis)/skin')}
            testID="menu-skin"
          />

          <MenuCard
            icon={<Calendar size={20} color={moduleColors.skin.base} />}
            iconBg={moduleColors.skin.light + '30'}
            title="스킨케어 루틴"
            description="내 피부에 맞는 아침/저녁 스킨케어 루틴을 확인해요"
            onPress={() => router.push('/(analysis)/skin/routine')}
            testID="menu-routine"
          />

          <MenuCard
            icon={<Palette size={20} color={moduleColors.personalColor.dark} />}
            iconBg={moduleColors.personalColor.light + '30'}
            title="퍼스널 컬러"
            description="나에게 어울리는 색상을 찾아보세요"
            onPress={() => router.push('/(analysis)/personal-color')}
            testID="menu-personal-color"
          />

          <MenuCard
            icon={
              <Sparkles size={20} color={moduleColors.personalColor.base} />
            }
            iconBg={moduleColors.personalColor.light + '20'}
            title="추천 제품"
            description="내 피부 타입에 맞는 화장품을 추천받으세요"
            onPress={() => router.push('/products?category=cosmetics')}
            testID="menu-products"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    lineHeight: 32,
  },
});
