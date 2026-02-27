/**
 * Posture 자세 분석 - 카메라 촬영
 */
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';

import { useTheme } from '@/lib/theme';

export default function PostureCameraScreen() {
  const { colors, brand } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>카메라 권한이 필요해요</Text>
        <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>자세 분석을 위해 사진이 필요합니다.</Text>
        <Pressable style={[styles.permissionButton, { backgroundColor: brand.primary }]} onPress={requestPermission}>
          <Text style={[styles.permissionButtonText, { color: brand.primaryForeground }]}>권한 허용하기</Text>
        </Pressable>
        <Pressable style={styles.galleryButton} onPress={pickFromGallery}>
          <Text style={[styles.galleryButtonText, { color: brand.primary }]}>갤러리에서 선택</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      if (photo?.uri) {
        navigateToResult(photo.uri, photo.base64);
      }
    } catch {
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      navigateToResult(result.assets[0].uri, result.assets[0].base64);
    }
  }

  function navigateToResult(imageUri: string, base64?: string | null) {
    router.replace({
      pathname: '/(analysis)/posture/result',
      params: { imageUri, imageBase64: base64 || '' },
    });
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View testID="analysis-posture-camera-screen" style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          <View style={styles.guideRect} />
          <Text style={[styles.guideText, { color: colors.overlayForeground }]}>옆모습 전신이 보이도록{'\n'}촬영해 주세요</Text>
        </View>
        <View style={styles.controls}>
          <Pressable style={styles.sideButton} onPress={pickFromGallery}>
            <Text style={[styles.iconText, { color: colors.overlayForeground }]}>갤러리</Text>
          </Pressable>
          <Pressable
            style={[styles.captureButton, { borderColor: colors.overlayForeground }, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color={colors.overlayForeground} />
            ) : (
              <View style={[styles.captureInner, { backgroundColor: colors.overlayForeground }]} />
            )}
          </Pressable>
          <Pressable style={styles.sideButton} onPress={toggleCameraFacing}>
            <Text style={[styles.iconText, { color: colors.overlayForeground }]}>전환</Text>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guideRect: {
    width: 200,
    height: 400,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  guideText: { marginTop: 24, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sideButton: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 14 },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureInner: { width: 56, height: 56, borderRadius: 28 },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionTitle: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  permissionText: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: { fontSize: 16, fontWeight: '600' },
  galleryButton: { paddingHorizontal: 32, paddingVertical: 16 },
  galleryButtonText: { fontSize: 16 },
});
