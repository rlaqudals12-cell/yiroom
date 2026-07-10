/**
 * 내 AI 아바타 카드 — [나] 탭 진입점 (ADR-115 / ADR-118)
 *
 * 승인(approved)된 트윈이 있으면 썸네일("AI 생성" 라벨)+삭제, 없으면 "만들기" CTA.
 * pending/rejected 트윈은 여기에 절대 표시하지 않는다(useMyTwin이 approvedOnly로 필터).
 * 스튜디오(/(twin))에서 승인하면 notifyTwinChanged로 useMyTwin이 재조회한다.
 */
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Sparkles, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, ActivityIndicator } from 'react-native';

import { GlassCard } from '@/components/ui';
import { useMyTwin } from '@/hooks/useMyTwin';
import { deleteTwin, TwinApiError } from '@/lib/api/twin';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

const PURPLE = '#8B5CF6';

export function MyTwinCard(): React.JSX.Element {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const { approvedTwin, isLoading, refetch } = useMyTwin();
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = (): void => {
    if (!approvedTwin) return;
    Alert.alert(
      '내 AI 아바타를 삭제할까요?',
      'AI 아바타 이미지가 완전히 지워져요. 이 작업은 되돌릴 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleDelete = async (): Promise<void> => {
    if (!approvedTwin) return;
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('오류', '로그인 세션이 만료됐어요.');
        return;
      }
      await deleteTwin(approvedTwin.id, token);
      refetch();
    } catch (e) {
      Alert.alert('오류', e instanceof TwinApiError ? e.message : '삭제에 실패했어요.');
    } finally {
      setDeleting(false);
    }
  };

  const renderBody = (): React.JSX.Element => {
    if (isLoading) {
      return (
        <View style={styles.loadingBox} testID="twin-card-loading">
          <ActivityIndicator color={PURPLE} />
        </View>
      );
    }
    if (approvedTwin) {
      return (
        <View style={styles.approvedBox} testID="twin-approved">
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: approvedTwin.imageUrl }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="내 AI 아바타"
            />
            <View style={styles.aiBadge} testID="ai-generated-label">
              <Text style={styles.aiBadgeText}>AI 생성</Text>
            </View>
          </View>
          <Text style={[styles.caption, { color: colors.mutedForeground }]}>
            옷장 아이템에서 &lsquo;입혀보기&rsquo;로 스타일을 입혀볼 수 있어요.
          </Text>
          <Pressable
            style={[
              styles.deleteButton,
              { borderColor: colors.border, opacity: deleting ? 0.6 : 1 },
            ]}
            onPress={confirmDelete}
            disabled={deleting}
            testID="twin-delete-button"
            accessibilityRole="button"
            accessibilityLabel="내 AI 아바타 삭제"
          >
            <Trash2 size={16} color={colors.destructive} />
            <Text style={[styles.deleteButtonText, { color: colors.destructive }]}>
              {deleting ? '삭제 중...' : '내 AI 아바타 삭제'}
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.emptyBox} testID="twin-empty">
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          나를 닮은 AI 아바타를 만들어, 옷과 스타일을 입혀볼 수 있어요.
        </Text>
        <Pressable
          style={[styles.createButton, { backgroundColor: '#EC4899' }]}
          onPress={() => router.push('/(twin)' as never)}
          testID="create-twin-cta"
          accessibilityRole="button"
          accessibilityLabel="내 AI 아바타 만들기"
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.createButtonText}>내 AI 아바타 만들기</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <GlassCard intensity={20} style={styles.card} testID="my-twin-card">
      <View style={styles.headerRow}>
        <Sparkles size={18} color={PURPLE} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>내 AI 아바타</Text>
      </View>
      {renderBody()}
    </GlassCard>
  );
}

export default MyTwinCard;

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  loadingBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedBox: {
    gap: spacing.sm,
  },
  imageWrap: {
    position: 'relative',
    alignSelf: 'center',
    width: '70%',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  image: {
    width: '100%',
    height: 240,
  },
  aiBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  aiBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  caption: {
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  deleteButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  emptyBox: {
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  createButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: '700',
  },
});
