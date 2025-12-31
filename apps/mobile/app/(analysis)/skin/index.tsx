/**
 * S-1 피부 분석 - 시작 화면
 */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SkinAnalysisScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleStartAnalysis = () => {
    router.push('/(analysis)/skin/camera');
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>AI</Text>
          </View>
          <Text style={[styles.title, isDark && styles.textLight]}>
            AI 피부 분석
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textMuted]}>
            사진 한 장으로 나의 피부 타입과{'\n'}맞춤 스킨케어 루틴을 확인하세요
          </Text>
        </View>

        {/* 분석 항목 */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>
            분석 항목
          </Text>
          <View style={styles.itemList}>
            <AnalysisItem label="피부 타입" description="건성/지성/복합/민감성" isDark={isDark} />
            <AnalysisItem label="수분도" description="피부 수분 레벨 측정" isDark={isDark} />
            <AnalysisItem label="유분도" description="피부 유분 밸런스" isDark={isDark} />
            <AnalysisItem label="모공" description="모공 상태 분석" isDark={isDark} />
            <AnalysisItem label="주름" description="피부 탄력 상태" isDark={isDark} />
            <AnalysisItem label="색소침착" description="기미/잡티 분석" isDark={isDark} />
            <AnalysisItem label="민감도" description="피부 민감 지수" isDark={isDark} />
          </View>
        </View>

        {/* 안내 */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>
            촬영 가이드
          </Text>
          <View style={styles.guideList}>
            <Text style={[styles.guideItem, isDark && styles.textMuted]}>
              • 화장을 지운 맨 얼굴로 촬영해주세요
            </Text>
            <Text style={[styles.guideItem, isDark && styles.textMuted]}>
              • 밝은 자연광 아래에서 촬영하면 좋아요
            </Text>
            <Text style={[styles.guideItem, isDark && styles.textMuted]}>
              • 정면을 바라보고 촬영해주세요
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 시작 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartAnalysis}>
          <Text style={styles.startButtonText}>피부 분석 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function AnalysisItem({
  label,
  description,
  isDark,
}: {
  label: string;
  description: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.analysisItem}>
      <View style={styles.bullet} />
      <View>
        <Text style={[styles.itemLabel, isDark && styles.textLight]}>{label}</Text>
        <Text style={[styles.itemDescription, isDark && styles.textMuted]}>
          {description}
        </Text>
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
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2e5afa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  itemList: {
    gap: 12,
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2e5afa',
    marginTop: 6,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
  },
  guideList: {
    gap: 8,
  },
  guideItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
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
  startButton: {
    backgroundColor: '#2e5afa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
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
