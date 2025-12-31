/**
 * PC-1 퍼스널 컬러 진단 - 온보딩/문진
 */
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
import { router } from 'expo-router';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      {/* 진행 바 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={[styles.progressText, isDark && styles.textMuted]}>
          {currentQuestion + 1} / {QUESTIONS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 질문 */}
        <View style={styles.questionContainer}>
          <Text style={[styles.questionText, isDark && styles.textLight]}>
            {question.question}
          </Text>
        </View>

        {/* 선택지 */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isDark && styles.optionButtonDark,
                answers[currentQuestion] === option.value && styles.optionSelected,
              ]}
              onPress={() => handleAnswer(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  isDark && styles.textLight,
                  answers[currentQuestion] === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 뒤로가기 버튼 */}
      {currentQuestion > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>이전 질문</Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2e5afa',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
    fontWeight: '600',
    color: '#111',
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionButtonDark: {
    backgroundColor: '#1a1a1a',
  },
  optionSelected: {
    borderColor: '#2e5afa',
    backgroundColor: '#f0f4ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  optionTextSelected: {
    color: '#2e5afa',
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
