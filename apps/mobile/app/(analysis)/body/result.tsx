/**
 * C-1 체형 분석 - 결과 화면
 */
import type { BodyType } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';

// eslint-disable-next-line import/order
import { captureError } from '../../../lib/monitoring/sentry';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisTrustBadge,
  AnalysisResultButtons,
  useAnalysisStyles,
} from '@/components/analysis';
import {
  analyzeBody as analyzeWithGemini,
  imageToBase64,
  type BodyAnalysisResult,
} from '@/lib/gemini';

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
    recommendations: ['벨트로 허리 강조', 'A라인 스커트', '페플럼 탑', '랩 원피스'],
    avoidItems: ['일자 실루엣', '박시한 상의'],
  },
  Triangle: {
    name: '삼각형 체형',
    description: '엉덩이가 어깨보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
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
    description: '복부가 가장 넓은 체형입니다. 세로 라인을 강조하고 편안한 실루엣을 선택하세요.',
    recommendations: ['세로 스트라이프', 'V넥', 'A라인', '하이웨이스트'],
    avoidItems: ['벨트 강조', '타이트한 복부', '가로 스트라이프'],
  },
  Diamond: {
    name: '다이아몬드 체형',
    description: '허리가 넓고 어깨와 엉덩이가 좁은 체형입니다. 상하체 균형을 맞추세요.',
    recommendations: ['어깨 강조', '와이드 팬츠', 'A라인', '스트럭처드 재킷'],
    avoidItems: ['타이트한 허리', '벨트 강조', '펜슬 스커트'],
  },
  Pear: {
    name: '배 체형',
    description: '하체가 상체보다 넓은 체형입니다. 상체를 강조하고 하체는 심플하게 연출하세요.',
    recommendations: ['보트넥', '퍼프 소매', 'A라인 스커트', '부츠컷 팬츠'],
    avoidItems: ['스키니진', '밝은 색 하의', '힙 포켓 디테일'],
  },
  Athletic: {
    name: '운동선수 체형',
    description: '탄탄하고 균형 잡힌 체형입니다. 다양한 스타일을 소화할 수 있어요.',
    recommendations: ['핏된 옷', '스포티 룩', '캐주얼', '미니멀'],
    avoidItems: ['과도한 레이어링', '너무 루즈한 핏'],
  },
};

