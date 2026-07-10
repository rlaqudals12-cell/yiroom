/**
 * 성분 스캔 화면 (ADR-112) — "나와의 적합도"
 *
 * @description
 *   제품 성분표를 촬영하거나 갤러리에서 선택 → 온디바이스 OCR(analyzeIngredientImage)로
 *   전성분 추출 → buildScanVerdict 4레이어 조립 → ScanVerdict 렌더.
 *
 *   정직성:
 *   - 성분표를 못 읽으면(추출 실패/성분 0개) 지어내지 않고 정직 안내 + 재시도를 보여준다.
 *   - 피부 프로필이 없으면 buildScanVerdict가 hasUserAnalysis.skinAnalysis=false를 반환하고,
 *     ScanVerdict가 점수 대신 분석 CTA로 게이팅한다.
 *   - OCR 신뢰도는 ScanVerdict의 ocrConfidence 배지로 그대로 전달한다(입력 품질 고지).
 *
 *   인벤토리 바코드 스캔((inventory))과 별개 — 이 화면은 "성분표 → 적합도 컨설팅"이다.
 */
import { useUser } from '@clerk/clerk-expo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera as CameraIcon, ImageUp, ScanLine, AlertTriangle, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanVerdict } from '@/components/scan';
import { ScreenContainer } from '@/components/ui';
import { downscaleToBase64 } from '@/lib/image/downscale';
import { analyzeIngredientImage, type OcrResult } from '@/lib/scan/ingredient-ocr';
import { buildScanVerdict, fetchScanUserAnalysis, type ScanVerdictData } from '@/lib/scan/verdict';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

type Phase = 'capture' | 'camera' | 'analyzing' | 'result' | 'error';

