/**
 * 내 AI 아바타에게 입혀보기 — 옷장 아이템 진입점 (ADR-115 / ADR-118)
 *
 * 승인된 트윈이 있고 아이템 이미지 URL이 http(s)일 때만 노출한다(트윈 없음/이미지 없음이면
 * 아무것도 렌더하지 않음 — 죽은 버튼 금지). 착장 합성 정본은 웹 서버(composeOnTwin) —
 * 이 컴포넌트는 호출+결과 렌더만. 결과 이미지에는 "AI 생성" 라벨을 상시 노출한다. 일 5회
 * 상한/미승인은 서버가 검증하며, 그 메시지를 정직하게 표시한다(클라 상한 중복 없음).
 */
import { useAuth } from '@clerk/clerk-expo';
import { Shirt, Sparkles, X } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, ActivityIndicator } from 'react-native';

import { useMyTwin } from '@/hooks/useMyTwin';
import { composeOnTwin, TwinApiError } from '@/lib/api/twin';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

interface TwinTryonButtonProps {
  /** 옷장 아이템 이미지 URL (http/https만 합성 가능) */
  garmentImageUrl: string | null | undefined;
}

const PURPLE = '#8B5CF6';

function isHttpUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\//.test(url);
}

export function TwinTryonButton({
  garmentImageUrl,
}: TwinTryonButtonProps): React.JSX.Element | null {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const { approvedTwin } = useMyTwin();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 트윈 없음 또는 합성 불가 이미지 → 진입점 자체를 노출하지 않음
  if (!approvedTwin || !isHttpUrl(garmentImageUrl)) return null;

  const run = async (): Promise<void> => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('로그인 세션이 만료됐어요. 다시 로그인해 주세요.');
        return;
      }
      const out = await composeOnTwin(approvedTwin.id, garmentImageUrl, token);
      setResultUrl(out.imageUrl);
    } catch (e) {
      setError(
        e instanceof TwinApiError
          ? e.message
          : '지금은 입혀볼 수 없어요. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pressable
        style={[styles.tryonButton, { borderColor: PURPLE }]}
        onPress={run}
        testID="twin-tryon-button"
        accessibilityRole="button"
        accessibilityLabel="내 AI 아바타에게 입혀보기"
      >
        <Shirt size={18} color={PURPLE} />
        <Text style={[styles.tryonButtonText, { color: PURPLE }]}>내 AI 아바타에게 입혀보기</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]} testID="twin-tryon-sheet">
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Sparkles size={18} color={PURPLE} />
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>입혀보기</Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                hitSlop={8}
              >
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {loading && (
              <View style={styles.centerBox} testID="twin-tryon-loading">
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={[styles.centerText, { color: colors.mutedForeground }]}>
                  아바타에 옷을 입히는 중이에요. 20~40초 정도 걸려요.
                </Text>
              </View>
            )}

            {!loading && error && (
              <View style={styles.centerBox} testID="twin-tryon-error">
                <Text style={[styles.centerText, { color: colors.mutedForeground }]}>{error}</Text>
                <Pressable
                  style={[styles.retryButton, { borderColor: colors.border }]}
                  onPress={run}
                  accessibilityRole="button"
                  accessibilityLabel="다시 시도"
                >
                  <Text style={[styles.retryButtonText, { color: colors.foreground }]}>
                    다시 시도
                  </Text>
                </Pressable>
              </View>
            )}

            {!loading && resultUrl && (
              <View testID="twin-tryon-result">
                <View style={styles.resultWrap}>
                  <Image
                    source={{ uri: resultUrl }}
                    style={styles.resultImg}
                    resizeMode="contain"
                  />
                  <View style={styles.aiBadge} testID="ai-generated-label">
                    <Text style={styles.aiBadgeText}>AI 생성</Text>
                  </View>
                </View>
                <Text style={[styles.caption, { color: colors.mutedForeground }]}>
                  AI로 생성된 이미지예요. 실물과 다를 수 있어요.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

export default TwinTryonButton;

const styles = StyleSheet.create({
  tryonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingVertical: 14,
  },
  tryonButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  centerText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  resultWrap: {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  resultImg: {
    width: '100%',
    height: 360,
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
    marginTop: spacing.sm,
  },
});
