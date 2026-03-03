/**
 * 구강건강 분석 결과 카드
 *
 * 전체 점수, 치아 색상, 잇몸 건강, 화이트닝 목표
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../../lib/theme';
import { GumHealthIndicator, type GumHealthResult } from './GumHealthIndicator';

export interface ToothColorInfo {
  currentShade: string;
  brightness: number;
  yellowness: number;
}

export interface WhiteningGoal {
  targetShade: string;
  expectedDuration: string;
  methods: Array<{ name: string; effectiveness: 'high' | 'medium' | 'low' }>;
  overWhiteningWarning?: boolean;
}

export interface OralHealthResultCardProps {
  overallScore: number;
  toothColor?: ToothColorInfo;
  gumHealth?: GumHealthResult;
  whiteningGoal?: WhiteningGoal;
  recommendations?: string[];
}

type TabType = 'tooth' | 'gum' | 'whitening';

const EFFECTIVENESS_LABELS: Record<string, { label: string; colorKey: 'success' | 'warning' | 'error' }> = {
  high: { label: '높음', colorKey: 'success' },
  medium: { label: '보통', colorKey: 'warning' },
  low: { label: '낮음', colorKey: 'error' },
};

export function OralHealthResultCard({
  overallScore,
  toothColor,
  gumHealth,
  whiteningGoal,
  recommendations = [],
}: OralHealthResultCardProps): React.ReactElement {
  const { colors, brand, module, status, typography, radii, spacing } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('tooth');

  const handleTabChange = useCallback((tab: TabType) => setActiveTab(tab), []);

  // 점수 색상
  const scoreColor = overallScore >= 80 ? status.success
    : overallScore >= 60 ? status.warning
    : status.error;

  return (
    <View
      testID="oral-health-result-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.xl, borderColor: colors.border }]}
      accessibilityLabel={`구강건강 분석 결과: ${overallScore}점`}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: `${module.oralHealth.base}15`, padding: spacing.md }]}>
        <Text style={{ fontSize: typography.size['2xl'] }}>🦷</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.lg }]}>
            구강건강 분석
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20`, borderRadius: radii.xl }]}>
          <Text style={{ color: scoreColor, fontSize: typography.size.xl, fontWeight: '700' }}>
            {overallScore}
          </Text>
          <Text style={{ color: scoreColor, fontSize: typography.size.xs }}>점</Text>
        </View>
      </View>

      {/* 탭 */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, marginHorizontal: spacing.md }]}>
        {[
          { key: 'tooth' as TabType, label: '치아 색상' },
          { key: 'gum' as TabType, label: '잇몸 건강' },
          { key: 'whitening' as TabType, label: '화이트닝' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key)}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: module.oralHealth.base, borderBottomWidth: 2 }]}
          >
            <Text
              style={{
                color: activeTab === tab.key ? module.oralHealth.base : colors.mutedForeground,
                fontSize: typography.size.sm,
                fontWeight: activeTab === tab.key ? '600' : '400',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 탭 콘텐츠 */}
      <View style={{ padding: spacing.md }}>
        {activeTab === 'tooth' && (
          <View>
            {toothColor ? (
              <View>
                <View style={[styles.shadeRow, { marginBottom: spacing.md }]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>현재 색조</Text>
                  <View style={[styles.shadeCircle, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '700' }}>
                      {toothColor.currentShade}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricRow}>
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>밝기</Text>
                  <View style={[styles.progressBg, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
                    <View style={[styles.progressFill, { width: `${toothColor.brightness}%`, backgroundColor: status.info, borderRadius: radii.full }]} />
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: typography.size.xs, fontWeight: '600' }}>{toothColor.brightness}%</Text>
                </View>
                <View style={[styles.metricRow, { marginTop: spacing.sm }]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>황색도</Text>
                  <View style={[styles.progressBg, { backgroundColor: colors.secondary, borderRadius: radii.full }]}>
                    <View style={[styles.progressFill, { width: `${toothColor.yellowness}%`, backgroundColor: status.warning, borderRadius: radii.full }]} />
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: typography.size.xs, fontWeight: '600' }}>{toothColor.yellowness}%</Text>
                </View>
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
                치아 색상 정보가 없습니다
              </Text>
            )}
          </View>
        )}

        {activeTab === 'gum' && (
          <View>
            {gumHealth ? (
              <GumHealthIndicator result={gumHealth} compact />
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
                잇몸 건강 정보가 없습니다
              </Text>
            )}
          </View>
        )}

        {activeTab === 'whitening' && (
          <View>
            {whiteningGoal ? (
              <View>
                <View style={[styles.goalRow, { marginBottom: spacing.sm }]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>목표 색조</Text>
                  <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '700' }}>
                    {whiteningGoal.targetShade}
                  </Text>
                </View>
                <View style={[styles.goalRow, { marginBottom: spacing.md }]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>예상 기간</Text>
                  <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600' }}>
                    {whiteningGoal.expectedDuration}
                  </Text>
                </View>

                {whiteningGoal.overWhiteningWarning && (
                  <View style={[styles.warningBox, { backgroundColor: `${status.warning}15`, borderRadius: radii.xl, padding: spacing.sm }]}>
                    <Text style={{ color: status.warning, fontSize: typography.size.xs }}>
                      ⚠️ 과도한 화이트닝은 치아 건강에 해로울 수 있습니다
                    </Text>
                  </View>
                )}

                <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm }}>
                  추천 방법
                </Text>
                {whiteningGoal.methods.map((method, index) => {
                  const eff = EFFECTIVENESS_LABELS[method.effectiveness];
                  return (
                    <View key={index} style={[styles.methodRow, { borderBottomColor: colors.border }]}>
                      <Text style={{ color: colors.foreground, fontSize: typography.size.sm, flex: 1 }}>
                        {method.name}
                      </Text>
                      <Text style={{ color: status[eff?.colorKey ?? 'info'], fontSize: typography.size.xs, fontWeight: '500' }}>
                        {eff?.label ?? method.effectiveness}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, textAlign: 'center' }}>
                화이트닝 정보가 없습니다
              </Text>
            )}
          </View>
        )}
      </View>

      {/* 추천사항 */}
      {recommendations.length > 0 && (
        <View style={[styles.recsSection, { borderTopColor: colors.border, padding: spacing.md }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: spacing.sm }}>
            추천사항
          </Text>
          {recommendations.slice(0, 4).map((rec, index) => (
            <Text key={index} style={{ color: colors.mutedForeground, fontSize: typography.size.xs, lineHeight: 18, marginBottom: spacing.xs }}>
              • {rec}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smx },
  headerText: { flex: 1 },
  title: { fontWeight: '700' },
  scoreBadge: { alignItems: 'center', paddingHorizontal: spacing.smx, paddingVertical: 6 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginTop: spacing.sm },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.smd },
  shadeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shadeCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBg: { flex: 1, height: 6 },
  progressFill: { height: 6 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  warningBox: {},
  methodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  recsSection: { borderTopWidth: 1 },
});
