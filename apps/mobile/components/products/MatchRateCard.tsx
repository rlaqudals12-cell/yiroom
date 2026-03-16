/**
 * 매칭률 카드 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MatchRateCardProps {
  matchRate: number;
  reasons?: string[];
}

function getGradeInfo(rate: number): { grade: string; color: string } {
  if (rate >= 85) return { grade: 'Diamond', color: '#a855f7' };
  if (rate >= 70) return { grade: 'Gold', color: '#f59e0b' };
  if (rate >= 50) return { grade: 'Silver', color: '#9ca3af' };
  return { grade: 'Bronze', color: '#b45309' };
}

export function MatchRateCard({ matchRate, reasons }: MatchRateCardProps): React.ReactElement {
  const { grade, color } = getGradeInfo(matchRate);

  return (
    <View style={styles.card} testID="match-rate-card">
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color }]}>{matchRate}%</Text>
        <View style={[styles.gradeBadge, { backgroundColor: color }]}>
          <Text style={styles.gradeText}>{grade}</Text>
        </View>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${matchRate}%`, backgroundColor: color }]} />
      </View>
      {reasons && reasons.length > 0 && (
        <View style={styles.reasons}>
          {reasons.map((reason, i) => (
            <Text key={i} style={styles.reason}>• {reason}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#1f2937' },
  scoreRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 8 },
  score: { fontSize: 24, fontWeight: '700' as const, marginRight: 8 },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  gradeText: { fontSize: 11, fontWeight: '600' as const, color: '#fff' },
  bar: { height: 6, borderRadius: 3, backgroundColor: '#374151', overflow: 'hidden' as const },
  fill: { height: '100%', borderRadius: 3 },
  reasons: { marginTop: 8 },
  reason: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
});
