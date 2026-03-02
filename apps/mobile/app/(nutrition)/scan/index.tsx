/**
 * N-1 바코드 스캔 화면
 * 카메라로 바코드 스캔 → OpenFoodFacts 조회 → 결과 표시 → 식사 기록 저장
 */
import { useUser } from '@clerk/clerk-expo';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { ScreenContainer, SuccessCheckmark } from '@/components/ui';
import { useTheme, spacing, radii, typography } from '@/lib/theme';

import {
  lookupBarcode,
  recordBarcodeFood,
  calculateNutrition,
  getSourceLabel,
  type BarcodeFood,
} from '../../../lib/nutrition/barcodeService';
import { useClerkSupabaseClient } from '../../../lib/supabase';
import { nutritionLogger } from '../../../lib/utils/logger';

// 식사 타입
const MEAL_TYPES = [
  { id: 'breakfast', label: '아침', icon: '🍳' },
  { id: 'lunch', label: '점심', icon: '🍱' },
  { id: 'dinner', label: '저녁', icon: '🍝' },
  { id: 'snack', label: '간식', icon: '🍪' },
] as const;

type ScreenState = 'scanning' | 'loading' | 'result' | 'not-found';

export default function BarcodeScanScreen() {
  const { colors, status, module: moduleColors, typography, spacing, radii} = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [permission, requestPermission] = useCameraPermissions();

  const [screenState, setScreenState] = useState<ScreenState>('scanning');
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [food, setFood] = useState<BarcodeFood | null>(null);
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      // 중복 스캔 방지
      if (!isScanning || screenState !== 'scanning') return;
      setIsScanning(false);

      const barcode = result.data;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setScannedBarcode(barcode);
      setScreenState('loading');

      try {
        const lookupResult = await lookupBarcode(barcode, supabase);

        if (lookupResult.found && lookupResult.food) {
          setFood(lookupResult.food);
          setScreenState('result');
        } else {
          setScreenState('not-found');
        }
      } catch (error) {
        nutritionLogger.error('바코드 조회 실패', error);
        setScreenState('not-found');
      }
    },
    [isScanning, screenState, supabase]
  );

  const handleSave = async () => {
    if (!food || !user?.id) return;

    setIsSaving(true);
    try {
      const result = await recordBarcodeFood(supabase, food, servings, mealType);

      if (result.success) {
        setShowSuccess(true);
      } else {
        Alert.alert('오류', result.error || '저장에 실패했어요');
      }
    } catch {
      Alert.alert('오류', '저장에 실패했어요');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    setScreenState('scanning');
    setScannedBarcode('');
    setFood(null);
    setServings(1);
    setIsScanning(true);
  };

  const adjustServings = (delta: number) => {
    Haptics.selectionAsync();
    setServings((prev) => Math.max(0.5, Math.min(10, prev + delta)));
  };

  // 카메라 권한 없음
  if (!permission?.granted) {
    return (
      <ScreenContainer
        scrollable={false}
        contentPadding={0}
        style={{ backgroundColor: colors.background }}
        testID="barcode-scan-screen"
      >
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
            카메라 권한이 필요해요
          </Text>
          <Text style={[styles.permissionDesc, { color: colors.mutedForeground }]}>
            바코드를 스캔하려면 카메라 접근을 허용해주세요
          </Text>
          <Pressable
            style={[styles.permissionButton, { backgroundColor: moduleColors.nutrition.base }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.overlayForeground }]}>
              권한 허용
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // 로딩 상태
  if (screenState === 'loading') {
    return (
      <ScreenContainer
        scrollable={false}
        contentPadding={0}
        style={{ backgroundColor: colors.background }}
        testID="barcode-scan-screen"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={moduleColors.nutrition.base} />
          <Text style={[styles.loadingText, { color: colors.foreground }]}>
            식품 정보를 조회하고 있어요...
          </Text>
          <Text style={[styles.barcodeText, { color: colors.mutedForeground }]}>
            {scannedBarcode}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // 미등록 바코드
  if (screenState === 'not-found') {
    return (
      <ScreenContainer
        scrollable={false}
        contentPadding={0}
        style={{ backgroundColor: colors.background }}
        testID="barcode-scan-screen"
      >
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundEmoji}>🔍</Text>
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>
            등록되지 않은 제품이에요
          </Text>
          <Text style={[styles.notFoundBarcode, { color: colors.mutedForeground }]}>
            바코드: {scannedBarcode}
          </Text>
          <Text style={[styles.notFoundDesc, { color: colors.mutedForeground }]}>
            아직 데이터베이스에 없는 제품이에요.{'\n'}
            직접 검색하거나 다시 스캔해보세요.
          </Text>
          <View style={styles.notFoundButtons}>
            <Pressable
              style={[styles.retryButton, { backgroundColor: moduleColors.nutrition.base }]}
              onPress={handleRetry}
            >
              <Text style={[styles.retryButtonText, { color: colors.overlayForeground }]}>
                다시 스캔
              </Text>
            </Pressable>
            <Pressable
              style={[styles.searchButton, { borderColor: colors.border }]}
              onPress={() => router.replace('/(nutrition)/search')}
            >
              <Text style={[styles.searchButtonText, { color: colors.foreground }]}>
                직접 검색
              </Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // 결과 화면
  if (screenState === 'result' && food) {
    const nutrition = calculateNutrition(food, servings);

    return (
      <ScreenContainer
        scrollable={false}
        contentPadding={0}
        style={{ backgroundColor: colors.background }}
        edges={['bottom']}
        testID="barcode-scan-screen"
      >
        <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
          {/* 제품 정보 */}
          <View style={[styles.productCard, { backgroundColor: colors.card }]}>
            {food.imageUrl && (
              <Image source={{ uri: food.imageUrl }} style={styles.productImage} />
            )}
            <Text style={[styles.productName, { color: colors.foreground }]}>{food.name}</Text>
            {food.brand && (
              <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>
                {food.brand}
              </Text>
            )}
            <Text style={[styles.sourceLabel, { color: colors.mutedForeground }]}>
              출처: {getSourceLabel(food.source)}
            </Text>
          </View>

          {/* 영양 정보 */}
          <View style={[styles.nutritionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>영양 정보</Text>
            <Text style={[styles.servingNote, { color: colors.mutedForeground }]}>
              {food.servingSize}{food.servingUnit} 기준 × {servings}인분
            </Text>

            <View style={styles.macroGrid}>
              <View style={[styles.macroItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.macroValue, { color: moduleColors.nutrition.dark }]}>
                  {nutrition.calories}
                </Text>
                <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>kcal</Text>
              </View>
              <View style={[styles.macroItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.macroValue, { color: status.info }]}>
                  {nutrition.protein}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>단백질</Text>
              </View>
              <View style={[styles.macroItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.macroValue, { color: status.warning }]}>
                  {nutrition.carbs}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>탄수화물</Text>
              </View>
              <View style={[styles.macroItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.macroValue, { color: status.error }]}>
                  {nutrition.fat}g
                </Text>
                <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>지방</Text>
              </View>
            </View>
          </View>

          {/* 섭취량 */}
          <View style={[styles.servingCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>섭취량</Text>
            <View style={styles.servingControls}>
              <Pressable
                style={[styles.servingButton, { backgroundColor: colors.background }]}
                onPress={() => adjustServings(-0.5)}
              >
                <Text style={[styles.servingButtonText, { color: colors.foreground }]}>−</Text>
              </Pressable>
              <Text style={[styles.servingValue, { color: colors.foreground }]}>
                {servings}인분
              </Text>
              <Pressable
                style={[styles.servingButton, { backgroundColor: colors.background }]}
                onPress={() => adjustServings(0.5)}
              >
                <Text style={[styles.servingButtonText, { color: colors.foreground }]}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* 식사 타입 */}
          <View style={[styles.mealTypeCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>식사 유형</Text>
            <View style={styles.mealTypeGrid}>
              {MEAL_TYPES.map((mt) => {
                const isSelected = mealType === mt.id;
                return (
                  <Pressable
                    key={mt.id}
                    style={[
                      styles.mealTypeChip,
                      {
                        backgroundColor: isSelected
                          ? moduleColors.nutrition.base
                          : colors.background,
                        borderColor: isSelected
                          ? moduleColors.nutrition.base
                          : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMealType(mt.id);
                    }}
                  >
                    <Text style={styles.mealTypeIcon}>{mt.icon}</Text>
                    <Text
                      style={[
                        styles.mealTypeLabel,
                        { color: isSelected ? colors.overlayForeground : colors.foreground },
                      ]}
                    >
                      {mt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.rescanButton, { borderColor: colors.border }]}
            onPress={handleRetry}
          >
            <Text style={[styles.rescanButtonText, { color: colors.foreground }]}>다시 스캔</Text>
          </Pressable>
          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: moduleColors.nutrition.base },
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.overlayForeground} />
            ) : (
              <Text style={[styles.saveButtonText, { color: colors.overlayForeground }]}>
                기록하기
              </Text>
            )}
          </Pressable>
        </View>

        {/* 저장 완료 애니메이션 */}
        {showSuccess && (
          <View style={styles.successOverlay}>
            <SuccessCheckmark visible size={80} onComplete={() => router.back()} />
          </View>
        )}
      </ScreenContainer>
    );
  }

  // 스캔 화면 (기본)
  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      style={{ backgroundColor: '#000' }}
      edges={['bottom']}
      testID="barcode-scan-screen"
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* 스캔 가이드 오버레이 */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL, { borderColor: status.success }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: status.success }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: status.success }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: status.success }]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.scanGuideText}>바코드를 프레임 안에 맞춰주세요</Text>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const SCAN_FRAME_SIZE = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 권한 요청
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  permissionDesc: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radii.smx,
  },
  permissionButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  // 로딩
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.size.base,
    marginTop: spacing.md,
  },
  barcodeText: {
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
    fontFamily: 'monospace',
  },
  // 스캔 오버레이 (항상 dark bg → 색상 하드코딩 유지)
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
    height: SCAN_FRAME_SIZE * 0.6,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'transparent',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  scanGuideText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  cancelButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.smx,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
  },
  // 미등록
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notFoundEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  notFoundTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  notFoundBarcode: {
    fontSize: typography.size.sm,
    fontFamily: 'monospace',
    marginBottom: spacing.md,
  },
  notFoundDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  notFoundButtons: {
    gap: spacing.smx,
    width: '100%',
  },
  retryButton: {
    borderRadius: radii.smx,
    padding: spacing.md,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  searchButton: {
    borderRadius: radii.smx,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  searchButtonText: {
    fontSize: typography.size.base,
  },
  // 결과 화면
  resultScroll: {
    flex: 1,
    padding: spacing.md,
  },
  productCard: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: radii.smx,
    marginBottom: spacing.smx,
  },
  productName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  productBrand: {
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
  sourceLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing.sm,
  },
  // 영양 정보
  nutritionCard: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
    marginBottom: spacing.smx,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  servingNote: {
    fontSize: 13,
    marginBottom: spacing.smx,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroItem: {
    flex: 1,
    borderRadius: radii.smx,
    padding: spacing.smx,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  macroLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
  },
  // 섭취량
  servingCard: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
    marginBottom: spacing.smx,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  servingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingButtonText: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
  },
  servingValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    minWidth: 80,
    textAlign: 'center',
  },
  // 식사 타입
  mealTypeCard: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
    marginBottom: spacing.mlg,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: spacing.smx,
    borderRadius: radii.smx,
    borderWidth: 1,
    alignItems: 'center',
  },
  mealTypeIcon: {
    fontSize: typography.size.xl,
    marginBottom: spacing.xs,
  },
  mealTypeLabel: {
    fontSize: 13,
    fontWeight: typography.weight.medium,
  },
  // 하단
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.smx,
  },
  rescanButton: {
    flex: 1,
    borderRadius: radii.smx,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  rescanButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  saveButton: {
    flex: 2,
    borderRadius: radii.smx,
    padding: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});
