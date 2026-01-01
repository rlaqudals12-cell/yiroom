/**
 * 위젯 설정 및 미리보기 화면
 * iOS/Android 홈 화면 위젯 안내
 */

import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Platform,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuickActionsWidget } from '../../components/widgets/QuickActionsWidget';
import { TodaySummaryWidget } from '../../components/widgets/TodaySummaryWidget';
import { useWidgetSync } from '../../lib/widgets';
import {
  TodaySummaryData,
  DEFAULT_SUMMARY_DATA,
} from '../../lib/widgets/types';

export default function WidgetSettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getData } = useWidgetSync({ autoSync: false });

  const [widgetData, setWidgetData] =
    useState<TodaySummaryData>(DEFAULT_SUMMARY_DATA);
  const [selectedSize, setSelectedSize] = useState<
    'small' | 'medium' | 'large'
  >('medium');

  useEffect(() => {
    loadWidgetData();
  }, []);

  const loadWidgetData = async () => {
    const data = await getData();
    setWidgetData(data);
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    Haptics.selectionAsync();
    setSelectedSize(size);
  };

  const handleAddWidgetHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 플랫폼별 위젯 추가 안내
    if (Platform.OS === 'ios') {
      // iOS 위젯 추가 방법 안내
      Linking.openURL('https://support.apple.com/ko-kr/HT207122');
    } else {
      // Android 위젯 추가 방법 안내
      Linking.openURL('https://support.google.com/android/answer/9450271');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 안내 배너 */}
        <View style={[styles.infoBanner, isDark && styles.infoBannerDark]}>
          <Text style={styles.infoIcon}>📱</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, isDark && styles.textLight]}>
              홈 화면에 위젯 추가하기
            </Text>
            <Text style={[styles.infoText, isDark && styles.textMuted]}>
              {Platform.OS === 'ios'
                ? '홈 화면을 길게 눌러 편집 모드에서 "이룸" 위젯을 추가하세요.'
                : '홈 화면을 길게 눌러 위젯 메뉴에서 "이룸" 위젯을 찾아 추가하세요.'}
            </Text>
          </View>
        </View>

        {/* 위젯 크기 선택 */}
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          위젯 미리보기
        </Text>
        <View style={styles.sizeSelector}>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                isDark && styles.sizeButtonDark,
                selectedSize === size && styles.sizeButtonSelected,
              ]}
              onPress={() => handleSizeChange(size)}
            >
              <Text
                style={[
                  styles.sizeButtonText,
                  isDark && styles.textMuted,
                  selectedSize === size && styles.sizeButtonTextSelected,
                ]}
              >
                {size === 'small'
                  ? '소형'
                  : size === 'medium'
                    ? '중형'
                    : '대형'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 오늘 요약 위젯 미리보기 */}
        <View style={styles.widgetSection}>
          <Text style={[styles.widgetLabel, isDark && styles.textMuted]}>
            오늘 요약
          </Text>
          <View style={styles.widgetPreview}>
            <TodaySummaryWidget data={widgetData} size={selectedSize} />
          </View>
        </View>

        {/* 빠른 실행 위젯 미리보기 */}
        {selectedSize !== 'large' && (
          <View style={styles.widgetSection}>
            <Text style={[styles.widgetLabel, isDark && styles.textMuted]}>
              빠른 실행
            </Text>
            <View style={styles.widgetPreview}>
              <QuickActionsWidget
                size={selectedSize === 'small' ? 'small' : 'medium'}
              />
            </View>
          </View>
        )}

        {/* 위젯 추가 도움말 버튼 */}
        <TouchableOpacity
          style={[styles.helpButton, isDark && styles.helpButtonDark]}
          onPress={handleAddWidgetHelp}
        >
          <Text style={styles.helpButtonIcon}>❓</Text>
          <Text style={[styles.helpButtonText, isDark && styles.textLight]}>
            위젯 추가 방법 알아보기
          </Text>
        </TouchableOpacity>

        {/* 지원 위젯 목록 */}
        <View style={styles.widgetList}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            지원 위젯
          </Text>

          <View style={[styles.widgetItem, isDark && styles.widgetItemDark]}>
            <Text style={styles.widgetItemIcon}>📊</Text>
            <View style={styles.widgetItemContent}>
              <Text
                style={[styles.widgetItemTitle, isDark && styles.textLight]}
              >
                오늘 요약
              </Text>
              <Text style={[styles.widgetItemDesc, isDark && styles.textMuted]}>
                운동, 물 섭취, 칼로리 현황을 한눈에
              </Text>
            </View>
            <View style={styles.sizeBadges}>
              <Text style={styles.sizeBadge}>S</Text>
              <Text style={styles.sizeBadge}>M</Text>
              <Text style={styles.sizeBadge}>L</Text>
            </View>
          </View>

          <View style={[styles.widgetItem, isDark && styles.widgetItemDark]}>
            <Text style={styles.widgetItemIcon}>⚡</Text>
            <View style={styles.widgetItemContent}>
              <Text
                style={[styles.widgetItemTitle, isDark && styles.textLight]}
              >
                빠른 실행
              </Text>
              <Text style={[styles.widgetItemDesc, isDark && styles.textMuted]}>
                원탭으로 물 추가, 운동 시작
              </Text>
            </View>
            <View style={styles.sizeBadges}>
              <Text style={styles.sizeBadge}>S</Text>
              <Text style={styles.sizeBadge}>M</Text>
            </View>
          </View>
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
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoBannerDark: {
    backgroundColor: '#1a1a2e',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  sizeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  sizeButtonDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  sizeButtonSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  sizeButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  widgetSection: {
    marginBottom: 24,
  },
  widgetLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  widgetPreview: {
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  helpButtonDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  helpButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  helpButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  widgetList: {
    marginTop: 8,
  },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  widgetItemDark: {
    backgroundColor: '#1a1a1a',
  },
  widgetItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  widgetItemContent: {
    flex: 1,
  },
  widgetItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
    marginBottom: 2,
  },
  widgetItemDesc: {
    fontSize: 13,
    color: '#666',
  },
  sizeBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  sizeBadge: {
    width: 24,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    overflow: 'hidden',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
