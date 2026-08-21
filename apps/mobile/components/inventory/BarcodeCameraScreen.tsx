import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { Camera, Keyboard } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui';
import { useTheme } from '@/lib/theme';

const SCAN_FRAME_SIZE = 260;

interface BarcodeCameraScreenProps {
  hasPermission: boolean;
  isScanning: boolean;
  onRequestPermission: () => void;
  onManual: () => void;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
}

export function BarcodeCameraScreen({
  hasPermission,
  isScanning,
  onRequestPermission,
  onManual,
  onBarcodeScanned,
}: BarcodeCameraScreenProps) {
  const { colors, brand, typography, spacing, radii } = useTheme();

  if (!hasPermission) {
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
            style={[
              styles.permissionTitle,
              { color: colors.foreground, fontWeight: typography.weight.bold },
            ]}
          >
            카메라 권한이 필요해요
          </Text>
          <Text style={[styles.permissionDescription, { color: colors.mutedForeground }]}>
            바코드를 스캔하려면 카메라 접근을 허용해주세요
          </Text>
          <Pressable
            style={[
              styles.permissionButton,
              { backgroundColor: brand.primary, borderRadius: radii.xl },
            ]}
            onPress={onRequestPermission}
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
            onPress={onManual}
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

  return (
    <ScreenContainer
      testID="barcode-scan-screen"
      scrollable={false}
      contentPadding={0}
      edges={['bottom']}
      style={styles.cameraBackground}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={isScanning ? onBarcodeScanned : undefined}
      />
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
              onPress={onManual}
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

const styles = StyleSheet.create({
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  permissionTitle: { fontSize: 18, marginTop: 16 },
  permissionDescription: { fontSize: 14, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  permissionButton: { paddingHorizontal: 24, paddingVertical: 14, marginTop: 20 },
  cameraBackground: { backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: { width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE },
  corner: { position: 'absolute', width: 24, height: 24, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
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
  cameraActions: { flexDirection: 'row', gap: 20 },
  cameraModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  cameraModeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
