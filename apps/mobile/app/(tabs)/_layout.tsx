/**
 * 이룸 탭 네비게이션 레이아웃
 * 5탭 구조: 홈 / 뷰티 / 스타일 / 기록 / 나
 */
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Home, Sparkles, Shirt, BookOpen, User } from 'lucide-react-native';

// 색상 상수 (이룸 브랜드 컬러)
const COLORS = {
  primary: '#2e5afa',
  inactive: '#8E8E93',
  lightBg: '#ffffff',
  darkBg: '#1a1a1a',
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: isDark ? COLORS.darkBg : COLORS.lightBg,
          borderTopColor: isDark ? '#2a2a2a' : '#e5e5e5',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: isDark ? COLORS.darkBg : COLORS.lightBg,
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
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
