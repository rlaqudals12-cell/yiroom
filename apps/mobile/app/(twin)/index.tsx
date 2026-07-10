/**
 * 내 AI 아바타 만들기 스튜디오 (모바일) — AI 트윈 생성 + 승인 게이트 (ADR-115)
 *
 * @route /(twin)
 * @description
 *   안내(본인 사진·Google AI 전송·상한 고지) → 셀카(+전신) 선택 → 생성 로딩(정직) →
 *   승인 게이트("이게 나 맞나요?"). 승인 전 트윈은 이 화면 밖 어떤 표면에도 노출되지
 *   않는다(pending은 [나] 탭 카드에서 approvedOnly로 걸러짐). 생성·승인 로직 정본은
 *   웹 서버 — 이 화면은 호출+렌더만 한다(ADR-118 thin client). 일 5회 상한은 서버 신뢰.
 *
 * @see docs/adr/ADR-115-ai-twin.md
 * @see apps/web/components/visual-expression/TwinStudio.tsx (웹 대응)
 */

import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Sparkles, Upload, Check, RefreshCw, X, ShieldAlert } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { GlassCard, ScreenContainer } from '@/components/ui';
import {
  generateTwin,
  setTwinStatus,
  notifyTwinChanged,
  TwinApiError,
  type TwinRecord,
} from '@/lib/api/twin';
import { downscaleToDataUrl } from '@/lib/image/downscale';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

type Phase = 'intro' | 'upload' | 'generating' | 'review' | 'error';

const BRAND = '#EC4899';
const PURPLE = '#8B5CF6';

