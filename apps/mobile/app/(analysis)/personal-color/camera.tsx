/**
 * PC-1 퍼스널 컬러 진단 - 카메라 촬영
 */
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';

import { useTheme, typography, radii , spacing } from '@/lib/theme';

export default function PersonalColorCameraScreen() {
  const { colors, brand } = useTheme();
  const { answers } = useLocalSearchParams<{ answers: string }>();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // 권한 체크
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  // 권한 요청 화면
  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>카메라 권한이 필요해요</Text>
        <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>퍼스널 컬러 진단을 위해 얼굴 사진이 필요합니다.</Text>
        <Pressable style={[styles.permissionButton, { backgroundColor: brand.primary }]} onPress={requestPermission}>
          <Text style={[styles.permissionButtonText, { color: brand.primaryForeground }]}>권한 허용하기</Text>
        </Pressable>
        <Pressable style={styles.galleryButton} onPress={pickFromGallery}>
          <Text style={[styles.galleryButtonText, { color: brand.primary }]}>갤러리에서 선택</Text>
        </Pressable>
      </View>
    );
  }

  // 사진 촬영
  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.uri) {
        navigateToResult(photo.uri, photo.base64);
      }
    } catch {
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  // 갤러리에서 선택
  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      navigateToResult(result.assets[0].uri, result.assets[0].base64);
    }
  }

  // 결과 화면으로 이동
  function navigateToResult(imageUri: string, base64?: string | null) {
    router.replace({
      pathname: '/(analysis)/personal-color/result',
      params: {
        imageUri,
        imageBase64: base64 || '',
        answers: answers || '{}',
      },
    });
  }

  // 카메라 전환
  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View testID="analysis-pc-camera-screen" style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} mirror={facing === 'front'}>
        {/* 가이드 오버레이 */}
        <View style={styles.overlay}>
          <View style={styles.guideCircle} />
          <Text style={[styles.guideText, { color: colors.overlayForeground }]}>얼굴이 원 안에 들어오도록{'\n'}정면을 바라봐 주세요</Text>
        </View>

        {/* 하단 컨트롤 */}
        <View style={styles.controls}>
          <Pressable style={styles.galleryIconButton} onPress={pickFromGallery}>
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

          <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
            <Text style={[styles.iconText, { color: colors.overlayForeground }]}>전환</Text>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',  // 카메라 배경 — 항상 검정
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'dashed',
  },
  guideText: {
    marginTop: spacing.lg,
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 40,
    paddingHorizontal: spacing.mlg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  galleryIconButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: typography.size.sm,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.mlg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.smx,
  },
  permissionText: {
    fontSize: typography.size.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.smx,
    marginBottom: spacing.md,
  },
  permissionButtonText: {
    fontSize: typography.size.base,
    fontWeight: '600',
  },
  galleryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  galleryButtonText: {
    fontSize: typography.size.base,
  },
});
