/**
 * 스타일 탭
 * 체형 분석, 패션 추천, 내 옷장, 코디 추천, 제품 둘러보기
 */
import { useRouter } from 'expo-router';
import { Shirt, Ruler, ShoppingBag, Package, Wand2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MenuCard } from '../../components/ui';
import { useTheme } from '../../lib/theme';

export default function StyleTab(): React.JSX.Element {
  const router = useRouter();
  const {
    colors,
    spacing,
    typography,
    module: moduleColors,
    status,
  } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="style-tab"
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
          스타일
        </Text>

        <View style={{ gap: spacing.sm + 4 }}>
          <MenuCard
            icon={<Ruler size={20} color={moduleColors.body.dark} />}
            iconBg={moduleColors.body.light + '30'}
            title="체형 분석"
            description="AI가 체형을 분석하고 어울리는 스타일을 추천해요"
            onPress={() => router.push('/(analysis)/body')}
            testID="menu-body"
          />

          <MenuCard
            icon={<Shirt size={20} color={moduleColors.body.base} />}
            iconBg={moduleColors.body.light + '20'}
            title="패션 추천"
            description="체형과 퍼스널 컬러에 맞는 옷을 추천받으세요"
            onPress={() => router.push('/products?category=fashion')}
            testID="menu-fashion"
          />

          <MenuCard
            icon={<Package size={20} color={moduleColors.body.dark} />}
            iconBg={moduleColors.body.light + '20'}
            title="내 옷장"
            description="옷장을 관리하고 AI 코디 추천을 받으세요"
            onPress={() => router.push('/(closet)')}
            testID="menu-closet"
          />

          <MenuCard
            icon={<Wand2 size={20} color={moduleColors.personalColor.dark} />}
            iconBg={moduleColors.personalColor.light + '20'}
            title="오늘의 코디"
            description="퍼스널컬러와 체형에 맞는 코디를 추천받으세요"
            onPress={() => router.push('/(closet)/recommend')}
            testID="menu-coord"
          />

          <MenuCard
            icon={<ShoppingBag size={20} color={status.success} />}
            iconBg={status.success + '20'}
            title="제품 둘러보기"
            description="인기 제품과 할인 정보를 확인하세요"
            onPress={() => router.push('/products')}
            testID="menu-shopping"
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