export default function TwinStudioScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { getToken } = useAuth();

  const [phase, setPhase] = useState<Phase>('intro');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // 언마운트 후 setState 방지 가드 (생성/승인이 화면 이탈 후 완료될 수 있음)
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const pickImage = async (kind: 'face' | 'body'): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 선택 권한이 필요해요.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: kind === 'face' ? [1, 1] : [3, 4],
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      // 전송 전 1024px 다운스케일 → data URL (원본 수 MB base64 전송 방지)
      const dataUrl = await downscaleToDataUrl(result.assets[0].uri);
      if (!mountedRef.current) return;
      if (kind === 'face') setFaceImage(dataUrl);
      else setBodyImage(dataUrl);
    } catch {
      Alert.alert('사진 불러오기 실패', '다른 사진을 선택해 주세요.');
    }
  };

  // 승인 전 트윈을 id로 정리 — 실패해도 흐름 진행(예산/노출 방지용 best-effort)
  const rejectTwinById = async (id: string): Promise<void> => {
    try {
      const token = await getToken();
      if (token) await setTwinStatus(id, 'reject', token);
    } catch {
      /* 정리 실패는 무시 — 사용자 흐름 우선 */
    }
  };

  // 승인 전 트윈 정리(다시 만들기/그만두기)
  const rejectCurrent = async (): Promise<void> => {
    if (!twin) return;
    await rejectTwinById(twin.id);
  };

  const generate = async (): Promise<void> => {
    if (!faceImage) return;
    setPhase('generating');
    setErrorMsg('');
    try {
      const token = await getToken();
      if (!token) {
        if (!mountedRef.current) return;
        setErrorMsg('로그인 세션이 만료됐어요. 다시 로그인해 주세요.');
        setPhase('error');
        return;
      }
      const rec = await generateTwin(
        { faceImageBase64: faceImage, bodyImageBase64: bodyImage ?? undefined },
        token
      );
      // 생성 중 화면을 벗어났다면: 승인 못 하는 pending 트윈이 서버에 남아 예산만 소모 →
      // 방금 만든 트윈을 정리(reject)하고 종료
      if (!mountedRef.current) {
        void rejectTwinById(rec.id);
        return;
      }
      setTwin(rec);
      setPhase('review');
    } catch (e) {
      if (!mountedRef.current) return;
      setErrorMsg(
        e instanceof TwinApiError
          ? e.message
          : '지금은 AI 아바타를 만들 수 없어요. 잠시 후 다시 시도해 주세요.'
      );
      setPhase('error');
    }
  };

  const approve = async (): Promise<void> => {
    if (!twin) return;
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('오류', '로그인 세션이 만료됐어요. 다시 로그인해 주세요.');
        return;
      }
      await setTwinStatus(twin.id, 'approve', token);
      // [나] 탭 카드가 리마운트 없이 최신 트윈을 반영하도록 알림
      notifyTwinChanged();
      Alert.alert('완료', '내 AI 아바타가 만들어졌어요.');
      router.back();
    } catch (e) {
      Alert.alert('오류', e instanceof TwinApiError ? e.message : '승인에 실패했어요.');
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  // 다시 만들기 = 현재 트윈 거부 + 재생성(일 상한 내)
  const regenerate = async (): Promise<void> => {
    setBusy(true);
    await rejectCurrent();
    if (!mountedRef.current) return;
    setTwin(null);
    setBusy(false);
    await generate();
  };

  // 그만두기 = 현재 트윈 거부 + 뒤로
  const discard = async (): Promise<void> => {
    setBusy(true);
    await rejectCurrent();
    if (mountedRef.current) setBusy(false);
    router.back();
  };

  // ─────────────────────────────── 렌더 ───────────────────────────────

  const renderIntro = (): React.JSX.Element => (
    <GlassCard style={styles.section} testID="twin-intro">
      <View style={styles.noticeRow}>
        <ShieldAlert size={18} color="#F59E0B" />
        <Text style={[styles.noticeText, { color: colors.foreground }]}>
          <Text style={styles.bold}>본인 사진만 사용해 주세요.</Text> 다른 사람의 사진으로 AI
          아바타를 만들 수 없어요.
        </Text>
      </View>
      <View style={styles.noticeRow}>
        <Sparkles size={18} color={PURPLE} />
        <Text style={[styles.noticeText, { color: colors.foreground }]}>
          사진은 Google AI로 전송돼 AI 아바타를 만드는 데 사용돼요.
        </Text>
      </View>
      <View style={styles.noticeRow}>
        <RefreshCw size={18} color={colors.mutedForeground} />
        <Text style={[styles.noticeText, { color: colors.foreground }]}>
          AI 아바타 만들기는 하루에 5번까지 할 수 있어요.
        </Text>
      </View>
      <Pressable
        style={[styles.primaryButton, { backgroundColor: BRAND }]}
        onPress={() => setPhase('upload')}
        testID="twin-intro-continue"
        accessibilityRole="button"
        accessibilityLabel="시작하기"
      >
        <Text style={styles.primaryButtonText}>시작하기</Text>
      </Pressable>
    </GlassCard>
  );

  const renderUploadTile = (
    image: string | null,
    label: string,
    hint: string,
    onPress: () => void,
    testID: string
  ): React.JSX.Element =>
    image ? (
      <Pressable onPress={onPress} style={styles.imagePreview} testID={testID}>
        <Image source={{ uri: image }} style={styles.imagePreviewImg} />
        <View style={styles.reselectBadge}>
          <Text style={styles.reselectText}>다시 선택</Text>
        </View>
      </Pressable>
    ) : (
      <Pressable
        onPress={onPress}
        style={[styles.uploadTile, { borderColor: colors.border }]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Upload size={22} color={colors.mutedForeground} />
        <Text style={[styles.uploadLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>{hint}</Text>
      </Pressable>
    );

  const renderUpload = (): React.JSX.Element => (
    <GlassCard style={styles.section} testID="twin-upload">
      {renderUploadTile(
        faceImage,
        '셀카 올리기 (필수)',
        '얼굴이 잘 보이는 정면 사진',
        () => pickImage('face'),
        'twin-face-tile'
      )}
      <View style={{ height: spacing.sm }} />
      {renderUploadTile(
        bodyImage,
        '전신 사진 올리기 (선택)',
        '있으면 체형을 더 잘 반영해요',
        () => pickImage('body'),
        'twin-body-tile'
      )}
      <Pressable
        style={[styles.primaryButton, { backgroundColor: BRAND, opacity: faceImage ? 1 : 0.5 }]}
        onPress={generate}
        disabled={!faceImage}
        testID="twin-generate-button"
        accessibilityRole="button"
        accessibilityLabel="내 AI 아바타 만들기"
      >
        <Sparkles size={18} color="#fff" />
        <Text style={styles.primaryButtonText}>내 AI 아바타 만들기</Text>
      </Pressable>
    </GlassCard>
  );

  const renderGenerating = (): React.JSX.Element => (
    <View style={styles.centerBox} testID="twin-generating">
      <ActivityIndicator size="large" color={PURPLE} />
      <Text style={[styles.centerTitle, { color: colors.foreground }]}>
        AI 아바타를 만들고 있어요
      </Text>
      <Text style={[styles.centerSubtitle, { color: colors.mutedForeground }]}>
        20~40초 정도 걸려요. 화면을 벗어나지 말고 잠시만 기다려 주세요.
      </Text>
    </View>
  );

  const renderReview = (): React.JSX.Element | null =>
    twin ? (
      <GlassCard style={styles.section} testID="twin-review">
        <View style={styles.resultWrap}>
          <Image source={{ uri: twin.imageUrl }} style={styles.resultImg} resizeMode="contain" />
          <View style={styles.aiBadge} testID="ai-generated-label">
            <Text style={styles.aiBadgeText}>AI 생성</Text>
          </View>
        </View>
        <Text style={[styles.reviewTitle, { color: colors.foreground }]}>이게 나 맞나요?</Text>
        <Text style={[styles.reviewHint, { color: colors.mutedForeground }]}>
          닮은 모습으로 만들어봤어요. 실물과 다를 수 있어요. 마음에 들면 저장해 주세요.
        </Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: BRAND, opacity: busy ? 0.6 : 1 }]}
          onPress={approve}
          disabled={busy}
          testID="twin-approve-button"
          accessibilityRole="button"
          accessibilityLabel="네, 저예요"
        >
          <Check size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>네, 저예요</Text>
        </Pressable>
        <View style={styles.rowButtons}>
          <Pressable
            style={[styles.outlineButton, { borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}
            onPress={regenerate}
            disabled={busy}
            testID="twin-regenerate-button"
            accessibilityRole="button"
            accessibilityLabel="다시 만들기"
          >
            <RefreshCw size={16} color={colors.foreground} />
            <Text style={[styles.outlineButtonText, { color: colors.foreground }]}>
              다시 만들기
            </Text>
          </Pressable>
          <Pressable
            style={[styles.ghostButton, { opacity: busy ? 0.6 : 1 }]}
            onPress={discard}
            disabled={busy}
            testID="twin-discard-button"
            accessibilityRole="button"
            accessibilityLabel="그만두기"
          >
            <X size={16} color={colors.mutedForeground} />
            <Text style={[styles.ghostButtonText, { color: colors.mutedForeground }]}>
              그만두기
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    ) : null;

  const renderError = (): React.JSX.Element => (
    <View style={styles.centerBox} testID="twin-error">
      <Text style={[styles.centerSubtitle, { color: colors.mutedForeground }]}>{errorMsg}</Text>
      <View style={styles.rowButtons}>
        <Pressable
          style={[styles.outlineButton, { borderColor: colors.border }]}
          onPress={() => setPhase('upload')}
          testID="twin-error-retry"
          accessibilityRole="button"
          accessibilityLabel="다시 시도"
        >
          <Text style={[styles.outlineButtonText, { color: colors.foreground }]}>다시 시도</Text>
        </Pressable>
        <Pressable
          style={styles.ghostButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Text style={[styles.ghostButtonText, { color: colors.mutedForeground }]}>닫기</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderPhase = (): React.JSX.Element | null => {
    switch (phase) {
      case 'intro':
        return renderIntro();
      case 'upload':
        return renderUpload();
      case 'generating':
        return renderGenerating();
      case 'review':
        return renderReview();
      case 'error':
        return renderError();
      default:
        return null;
    }
  };

  return (
    <ScreenContainer testID="twin-studio-screen">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>내 AI 아바타 만들기</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            나를 닮은 AI 아바타를 만들어, 옷과 스타일을 입혀볼 수 있어요.
          </Text>
        </View>
        {renderPhase()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.base,
    lineHeight: typography.size.base * typography.lineHeight.normal,
  },
  section: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },
  bold: { fontWeight: '700' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  uploadTile: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  uploadLabel: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: typography.size.xs,
  },
  imagePreview: {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  imagePreviewImg: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  reselectBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  reselectText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  centerTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
  },
  centerSubtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: typography.size.sm * typography.lineHeight.normal,
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
  reviewTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  reviewHint: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    lineHeight: typography.size.xs * typography.lineHeight.normal,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  outlineButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  ghostButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
  },
  ghostButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
});
