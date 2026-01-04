/**
 * W-1 운동 온보딩 - 빈도 설정
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 주당 운동 횟수 옵션 (2-6회)
const FREQUENCY_OPTIONS = [
  { value: 2, label: '주 2회', description: '가볍게 시작해요', emoji: '🌱' },
  { value: 3, label: '주 3회', description: '균형 잡힌 운동', emoji: '🌿' },
  { value: 4, label: '주 4회', description: '적극적인 운동', emoji: '🌳' },
  { value: 5, label: '주 5회', description: '열정적인 운동', emoji: '💪' },
  { value: 6, label: '주 6회', description: '고강도 트레이닝', emoji: '🔥' },
];

// 선호 운동 시간대 옵션
const TIME_OPTIONS = [
  { id: 'morning', label: '아침', emoji: '🌅', description: '6시~12시' },
  { id: 'afternoon', label: '점심', emoji: '☀️', description: '12시~18시' },
  { id: 'evening', label: '저녁', emoji: '🌆', description: '18시~21시' },
  { id: 'night', label: '밤', emoji: '🌙', description: '21시~24시' },
];

export default function WorkoutFrequencyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ goals?: string }>();

  const [frequency, setFrequency] = useState<number | null>(null);
  const [preferredTime, setPreferredTime] = useState<string | null>(null);

  // 주당 횟수 선택 핸들러
  const handleFrequencySelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFrequency(value);
  };

  // 시간대 선택 핸들러
  const handleTimeSelect = (timeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferredTime(timeId);
  };

  // 다음 단계로 이동
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: '/(workout)/result',
      params: {
        goals: params.goals || '[]',
        frequency: frequency?.toString() || '',
        preferredTime: preferredTime || '',
      },
    });
  };

  const isValid = frequency !== null && preferredTime !== null;

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 주당 운동 횟수 */}
        <Text style={[styles.title, isDark && styles.textLight]}>
          주당 운동 횟수
        </Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          일주일에 몇 번 운동할 수 있나요?
        </Text>

        <View style={styles.frequencyList}>
          {FREQUENCY_OPTIONS.map((option) => {
            const isSelected = frequency === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.frequencyCard,
                  isDark && styles.frequencyCardDark,
                  isSelected && styles.frequencyCardSelected,
                ]}
                onPress={() => handleFrequencySelect(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.frequencyEmoji}>{option.emoji}</Text>
                <View style={styles.frequencyContent}>
                  <Text
                    style={[
                      styles.frequencyLabel,
                      isDark && styles.textLight,
                      isSelected && styles.frequencyLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.frequencyDescription,
                      isDark && styles.textMuted,
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
                <View
                  style={[styles.radio, isSelected && styles.radioSelected]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 선호 운동 시간대 */}
        <Text
          style={[
            styles.title,
            styles.sectionMargin,
            isDark && styles.textLight,
          ]}
        >
          선호 운동 시간대
        </Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          주로 어느 시간대에 운동하시나요?
        </Text>

        <View style={styles.timeGrid}>
          {TIME_OPTIONS.map((option) => {
            const isSelected = preferredTime === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.timeCard,
                  isDark && styles.timeCardDark,
                  isSelected && styles.timeCardSelected,
                ]}
                onPress={() => handleTimeSelect(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.timeEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.timeLabel,
                    isDark && styles.textLight,
                    isSelected && styles.timeLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[styles.timeDescription, isDark && styles.textMuted]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, isDark && styles.footerDark]}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>운동 타입 분석하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  sectionMargin: {
    marginTop: 32,
  },
  // 주당 횟수 카드 스타일
  frequencyList: {
    gap: 12,
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyCardDark: {
    backgroundColor: '#1a1a1a',
  },
  frequencyCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  frequencyEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  frequencyContent: {
    flex: 1,
  },
  frequencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  frequencyLabelSelected: {
    color: '#ef4444',
  },
  frequencyDescription: {
    fontSize: 13,
    color: '#666',
  },
  // 라디오 버튼 스타일
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#ef4444',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  // 시간대 그리드 스타일
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeCardDark: {
    backgroundColor: '#1a1a1a',
  },
  timeCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  timeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  timeLabelSelected: {
    color: '#ef4444',
  },
  timeDescription: {
    fontSize: 13,
    color: '#666',
  },
  // Footer 스타일
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f8f9fc',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerDark: {
    backgroundColor: '#0a0a0a',
    borderTopColor: '#222',
  },
  nextButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
