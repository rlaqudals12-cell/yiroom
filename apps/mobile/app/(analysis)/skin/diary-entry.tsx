/**
 * 피부 다이어리 엔트리 작성/수정 화면
 * 컨디션 + 생활요인 + 루틴 입력
 */
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';

import { ScreenContainer } from '@/components/ui';
import { useTheme, brand, typography, spacing, radii } from '../../../lib/theme';
import { useSkinDiary } from '../../../hooks/useSkinDiary';
import {
  type SkinConditionScore,
  type SleepQualityScore,
  type StressLevelScore,
  type WeatherType,
  type SkinDiaryInput,
  CONDITION_LABELS,
  CONDITION_EMOJIS,
  WEATHER_LABELS,
  WEATHER_ICONS,
} from '../../../lib/skincare/diary-types';

const WEATHER_OPTIONS: WeatherType[] = [
  'sunny', 'cloudy', 'rainy', 'cold', 'hot', 'humid', 'dry',
];

const CONDITION_SCORES: SkinConditionScore[] = [1, 2, 3, 4, 5];
const QUALITY_SCORES: SleepQualityScore[] = [1, 2, 3, 4, 5];
const STRESS_SCORES: StressLevelScore[] = [1, 2, 3, 4, 5];

const STRESS_LABELS: Record<StressLevelScore, string> = {
  1: '매우 낮음',
  2: '낮음',
  3: '보통',
  4: '높음',
  5: '매우 높음',
};

const SLEEP_QUALITY_LABELS: Record<SleepQualityScore, string> = {
  1: '매우 나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
};

