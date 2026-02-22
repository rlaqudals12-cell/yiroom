/**
 * 이룸 탭 네비게이션 레이아웃
 * 5탭 구조: 홈 / 뷰티 / 스타일 / 기록 / 나
 *
 * 커스텀 BrandTabBar: 그라디언트 인디케이터 + 햅틱 피드백 + 프레스 스케일
 */
import { Tabs } from 'expo-router';
import { Home, Sparkles, Shirt, BookOpen, User } from 'lucide-react-native';

import { BrandTabBar } from '../../components/navigation/BrandTabBar';
import { useTheme } from '../../lib/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={props => <BrandTabBar {...props} />}
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
          title: '홈',
          tabBarLabel: '홈',
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
      <Tabs.Screen
        name="style"
        options={{
          title: '스타일',
          tabBarLabel: '스타일',
          tabBarIcon: ({ color, size }) => <Shirt color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '기록',
          tabBarLabel: '기록',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
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
    </Tabs>
  );
}
