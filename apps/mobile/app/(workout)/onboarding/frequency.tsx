/**
 * W-1 운동 온보딩 - 빈도 선택
 */
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

const FREQUENCIES = [
  { id: '1-2', label: '주 1-2회', description: '가볍게 시작하기', emoji: '🌱' },
  { id: '3-4', label: '주 3-4회', description: '균형 잡힌 운동', emoji: '🌿' },
  { id: '5-6', label: '주 5-6회', description: '적극적인 운동', emoji: '🌳' },
  { id: '7', label: '매일', description: '운동이 일상', emoji: '🔥' },
];

const DURATIONS = [
  { id: '15-30', label: '15-30분', description: '짧고 굵게' },
  { id: '30-45', label: '30-45분', description: '적당한 시간' },
  { id: '45-60', label: '45-60분', description: '충분한 시간' },
  { id: '60+', label: '1시간 이상', description: '집중 운동' },
];

export default function WorkoutFrequencyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { goals } = useLocalSearchParams<{ goals: string }>();

  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(
    null
  );
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  const handleAnalyze = () => {
    router.replace({
      pathname: '/(workout)/result',
      params: {
        goals: goals || '[]',
        frequency: selectedFrequency || '',
        duration: selectedDuration || '',
      },
    });
  };

  const isComplete = selectedFrequency && selectedDuration;

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 운동 빈도 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            일주일에 몇 번 운동하실 건가요?
          </Text>
          <View style={styles.optionList}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq.id}
                style={[
                  styles.optionCard,
                  isDark && styles.optionCardDark,
                  selectedFrequency === freq.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedFrequency(freq.id)}
              >
                <Text style={styles.optionEmoji}>{freq.emoji}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    isDark && styles.textLight,
                    selectedFrequency === freq.id && styles.optionLabelSelected,
                  ]}
                >
                  {freq.label}
                </Text>
                <Text
                  style={[styles.optionDescription, isDark && styles.textMuted]}
                >
                  {freq.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 운동 시간 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            한 번에 얼마나 운동하실 건가요?
          </Text>
          <View style={styles.durationList}>
            {DURATIONS.map((dur) => (
              <TouchableOpacity
                key={dur.id}
                style={[
                  styles.durationCard,
                  isDark && styles.durationCardDark,
                  selectedDuration === dur.id && styles.durationCardSelected,
                ]}
                onPress={() => setSelectedDuration(dur.id)}
              >
                <Text
                  style={[
                    styles.durationLabel,
                    isDark && styles.textLight,
                    selectedDuration === dur.id && styles.durationLabelSelected,
                  ]}
                >
                  {dur.label}
                </Text>
                <Text
                  style={[
                    styles.durationDescription,
                    isDark && styles.textMuted,
                  ]}
                >
                  {dur.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, isDark && styles.footerDark]}>
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            !isComplete && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={!isComplete}
        >
          <Text style={styles.analyzeButtonText}>운동 타입 분석하기</Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardDark: {
    backgroundColor: '#1a1a1a',
  },
  optionCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#ef4444',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  durationList: {
    gap: 12,
  },
  durationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationCardDark: {
    backgroundColor: '#1a1a1a',
  },
  durationCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  durationLabelSelected: {
    color: '#ef4444',
  },
  durationDescription: {
    fontSize: 13,
    color: '#666',
  },
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
  analyzeButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
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