export default function ScanScreen(): React.JSX.Element {
  const { colors, brand } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>('capture');
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [verdict, setVerdict] = useState<ScanVerdictData | null>(null);
  const [capturing, setCapturing] = useState(false);

  const userId = user?.id;

  // 언마운트 후 setState 방지 가드 (비동기 핸들러가 화면 이탈 후 완료될 수 있음)
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // OCR → 판정 파이프라인. 성분을 못 읽으면 정직 안내(지어내지 않음).
  const runAnalysis = useCallback(
    async (base64: string) => {
      setPhase('analyzing');
      try {
        const ocrResult = await analyzeIngredientImage(base64);
        if (!mountedRef.current) return;

        // 추출 실패 또는 성분 0개 → 정직하게 재촬영 안내 (모의 성분으로 판정하지 않음)
        if (!ocrResult.success || ocrResult.ingredients.length === 0) {
          setOcr(null);
          setPhase('error');
          return;
        }

        // 사용자 5축 프로필 조회 (실패해도 판정은 진행 — 프로필 없으면 CTA 게이팅)
        let userAnalysis = {};
        try {
          if (userId) userAnalysis = await fetchScanUserAnalysis(supabase, userId);
        } catch (e) {
          console.error('[scan] 프로필 조회 실패:', e);
        }

        const v = await buildScanVerdict({
          ingredients: ocrResult.ingredients,
          userAnalysis,
          supabase,
        });
        if (!mountedRef.current) return;

        setOcr(ocrResult);
        setVerdict(v);
        setPhase('result');
      } catch (e) {
        console.error('[scan] 판정 실패:', e);
        if (!mountedRef.current) return;
        setOcr(null);
        setPhase('error');
      }
    },
    [supabase, userId]
  );

  // 카메라 열기 (권한 확인 후). 영구 거부 시 설정 앱으로 안내.
  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        // 영구 거부(다시 물어볼 수 없음) → 시스템 설정으로 유도
        if (!res.canAskAgain) {
          Alert.alert(
            '카메라 권한이 필요해요',
            '성분표를 촬영하려면 설정에서 카메라 권한을 허용해 주세요.',
            [
              { text: '취소', style: 'cancel' },
              { text: '설정 열기', onPress: () => void Linking.openSettings() },
            ]
          );
        }
        return;
      }
    }
    setPhase('camera');
  }, [permission?.granted, requestPermission]);

  // 카메라 촬영 (전송 전 1024px 다운스케일)
  const takePicture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        const base64 = await downscaleToBase64(photo.uri);
        if (!mountedRef.current) return;
        if (base64) {
          await runAnalysis(base64);
        } else {
          setPhase('error');
        }
      } else if (mountedRef.current) {
        setPhase('error');
      }
    } catch (e) {
      console.error('[scan] 촬영 실패:', e);
      if (mountedRef.current) setPhase('error');
    } finally {
      if (mountedRef.current) setCapturing(false);
    }
  }, [capturing, runAnalysis]);

  // 갤러리에서 선택 (전송 전 1024px 다운스케일)
  const pickFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const base64 = await downscaleToBase64(result.assets[0].uri);
      if (!mountedRef.current) return;
      if (base64) await runAnalysis(base64);
    }
  }, [runAnalysis]);

  const reset = useCallback(() => {
    setOcr(null);
    setVerdict(null);
    setPhase('capture');
  }, []);

  // ── 카메라 뷰 (전체 화면) ───────────────────────────────
  if (phase === 'camera') {
    return (
      <SafeAreaView testID="scan-camera-view" style={styles.cameraContainer} edges={['bottom']}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.guideFrame} />
            <Text style={styles.guideText}>제품 뒷면의 전성분표를{'\n'}사각형 안에 맞춰주세요</Text>
          </View>

          <View style={styles.cameraControls}>
            <Pressable
              testID="scan-camera-cancel"
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel="촬영 취소"
              style={styles.cameraIconButton}
            >
              <X size={26} color="#FFFFFF" />
            </Pressable>

            <Pressable
              testID="scan-capture-button"
              onPress={takePicture}
              disabled={capturing}
              accessibilityRole="button"
              accessibilityLabel="성분표 촬영"
              style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
            >
              {capturing ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </Pressable>

            <View style={styles.cameraIconButton} />
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  // ── 분석 중 ─────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <ScreenContainer testID="scan-screen" backgroundGradient="beauty">
        <View testID="scan-analyzing" style={styles.centered}>
          <ActivityIndicator size="large" color={brand.primary} />
          <Text style={[styles.analyzingText, { color: colors.foreground }]}>
            성분을 읽고 나와의 적합도를 분석하고 있어요...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── 결과 (판정) ─────────────────────────────────────────
  if (phase === 'result' && verdict && ocr) {
    return (
      <ScreenContainer
        testID="scan-screen"
        backgroundGradient="beauty"
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <ScanVerdict
          verdict={verdict}
          ingredients={ocr.ingredients}
          productName={ocr.productName}
          brandName={ocr.brandName}
          ocrConfidence={ocr.confidence}
          onRescan={reset}
        />
      </ScreenContainer>
    );
  }

  // ── 오류 (성분을 못 읽음) — 정직 안내 + 재시도 ──────────
  if (phase === 'error') {
    return (
      <ScreenContainer testID="scan-screen" backgroundGradient="beauty">
        <View testID="scan-error" style={styles.centered}>
          <View style={[styles.errorIcon, { backgroundColor: `${brand.primary}18` }]}>
            <AlertTriangle size={28} color={brand.primary} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            성분표가 잘 안 읽혔어요
          </Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
            더 밝은 곳에서 전성분표가 선명하게 보이도록 정면으로 다시 찍어주세요.
          </Text>
          <Pressable
            testID="scan-error-retry"
            onPress={reset}
            accessibilityRole="button"
            accessibilityLabel="다시 스캔하기"
            style={[styles.primaryButton, { backgroundColor: brand.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: brand.primaryForeground }]}>
              다시 스캔하기
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ── 시작 화면 (촬영/선택) ───────────────────────────────
  return (
    <ScreenContainer testID="scan-screen" backgroundGradient="beauty">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.captureContent}
      >
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${brand.primary}18` }]}>
            <ScanLine size={28} color={brand.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            성분 스캔 — 나와의 적합도
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            제품 전성분표를 찍으면 내 피부 프로필 기준으로 적합도와 성분 정보를 알려드려요.
          </Text>
        </View>

        <View
          style={[styles.guideCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.guideCardTitle, { color: colors.foreground }]}>촬영 팁</Text>
          <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
            • 밝은 곳에서 전성분표를 정면으로 찍어주세요
          </Text>
          <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
            • 글씨가 흐리면 정확도가 낮아질 수 있어요
          </Text>
          <Text style={[styles.guideItem, { color: colors.mutedForeground }]}>
            • 판정은 정보 제공용이며 의학적 조언이 아니에요
          </Text>
        </View>

        <Pressable
          testID="scan-open-camera"
          onPress={openCamera}
          accessibilityRole="button"
          accessibilityLabel="카메라로 성분표 촬영"
          style={[styles.primaryButton, { backgroundColor: brand.primary }]}
        >
          <CameraIcon size={20} color={brand.primaryForeground} />
          <Text style={[styles.primaryButtonText, { color: brand.primaryForeground }]}>
            카메라로 촬영
          </Text>
        </Pressable>

        <Pressable
          testID="scan-pick-gallery"
          onPress={pickFromGallery}
          accessibilityRole="button"
          accessibilityLabel="갤러리에서 성분표 이미지 선택"
          style={[styles.secondaryButton, { borderColor: colors.border }]}
        >
          <ImageUp size={20} color={colors.foreground} />
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
            갤러리에서 선택
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  captureContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  guideCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  guideCardTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  guideItem: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  analyzingText: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  // 카메라
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFrame: {
    width: 280,
    height: 200,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#FFFFFF',
    marginTop: spacing.lg,
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 40,
    paddingHorizontal: spacing.mlg,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraIconButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
});
