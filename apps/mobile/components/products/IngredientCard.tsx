/**
 * 성분 카드 컴포넌트
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Ingredient {
  name: string;
  safety: 'safe' | 'caution' | 'warning';
  description?: string;
  ewgScore?: number;
}

interface IngredientCardProps {
  ingredient: Ingredient;
}

const SAFETY_COLORS = {
  safe: '#22c55e',
  caution: '#f59e0b',
  warning: '#ef4444',
};

const SAFETY_LABELS = {
  safe: '안전',
  caution: '주의',
  warning: '위험',
};

export function IngredientCard({ ingredient }: IngredientCardProps): React.ReactElement {
  const color = SAFETY_COLORS[ingredient.safety];

  return (
    <View style={styles.card} testID={`ingredient-${ingredient.name}`}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{SAFETY_LABELS[ingredient.safety]}</Text>
        </View>
        <Text style={styles.name}>{ingredient.name}</Text>
        {ingredient.ewgScore !== undefined && (
          <Text style={[styles.ewg, { color }]}>EWG {ingredient.ewgScore}</Text>
        )}
      </View>
      {ingredient.description && (
        <Text style={styles.description}>{ingredient.description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#1f2937', marginBottom: 8 },
  header: { flexDirection: 'row' as const, alignItems: 'center' as const },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' as const, color: '#fff' },
  name: { fontSize: 14, fontWeight: '500' as const, flex: 1 },
  ewg: { fontSize: 12, fontWeight: '600' as const },
  description: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
});
