/**
 * 온보딩 Step 2: 기본 정보 입력
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, ProgressIndicator } from '../../components/ui';
import {
  useOnboarding,
  type Gender,
  type ActivityLevel,
  GENDER_LABELS,
  ACTIVITY_LEVEL_LABELS,
} from '../../lib/onboarding';
import { useTheme } from '../../lib/theme';

const GENDERS: Gender[] = ['male', 'female', 'other'];
const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

const CURRENT_YEAR = new Date().getFullYear();

export default function OnboardingStep2() {
  const { colors, brand, spacing, radii, shadows, typography } = useTheme();
  const { data, setBasicInfo, nextStep, prevStep } = useOnboarding();

  // 로컬 입력 상태
  const [birthYear, setBirthYear] = useState(data.basicInfo.birthYear?.toString() || '');
  const [height, setHeight] = useState(data.basicInfo.height?.toString() || '');
  const [weight, setWeight] = useState(data.basicInfo.weight?.toString() || '');

  const handleGenderSelect = (gender: Gender) => {
    setBasicInfo({ gender });
  };

  const handleActivitySelect = (level: ActivityLevel) => {
    setBasicInfo({ activityLevel: level });
  };

  const handleBirthYearChange = (value: string) => {
    setBirthYear(value);
    const year = parseInt(value, 10);
    if (year >= 1900 && year <= CURRENT_YEAR) {
      setBasicInfo({ birthYear: year });
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    const h = parseInt(value, 10);
    if (h > 0 && h < 300) {
      setBasicInfo({ height: h });
    }
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    const w = parseFloat(value);
    if (w > 0 && w < 500) {
      setBasicInfo({ weight: w });
    }
  };

  const canProceed =
    data.basicInfo.gender && data.basicInfo.birthYear && data.basicInfo.activityLevel;

  const selectedBg = `${brand.primary}1A`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="onboarding-step2"
    >
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📝</Text>
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            기본 정보를 알려주세요
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
              textAlign: 'center',
            }}
          >
            더 정확한 맞춤 추천을 위해 필요해요
          </Text>
        </View>

        {/* 성별 선택 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.foreground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            성별
          </Text>
          <View style={styles.optionRow}>
            {GENDERS.map((gender) => {
              const isSelected = data.basicInfo.gender === gender;
              return (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.optionButton,
                    shadows.sm,
                    {
                      backgroundColor: isSelected ? selectedBg : colors.card,
                      borderRadius: radii.lg + 2,
                      borderColor: isSelected ? brand.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleGenderSelect(gender)}
                  testID={`gender-${gender}`}
                >
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.semibold,
                      color: isSelected ? brand.primary : colors.foreground,
                    }}
                  >
                    {GENDER_LABELS[gender]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 출생년도 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Input
            label="출생년도"
            value={birthYear}
            onChangeText={handleBirthYearChange}
            placeholder="1990"
            keyboardType="number-pad"
            maxLength={4}
            testID="birthYear-input"
          />
        </View>

        {/* 신장/체중 (선택) */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.foreground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            신장 / 체중 (선택)
          </Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.lg + 2,
                    color: colors.foreground,
                    fontSize: typography.size.base,
                  },
                ]}
                value={height}
                onChangeText={handleHeightChange}
                placeholder="170"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={3}
                testID="height-input"
              />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                }}
              >
                cm
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.lg + 2,
                    color: colors.foreground,
                    fontSize: typography.size.base,
                  },
                ]}
                value={weight}
                onChangeText={handleWeightChange}
                placeholder="65"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                maxLength={5}
                testID="weight-input"
              />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                }}
              >
                kg
              </Text>
            </View>
          </View>
        </View>

        {/* 활동 수준 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.foreground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            평소 활동 수준
          </Text>
          <View style={{ gap: spacing.sm }}>
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = data.basicInfo.activityLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.activityButton,
                    shadows.sm,
                    {
                      backgroundColor: isSelected ? selectedBg : colors.card,
                      borderRadius: radii.lg + 2,
                      borderColor: isSelected ? brand.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleActivitySelect(level)}
                  testID={`activity-${level}`}
                >
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.medium,
                      color: isSelected ? brand.primary : colors.foreground,
                    }}
                  >
                    {ACTIVITY_LEVEL_LABELS[level]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 진행 상황 */}
        <ProgressIndicator current={2} total={3} style={{ marginTop: spacing.xl }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View
        style={[styles.footer, { padding: spacing.lg, paddingBottom: 40, gap: spacing.sm + 4 }]}
      >
        <Button
          variant="secondary"
          size="lg"
          onPress={prevStep}
          testID="back-button"
          style={{ flex: 1 }}
        >
          이전
        </Button>
        <Button
          size="lg"
          onPress={nextStep}
          disabled={!canProceed}
          testID="next-button"
          style={{ flex: 2 }}
        >
          다음
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    marginBottom: 6,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityButton: {
    padding: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
});
