/**
 * 분석 모듈 허브 화면
 *
 * 모든 AI 분석 모듈을 한눈에 보고 선택할 수 있는 화면.
 * 퍼스널컬러, 피부, 체형, 헤어, 메이크업, 구강, 자세 등.
 */
import { useRouter } from 'expo-router';
import { View, Text, Pressable, ScrollView } from 'react-native';

import { useTheme } from '@/lib/theme';

interface AnalysisModule {
  id: string;
  name: string;
  emoji: string;
  description: string;
  route: string;
  moduleColor: string;
}

export default function AnalysisHubScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, module: moduleColors } = useTheme();

  const modules: AnalysisModule[] = [
    { id: 'personal-color', name: '퍼스널컬러', emoji: '🎨', description: '나에게 어울리는 색상 찾기', route: '/(analysis)/personal-color', moduleColor: moduleColors.personalColor.base },
    { id: 'skin', name: '피부 분석', emoji: '✨', description: '피부 타입과 상태 진단', route: '/(analysis)/skin', moduleColor: moduleColors.skin.base },
    { id: 'body', name: '체형 분석', emoji: '📐', description: '체형 타입과 비율 분석', route: '/(analysis)/body', moduleColor: moduleColors.body.base },
    { id: 'hair', name: '헤어 분석', emoji: '💇', description: '두피 상태와 헤어 스타일', route: '/(analysis)/hair', moduleColor: moduleColors.hair.base },
    { id: 'makeup', name: '메이크업', emoji: '💄', description: 'AI 맞춤 메이크업 추천', route: '/(analysis)/makeup', moduleColor: moduleColors.makeup.base },
    { id: 'oral-health', name: '구강 건강', emoji: '🦷', description: '치아와 잇몸 상태 체크', route: '/(analysis)/oral-health', moduleColor: moduleColors.oralHealth.base },
    { id: 'posture', name: '자세 분석', emoji: '🧘', description: '자세 교정과 체형 개선', route: '/(analysis)/posture', moduleColor: moduleColors.posture.base },
  ];

  return (
    <ScrollView
      testID="analysis-hub-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        AI 분석
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        원하는 분석을 선택해주세요
      </Text>

      <View style={{ gap: spacing.sm }}>
        {modules.map((mod) => (
          <Pressable
            key={mod.id}
            accessibilityLabel={`${mod.name} 분석`}
            onPress={() => router.push(mod.route as never)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              borderLeftWidth: 4,
              borderLeftColor: mod.moduleColor,
            }}
          >
            <Text style={{ fontSize: 32, marginRight: spacing.smx }}>{mod.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                }}
              >
                {mod.name}
              </Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                {mod.description}
              </Text>
            </View>
            <Text style={{ fontSize: typography.size.lg, color: colors.mutedForeground }}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
