/**
 * 뷰티 바코드 스캔 화면
 *
 * 바코드로 화장품/뷰티 제품 조회 후
 * 인벤토리에 추가하는 플로우.
 *
 * - 카메라 스캔 (자동)
 * - 바코드 입력 (수동)
 * - 제품 조회 (affiliate_products 테이블)
 * - 인벤토리 추가
 */
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ScanBarcode,
  Search,
  Plus,
  Package,
  AlertCircle,
  Camera,
  Keyboard,
} from 'lucide-react-native';
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { productLogger } from '../../lib/utils/logger';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useInventory } from '@/lib/inventory';
import { isValidBarcode } from '@/lib/nutrition/barcodeService';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, spacing } from '@/lib/theme';

interface BeautyProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  price: number | null;
  barcode: string;
}

type ScanState = 'idle' | 'searching' | 'found' | 'not-found' | 'added' | 'error';
type InputMode = 'camera' | 'manual';

const SCAN_FRAME_SIZE = 260;

export default function BarcodeScanScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status, shadows } = useTheme();
  const supabase = useClerkSupabaseClient();
  const { addItem } = useInventory('beauty');
  const [permission, requestPermission] = useCameraPermissions();

  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [barcode, setBarcode] = useState('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [product, setProduct] = useState<BeautyProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  // 카메라 중복 스캔 방지
  const isScanningRef = useRef(true);

  // 바코드로 제품 조회 (수동 입력 & 카메라 스캔 공용)
  const searchByBarcode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      if (!isValidBarcode(trimmed)) {
        setScanState('error');
        setErrorMsg('유효하지 않은 바코드 형식이에요 (8~14자리 숫자)');
        return;
      }

      setBarcode(trimmed);
      setScanState('searching');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
        // affiliate_products 테이블에서 바코드로 조회
        const { data, error } = await supabase
          .from('affiliate_products')
          .select('id, name, brand, category, image_url, price, barcode')
          .eq('barcode', trimmed)
          .single();

        if (error || !data) {
          setScanState('not-found');
          setProduct(null);
          return;
        }

        setProduct({
          id: data.id,
          name: data.name,
          brand: data.brand,
          category: data.category,
          imageUrl: data.image_url,
          price: data.price,
          barcode: data.barcode,
        });
        setScanState('found');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        productLogger.error('Beauty barcode lookup failed:', err);
        setScanState('error');
        setErrorMsg('조회 중 오류가 발생했어요');
      }
    },
    [supabase]
  );

  // 수동 입력 검색
  const handleSearch = useCallback(() => {
    searchByBarcode(barcode);
  }, [barcode, searchByBarcode]);

  // 카메라 바코드 스캔 콜백
  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      // 중복 스캔 방지
      if (!isScanningRef.current) return;
      isScanningRef.current = false;

      searchByBarcode(result.data);
    },
    [searchByBarcode]
  );

  const handleAddToInventory = useCallback(async () => {
    if (!product) return;

    try {
      await addItem({
        name: product.name,
        brand: product.brand,
        category: 'beauty',
        subCategory: product.category || 'skincare',
        imageUrl: product.imageUrl || '',
        originalImageUrl: null,
        tags: [],
        isFavorite: false,
        useCount: 0,
        lastUsedAt: null,
        expiryDate: null,
        metadata: {
          productType: product.category || 'skincare',
          barcode: product.barcode,
        },
      });
      setScanState('added');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      productLogger.error('Add to inventory failed:', err);
      setScanState('error');
      setErrorMsg('인벤토리 추가에 실패했어요');
    }
  }, [product, addItem]);

  const handleReset = useCallback(() => {
    setBarcode('');
    setProduct(null);
    setScanState('idle');
    setErrorMsg('');
    isScanningRef.current = true;
  }, []);

  // 카메라 모드에서 idle 상태 → 카메라 뷰 렌더
  if (inputMode === 'camera' && scanState === 'idle') {
    // 권한 미부여: 안내 화면
    if (!permission?.granted) {
      return (
        <ScreenContainer
          testID="barcode-scan-screen"
          scrollable={false}
          edges={['bottom']}
          backgroundGradient="beauty"
        >
          <View style={styles.permissionContainer}>
            <Camera size={48} color={brand.primary} />
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginTop: spacing.md,
              }}
            >
              카메라 권한이 필요해요
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                textAlign: 'center',
                marginTop: spacing.xs,
                lineHeight: 20,
              }}
            >
              바코드를 스캔하려면 카메라 접근을 허용해주세요
            </Text>
            <Pressable
              style={[
                styles.permissionButton,
                { backgroundColor: brand.primary, borderRadius: radii.xl },
              ]}
              onPress={requestPermission}
              accessibilityRole="button"
              accessibilityLabel="카메라 권한 허용"
            >
              <Text
                style={{
                  color: brand.primaryForeground,
                  fontWeight: typography.weight.semibold,
                  fontSize: typography.size.sm,
                }}
              >
                권한 허용
              </Text>
            </Pressable>
            <Pressable
              style={{ marginTop: spacing.md }}
              onPress={() => setInputMode('manual')}
              accessibilityRole="button"
              accessibilityLabel="수동 입력으로 전환"
            >
              <Text
                style={{
                  color: brand.primary,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.medium,
                }}
              >
                수동 입력으로 전환
              </Text>
            </Pressable>
          </View>
        </ScreenContainer>
      );
    }

    // 카메라 스캔 화면
    return (
      <ScreenContainer
        testID="barcode-scan-screen"
        scrollable={false}
        contentPadding={0}
        edges={['bottom']}
        style={{ backgroundColor: '#000' }}
      >
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
          }}
          onBarcodeScanned={isScanningRef.current ? handleBarcodeScanned : undefined}
        />

        {/* 스캔 가이드 오버레이 */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL, { borderColor: brand.primary }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: brand.primary }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: brand.primary }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: brand.primary }]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.scanGuideText}>바코드를 프레임 안에 맞춰주세요</Text>
            <View style={styles.cameraActions}>
              <Pressable
                style={styles.cameraModeButton}
                onPress={() => setInputMode('manual')}
                accessibilityRole="button"
                accessibilityLabel="수동 입력으로 전환"
              >
                <Keyboard size={20} color="#FFFFFF" />
                <Text style={styles.cameraModeText}>수동 입력</Text>
              </Pressable>
              <Pressable
                style={styles.cameraModeButton}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="닫기"
              >
                <Text style={styles.cameraModeText}>닫기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="barcode-scan-screen"
      scrollable={false}
      edges={['bottom']}
      backgroundGradient="beauty"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 안내 카드 */}
          <Animated.View
            entering={FadeInUp.duration(TIMING.normal)}
            style={{ marginBottom: spacing.lg }}
          >
            <GlassCard shadowSize="md" style={{ backgroundColor: brand.primary }}>
              <View style={styles.infoRow}>
                <ScanBarcode size={24} color={brand.primaryForeground} />
                <Text
                  style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.bold,
                    color: brand.primaryForeground,
                    marginLeft: spacing.sm,
                  }}
                >
                  뷰티 바코드 스캔
                </Text>
              </View>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: brand.primaryForeground + 'D9',
                  marginTop: spacing.xs,
                  lineHeight: 20,
                }}
              >
                화장품 바코드를 입력하면 제품 정보를 조회하고{'\n'}내 화장대에 추가할 수 있어요
              </Text>
            </GlassCard>
          </Animated.View>

          {/* 모드 전환 토글 */}
          <View
            style={[
              styles.modeToggle,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Pressable
              style={[
                styles.modeButton,
                {
                  borderRadius: radii.lg,
                  backgroundColor: inputMode === 'camera' ? brand.primary : 'transparent',
                },
              ]}
              onPress={() => {
                setInputMode('camera');
                handleReset();
              }}
              accessibilityRole="button"
              accessibilityLabel="카메라 스캔"
              accessibilityState={{ selected: inputMode === 'camera' }}
            >
              <Camera
                size={16}
                color={inputMode === 'camera' ? brand.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: inputMode === 'camera' ? brand.primaryForeground : colors.mutedForeground,
                  marginLeft: spacing.xxs,
                }}
              >
                카메라
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                {
                  borderRadius: radii.lg,
                  backgroundColor: inputMode === 'manual' ? brand.primary : 'transparent',
                },
              ]}
              onPress={() => setInputMode('manual')}
              accessibilityRole="button"
              accessibilityLabel="수동 입력"
              accessibilityState={{ selected: inputMode === 'manual' }}
            >
              <Keyboard
                size={16}
                color={inputMode === 'manual' ? brand.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: inputMode === 'manual' ? brand.primaryForeground : colors.mutedForeground,
                  marginLeft: spacing.xxs,
                }}
              >
                수동 입력
              </Text>
            </Pressable>
          </View>

          {/* 바코드 수동 입력 */}
          <Animated.View
            entering={FadeInUp.delay(80).duration(TIMING.normal)}
            style={{ marginBottom: spacing.lg }}
          >
            <GlassCard shadowSize="md">
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.sm,
                }}
              >
                바코드 번호 입력
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      backgroundColor: colors.secondary,
                      borderRadius: radii.xl,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      fontSize: typography.size.base,
                      color: colors.foreground,
                    },
                  ]}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="8~14자리 바코드 숫자"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={14}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <Pressable
                  style={[
                    styles.searchButton,
                    {
                      backgroundColor: brand.primary,
                      borderRadius: radii.xl,
                      marginLeft: spacing.sm,
                    },
                  ]}
                  onPress={handleSearch}
                  disabled={scanState === 'searching'}
                >
                  {scanState === 'searching' ? (
                    <ActivityIndicator size="small" color={brand.primaryForeground} />
                  ) : (
                    <Search size={20} color={brand.primaryForeground} />
                  )}
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          {/* 검색 결과 */}
          {scanState === 'found' && product && (
            <Animated.View
              entering={FadeInUp.duration(TIMING.normal)}
              style={[
                styles.resultCard,
                shadows.card,
                {
                  backgroundColor: colors.card,
                  borderRadius: radii.xl,
                  borderColor: status.success + '40',
                  padding: spacing.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <View style={styles.productRow}>
                <View
                  style={[
                    styles.productIcon,
                    {
                      backgroundColor: brand.primary + '15',
                      borderRadius: radii.xl,
                    },
                  ]}
                >
                  <Package size={24} color={brand.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                    }}
                  >
                    {product.name}
                  </Text>
                  {product.brand && (
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: colors.mutedForeground,
                        marginTop: spacing.xxs,
                      }}
                    >
                      {product.brand}
                    </Text>
                  )}
                  {product.price != null && (
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        color: colors.mutedForeground,
                        marginTop: spacing.xxs,
                      }}
                    >
                      {product.price.toLocaleString()}원
                    </Text>
                  )}
                </View>
              </View>

              <Pressable
                style={[
                  styles.addButton,
                  {
                    backgroundColor: brand.primary,
                    borderRadius: radii.xl,
                    marginTop: spacing.md,
                  },
                ]}
                onPress={handleAddToInventory}
              >
                <Plus size={18} color={brand.primaryForeground} />
                <Text
                  style={{
                    color: brand.primaryForeground,
                    fontWeight: typography.weight.semibold,
                    fontSize: typography.size.sm,
                    marginLeft: spacing.xs,
                  }}
                >
                  내 화장대에 추가
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* 추가 완료 */}
          {scanState === 'added' && (
            <Animated.View
              entering={FadeInUp.duration(TIMING.normal)}
              style={[
                styles.resultCard,
                shadows.card,
                {
                  backgroundColor: colors.card,
                  borderRadius: radii.xl,
                  borderColor: status.success + '40',
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.sm }}>
                {'\u2705'}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  textAlign: 'center',
                  marginBottom: spacing.xs,
                }}
              >
                화장대에 추가했어요!
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  marginBottom: spacing.md,
                }}
              >
                {product?.name}
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: colors.secondary,
                      borderRadius: radii.xl,
                      flex: 1,
                      marginRight: spacing.sm,
                    },
                  ]}
                  onPress={handleReset}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: typography.weight.semibold,
                      fontSize: typography.size.sm,
                    }}
                  >
                    다른 제품 스캔
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: brand.primary,
                      borderRadius: radii.xl,
                      flex: 1,
                    },
                  ]}
                  onPress={() => router.push('/(inventory)/beauty')}
                >
                  <Text
                    style={{
                      color: brand.primaryForeground,
                      fontWeight: typography.weight.semibold,
                      fontSize: typography.size.sm,
                    }}
                  >
                    화장대 보기
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* 제품 없음 */}
          {scanState === 'not-found' && (
            <Animated.View
              entering={FadeInUp.duration(TIMING.normal)}
              style={[
                styles.center,
                {
                  paddingVertical: spacing.xxl,
                },
              ]}
            >
              <Package size={48} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginTop: spacing.md,
                }}
              >
                제품을 찾을 수 없어요
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  marginTop: spacing.xs,
                }}
              >
                바코드 번호를 확인하거나{'\n'}다른 방법으로 제품을 추가해보세요
              </Text>
              <Pressable
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: brand.primary,
                    borderRadius: radii.xl,
                    marginTop: spacing.md,
                  },
                ]}
                onPress={handleReset}
              >
                <Text
                  style={{
                    color: brand.primaryForeground,
                    fontWeight: typography.weight.semibold,
                    fontSize: typography.size.sm,
                  }}
                >
                  다시 시도
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* 에러 */}
          {scanState === 'error' && (
            <Animated.View
              entering={FadeInUp.duration(TIMING.normal)}
              style={[
                styles.center,
                {
                  paddingVertical: spacing.xl,
                },
              ]}
            >
              <AlertCircle size={40} color={status.error} />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: status.error,
                  textAlign: 'center',
                  marginTop: spacing.sm,
                }}
              >
                {errorMsg}
              </Text>
              <Pressable
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: brand.primary,
                    borderRadius: radii.xl,
                    marginTop: spacing.md,
                  },
                ]}
                onPress={handleReset}
              >
                <Text
                  style={{
                    color: brand.primaryForeground,
                    fontWeight: typography.weight.semibold,
                    fontSize: typography.size.sm,
                  }}
                >
                  다시 시도
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  infoCard: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 모드 전환 토글
  modeToggle: {
    flexDirection: 'row',
    padding: 3,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  // 카메라 권한
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 20,
  },
  // 카메라 오버레이 (항상 dark bg → 색상 하드코딩)
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scanGuideText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  cameraActions: {
    flexDirection: 'row',
    gap: 20,
  },
  cameraModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  cameraModeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 수동 입력
  inputCard: {
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {},
  searchButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    borderWidth: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.smx,
  },
  center: {
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: spacing.smx,
    alignItems: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.smx,
  },
});
