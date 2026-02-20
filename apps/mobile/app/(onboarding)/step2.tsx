/**
 * 온보딩 Step 2: 기본 정보 입력
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  SafeAreaView,
} from 'react-native';

import {
  useOnboarding,
  type Gender,
  type ActivityLevel,
  GENDER_LABELS,
  ACTIVITY_LEVEL_LABELS,
} from '../../lib/onboarding';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data, setBasicInfo, nextStep, prevStep } = useOnboarding();

  // 로컬 입력 상태
  const [birthYear, setBirthYear] = useState(
    data.basicInfo.birthYear?.toString() || ''
  );
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
    data.basicInfo.gender &&
    data.basicInfo.birthYear &&
    data.basicInfo.activityLevel;

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      testID="onboarding-step2"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📝</Text>
          <Text style={[styles.title, isDark && styles.textLight]}>
            기본 정보를 알려주세요
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            더 정확한 맞춤 추천을 위해 필요해요
          </Text>
        </View>

        {/* 성별 선택 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
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
                    isDark && styles.optionButtonDark,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleGenderSelect(gender)}
                  testID={`gender-${gender}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isDark && styles.textLight,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {GENDER_LABELS[gender]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 출생년도 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            출생년도
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={birthYear}
            onChangeText={handleBirthYearChange}
            placeholder="1990"
            placeholderTextColor={isDark ? '#666666' : '#999999'}
            keyboardType="number-pad"
            maxLength={4}
            testID="birthYear-input"
          />
        </View>

        {/* 신장/체중 (선택) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            신장 / 체중 (선택)
          </Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputHalf,
                  isDark && styles.inputDark,
                ]}
                value={height}
                onChangeText={handleHeightChange}
                placeholder="170"
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                keyboardType="number-pad"
                maxLength={3}
                testID="height-input"
              />
              <Text style={[styles.unit, isDark && styles.textLight]}>cm</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.input,
                  styles.inputHalf,
                  isDark && styles.inputDark,
                ]}
                value={weight}
                onChangeText={handleWeightChange}
                placeholder="65"
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                keyboardType="decimal-pad"
                maxLength={5}
                testID="weight-input"
              />
              <Text style={[styles.unit, isDark && styles.textLight]}>kg</Text>
            </View>
          </View>
        </View>

        {/* 활동 수준 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            평소 활동 수준
          </Text>
          <View style={styles.activityGrid}>
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = data.basicInfo.activityLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.activityButton,
                    isDark && styles.activityButtonDark,
                    isSelected && styles.activityButtonSelected,
                  ]}
                  onPress={() => handleActivitySelect(level)}
                  testID={`activity-${level}`}
                >
                  <Text
                    style={[
                      styles.activityText,
                      isDark && styles.textLight,
                      isSelected && styles.activityTextSelected,
                    ]}
                  >
                    {ACTIVITY_LEVEL_LABELS[level]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 진행 상황 */}
        <View style={styles.progress}>
          <View
            style={[styles.progressDot, isDark && styles.progressDotDark]}
          />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View
            style={[styles.progressDot, isDark && styles.progressDotDark]}
          />
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.backButton, isDark && styles.backButtonDark]}
          onPress={prevStep}
          testID="back-button"
        >
          <Text style={[styles.backButtonText, isDark && styles.textLight]}>
            이전
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={!canProceed}
          testID="next-button"
        >
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  textLight: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#999999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  optionButtonSelected: {
    borderColor: '#F8C8DC',
    backgroundColor: '#FDF2F6',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  optionTextSelected: {
    color: '#F8C8DC',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
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
  inputHalf: {
    flex: 1,
  },
  unit: {
    fontSize: 15,
    color: '#666666',
  },
  activityGrid: {
    gap: 8,
  },
  activityButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  activityButtonSelected: {
    borderColor: '#F8C8DC',
    backgroundColor: '#FDF2F6',
  },
  activityText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  activityTextSelected: {
    color: '#F8C8DC',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotDark: {
    backgroundColor: '#444444',
  },
  progressDotActive: {
    backgroundColor: '#F8C8DC',
    width: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  backButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666666',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#F8C8DC',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
