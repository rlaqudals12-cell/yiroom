/**
 * 뷰티 바코드 스캔 화면
 *
 * 바코드로 화장품/뷰티 제품 조회 후
 * 인벤토리에 추가하는 플로우.
 *
 * - 바코드 입력 (수동)
 * - 제품 조회 (affiliate_products 테이블)
 * - 인벤토리 추가
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ScanBarcode, Search, Plus, Package, AlertCircle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
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

import { ScreenContainer } from '@/components/ui';
import { useTheme, typography, spacing } from '@/lib/theme';
import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useInventory } from '@/lib/inventory';
import { isValidBarcode } from '@/lib/nutrition/barcodeService';
import { productLogger } from '../../lib/utils/logger';

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

export default function BarcodeScanScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status, shadows } = useTheme();
  const supabase = useClerkSupabaseClient();
  const { addItem } = useInventory('beauty');

  const [barcode, setBarcode] = useState('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [product, setProduct] = useState<BeautyProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = useCallback(async () => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    if (!isValidBarcode(trimmed)) {
      setScanState('error');
      setErrorMsg('유효하지 않은 바코드 형식이에요 (8~14자리 숫자)');
      return;
    }

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
  }, [barcode, supabase]);

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
  }, []);

  return (
    <ScreenContainer
      testID="barcode-scan-screen"
      scrollable={false}
      edges={['bottom']}
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
            style={[
              styles.infoCard,
              shadows.card,
              {
                backgroundColor: brand.primary,
                borderRadius: radii.xl,
                padding: spacing.lg,
                marginBottom: spacing.lg,
              },
            ]}
          >
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
              화장품 바코드를 입력하면 제품 정보를 조회하고{'\n'}
              내 화장대에 추가할 수 있어요
            </Text>
          </Animated.View>

          {/* 바코드 입력 */}
          <Animated.View
            entering={FadeInUp.delay(80).duration(TIMING.normal)}
            style={[
              styles.inputCard,
              shadows.card,
              {
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                borderColor: colors.border,
                padding: spacing.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
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
