import { Image } from 'expo-image';
import { Bookmark, Info } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

import { styles } from './recommend.styles';
import { GlassCard } from '../../components/ui';
import type { OutfitSuggestion } from '../../lib/inventory/useClosetMatcher';

interface RecommendOutfitSectionProps {
  outfit: OutfitSuggestion | null;
  noOutfitHint: string;
  isSaving: boolean;
  isAlreadySaved: boolean;
  onItemPress: (id: string) => void;
  onSave: () => void;
}

type OutfitMatch = OutfitSuggestion['top'];

function OutfitItem({
  label,
  match,
  onPress,
}: {
  label: string;
  match: OutfitMatch;
  onPress: (id: string) => void;
}) {
  const { colors, status } = useTheme();
  if (!match) return null;

  return (
    <Pressable
      style={[styles.outfitItem, { backgroundColor: colors.card }]}
      onPress={() => onPress(match.item.id)}
    >
      <View style={styles.outfitImageContainer}>
        {match.item.imageUrl ? (
          <Image
            source={{ uri: match.item.imageUrl }}
            style={styles.outfitImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.outfitPlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={styles.placeholderText}>👕</Text>
          </View>
        )}
      </View>
      <View style={styles.outfitItemInfo}>
        <Text style={[styles.outfitItemLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.outfitItemName, { color: colors.foreground }]} numberOfLines={1}>
          {match.item.name}
        </Text>
        <View style={[styles.scoreContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.scoreBar,
              { width: `${match.score.total}%` },
              match.score.total >= 70 && { backgroundColor: status.success },
              match.score.total >= 50 &&
                match.score.total < 70 && { backgroundColor: status.warning },
              match.score.total < 50 && { backgroundColor: status.error },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

export function RecommendOutfitSection({
  outfit,
  noOutfitHint,
  isSaving,
  isAlreadySaved,
  onItemPress,
  onSave,
}: RecommendOutfitSectionProps) {
  const { colors, module: moduleTheme, status } = useTheme();

  if (!outfit) {
    return (
      <View style={styles.noOutfitContainer} testID="no-outfit">
        <Text style={[styles.noOutfitText, { color: colors.mutedForeground }]}>
          추천할 코디를 찾지 못했어요
        </Text>
        <Text style={[styles.noOutfitSubtext, { color: colors.mutedForeground }]}>
          {noOutfitHint}
        </Text>
      </View>
    );
  }

  const matches: [string, OutfitMatch][] = [
    ['아우터', outfit.outer],
    ['원피스', outfit.dress],
    ['상의', outfit.top],
    ['하의', outfit.bottom],
    ['신발', outfit.shoes],
    ['가방', outfit.bag],
    ['악세서리', outfit.accessory],
  ];

  return (
    <View style={styles.outfitSection}>
      <View style={styles.outfitHeader}>
        <Text style={[styles.outfitTitle, { color: colors.foreground }]}>오늘의 추천 코디</Text>
        <View style={[styles.scoreCircle, { backgroundColor: moduleTheme.body.dark }]}>
          <Text style={[styles.scoreCircleText, { color: colors.card }]}>{outfit.totalScore}</Text>
        </View>
      </View>

      <View style={styles.outfitGrid}>
        {matches.map(([label, match]) => (
          <OutfitItem key={label} label={label} match={match} onPress={onItemPress} />
        ))}
      </View>

      {outfit.warnings.length > 0 && (
        <Animated.View entering={FadeInUp.delay(40).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.warningsCard }} testID="outfit-warnings">
            {outfit.warnings.map((warning, index) => (
              <View key={index} style={styles.warningRow}>
                <Info size={14} color={status.warning} />
                <Text style={[styles.warningText, { color: colors.mutedForeground }]}>
                  {warning}
                </Text>
              </View>
            ))}
          </GlassCard>
        </Animated.View>
      )}

      {outfit.tips.length > 0 && (
        <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={{ ...styles.tipsCard }}>
            <Text style={[styles.tipsTitle, { color: colors.foreground }]}>💡 코디 팁</Text>
            {outfit.tips.map((tip, index) => (
              <Text key={index} style={[styles.tipText, { color: colors.mutedForeground }]}>
                • {tip}
              </Text>
            ))}
          </GlassCard>
        </Animated.View>
      )}

      <Pressable
        style={[
          styles.saveOutfitButton,
          { backgroundColor: isAlreadySaved ? colors.muted : moduleTheme.body.dark },
          isSaving && styles.saveOutfitButtonDisabled,
        ]}
        onPress={onSave}
        disabled={isSaving}
        testID="save-outfit-button"
        accessibilityRole="button"
        accessibilityLabel={isAlreadySaved ? '저장한 코디 보기' : '코디 저장'}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.card} />
        ) : (
          <>
            <Bookmark
              size={18}
              color={isAlreadySaved ? colors.mutedForeground : colors.card}
              fill={isAlreadySaved ? colors.mutedForeground : 'none'}
            />
            <Text
              style={[
                styles.saveOutfitButtonText,
                { color: isAlreadySaved ? colors.mutedForeground : colors.card },
              ]}
            >
              {isAlreadySaved ? '저장한 코디 보기' : '코디 저장'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
