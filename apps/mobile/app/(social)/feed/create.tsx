/**
 * 피드 글 작성 화면
 * 사용자가 직접 피드에 글을 올리는 기능
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, typography} from '@/lib/theme';
import { BottomSheet } from '@/components/ui/BottomSheet';

import { useClerkSupabaseClient } from '../../../lib/supabase';
import type { FeedItemType } from '../../../lib/feed';

const FEED_CATEGORIES: { type: FeedItemType; emoji: string; label: string }[] = [
  { type: 'workout', emoji: '💪', label: '운동' },
  { type: 'nutrition', emoji: '🥗', label: '영양' },
  { type: 'analysis', emoji: '🎨', label: '분석' },
  { type: 'challenge', emoji: '🔥', label: '챌린지' },
];

// 활동 타입 역매핑
const typeToActivity: Record<FeedItemType, string> = {
  workout: 'workout_completed',
  nutrition: 'nutrition_logged',
  analysis: 'analysis_completed',
  challenge: 'challenge_completed',
  badge: 'badge_earned',
};

export default function FeedCreateScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<FeedItemType>('workout');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  const handleOpenCategorySheet = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCategorySheetOpen(true);
  }, []);

  const handleCloseCategorySheet = useCallback((): void => {
    setIsCategorySheetOpen(false);
  }, []);

  const handleCategorySelect = useCallback((type: FeedItemType): void => {
    Haptics.selectionAsync();
    setSelectedType(type);
    setIsCategorySheetOpen(false);
  }, []);

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit || !user?.id) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = await supabase.from('user_activities').insert({
        clerk_user_id: user.id,
        activity_type: typeToActivity[selectedType],
        title: title.trim(),
        description: description.trim() || null,
        metadata: { likes: 0, comments: 0, liked_by: [] },
      });

      if (error) {
        Alert.alert('오류', '글을 올리지 못했어요. 다시 시도해주세요.');
        return;
      }

      Alert.alert('완료', '글이 올라갔어요!');
      router.back();
    } catch {
      Alert.alert('오류', '네트워크 문제가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
      testID="feed-create-screen"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {/* 카테고리 선택 */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: typography.size.sm, fontWeight: typography.weight.semibold }]}>
              카테고리
            </Text>
            <View style={[styles.categoryRow, { marginTop: spacing.sm }]}>
              {FEED_CATEGORIES.map((cat) => {
                const isActive = selectedType === cat.type;
                return (
                  <Pressable
                    key={cat.type}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive ? brand.primary : colors.muted,
                        borderRadius: radii.full,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedType(cat.type);
                    }}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        {
                          color: isActive ? brand.primaryForeground : colors.mutedForeground,
                          fontSize: typography.size.sm,
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 카테고리 바텀 시트에서도 선택 가능 */}
          <Pressable
            onPress={handleOpenCategorySheet}
            testID="feed-category-expand"
          >
            <Text style={{ color: brand.primary, fontSize: typography.size.xs, marginTop: spacing.xs }}>
              전체 카테고리 보기
            </Text>
          </Pressable>

          {/* 제목 */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: typography.size.sm, fontWeight: typography.weight.semibold }]}>
              제목
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderRadius: radii.lg,
                  fontSize: typography.size.base,
                  marginTop: spacing.sm,
                },
              ]}
              placeholder="무슨 이야기를 나눌까요?"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              testID="feed-title-input"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
              {title.length}/100
            </Text>
          </View>

          {/* 설명 */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: typography.size.sm, fontWeight: typography.weight.semibold }]}>
              설명 (선택)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderRadius: radii.lg,
                  fontSize: typography.size.base,
                  marginTop: spacing.sm,
                },
              ]}
              placeholder="자세한 이야기를 적어보세요..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              testID="feed-description-input"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
              {description.length}/500
            </Text>
          </View>
        </ScrollView>

        {/* 하단 제출 버튼 */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: canSubmit ? brand.primary : colors.muted,
                borderRadius: radii.lg,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            testID="feed-submit-button"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={brand.primaryForeground} />
            ) : (
              <Text
                style={[
                  styles.submitText,
                  {
                    color: canSubmit ? brand.primaryForeground : colors.mutedForeground,
                    fontWeight: typography.weight.bold,
                    fontSize: typography.size.base,
                  },
                ]}
              >
                올리기
              </Text>
            )}
          </Pressable>
        </View>
        {/* 카테고리 바텀 시트 */}
        <BottomSheet
          isVisible={isCategorySheetOpen}
          onClose={handleCloseCategorySheet}
          snapPoints={['40%']}
          title="카테고리 선택"
          testID="feed-category-sheet"
        >
          {FEED_CATEGORIES.map((cat) => {
            const isActive = selectedType === cat.type;
            return (
              <Pressable
                key={cat.type}
                style={[
                  styles.sheetOption,
                  {
                    backgroundColor: isActive ? brand.primary : colors.muted,
                    borderRadius: radii.lg,
                  },
                ]}
                onPress={() => handleCategorySelect(cat.type)}
                testID={`sheet-category-${cat.type}`}
              >
                <Text style={styles.sheetOptionEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.sheetOptionLabel,
                    { color: isActive ? brand.primaryForeground : colors.foreground },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </BottomSheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  sectionTitle: { marginBottom: 4 },
  categoryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 4 },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: {},
  input: { padding: 14, height: 48 },
  textArea: { padding: 14, minHeight: 120 },
  charCount: { textAlign: 'right', marginTop: 4 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  submitButton: { padding: 16, alignItems: 'center' },
  submitText: {},
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  sheetOptionEmoji: { fontSize: 20 },
  sheetOptionLabel: { fontSize: 15, fontWeight: typography.weight.medium },
});
