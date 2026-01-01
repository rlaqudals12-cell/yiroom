/**
 * PC-1 퍼스널 컬러 진단 - 결과 화면
 */
import type { PersonalColorSeason } from '@yiroom/shared';
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
  const { imageUri, answers } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
    answers: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PersonalColorSeason | null>(null);

  useEffect(() => {
    analyzePersonalColor();
  }, []);

  // 퍼스널 컬러 분석 (Mock)
  const analyzePersonalColor = async () => {
    setIsLoading(true);

    // TODO: 실제 Gemini AI 분석 연동
    // 현재는 문진 결과 기반 Mock 분석
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const parsedAnswers = JSON.parse(answers || '{}');
    const warmCount = Object.values(parsedAnswers).filter(
      (v) => v === 'warm'
    ).length;
    const coolCount = Object.values(parsedAnswers).filter(
      (v) => v === 'cool'
    ).length;

    let season: PersonalColorSeason;
    if (warmCount > coolCount) {
      season = Math.random() > 0.5 ? 'Spring' : 'Autumn';
    } else {
      season = Math.random() > 0.5 ? 'Summer' : 'Winter';
    }

    setResult(season);
    setIsLoading(false);
  };

  const handleRetry = () => {
    router.replace('/(analysis)/personal-color');
  };

  // 내 색상에 맞는 제품 추천으로 이동
  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: {
        season: result || '',
        category: 'makeup',
      },
    });
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#2e5afa" />
        <Text style={[styles.loadingText, isDark && styles.textLight]}>
          퍼스널 컬러를 분석 중이에요...
        </Text>
      </View>
    );
  }

  if (!result) {
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

  const seasonData = SEASON_DATA[result];

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

        {/* 결과 카드 */}
        <View style={[styles.resultCard, isDark && styles.cardDark]}>
          <Text style={[styles.seasonLabel, isDark && styles.textMuted]}>
            당신의 퍼스널 컬러는
          </Text>
          <Text style={[styles.seasonName, isDark && styles.textLight]}>
            {seasonData.name}
          </Text>
          <Text style={[styles.description, isDark && styles.textMuted]}>
            {seasonData.description}
          </Text>
        </View>

        {/* 추천 컬러 팔레트 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
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
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
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
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleProductRecommendation}
          >
            <Text style={styles.primaryButtonText}>💄 내 색상에 맞는 제품</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRetry}>
            <Text style={styles.retryLink}>다시 진단하기</Text>
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
    marginBottom: 24,
  },
  resultImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#2e5afa',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  seasonLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  seasonName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2e5afa',
    marginBottom: 16,
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
    color: '#2e5afa',
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
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 4,
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
