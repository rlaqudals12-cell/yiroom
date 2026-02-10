/**
 * PC-1 퍼스널 컬러 진단 - 결과 화면
 */
import type { PersonalColorSeason } from '@yiroom/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnalysisLoadingState,
  AnalysisErrorState,
  AnalysisTrustBadge,
  AnalysisResultButtons,
  commonAnalysisStyles,
  ANALYSIS_COLORS,
} from '@/components/analysis';
import {
  analyzePersonalColor as analyzeWithGemini,
  imageToBase64,
  type PersonalColorAnalysisResult,
} from '@/lib/gemini';

// 퍼스널 컬러 결과 데이터
const SEASON_DATA: Record<
  PersonalColorSeason,
  {
    name: string;
    description: string;
    colors: string[];
    celebrities: string[];
  }
> = {
  Spring: {
    name: '봄 웜톤',
    description:
      '밝고 화사한 색상이 잘 어울리는 타입입니다. 코랄, 피치, 아이보리 등 따뜻하고 맑은 색상을 추천드려요.',
    colors: ['#FFB6C1', '#FFDAB9', '#FFA07A', '#F0E68C', '#98FB98'],
    celebrities: ['아이유', '수지', '윤아'],
  },
  Summer: {
    name: '여름 쿨톤',
    description:
      '부드럽고 차분한 색상이 잘 어울리는 타입입니다. 라벤더, 로즈핑크, 스카이블루 등 시원하고 우아한 색상을 추천드려요.',
    colors: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#F0FFFF', '#FFC0CB'],
    celebrities: ['블랙핑크 제니', '김태희', '손예진'],
  },
  Autumn: {
    name: '가을 웜톤',
    description:
      '깊고 풍부한 색상이 잘 어울리는 타입입니다. 버건디, 머스타드, 카키 등 차분하고 고급스러운 색상을 추천드려요.',
    colors: ['#8B4513', '#DAA520', '#BC8F8F', '#CD853F', '#556B2F'],
    celebrities: ['제니퍼 로페즈', '김희선', '공효진'],
  },
  Winter: {
    name: '겨울 쿨톤',
    description:
      '선명하고 대비가 강한 색상이 잘 어울리는 타입입니다. 블랙, 화이트, 로열블루 등 강렬하고 세련된 색상을 추천드려요.',
    colors: ['#000000', '#FFFFFF', '#4169E1', '#DC143C', '#800080'],
    celebrities: ['김연아', '전지현', '송혜교'],
  },
};

