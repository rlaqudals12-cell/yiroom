/**
 * 스트레칭 가이드 화면
 *
 * 운동 전후 스트레칭 루틴을 안내한다.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useTheme } from '../../../lib/theme';

type StretchType = 'warmup' | 'cooldown' | 'daily';

interface StretchExercise {
  id: string;
  name: string;
  emoji: string;
  duration: string;
  targetArea: string;
  instruction: string;
}

const STRETCH_TABS: { id: StretchType; label: string; emoji: string }[] = [
  { id: 'warmup', label: '워밍업', emoji: '🔥' },
  { id: 'cooldown', label: '쿨다운', emoji: '❄️' },
  { id: 'daily', label: '일상', emoji: '🧘' },
];

const MOCK_STRETCHES: Record<StretchType, StretchExercise[]> = {
  warmup: [
    { id: '1', name: '팔 돌리기', emoji: '💪', duration: '30초', targetArea: '어깨', instruction: '양팔을 크게 원을 그리며 앞뒤로 돌리세요.' },
    { id: '2', name: '무릎 높이 들기', emoji: '🦵', duration: '30초', targetArea: '허벅지', instruction: '제자리에서 무릎을 번갈아 높이 들어올리세요.' },
    { id: '3', name: '몸통 회전', emoji: '🔄', duration: '30초', targetArea: '허리', instruction: '양발을 어깨너비로 벌리고 상체를 좌우로 회전하세요.' },
    { id: '4', name: '발목 돌리기', emoji: '🦶', duration: '20초', targetArea: '발목', instruction: '한 발을 들고 발목을 안쪽과 바깥쪽으로 돌리세요.' },
  ],
  cooldown: [
    { id: '5', name: '허벅지 스트레칭', emoji: '🦵', duration: '30초', targetArea: '대퇴사두근', instruction: '한 발을 뒤로 접어 손으로 잡고 당겨주세요.' },
    { id: '6', name: '햄스트링 스트레칭', emoji: '🧎', duration: '30초', targetArea: '뒷허벅지', instruction: '앉아서 한 다리를 뻗고 발끝을 향해 상체를 숙이세요.' },
    { id: '7', name: '종아리 스트레칭', emoji: '🦶', duration: '20초', targetArea: '종아리', instruction: '벽에 손을 짚고 한 발을 뒤로 뻗어 종아리를 늘려주세요.' },
    { id: '8', name: '어깨 스트레칭', emoji: '💪', duration: '20초', targetArea: '어깨', instruction: '한 팔을 가슴 앞으로 당기고 반대 손으로 잡아주세요.' },
  ],
  daily: [
    { id: '9', name: '고양이-소 자세', emoji: '🐱', duration: '1분', targetArea: '척추', instruction: '네 발로 엎드려 등을 둥글게 말았다 펴기를 반복하세요.' },
    { id: '10', name: '아이 자세', emoji: '🧒', duration: '1분', targetArea: '허리/등', instruction: '무릎을 꿇고 앞으로 팔을 뻗어 이마를 바닥에 대세요.' },
    { id: '11', name: '목 스트레칭', emoji: '🙇', duration: '30초', targetArea: '목', instruction: '고개를 좌우로 천천히 기울여 목 옆을 늘려주세요.' },
    { id: '12', name: '비둘기 자세', emoji: '🕊️', duration: '1분', targetArea: '엉덩이', instruction: '한 다리를 앞으로 접고 반대 다리는 뒤로 뻗어주세요.' },
  ],
};

export default function StretchingScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography, module: moduleColors } = useTheme();
  const [activeTab, setActiveTab] = useState<StretchType>('warmup');

  const stretches = MOCK_STRETCHES[activeTab];
  const totalDuration = stretches.reduce((sum, s) => {
    const seconds = s.duration.includes('분') ? parseInt(s.duration) * 60 : parseInt(s.duration);
    return sum + seconds;
  }, 0);

  return (
    <ScrollView
      testID="stretching-screen"
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
        스트레칭 가이드
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        부상 방지와 유연성 향상을 위해 스트레칭하세요
      </Text>

      {/* 탭 */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {STRETCH_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityLabel={`${tab.label} 스트레칭`}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radii.lg,
                backgroundColor: active ? moduleColors.workout.base : colors.card,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: typography.size.sm }}>{tab.emoji}</Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: active ? typography.weight.bold : typography.weight.normal,
                  color: active ? colors.overlayForeground : colors.foreground,
                  marginTop: spacing.xxs,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 총 소요시간 */}
      <View
        style={{
          backgroundColor: moduleColors.workout.base + '15',
          borderRadius: radii.lg,
          padding: spacing.md,
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>예상 소요시간</Text>
        <Text style={{ fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: moduleColors.workout.base }}>
          약 {Math.ceil(totalDuration / 60)}분
        </Text>
      </View>

      {/* 스트레칭 목록 */}
      <View style={{ gap: spacing.sm }}>
        {stretches.map((stretch, index) => (
          <View
            key={stretch.id}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radii.xlg,
                  backgroundColor: moduleColors.workout.base + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.smx,
                }}
              >
                <Text style={{ fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: moduleColors.workout.base }}>
                  {index + 1}
                </Text>
              </View>
              <Text style={{ fontSize: typography.size.lg, marginRight: spacing.xs }}>{stretch.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                  {stretch.name}
                </Text>
                <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                  {stretch.targetArea} · {stretch.duration}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, lineHeight: 20 }}>
              {stretch.instruction}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