export default function BodyResultScreen() {
  const { styles, module, colors, status, isDark } = useAnalysisStyles();
  const accent = module.body;

  const { height, weight, imageUri, imageBase64 } = useLocalSearchParams<{
    height: string;
    weight: string;
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [_recommendations, setRecommendations] = useState<string[]>([]);
  const [_avoidItems, setAvoidItems] = useState<string[]>([]);

  // 체형 분석 (lib/gemini.ts 연동)
  const analyzeBody = useCallback(async () => {
    setIsLoading(true);
    setUsedFallback(false);

    try {
      // imageBase64가 없으면 imageUri에서 변환
      let base64Data = imageBase64;
      if (!base64Data && imageUri) {
        base64Data = await imageToBase64(imageUri);
      }

      if (!base64Data) {
        throw new Error('이미지 데이터가 없습니다.');
      }

      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);

      // lib/gemini의 analyzeBody 호출 (usedFallback 포함)
      const response = await analyzeWithGemini(base64Data, heightNum, weightNum);
      const analysisResult = response.result;

      setUsedFallback(response.usedFallback);

      // 결과 매핑 (BodyType 대소문자 변환)
      const bodyTypeMap: Record<string, BodyType> = {
        rectangle: 'Rectangle',
        triangle: 'Triangle',
        inverted_triangle: 'InvertedTriangle',
        hourglass: 'Hourglass',
        oval: 'Oval',
        diamond: 'Diamond',
        pear: 'Pear',
        athletic: 'Athletic',
      };

      const mappedBodyType = bodyTypeMap[analysisResult.bodyType] || 'Rectangle';
      setBodyType(mappedBodyType);
      setBmi(analysisResult.bmi);
      setRecommendations(analysisResult.recommendations || []);
      setAvoidItems(analysisResult.avoidItems || []);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        screen: 'body-result',
        tags: { module: 'C-1', action: 'analyze' },
      });
      setBodyType(null);
    } finally {
      setIsLoading(false);
    }
  }, [height, weight, imageUri, imageBase64]);

  useEffect(() => {
    analyzeBody();
  }, [analyzeBody]);

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
    if (bmiValue < 18.5) return { label: '저체중', color: status.info };
    if (bmiValue < 23) return { label: '정상', color: status.success };
    if (bmiValue < 25) return { label: '과체중', color: status.warning };
    return { label: '비만', color: status.error };
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="체형을 분석 중이에요..."
        testID="body-analysis-loading"
      />
    );
  }

  if (!bodyType || bmi === null) {
    return (
      <AnalysisErrorState
        message="분석에 실패했습니다."
        onRetry={handleRetry}
        onGoHome={handleGoHome}
        testID="body-analysis-error"
      />
    );
  }

  const typeData = BODY_TYPE_DATA[bodyType];
  const bmiStatus = getBmiStatus(bmi);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* AI 분석 신뢰도 표시 */}
        <AnalysisTrustBadge type={usedFallback ? 'fallback' : 'ai'} testID="body-trust-badge" />

        {/* 결과 이미지 */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={[localStyles.resultImage, { borderColor: accent.base }]}
            />
          </View>
        )}

        {/* BMI 카드 */}
        <View style={[localStyles.bmiCard, { backgroundColor: colors.card }]}>
          <Text style={[localStyles.bmiLabel, { color: colors.mutedForeground }]}>BMI</Text>
          <View style={localStyles.bmiValue}>
            <Text style={[localStyles.bmiNumber, { color: bmiStatus.color }]}>{bmi}</Text>
            <View style={[localStyles.bmiStatus, { backgroundColor: bmiStatus.color }]}>
              <Text style={localStyles.bmiStatusText}>{bmiStatus.label}</Text>
            </View>
          </View>
          <Text style={[localStyles.bmiInfo, { color: colors.mutedForeground }]}>
            키 {height}cm / 체중 {weight}kg
          </Text>
        </View>

        {/* 체형 결과 */}
        <View style={styles.resultCard}>
          <Text style={styles.label}>당신의 체형은</Text>
          <Text style={[localStyles.typeName, { color: accent.base }]}>{typeData.name}</Text>
          <Text style={styles.description}>{typeData.description}</Text>
        </View>

        {/* 추천 스타일 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추천 스타일</Text>
          <View style={localStyles.tagContainer}>
            {typeData.recommendations.map((item, index) => (
              <View
                key={index}
                style={[
                  localStyles.tag,
                  { backgroundColor: status.success + (isDark ? '20' : '25') },
                ]}
              >
                <Text style={[localStyles.tagText, { color: isDark ? '#4ADE80' : '#16A34A' }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 피해야 할 스타일 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>피하면 좋은 스타일</Text>
          <View style={localStyles.tagContainer}>
            {typeData.avoidItems.map((item, index) => (
              <View
                key={index}
                style={[
                  localStyles.tag,
                  { backgroundColor: status.error + (isDark ? '20' : '25') },
                ]}
              >
                <Text style={[localStyles.tagText, { color: isDark ? '#F87171' : '#B91C1C' }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 버튼 */}
        <AnalysisResultButtons
          primaryText="🏃 나에게 맞는 운동 추천"
          onPrimaryPress={handleWorkoutRecommendation}
          onGoHome={handleGoHome}
          onRetry={handleRetry}
          testID="body-result-buttons"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  resultImage: {
    width: 140,
    height: 180,
    borderRadius: 12,
    borderWidth: 3,
  },
  bmiCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  bmiLabel: {
    fontSize: 14,
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
  },
  typeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
