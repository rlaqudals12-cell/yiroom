/**
 * 운동 상세 화면
 *
 * 개별 운동의 상세 정보, 올바른 자세, 세트/횟수를 안내한다.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '../../../lib/theme';

interface ExerciseDetail {
  name: string;
  emoji: string;
  category: string;
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  met: number;
  sets: number;
  reps: string;
  restSeconds: number;
  instructions: string[];
  tips: string[];
}

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  beginner: { label: '초급', color: '#22C55E' },
  intermediate: { label: '중급', color: '#F59E0B' },
  advanced: { label: '고급', color: '#EF4444' },
};

// 예시 데이터
const MOCK_EXERCISE: ExerciseDetail = {
  name: '바벨 스쿼트',
  emoji: '🏋️',
  category: '하체',
  targetMuscles: ['대퇴사두근', '둔근', '햄스트링', '코어'],
  difficulty: 'intermediate',
  met: 6.0,
  sets: 4,
  reps: '8-12회',
  restSeconds: 90,
  instructions: [
    '바벨을 승모근 위에 올리고 양손으로 안정적으로 잡으세요.',
    '양발을 어깨너비로 벌리고 발끝은 살짝 바깥으로 향하게 하세요.',
    '허리를 곧게 유지하며 엉덩이를 뒤로 빼면서 무릎을 구부리세요.',
    '허벅지가 바닥과 평행이 되거나 그 아래까지 내려가세요.',
    '발뒤꿈치로 밀며 일어나면서 시작 자세로 돌아오세요.',
  ],
  tips: [
    '무릎이 발끝보다 앞으로 나가지 않도록 주의하세요.',
    '내려갈 때 숨을 들이마시고, 올라올 때 내쉬세요.',
    '허리가 둥글게 말리지 않도록 코어에 힘을 유지하세요.',
    '처음에는 가벼운 무게로 폼을 익히는 것이 중요해요.',
  ],
};

export default function ExerciseDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status, module: moduleColors } = useTheme();

  const exercise = MOCK_EXERCISE;
  const diffConfig = DIFFICULTY_LABELS[exercise.difficulty];

  return (
    <ScrollView
      testID="exercise-detail-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      {/* 운동 헤더 */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{ fontSize: 48 }}>{exercise.emoji}</Text>
        <Text
          style={{
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginTop: spacing.sm,
          }}
        >
          {exercise.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radii.full, backgroundColor: colors.secondary }}>
            <Text style={{ fontSize: typography.size.xs, color: colors.foreground }}>{exercise.category}</Text>
          </View>
          <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radii.full, backgroundColor: diffConfig?.color + '20' }}>
            <Text style={{ fontSize: typography.size.xs, color: diffConfig?.color, fontWeight: typography.weight.semibold }}>
              {diffConfig?.label}
            </Text>
          </View>
        </View>
      </View>

      {/* 운동 스펙 */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        {[
          { label: '세트', value: `${exercise.sets}세트` },
          { label: '반복', value: exercise.reps },
          { label: '휴식', value: `${exercise.restSeconds}초` },
          { label: 'MET', value: exercise.met.toFixed(1) },
        ].map((spec) => (
          <View key={spec.label} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: moduleColors.workout.base }}>
              {spec.value}
            </Text>
            <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xxs }}>
              {spec.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 타겟 근육 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        타겟 근육
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        {exercise.targetMuscles.map((muscle) => (
          <View
            key={muscle}
            style={{
              paddingHorizontal: spacing.smx,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              backgroundColor: moduleColors.workout.base + '15',
            }}
          >
            <Text style={{ fontSize: typography.size.sm, color: moduleColors.workout.base }}>{muscle}</Text>
          </View>
        ))}
      </View>

      {/* 수행 방법 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        수행 방법
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {exercise.instructions.map((step, index) => (
          <View key={index} style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: moduleColors.workout.base,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.smx,
              }}
            >
              <Text style={{ fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: '#FFFFFF' }}>
                {index + 1}
              </Text>
            </View>
            <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 }}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* 팁 */}
      <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.foreground, marginBottom: spacing.sm }}>
        주의사항
      </Text>
      <View
        style={{
          backgroundColor: status.warning + '10',
          borderRadius: radii.lg,
          padding: spacing.md,
          gap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        {exercise.tips.map((tip, index) => (
          <View key={index} style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: typography.size.sm, color: status.warning, marginRight: spacing.xs }}>⚠️</Text>
            <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 }}>
              {tip}
            </Text>
          </View>
        ))}
      </View>

      {/* 운동 시작 */}
      <Pressable
        accessibilityLabel="이 운동으로 세션 시작"
        onPress={() => router.push('/(workout)/session')}
        style={{
          backgroundColor: moduleColors.workout.base,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: '#FFFFFF' }}>
          운동 시작하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
