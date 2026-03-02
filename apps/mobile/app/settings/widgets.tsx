/**
 * 위젯 설정 및 미리보기 화면
 * iOS/Android 홈 화면 위젯 안내
 */

import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Linking,
  Pressable,
} from 'react-native';

import { useTheme, typography, radii , spacing } from '@/lib/theme';
import { ScreenContainer } from '../../components/ui';

import { QuickActionsWidget } from '../../components/widgets/QuickActionsWidget';
import { TodaySummaryWidget } from '../../components/widgets/TodaySummaryWidget';
import { useWidgetSync } from '../../lib/widgets';
import { TodaySummaryData, DEFAULT_SUMMARY_DATA } from '../../lib/widgets/types';

export default function WidgetSettingsScreen() {
  const { colors, brand, typography, spacing, radii} = useTheme();
  const { getData } = useWidgetSync({ autoSync: false });

  const [widgetData, setWidgetData] = useState<TodaySummaryData>(DEFAULT_SUMMARY_DATA);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');

  const loadWidgetData = useCallback(async () => {
    const data = await getData();
    setWidgetData(data);
  }, [getData]);

  useEffect(() => {
    loadWidgetData();
  }, [loadWidgetData]);

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    Haptics.selectionAsync();
    setSelectedSize(size);
  };

  const handleAddWidgetHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 플랫폼별 위젯 추가 안내
    if (Platform.OS === 'ios') {
      Linking.openURL('https://support.apple.com/ko-kr/HT207122');
    } else {
      Linking.openURL('https://support.google.com/android/answer/9450271');
    }
  };

  return (
    <ScreenContainer
      testID="settings-widgets-screen"
      edges={['bottom']}
    >
        {/* 안내 배너 */}
        <View style={[styles.infoBanner, { backgroundColor: colors.muted }]}>
          <Text style={styles.infoIcon}>📱</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              홈 화면에 위젯 추가하기
            </Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              {Platform.OS === 'ios'
                ? '홈 화면을 길게 눌러 편집 모드에서 "이룸" 위젯을 추가하세요.'
                : '홈 화면을 길게 눌러 위젯 메뉴에서 "이룸" 위젯을 찾아 추가하세요.'}
            </Text>
          </View>
        </View>

        {/* 위젯 크기 선택 */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>위젯 미리보기</Text>
        <View style={styles.sizeSelector}>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <Pressable
              key={size}
              style={[
                styles.sizeButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedSize === size && { backgroundColor: brand.primary, borderColor: brand.primary },
              ]}
              onPress={() => handleSizeChange(size)}
            >
              <Text
                style={[
                  styles.sizeButtonText,
                  { color: colors.foreground },
                  selectedSize === size && { color: brand.primaryForeground, fontWeight: typography.weight.semibold },
                ]}
              >
                {size === 'small' ? '소형' : size === 'medium' ? '중형' : '대형'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 오늘 요약 위젯 미리보기 */}
        <View style={styles.widgetSection}>
          <Text style={[styles.widgetLabel, { color: colors.mutedForeground }]}>오늘 요약</Text>
          <View style={styles.widgetPreview}>
            <TodaySummaryWidget data={widgetData} size={selectedSize} />
          </View>
        </View>

        {/* 빠른 실행 위젯 미리보기 */}
        {selectedSize !== 'large' && (
          <View style={styles.widgetSection}>
            <Text style={[styles.widgetLabel, { color: colors.mutedForeground }]}>빠른 실행</Text>
            <View style={styles.widgetPreview}>
              <QuickActionsWidget size={selectedSize === 'small' ? 'small' : 'medium'} />
            </View>
          </View>
        )}

        {/* 위젯 추가 도움말 버튼 */}
        <Pressable
          style={[styles.helpButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleAddWidgetHelp}
        >
          <Text style={styles.helpButtonIcon}>❓</Text>
          <Text style={[styles.helpButtonText, { color: colors.foreground }]}>
            위젯 추가 방법 알아보기
          </Text>
        </Pressable>

        {/* 지원 위젯 목록 */}
        <View style={styles.widgetList}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>지원 위젯</Text>

          <View style={[styles.widgetItem, { backgroundColor: colors.card }]}>
            <Text style={styles.widgetItemIcon}>📊</Text>
            <View style={styles.widgetItemContent}>
              <Text style={[styles.widgetItemTitle, { color: colors.foreground }]}>오늘 요약</Text>
              <Text style={[styles.widgetItemDesc, { color: colors.mutedForeground }]}>
                운동, 물 섭취, 칼로리 현황을 한눈에
              </Text>
            </View>
            <View style={styles.sizeBadges}>
              <Text style={[styles.sizeBadge, { backgroundColor: colors.muted, color: colors.mutedForeground }]}>S</Text>
              <Text style={[styles.sizeBadge, { backgroundColor: colors.muted, color: colors.mutedForeground }]}>M</Text>
              <Text style={[styles.sizeBadge, { backgroundColor: colors.muted, color: colors.mutedForeground }]}>L</Text>
            </View>
          </View>

          <View style={[styles.widgetItem, { backgroundColor: colors.card }]}>
            <Text style={styles.widgetItemIcon}>⚡</Text>
            <View style={styles.widgetItemContent}>
              <Text style={[styles.widgetItemTitle, { color: colors.foreground }]}>빠른 실행</Text>
              <Text style={[styles.widgetItemDesc, { color: colors.mutedForeground }]}>
                원탭으로 물 추가, 운동 시작
              </Text>
            </View>
            <View style={styles.sizeBadges}>
              <Text style={[styles.sizeBadge, { backgroundColor: colors.muted, color: colors.mutedForeground }]}>S</Text>
              <Text style={[styles.sizeBadge, { backgroundColor: colors.muted, color: colors.mutedForeground }]}>M</Text>
            </View>
          </View>
        </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    borderRadius: radii.smx,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    fontSize: typography.size['2xl'],
    marginRight: spacing.smx,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  sizeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.mlg,
  },
  sizeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.circle,
    borderWidth: 1,
  },
  sizeButtonText: {
    fontSize: typography.size.sm,
  },
  widgetSection: {
    marginBottom: spacing.lg,
  },
  widgetLabel: {
    fontSize: 13,
    marginBottom: spacing.smx,
  },
  widgetPreview: {
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.smx,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  helpButtonIcon: {
    fontSize: typography.size.lg,
    marginRight: spacing.sm,
  },
  helpButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
  },
  widgetList: {
    marginTop: spacing.sm,
  },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.smx,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  widgetItemIcon: {
    fontSize: typography.size['2xl'],
    marginRight: spacing.smx,
  },
  widgetItemContent: {
    flex: 1,
  },
  widgetItemTitle: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
    marginBottom: spacing.xxs,
  },
  widgetItemDesc: {
    fontSize: 13,
  },
  sizeBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sizeBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    overflow: 'hidden',
  },
});
