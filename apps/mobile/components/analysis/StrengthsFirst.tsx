/**
 * 강점 우선 표시 컴포넌트
 *
 * 긍정적 UX: 강점을 먼저 보여주고, 성장 가능성을 부드럽게 표현
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { AnalysisType, MetricItem } from './VisualReportCard';

export interface StrengthsFirstProps {
  analysisType: AnalysisType;
  /** 피부 분석 메트릭 */
  metrics?: MetricItem[];
  /** 체형 강점 */
  strengths?: string[];
  /** 퍼스널 컬러 베스트 색상 */
  bestColors?: Array<{ hex: string; name: string }>;
  /** 강점 최대 표시 수 (기본 3) */
  maxStrengths?: number;
  /** 성장 영역 최대 표시 수 (기본 2) */
  maxGrowthAreas?: number;
}

export function StrengthsFirst({
  analysisType,
  metrics,
  strengths,
  bestColors,
  maxStrengths = 3,
  maxGrowthAreas = 2,
}: StrengthsFirstProps): React.ReactElement {
  const { colors, status, module, typography } = useTheme();

  // 메트릭 기반 강점/성장 분류
  const { topItems, growthItems, allExcellent } = useMemo(() => {
    if (analysisType === 'skin' && metrics) {
      const sorted = [...metrics].sort((a, b) => b.value - a.value);
      const top = sorted.slice(0, maxStrengths);
      const growth = sorted.slice(-maxGrowthAreas).filter((m) => m.value < 70);
      return { topItems: top, growthItems: growth, allExcellent: growth.length === 0 };
    }
    if (analysisType === 'body' && strengths) {
      return {
        topItems: strengths.slice(0, maxStrengths).map((s, i) => ({ id: `s${i}`, name: s, value: 0 })),
        growthItems: [],
        allExcellent: true,
      };
    }
    return { topItems: [], growthItems: [], allExcellent: false };
  }, [analysisType, metrics, strengths, maxStrengths, maxGrowthAreas]);

  const moduleColor = analysisType === 'skin'
    ? module.skin.base
    : analysisType === 'body'
      ? module.body.base
      : module.personalColor.base;

  return (
    <View testID="strengths-first">
      {/* 강점 섹션 */}
      <View
        style={[styles.section, { backgroundColor: `${status.success}10`, borderColor: `${status.success}30` }]}
      >
        <Text style={[styles.sectionTitle, { color: status.success, fontSize: typography.size.sm }]}>
          나의 강점
        </Text>

        {analysisType === 'personal-color' && bestColors && bestColors.length > 0 ? (
          <View style={styles.colorRow}>
            {bestColors.slice(0, 6).map((c, i) => (
              <View key={i} style={styles.colorItem}>
                <View style={[styles.colorCircle, { backgroundColor: c.hex }]} />
                <Text style={[styles.colorName, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                  {c.name}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          topItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.strengthIcon, { color: status.success }]}>●</Text>
              <Text style={[styles.itemName, { color: colors.foreground, fontSize: typography.size.sm }]}>
                {item.name}
              </Text>
              {item.value > 0 && (
                <Text style={[styles.itemScore, { color: status.success, fontSize: typography.size.sm }]}>
                  {item.value}점
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* 성장 가능성 섹션 */}
      {!allExcellent && growthItems.length > 0 ? (
        <View
          style={[styles.section, styles.growthSection, { backgroundColor: `${status.warning}10`, borderColor: `${status.warning}30` }]}
        >
          <Text style={[styles.sectionTitle, { color: status.warning, fontSize: typography.size.sm }]}>
            성장 가능성
          </Text>
          {growthItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.strengthIcon, { color: status.warning }]}>○</Text>
              <Text style={[styles.itemName, { color: colors.foreground, fontSize: typography.size.sm }]}>
                {item.name}을(를) 개선하면 더 좋아질 수 있어요
              </Text>
            </View>
          ))}
        </View>
      ) : allExcellent && topItems.length > 0 ? (
        <View
          style={[styles.section, styles.growthSection, { backgroundColor: `${status.info}10`, borderColor: `${status.info}30` }]}
        >
          <Text style={[styles.excellentText, { color: status.info, fontSize: typography.size.sm }]}>
            모든 항목이 우수해요! 🎉
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  growthSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  strengthIcon: {
    fontSize: 8,
    marginRight: 8,
    marginTop: 1,
  },
  itemName: {
    flex: 1,
  },
  itemScore: {
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorItem: {
    alignItems: 'center',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },
  colorName: {
    textAlign: 'center',
  },
  excellentText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
