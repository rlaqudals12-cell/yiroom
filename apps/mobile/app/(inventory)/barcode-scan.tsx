/** 바코드 조회 뒤 제품함 또는 화장대에 추가하는 화면. */
import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import type {
  BeautyProduct,
  InputMode,
  ScanState,
} from '@/components/inventory/barcode-scan.types';
import { BarcodeCameraScreen } from '@/components/inventory/BarcodeCameraScreen';
import { BarcodeProductResult } from '@/components/inventory/BarcodeProductResult';
import { BarcodeScanStatus } from '@/components/inventory/BarcodeScanStatus';
import { BarcodeSearchForm } from '@/components/inventory/BarcodeSearchForm';
import { ScreenContainer } from '@/components/ui';
import { useBarcodeShelfAdd } from '@/lib/api/useBarcodeShelfAdd';
import { useInventory } from '@/lib/inventory';
import { isValidBarcode } from '@/lib/nutrition/barcodeService';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { productLogger } from '@/lib/utils/logger';

export default function BarcodeScanScreen(): React.JSX.Element {
  const { spacing } = useTheme();
  const { addBarcodeProduct, isAdding: isAddingToShelf } = useBarcodeShelfAdd();
  const supabase = useClerkSupabaseClient();
  const { addItem } = useInventory('beauty');
  const [permission, requestPermission] = useCameraPermissions();
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [barcode, setBarcode] = useState('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [product, setProduct] = useState<BeautyProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const isScanningRef = useRef(true);

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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      try {
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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        productLogger.error('Beauty barcode lookup failed:', error);
        setScanState('error');
        setErrorMsg('조회 중 오류가 발생했어요');
      }
    },
    [supabase]
  );

  const handleSearch = useCallback(() => {
    void searchByBarcode(barcode);
  }, [barcode, searchByBarcode]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!isScanningRef.current) return;
      isScanningRef.current = false;
      void searchByBarcode(result.data);
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      productLogger.error('Add to inventory failed:', error);
      setScanState('error');
      setErrorMsg('화장대에 추가하지 못했어요');
    }
  }, [product, addItem]);

  const handleAddToShelf = useCallback(async () => {
    if (!product || isAddingToShelf) return;
    try {
      const added = await addBarcodeProduct(product);
      if (!added) return;
      setScanState('shelf-added');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      productLogger.error('Add to product shelf failed:', error);
      setScanState('error');
      setErrorMsg('제품함에 추가하지 못했어요');
    }
  }, [addBarcodeProduct, isAddingToShelf, product]);

  const handleReset = useCallback(() => {
    setBarcode('');
    setProduct(null);
    setScanState('idle');
    setErrorMsg('');
    isScanningRef.current = true;
  }, []);

  if (inputMode === 'camera' && scanState === 'idle') {
    return (
      <BarcodeCameraScreen
        hasPermission={permission?.granted ?? false}
        isScanning={isScanningRef.current}
        onRequestPermission={() => void requestPermission()}
        onManual={() => setInputMode('manual')}
        onBarcodeScanned={handleBarcodeScanned}
      />
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
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <BarcodeSearchForm
            inputMode={inputMode}
            barcode={barcode}
            scanState={scanState}
            onBarcodeChange={setBarcode}
            onSearch={handleSearch}
            onCamera={() => {
              setInputMode('camera');
              handleReset();
            }}
            onManual={() => setInputMode('manual')}
          />
          {scanState === 'found' && product && (
            <BarcodeProductResult
              product={product}
              isAddingToShelf={isAddingToShelf}
              onAddToShelf={() => void handleAddToShelf()}
              onAddToInventory={() => void handleAddToInventory()}
            />
          )}
          <BarcodeScanStatus
            scanState={scanState}
            productName={product?.name}
            errorMessage={errorMsg}
            onReset={handleReset}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
