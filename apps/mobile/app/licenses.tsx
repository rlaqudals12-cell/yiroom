/**
 * 오픈소스 라이선스 화면
 *
 * 앱에서 사용하는 오픈소스 라이브러리의 라이선스 정보를 표시한다.
 */
import { useState } from 'react';
import { View, Text, Pressable, Linking, ScrollView } from 'react-native';

import { useTheme } from '../lib/theme';
import { ScreenContainer } from '../components/ui';

interface LicenseItem {
  name: string;
  version: string;
  license: string;
  url: string;
}

const OPEN_SOURCE_LICENSES: LicenseItem[] = [
  { name: 'React', version: '19.x', license: 'MIT', url: 'https://github.com/facebook/react' },
  { name: 'React Native', version: '0.76.x', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo', version: '54.x', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Router', version: '4.x', license: 'MIT', url: 'https://github.com/expo/router' },
  { name: 'React Native Reanimated', version: '3.x', license: 'MIT', url: 'https://github.com/software-mansion/react-native-reanimated' },
  { name: 'React Native Gesture Handler', version: '2.x', license: 'MIT', url: 'https://github.com/software-mansion/react-native-gesture-handler' },
  { name: '@clerk/clerk-expo', version: '2.x', license: 'MIT', url: 'https://github.com/clerk/javascript' },
  { name: '@supabase/supabase-js', version: '2.x', license: 'MIT', url: 'https://github.com/supabase/supabase-js' },
  { name: 'NativeWind', version: '4.x', license: 'MIT', url: 'https://github.com/marklawlor/nativewind' },
  { name: 'Zod', version: '3.x', license: 'MIT', url: 'https://github.com/colinhacks/zod' },
  { name: 'TypeScript', version: '5.x', license: 'Apache-2.0', url: 'https://github.com/microsoft/TypeScript' },
  { name: '@react-native-async-storage', version: '2.x', license: 'MIT', url: 'https://github.com/react-native-async-storage/async-storage' },
];

export default function LicensesScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const [expandedName, setExpandedName] = useState<string | null>(null);

  return (
    <ScreenContainer testID="licenses-screen" edges={['bottom']}>
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        오픈소스 라이선스
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        이룸은 다음의 오픈소스 라이브러리를 사용해요
      </Text>

      <View style={{ gap: spacing.sm }}>
        {OPEN_SOURCE_LICENSES.map((lib) => (
          <Pressable
            key={lib.name}
            accessibilityLabel={`${lib.name} ${lib.version}, ${lib.license} 라이선스`}
            onPress={() => setExpandedName((prev) => (prev === lib.name ? null : lib.name))}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: colors.foreground,
                  }}
                >
                  {lib.name}
                </Text>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                  v{lib.version}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xxs,
                  borderRadius: radii.full,
                  backgroundColor: colors.secondary,
                }}
              >
                <Text style={{ fontSize: typography.size.xs, color: colors.foreground }}>
                  {lib.license}
                </Text>
              </View>
            </View>

            {expandedName === lib.name && (
              <Pressable
                onPress={() => Linking.openURL(lib.url)}
                style={{ marginTop: spacing.sm }}
              >
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    color: brand.primary,
                    fontWeight: typography.weight.medium,
                  }}
                >
                  GitHub에서 보기 →
                </Text>
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>

      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginTop: spacing.lg,
        }}
      >
        전체 라이선스 텍스트는 각 프로젝트의 GitHub 저장소에서 확인할 수 있어요.
      </Text>
    </ScreenContainer>
  );
}
