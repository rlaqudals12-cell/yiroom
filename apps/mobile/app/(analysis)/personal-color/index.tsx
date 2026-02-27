/**
 * PC-1 퍼스널 컬러 진단 - 온보딩/문진
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { staggeredEntry } from '../../../lib/animations';
import { useTheme, typography} from '@/lib/theme';

// 퍼스널 컬러 문진 질문
const QUESTIONS = [
  {
    id: 1,
    question: '햇빛 아래에서 피부 톤이 어떻게 보이나요?',
    options: [
      { value: 'warm', label: '노르스름하거나 복숭아빛' },
      { value: 'cool', label: '핑크빛이나 붉은기' },
      { value: 'neutral', label: '둘 다 비슷하게 보여요' },
    ],
  },
  {
    id: 2,
    question: '손목 안쪽 혈관 색은 무엇에 가깝나요?',
    options: [
      { value: 'warm', label: '초록색에 가까워요' },
      { value: 'cool', label: '파란색/보라색에 가까워요' },
      { value: 'neutral', label: '구분하기 어려워요' },
    ],
  },
  {
    id: 3,
    question: '금색과 은색 액세서리 중 더 잘 어울리는 것은?',
    options: [
      { value: 'warm', label: '금색이 더 잘 어울려요' },
      { value: 'cool', label: '은색이 더 잘 어울려요' },
      { value: 'neutral', label: '둘 다 잘 어울려요' },
    ],
  },
  {
    id: 4,
    question: '햇빛에 노출되면 피부가 어떻게 되나요?',
    options: [
      { value: 'warm', label: '금방 태닝되고 잘 타요' },
      { value: 'cool', label: '빨갛게 되고 잘 안 타요' },
      { value: 'neutral', label: '약간 타고 금방 원래대로 돌아와요' },
    ],
  },
  {
    id: 5,
    question: '순백색과 아이보리색 중 더 잘 어울리는 것은?',
    options: [
      { value: 'warm', label: '아이보리/크림색이 더 잘 어울려요' },
      { value: 'cool', label: '순백색이 더 잘 어울려요' },
      { value: 'neutral', label: '둘 다 비슷해요' },
    ],
  },
];

export default function PersonalColorScreen() {
  const { colors, brand } = useTheme();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: value }));

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // 문진 완료, 카메라로 이동
      router.push({
        pathname: '/(analysis)/personal-color/camera',
        params: { answers: JSON.stringify(answers) },
      });
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const isSelected = (value: string) => answers[currentQuestion] === value;

  return (
    <SafeAreaView
      testID="analysis-pc-screen"
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* 진행 바 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]} accessibilityLabel={`진행률 ${currentQuestion + 1}/${QUESTIONS.length}`}>
          <View
            style={[styles.progressFill, { width: `${progress}%`, backgroundColor: brand.primary }]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
          {currentQuestion + 1} / {QUESTIONS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 질문 */}
        <Animated.View entering={staggeredEntry(0)} style={styles.questionContainer}>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {question.question}
          </Text>
        </Animated.View>

        {/* 선택지 */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <Animated.View key={index} entering={staggeredEntry(index + 1)}>
              <Pressable
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.card },
                  isSelected(option.value) && {
                    borderColor: brand.primary,
                    backgroundColor: colors.muted,
                  },
                ]}
                onPress={() => handleAnswer(option.value)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isSelected(option.value) }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.foreground },
                    isSelected(option.value) && {
                      color: brand.primary,
                      fontWeight: typography.weight.semibold,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* 뒤로가기 버튼 */}
      {currentQuestion > 0 && (
        <Pressable style={styles.backButton} onPress={handleBack} accessibilityRole="button" accessibilityLabel="이전 질문으로 돌아가기">
          <Text style={[styles.backButtonText, { color: colors.mutedForeground }]}>이전 질문</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: typography.weight.medium,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 22,
    fontWeight: typography.weight.semibold,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
  },
});
