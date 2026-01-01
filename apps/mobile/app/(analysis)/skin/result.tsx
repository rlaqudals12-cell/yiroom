/**
 * S-1 피부 분석 - 결과 화면
 */
import type { SkinType } from '@yiroom/shared';
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

// 피부 지표 타입
interface SkinMetrics {
  moisture: number;
  oil: number;
  pores: number;
  wrinkles: number;
  pigmentation: number;
  sensitivity: number;
  elasticity: number;
}

// 피부 타입 데이터
const SKIN_TYPE_DATA: Record<
  SkinType,
  {
    name: string;
    description: string;
    tips: string[];
  }
> = {
  dry: {
    name: '건성 피부',
    description:
      '수분이 부족한 피부 타입입니다. 보습에 집중하는 스킨케어를 추천드려요.',
    tips: [
      '고보습 크림 사용을 권장해요',
      '클렌징 후 바로 토너를 발라주세요',
      '수분 마스크팩을 주 2-3회 사용해보세요',
    ],
  },
  oily: {
    name: '지성 피부',
    description:
      '피지 분비가 활발한 피부 타입입니다. 유수분 밸런스 관리가 중요해요.',
    tips: [
      '가벼운 젤 타입 보습제를 사용하세요',
      '주 1-2회 모공 관리를 해주세요',
      '자극적인 클렌징은 피해주세요',
    ],
  },
  combination: {
    name: '복합성 피부',
    description:
      'T존은 지성, 볼은 건성인 피부 타입입니다. 부위별 맞춤 케어가 필요해요.',
    tips: [
      'T존과 볼을 다른 제품으로 케어하세요',
      '수분 공급과 유분 조절을 동시에 해주세요',
      '자극적인 각질 제거는 피해주세요',
    ],
  },
  sensitive: {
    name: '민감성 피부',
    description:
      '자극에 예민한 피부 타입입니다. 순한 성분의 제품을 사용하세요.',
    tips: [
      '무향료, 저자극 제품을 선택하세요',
      '새 제품은 패치 테스트 후 사용하세요',
      '피부 장벽 강화 제품을 사용해보세요',
    ],
  },
  normal: {
    name: '정상 피부',
    description:
      '유수분 밸런스가 좋은 피부 타입입니다. 현재 상태를 유지해주세요.',
    tips: [
      '기본적인 보습 케어를 유지하세요',
      '자외선 차단은 꼭 해주세요',
      '계절에 따라 제품을 조절해보세요',
    ],
  },
};

export default function SkinResultScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { imageUri } = useLocalSearchParams<{
    imageUri: string;
    imageBase64?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [metrics, setMetrics] = useState<SkinMetrics | null>(null);

  useEffect(() => {
    analyzeSkin();
  }, []);

  // 피부 분석 (Mock)
  const analyzeSkin = async () => {
    setIsLoading(true);

    // TODO: 실제 Gemini AI 분석 연동
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Mock 결과
    const types: SkinType[] = [
      'dry',
      'oily',
      'combination',
      'sensitive',
      'normal',
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];

    setSkinType(randomType);
    setMetrics({
      moisture: Math.floor(Math.random() * 40) + 40,
      oil: Math.floor(Math.random() * 40) + 30,
      pores: Math.floor(Math.random() * 30) + 50,
      wrinkles: Math.floor(Math.random() * 30) + 60,
      pigmentation: Math.floor(Math.random() * 30) + 50,
      sensitivity: Math.floor(Math.random() * 40) + 30,
      elasticity: Math.floor(Math.random() * 30) + 55,
    });
    setIsLoading(false);
  };

  // 피부 맞춤 제품 추천으로 이동
  const handleProductRecommendation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: {
        skinType: skinType || '',
        category: 'skincare',
      },
    });
  };

  const handleRetry = () => {
    router.replace('/(analysis)/skin');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#2e5afa" />
        <Text style={[styles.loadingText, isDark && styles.textLight]}>
          피부 상태를 분석 중이에요...
        </Text>
      </View>
    );
  }

  if (!skinType || !metrics) {
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

  const typeData = SKIN_TYPE_DATA[skinType];

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

        {/* 피부 타입 결과 */}
        <View style={[styles.resultCard, isDark && styles.cardDark]}>
          <Text style={[styles.typeLabel, isDark && styles.textMuted]}>
            당신의 피부 타입은
          </Text>
          <Text style={[styles.typeName, isDark && styles.textLight]}>
            {typeData.name}
          </Text>
          <Text style={[styles.description, isDark && styles.textMuted]}>
            {typeData.description}
          </Text>
        </View>

        {/* 피부 지표 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            피부 분석 지표
          </Text>
          <View style={styles.metricsContainer}>
            <MetricBar
              label="수분도"
              value={metrics.moisture}
              isDark={isDark}
            />
            <MetricBar label="유분도" value={metrics.oil} isDark={isDark} />
            <MetricBar label="모공" value={metrics.pores} isDark={isDark} />
            <MetricBar
              label="탄력"
              value={metrics.elasticity}
              isDark={isDark}
            />
            <MetricBar
              label="색소침착"
              value={metrics.pigmentation}
              isDark={isDark}
            />
            <MetricBar
              label="민감도"
              value={metrics.sensitivity}
              isDark={isDark}
            />
          </View>
        </View>

        {/* 스킨케어 팁 */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            스킨케어 팁
          </Text>
          <View style={styles.tipsList}>
            {typeData.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, isDark && styles.textMuted]}>
                  {tip}
                </Text>
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
            <Text style={styles.primaryButtonText}>🧴 피부 맞춤 제품 보기</Text>
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

function MetricBar({
  label,
  value,
  isDark,
}: {
  label: string;
  value: number;
  isDark: boolean;
}) {
  const getColor = (val: number) => {
    if (val >= 70) return '#22c55e';
    if (val >= 50) return '#eab308';
    return '#ef4444';
  };

  return (
    <View style={styles.metricItem}>
      <View style={styles.metricHeader}>
        <Text style={[styles.metricLabel, isDark && styles.textLight]}>
          {label}
        </Text>
        <Text style={[styles.metricValue, isDark && styles.textMuted]}>
          {value}%
        </Text>
      </View>
      <View style={[styles.metricBarBg, isDark && styles.metricBarBgDark]}>
        <View
          style={[
            styles.metricBarFill,
            { width: `${value}%`, backgroundColor: getColor(value) },
          ]}
        />
      </View>
    </View>
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
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#22c55e',
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
  typeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#22c55e',
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
  metricsContainer: {
    gap: 14,
  },
  metricItem: {
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 14,
    color: '#333',
  },
  metricValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metricBarBg: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBarBgDark: {
    backgroundColor: '#333',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
  },
  tipBullet: {
    color: '#2e5afa',
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
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