export default function PersonalColorResultScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { imageUri, imageBase64, answers } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
    answers: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PersonalColorAnalysisResult | null>(
    null
  );
  const [usedFallback, setUsedFallback] = useState(false);

  // 퍼스널 컬러 분석 (lib/gemini.ts 연동)
  const analyzePersonalColor = useCallback(async () => {
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

      // 문진 결과 파싱 (Record<number, string> 형식으로 변환)
      const parsedAnswers: Record<number, string> = JSON.parse(answers || '{}');

      // lib/gemini.ts의 analyzePersonalColor 호출
      const analysisResult = await analyzeWithGemini(base64Data, parsedAnswers);

      // Mock fallback 사용 여부 확인 (confidence가 0.75이면 Mock)
      if (analysisResult.confidence === 0.75) {
        setUsedFallback(true);
      }

      setResult(analysisResult);
    } catch (error) {
      console.error('[PC-1] Analysis error:', error);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageUri, imageBase64, answers]);

  useEffect(() => {
    analyzePersonalColor();
  }, [analyzePersonalColor]);

  const handleRetry = () => {
    router.replace('/(analysis)/personal-color');
  };

  // 내 색상에 맞는 제품 추천으로 이동
  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: {
        season: result?.season || '',
        category: 'makeup',
      },
    });
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <AnalysisLoadingState
        message="퍼스널 컬러를 분석 중이에요..."
        isDark={isDark}
        testID="personal-color-loading"
      />
    );
  }

  if (!result) {
    return (
      <AnalysisErrorState
        message="분석에 실패했습니다."
        onRetry={handleRetry}
        onGoHome={handleGoHome}
        isDark={isDark}
        testID="personal-color-error"
      />
    );
  }

  const seasonData = SEASON_DATA[result.season];

  return (
    <SafeAreaView
      style={[
        commonAnalysisStyles.container,
        isDark && commonAnalysisStyles.containerDark,
      ]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={commonAnalysisStyles.content}>
        {/* 결과 이미지 */}
        {imageUri && (
          <View style={commonAnalysisStyles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          </View>
        )}

        {/* 결과 카드 */}
        <View
          style={[styles.resultCard, isDark && commonAnalysisStyles.cardDark]}
        >
          {/* AI 분석 신뢰도 표시 */}
          <AnalysisTrustBadge
            type={usedFallback ? 'questionnaire' : 'ai'}
            confidence={usedFallback ? undefined : result.confidence}
            testID="personal-color-trust-badge"
          />
          <Text
            style={[
              styles.seasonLabel,
              isDark && commonAnalysisStyles.textMuted,
            ]}
          >
            당신의 퍼스널 컬러는
          </Text>
          <Text
            style={[
              styles.seasonName,
              isDark && commonAnalysisStyles.textLight,
            ]}
          >
            {seasonData.name}
          </Text>
          <Text
            style={[
              commonAnalysisStyles.description,
              isDark && commonAnalysisStyles.textMuted,
            ]}
          >
            {result.description || seasonData.description}
          </Text>
        </View>

        {/* 추천 컬러 팔레트 */}
        <View
          style={[
            commonAnalysisStyles.section,
            isDark && commonAnalysisStyles.cardDark,
          ]}
        >
          <Text
            style={[
              commonAnalysisStyles.sectionTitle,
              isDark && commonAnalysisStyles.textLight,
            ]}
          >
            추천 컬러 팔레트
          </Text>
          <View style={styles.colorPalette}>
            {seasonData.colors.map((color, index) => (
              <View
                key={index}
                style={[styles.colorSwatch, { backgroundColor: color }]}
              />
            ))}
          </View>
        </View>

        {/* 비슷한 연예인 */}
        <View
          style={[
            commonAnalysisStyles.section,
            isDark && commonAnalysisStyles.cardDark,
          ]}
        >
          <Text
            style={[
              commonAnalysisStyles.sectionTitle,
              isDark && commonAnalysisStyles.textLight,
            ]}
          >
            같은 타입의 연예인
          </Text>
          <View style={styles.celebrities}>
            {seasonData.celebrities.map((celebrity, index) => (
              <View key={index} style={styles.celebrityTag}>
                <Text style={styles.celebrityText}>{celebrity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 버튼 */}
        <AnalysisResultButtons
          primaryText="💄 내 색상에 맞는 제품"
          onPrimaryPress={handleProductRecommendation}
          onGoHome={handleGoHome}
          onRetry={handleRetry}
          testID="personal-color-result-buttons"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// 이 파일 전용 스타일 (공통 스타일은 commonAnalysisStyles 사용)
const styles = StyleSheet.create({
  // 결과 이미지 (원형)
  resultImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: ANALYSIS_COLORS.primary,
  },
  // 결과 카드
  resultCard: {
    backgroundColor: ANALYSIS_COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  seasonLabel: {
    fontSize: 14,
    color: ANALYSIS_COLORS.textSecondary,
    marginBottom: 8,
  },
  seasonName: {
    fontSize: 28,
    fontWeight: '700',
    color: ANALYSIS_COLORS.primary,
    marginBottom: 16,
  },
  // 컬러 팔레트
  colorPalette: {
    flexDirection: 'row',
    gap: 12,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // 연예인 태그
  celebrities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  celebrityTag: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  celebrityText: {
    color: ANALYSIS_COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
