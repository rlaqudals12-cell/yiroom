/**
 * C-1 체형 분석 - 결과 화면
 */
import type { BodyType } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 체형 타입 데이터
const BODY_TYPE_DATA: Record<
  BodyType,
  {
    name: string;
    description: string;
    recommendations: string[];
    avoidItems: string[];
  }
> = {
  Rectangle: {
    name: '직사각형 체형',
    description:
      '어깨, 허리, 엉덩이 너비가 비슷한 체형입니다. 허리 라인을 강조하는 스타일이 잘 어울려요.',
    recommendations: [
      '벨트로 허리 강조',
      'A라인 스커트',
      '페플럼 탑',
      '랩 원피스',
    ],
    avoidItems: ['일자 실루엣', '박시한 상의'],
  },
  Triangle: {
    name: '삼각형 체형',
    description:
      '엉덩이가 어깨보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
  },
  InvertedTriangle: {
    name: '역삼각형 체형',
    description:
      '어깨가 엉덩이보다 넓은 체형입니다. 하체에 볼륨을 주고 어깨 라인은 심플하게 연출하세요.',
    recommendations: ['V넥', '래글런 소매', '플레어 스커트', '와이드 팬츠'],
    avoidItems: ['패드 있는 어깨', '보트넥', '호리존탈 스트라이프 상의'],
  },
  Hourglass: {
    name: '모래시계 체형',
    description:
      '어깨와 엉덩이가 비슷하고 허리가 잘록한 체형입니다. 곡선을 살리는 스타일이 잘 어울려요.',
    recommendations: ['허리 강조 원피스', '벨트', '바디컨 스타일', '랩 탑'],
    avoidItems: ['박시한 옷', '오버사이즈', '일자 실루엣'],
  },
  Oval: {
    name: '타원형 체형',
    description:
      '복부가 가장 넓은 체형입니다. 세로 라인을 강조하고 편안한 실루엣을 선택하세요.',
    recommendations: ['세로 스트라이프', 'V넥', 'A라인', '하이웨이스트'],
    avoidItems: ['벨트 강조', '타이트한 복부', '가로 스트라이프'],
  },
  Diamond: {
    name: '다이아몬드 체형',
    description:
      '허리가 넓고 어깨와 엉덩이가 좁은 체형입니다. 상하체 균형을 맞추세요.',
    recommendations: ['어깨 강조', '와이드 팬츠', 'A라인', '스트럭처드 재킷'],
    avoidItems: ['타이트한 허리', '벨트 강조', '펜슬 스커트'],
  },
  Pear: {
    name: '배 체형',
    description:
      '하체가 상체보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
  },
  Athletic: {
    name: '운동선수 체형',
    description:
      '탄탄하고 균형 잡힌 체형입니다. 다양한 스타일을 소화할 수 있어요.',
    recommendations: ['핏된 옷', '스포티 룩', '캐주얼', '미니멀'],
    avoidItems: ['과도한 레이어링', '너무 루즈한 핏'],
  },
};

export default function BodyResultScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height, weight, imageUri } = useLocalSearchParams<{
    height: string;
    weight: string;
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);

  useEffect(() => {
    analyzeBody();
  }, []);

  // 체형 분석 (Mock)
  const analyzeBody = async () => {
    setIsLoading(true);

    // TODO: 실제 Gemini AI 분석 연동
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // BMI 계산
    const heightM = parseFloat(height) / 100;
    const weightKg = parseFloat(weight);
    const calculatedBmi = weightKg / (heightM * heightM);
    setBmi(Math.round(calculatedBmi * 10) / 10);

    // Mock 체형 결정
    const types: BodyType[] = [
      'Rectangle',
      'Triangle',
      'InvertedTriangle',
      'Hourglass',
      'Oval',
      'Athletic',
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];
    setBodyType(randomType);

    setIsLoading(false);
  };

  // 운동 추천으로 이동
  const handleWorkoutRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(workout)/onboarding',
      params: {
        bodyType: bodyType || '',
        bmi: bmi?.toString() || '',
        fromAnalysis: 'body',
      },
    });
  };

  const handleRetry = () => {
    router.replace('/(analysis)/body');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const getBmiStatus = (bmiValue: number) => {
    if (bmiValue < 18.5) return { label: '저체중', color: '#3b82f6' };
    if (bmiValue < 23) return { label: '정상', color: '#22c55e' };
    if (bmiValue < 25) return { label: '과체중', color: '#eab308' };
    return { label: '비만', color: '#ef4444' };
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#2e5afa" />
        <Text style={[styles.loadingText, isDark && styles.textLight]}>
          체형을 분석 중이에요...
        </Text>
      </View>
    );
  }

  if (!bodyType || bmi === null) {
    return (
      <View style={[styles.errorContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.textLight]}>
          분석에 실패했습니다.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>다시 시도하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeData = BODY_TYPE_DATA[bodyType];
  const bmiStatus = getBmiStatus(bmi);

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 결과 이미지 */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          </View>
        )}

        {/* BMI 카드 */}
        <View style={[styles.bmiCard, isDark && styles.cardDark]}>
          <Text style={[styles.bmiLabel, isDark && styles.textMuted]}>BMI</Text>
          <View style={styles.bmiValue}>
            <Text style={[styles.bmiNumber, { color: bmiStatus.color }]}>
              {bmi}
            </Text>
            <View
              style={[styles.bmiStatus, { backgroundColor: bmiStatus.color }]}
            >
              <Text style={styles.bmiStatusText}>{bmiStatus.label}</Text>
            </View>
          </View>
          <Text style={[styles.bmiInfo, isDark && styles.textMuted]}>
            키 {height}cm / 체중 {weight}kg
          </Text>
        </View>

        {/* 체형 결과 */}
        <View style={[styles.resultCard, isDark && styles.cardDark]}>
          <Text style={[styles.typeLabel, isDark && styles.textMuted]}>
            당신의 체형은
          </Text>
          <Text style={[styles.typeName, isDark && styles.textLight]}>
            {typeData.name}
          </Text>
          <Text style={[styles.description, isDark && styles.textMuted]}>
            {typeData.description}
          </Text>
        </View>

        {/* 추천 스타일 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            추천 스타일
          </Text>
          <View style={styles.tagContainer}>
            {typeData.recommendations.map((item, index) => (
              <View key={index} style={styles.recommendTag}>
                <Text style={styles.recommendTagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 피해야 할 스타일 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            피하면 좋은 스타일
          </Text>
          <View style={styles.tagContainer}>
            {typeData.avoidItems.map((item, index) => (
              <View key={index} style={styles.avoidTag}>
                <Text style={styles.avoidTagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 버튼 */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleWorkoutRecommendation}
          >
            <Text style={styles.primaryButtonText}>
              🏃 나에게 맞는 운동 추천
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryLink} onPress={handleRetry}>
            <Text style={styles.retryLinkText}>다시 분석하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2e5afa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultImage: {
    width: 140,
    height: 180,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#2e5afa',
  },
  bmiCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  bmiLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bmiValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  bmiNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  bmiStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiStatusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bmiInfo: {
    fontSize: 14,
    color: '#666',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e5afa',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recommendTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recommendTagText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
  avoidTag: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  avoidTagText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500',
  },
  buttons: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2e5afa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
  retryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retryLinkText: {
    color: '#999',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
