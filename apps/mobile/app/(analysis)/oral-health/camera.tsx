/**
 * OH-1 구강건강 분석 - 카메라 촬영
 */
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

export default function OralHealthCameraScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2e5afa" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>카메라 권한이 필요해요</Text>
        <Text style={styles.permissionText}>구강건강 분석을 위해 사진이 필요합니다.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <Text style={styles.galleryButtonText}>갤러리에서 선택</Text>
        </TouchableOpacity>
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
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      navigateToResult(result.assets[0].uri, result.assets[0].base64);
    }
  }

  function navigateToResult(imageUri: string, base64?: string | null) {
    router.replace({
      pathname: '/(analysis)/oral-health/result',
      params: { imageUri, imageBase64: base64 || '' },
    });
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View testID="analysis-oral-health-camera-screen" style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          <View style={styles.guideRect} />
          <Text style={styles.guideText}>치아와 잇몸이 잘 보이도록{'\n'}입을 벌리고 촬영해 주세요</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideButton} onPress={pickFromGallery}>
            <Text style={styles.iconText}>갤러리</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideButton} onPress={toggleCameraFacing}>
            <Text style={styles.iconText}>전환</Text>
          </TouchableOpacity>
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
    width: 300,
    height: 220,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  guideText: { marginTop: 24, color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sideButton: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#fff', fontSize: 14 },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionTitle: { fontSize: 22, fontWeight: '600', color: '#111', marginBottom: 12 },
  permissionText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  permissionButton: {
    backgroundColor: '#2e5afa',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  galleryButton: { paddingHorizontal: 32, paddingVertical: 16 },
  galleryButtonText: { color: '#2e5afa', fontSize: 16 },
});
