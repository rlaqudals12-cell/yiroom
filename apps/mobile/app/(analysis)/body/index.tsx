/**
 * C-1 체형 분석 - 입력 화면
 */
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BodyAnalysisScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // 갤러리에서 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  // 분석 시작
  const handleAnalyze = () => {
    if (!height || !weight) {
      Alert.alert('알림', '키와 체중을 입력해주세요.');
      return;
    }

    if (!imageUri) {
      Alert.alert('알림', '전신 사진을 선택해주세요.');
      return;
    }

    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      Alert.alert('알림', '키를 올바르게 입력해주세요. (100~250cm)');
      return;
    }

    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      Alert.alert('알림', '체중을 올바르게 입력해주세요. (30~200kg)');
      return;
    }

    router.push({
      pathname: '/(analysis)/body/result',
      params: {
        height: heightNum.toString(),
        weight: weightNum.toString(),
        imageUri,
        imageBase64: imageBase64 || '',
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textLight]}>
            체형 분석
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textMuted]}>
            키, 체중과 전신 사진으로{'\n'}나에게 맞는 스타일을 찾아보세요
          </Text>
        </View>

        {/* 신체 정보 입력 */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>
            신체 정보
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.textMuted]}>
              키 (cm)
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="예: 165"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.textMuted]}>
              체중 (kg)
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="예: 55"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>

        {/* 이미지 업로드 */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textLight]}>
            전신 사진
          </Text>
          <Text style={[styles.cardDescription, isDark && styles.textMuted]}>
            정면에서 촬영한 전신 사진을 선택해주세요
          </Text>

          <TouchableOpacity
            style={[
              styles.imagePickerButton,
              isDark && styles.imagePickerButtonDark,
              imageUri && styles.imagePickerButtonSelected,
            ]}
            onPress={pickImage}
          >
            {imageUri ? (
              <Text style={styles.imagePickerTextSelected}>
                사진이 선택되었습니다
              </Text>
            ) : (
              <>
                <Text style={[styles.imagePickerIcon]}>+</Text>
                <Text
                  style={[styles.imagePickerText, isDark && styles.textMuted]}
                >
                  갤러리에서 선택
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.guideBox}>
            <Text style={[styles.guideTitle, isDark && styles.textLight]}>
              촬영 가이드
            </Text>
            <Text style={[styles.guideText, isDark && styles.textMuted]}>
              • 밝은 배경에서 촬영해주세요
            </Text>
            <Text style={[styles.guideText, isDark && styles.textMuted]}>
              • 몸에 맞는 옷을 입고 촬영하면 좋아요
            </Text>
            <Text style={[styles.guideText, isDark && styles.textMuted]}>
              • 정면을 바라보고 자연스럽게 서주세요
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 분석 버튼 */}
      <View style={[styles.footer, isDark && styles.footerDark]}>
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (!height || !weight || !imageUri) && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={!height || !weight || !imageUri}
        >
          <Text style={styles.analyzeButtonText}>체형 분석하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#f9f9f9',
  },
  inputDark: {
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  imagePickerButton: {
    height: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePickerButtonDark: {
    borderColor: '#444',
  },
  imagePickerButtonSelected: {
    borderColor: '#2e5afa',
    backgroundColor: '#f0f4ff',
    borderStyle: 'solid',
  },
  imagePickerIcon: {
    fontSize: 32,
    color: '#999',
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#666',
  },
  imagePickerTextSelected: {
    fontSize: 14,
    color: '#2e5afa',
    fontWeight: '600',
  },
  guideBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f8f9fc',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerDark: {
    backgroundColor: '#0a0a0a',
    borderTopColor: '#222',
  },
  analyzeButton: {
    backgroundColor: '#2e5afa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