export default function SkinDiaryEntryScreen(): React.JSX.Element {
  const { colors, isDark, typography, spacing} = useTheme();
  const params = useLocalSearchParams<{ date?: string; entryId?: string }>();
  const { saveEntry, getEntryForDate } = useSkinDiary();
  const [saving, setSaving] = useState(false);

  const entryDate = params.date ?? new Date().toISOString().split('T')[0];
  const existingEntry = getEntryForDate(entryDate);
  const isEdit = !!existingEntry;

  // 폼 상태
  const [condition, setCondition] = useState<SkinConditionScore>(
    existingEntry?.skinCondition ?? 3,
  );
  const [notes, setNotes] = useState(existingEntry?.conditionNotes ?? '');
  const [sleepHours, setSleepHours] = useState(
    existingEntry?.sleepHours?.toString() ?? '',
  );
  const [sleepQuality, setSleepQuality] = useState<SleepQualityScore | null>(
    existingEntry?.sleepQuality ?? null,
  );
  const [waterMl, setWaterMl] = useState(
    existingEntry?.waterIntakeMl?.toString() ?? '',
  );
  const [stress, setStress] = useState<StressLevelScore | null>(
    existingEntry?.stressLevel ?? null,
  );
  const [weather, setWeather] = useState<WeatherType | null>(
    existingEntry?.weather ?? null,
  );
  const [morningRoutine, setMorningRoutine] = useState(
    existingEntry?.morningRoutineCompleted ?? false,
  );
  const [eveningRoutine, setEveningRoutine] = useState(
    existingEntry?.eveningRoutineCompleted ?? false,
  );

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      const input: SkinDiaryInput = {
        entryDate,
        skinCondition: condition,
        conditionNotes: notes.trim() || undefined,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        sleepQuality: sleepQuality ?? undefined,
        waterIntakeMl: waterMl ? parseInt(waterMl, 10) : undefined,
        stressLevel: stress ?? undefined,
        weather: weather ?? undefined,
        morningRoutineCompleted: morningRoutine,
        eveningRoutineCompleted: eveningRoutine,
      };

      const success = await saveEntry(input);
      if (success) {
        router.back();
      } else {
        Alert.alert('저장 실패', '다이어리를 저장할 수 없어요. 다시 시도해주세요.');
      }
    } finally {
      setSaving(false);
    }
  }, [
    entryDate, condition, notes, sleepHours, sleepQuality,
    waterMl, stress, weather, morningRoutine, eveningRoutine, saveEntry,
  ]);

  // 섹션 제목
  const SectionTitle = ({ title }: { title: string }): React.JSX.Element => (
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
      {title}
    </Text>
  );

  // 점수 선택 버튼 그룹
  const ScoreSelector = <T extends number>({
    scores,
    selected,
    onSelect,
    labels,
  }: {
    scores: T[];
    selected: T | null;
    onSelect: (v: T) => void;
    labels: Record<T, string>;
  }): React.JSX.Element => (
    <View style={styles.scoreRow}>
      {scores.map((score) => {
        const isActive = selected === score;
        return (
          <Pressable
            key={score}
            style={[
              styles.scoreButton,
              {
                backgroundColor: isActive ? brand.primary : colors.card,
                borderColor: isActive ? brand.primary : colors.border,
              },
            ]}
            onPress={() => onSelect(score)}
          >
            <Text
              style={[
                styles.scoreNum,
                { color: isActive ? brand.primaryForeground : colors.foreground },
              ]}
            >
              {score}
            </Text>
            <Text
              style={[
                styles.scoreLabel,
                { color: isActive ? brand.primaryForeground : colors.muted },
              ]}
              numberOfLines={1}
            >
              {labels[score]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="skin-diary-entry-screen" edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
        >
        {/* 날짜 표시 */}
        <View
          style={[
            styles.dateHeader,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.dateText, { color: colors.foreground }]}>
            {formatDisplayDate(entryDate)}
          </Text>
          {isEdit && (
            <Text style={[styles.editBadge, { color: brand.primary }]}>
              수정 중
            </Text>
          )}
        </View>

        {/* 피부 컨디션 */}
        <SectionTitle title="오늘의 피부 컨디션" />
        <View style={styles.conditionGrid}>
          {CONDITION_SCORES.map((score) => {
            const isActive = condition === score;
            return (
              <Pressable
                key={score}
                style={[
                  styles.conditionItem,
                  {
                    backgroundColor: isActive ? brand.primary + '15' : colors.card,
                    borderColor: isActive ? brand.primary : colors.border,
                  },
                ]}
                onPress={() => setCondition(score)}
              >
                <Text style={styles.conditionEmoji}>
                  {CONDITION_EMOJIS[score]}
                </Text>
                <Text
                  style={[
                    styles.conditionText,
                    { color: isActive ? brand.primary : colors.foreground },
                  ]}
                >
                  {CONDITION_LABELS[score]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 메모 */}
        <TextInput
          style={[
            styles.notesInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="오늘 피부 상태를 자유롭게 메모해보세요"
          placeholderTextColor={colors.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* 수면 */}
        <SectionTitle title="수면" />
        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>
            수면 시간
          </Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              style={[
                styles.numericInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="7"
              placeholderTextColor={colors.muted}
              value={sleepHours}
              onChangeText={setSleepHours}
              keyboardType="decimal-pad"
              maxLength={4}
            />
            <Text style={[styles.unitText, { color: colors.muted }]}>시간</Text>
          </View>
        </View>

        <Text style={[styles.subLabel, { color: colors.muted }]}>수면 품질</Text>
        <ScoreSelector
          scores={QUALITY_SCORES}
          selected={sleepQuality}
          onSelect={setSleepQuality}
          labels={SLEEP_QUALITY_LABELS}
        />

        {/* 수분 섭취 */}
        <SectionTitle title="수분 섭취" />
        <View style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>
            수분 섭취량
          </Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              style={[
                styles.numericInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="2000"
              placeholderTextColor={colors.muted}
              value={waterMl}
              onChangeText={setWaterMl}
              keyboardType="number-pad"
              maxLength={5}
            />
            <Text style={[styles.unitText, { color: colors.muted }]}>ml</Text>
          </View>
        </View>

        {/* 스트레스 */}
        <SectionTitle title="스트레스" />
        <ScoreSelector
          scores={STRESS_SCORES}
          selected={stress}
          onSelect={setStress}
          labels={STRESS_LABELS}
        />

        {/* 날씨 */}
        <SectionTitle title="날씨" />
        <View style={styles.weatherGrid}>
          {WEATHER_OPTIONS.map((w) => {
            const isActive = weather === w;
            return (
              <Pressable
                key={w}
                style={[
                  styles.weatherChip,
                  {
                    backgroundColor: isActive ? brand.primary + '15' : colors.card,
                    borderColor: isActive ? brand.primary : colors.border,
                  },
                ]}
                onPress={() => setWeather(isActive ? null : w)}
              >
                <Text style={styles.weatherEmoji}>{WEATHER_ICONS[w]}</Text>
                <Text
                  style={[
                    styles.weatherLabel,
                    { color: isActive ? brand.primary : colors.foreground },
                  ]}
                >
                  {WEATHER_LABELS[w]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 루틴 */}
        <SectionTitle title="스킨케어 루틴" />
        <View style={styles.routineRow}>
          <Pressable
            style={[
              styles.routineToggle,
              {
                backgroundColor: morningRoutine
                  ? brand.primary + '15'
                  : colors.card,
                borderColor: morningRoutine ? brand.primary : colors.border,
              },
            ]}
            onPress={() => setMorningRoutine(!morningRoutine)}
          >
            {morningRoutine && <Check size={16} color={brand.primary} />}
            <Text
              style={[
                styles.routineText,
                {
                  color: morningRoutine ? brand.primary : colors.foreground,
                },
              ]}
            >
              🌅 아침 루틴
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.routineToggle,
              {
                backgroundColor: eveningRoutine
                  ? brand.primary + '15'
                  : colors.card,
                borderColor: eveningRoutine ? brand.primary : colors.border,
              },
            ]}
            onPress={() => setEveningRoutine(!eveningRoutine)}
          >
            {eveningRoutine && <Check size={16} color={brand.primary} />}
            <Text
              style={[
                styles.routineText,
                {
                  color: eveningRoutine ? brand.primary : colors.foreground,
                },
              ]}
            >
              🌙 저녁 루틴
            </Text>
          </Pressable>
        </View>

        {/* 저장 버튼 */}
        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: brand.primary,
              opacity: saving ? 0.6 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={saving}
          testID="save-diary-btn"
        >
          <Text style={[styles.saveButtonText, { color: brand.primaryForeground }]}>
            {saving ? '저장 중...' : isEdit ? '수정하기' : '기록하기'}
          </Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateStr);
  const day = dayOfWeek[date.getDay()];
  return `${y}년 ${Number(m)}월 ${Number(d)}일 (${day})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  // 날짜 헤더
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  dateText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  editBadge: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  // 섹션
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  // 컨디션 그리드
  conditionGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  conditionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  conditionEmoji: {
    fontSize: typography.size['2xl'],
    marginBottom: spacing.xs,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: typography.weight.medium,
  },
  // 메모
  notesInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginTop: spacing.sm,
    fontSize: typography.size.base,
    minHeight: 60,
  },
  // 숫자 입력
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: typography.size.base,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  numericInput: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.size.base,
    width: 80,
    textAlign: 'center',
  },
  unitText: {
    fontSize: typography.size.base,
  },
  // 점수 선택
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scoreButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  scoreNum: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  scoreLabel: {
    fontSize: 9,
    marginTop: spacing.xxs,
  },
  // 날씨
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  weatherEmoji: {
    fontSize: typography.size.sm,
  },
  weatherLabel: {
    fontSize: typography.size.xs,
  },
  // 루틴
  routineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  routineToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  routineText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  // 저장 버튼
  saveButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
});
