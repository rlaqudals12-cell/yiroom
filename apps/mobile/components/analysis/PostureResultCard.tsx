/**
 * 자세 분석 결과 카드
 *
 * 자세 유형, 전체 점수, 전면/측면 분석
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../../lib/theme';

export type PostureType =
  | 'ideal' | 'forward_head' | 'rounded_shoulders'
  | 'swayback' | 'kyphosis' | 'lordosis' | 'flat_back';

export interface PostureMeasurement {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'alert';
  idealRange?: string;
}

export interface PostureResultCardProps {
  postureType: PostureType;
  overallScore: number;
  confidence: number;
  frontMeasurements?: PostureMeasurement[];
  sideMeasurements?: PostureMeasurement[];
  issueCount?: number;
}

const POSTURE_INFO: Record<PostureType, { label: string; emoji: string; description: string }> = {
  ideal: { label: '이상적 자세', emoji: '🧍', description: '균형 잡힌 좋은 자세예요' },
  forward_head: { label: '거북목', emoji: '🐢', description: '머리가 앞으로 나와 있어요' },
  rounded_shoulders: { label: '둥근 어깨', emoji: '🔄', description: '어깨가 앞으로 말려 있어요' },
  swayback: { label: '스웨이백', emoji: '↩️', description: '골반이 앞으로 밀려 있어요' },
  kyphosis: { label: '등굽음증', emoji: '🌙', description: '등이 과도하게 굽어 있어요' },
  lordosis: { label: '요추전만', emoji: '🏋️', description: '허리가 과도하게 휘어 있어요' },
  flat_back: { label: '일자 허리', emoji: '📏', description: '척추 커브가 부족해요' },
};

export function PostureResultCard({
  postureType,
  overallScore,
  confidence,
  frontMeasurements = [],
  sideMeasurements = [],
  issueCount = 0,
}: PostureResultCardProps): React.ReactElement {
  const { colors, module, status, typography, radii, spacing } = useTheme();
  const info = POSTURE_INFO[postureType];

  const scoreColor = overallScore >= 80 ? status.success
    : overallScore >= 60 ? status.warning
    : status.error;

  const getStatusColor = (s: string): string => {
    switch (s) {
      case 'good': return status.success;
      case 'warning': return status.warning;
      case 'alert': return status.error;
      default: return colors.mutedForeground;
    }
  };

  const getStatusLabel = (s: string): string => {
    switch (s) {
      case 'good': return '양호';
      case 'warning': return '주의';
      case 'alert': return '개선 필요';
      default: return s;
    }
  };

  return (
    <View
      testID="posture-result-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg, borderColor: colors.border }]}
      accessibilityLabel={`자세 분석 결과: ${info.label}, ${overallScore}점`}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: `${module.posture.base}15`, padding: spacing.md }]}>
        <Text style={{ fontSize: typography.size['2xl'] }}>{info.emoji}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.typeLabel, { color: colors.foreground, fontSize: typography.size.lg }]}>
            {info.label}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
            {info.description}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20`, borderRadius: radii.md }]}>
          <Text style={{ color: scoreColor, fontSize: typography.size.xl, fontWeight: '700' }}>
            {overallScore}
          </Text>
          <Text style={{ color: scoreColor, fontSize: typography.size.xs }}>점</Text>
        </View>
      </View>

      {/* 이슈 알림 */}
      {issueCount > 0 && (
        <View style={[styles.issueAlert, { backgroundColor: `${status.warning}15`, margin: spacing.md, borderRadius: radii.md, padding: spacing.sm }]}>
          <Text style={{ color: status.warning, fontSize: typography.size.xs }}>
            ⚠️ {issueCount}개 항목이 개선이 필요합니다
          </Text>
        </View>
      )}

      {/* 이상적 자세 확인 배너 */}
      {postureType === 'ideal' && (
        <View style={[styles.idealBanner, { backgroundColor: `${status.success}15`, margin: spacing.md, borderRadius: radii.md, padding: spacing.sm }]}>
          <Text style={{ color: status.success, fontSize: typography.size.sm, fontWeight: '600' }}>
            ✨ 이상적인 자세를 유지하고 있어요!
          </Text>
        </View>
      )}

      {/* 전면 측정 */}
      {frontMeasurements.length > 0 && (
        <View style={[styles.section, { padding: spacing.md, borderTopColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: spacing.sm }}>
            전면 분석
          </Text>
          <View style={styles.measurementGrid}>
            {frontMeasurements.map((m, index) => (
              <View key={index} style={[styles.measurementCard, { backgroundColor: colors.secondary, borderRadius: radii.md }]}>
                <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{m.name}</Text>
                <Text style={{ color: getStatusColor(m.status), fontSize: typography.size.lg, fontWeight: '700' }}>
                  {m.value}{m.unit}
                </Text>
                <Text style={{ color: getStatusColor(m.status), fontSize: 10, fontWeight: '500' }}>
                  {getStatusLabel(m.status)}
                </Text>
                {m.idealRange && (
                  <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>이상: {m.idealRange}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 측면 측정 */}
      {sideMeasurements.length > 0 && (
        <View style={[styles.section, { padding: spacing.md, borderTopColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm, fontWeight: '600', marginBottom: spacing.sm }}>
            측면 분석
          </Text>
          <View style={styles.measurementGrid}>
            {sideMeasurements.map((m, index) => (
              <View key={index} style={[styles.measurementCard, { backgroundColor: colors.secondary, borderRadius: radii.md }]}>
                <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>{m.name}</Text>
                <Text style={{ color: getStatusColor(m.status), fontSize: typography.size.lg, fontWeight: '700' }}>
                  {m.value}{m.unit}
                </Text>
                <Text style={{ color: getStatusColor(m.status), fontSize: 10, fontWeight: '500' }}>
                  {getStatusLabel(m.status)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 신뢰도 */}
      <View style={[styles.footer, { borderTopColor: colors.border, padding: spacing.md }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs }}>
          분석 신뢰도 {confidence}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smx },
  headerText: { flex: 1 },
  typeLabel: { fontWeight: '700' },
  scoreBadge: { alignItems: 'center', paddingHorizontal: spacing.smx, paddingVertical: 6 },
  issueAlert: {},
  idealBanner: {},
  section: { borderTopWidth: 1 },
  measurementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  measurementCard: { width: '47%', padding: spacing.smd, alignItems: 'center' },
  footer: { borderTopWidth: 1 },
});
