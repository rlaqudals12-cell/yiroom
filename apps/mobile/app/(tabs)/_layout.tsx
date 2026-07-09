/**
 * 이룸 탭 네비게이션 레이아웃
 * 5탭 단일 IA (ADR-114): 오늘 / 물어보기(가운데) / 뷰티 / 스타일 / 나
 * — 웹 components/BottomNav.tsx 정본과 동일한 5항목·순서(오늘·뷰티·물어보기·스타일·나).
 * — 물어보기(코치)를 물리적 가운데(3번째)에 두어 1급 동작을 강조.
 * — "기록"(WELLNESS_PHASE2) 탭은 네비 진입점만 폐기, 라우트는 유지(href 게이팅).
 *
 * 커스텀 BrandTabBar: 그라디언트 인디케이터 + 햅틱 피드백 + 프레스 스케일
 */
import { Tabs } from 'expo-router';
import { Home, MessageCircle, Sparkles, Shirt, BookOpen, User } from 'lucide-react-native';
import { FEATURE_FLAGS } from '@yiroom/shared';

import { BrandTabBar } from '../../components/navigation/BrandTabBar';
import { useTheme } from '../../lib/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <BrandTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '오늘',
          tabBarLabel: '오늘',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="beauty"
        options={{
          title: '뷰티',
          tabBarLabel: '뷰티',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      {/* 물어보기(코치) — 5탭의 물리적 가운데, 컨설팅의 심장 */}
      <Tabs.Screen
        name="ask"
        options={{
          title: '물어보기',
          tabBarLabel: '물어보기',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          // ChatInterface가 자체 헤더를 제공 — 중복 네비 헤더 숨김
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="style"
        options={{
          title: '스타일',
          tabBarLabel: '스타일',
          tabBarIcon: ({ color, size }) => <Shirt color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '나',
          tabBarLabel: '나',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '기록',
          tabBarLabel: '기록',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          // ADR-098: WELLNESS_PHASE2=false 시 탭바에서 제거 + 화면 접근 불가
          href: FEATURE_FLAGS.WELLNESS_PHASE2 ? undefined : null,
        }}
      />
    </Tabs>
  );
}
