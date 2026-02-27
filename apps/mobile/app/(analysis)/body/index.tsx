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
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { staggeredEntry } from '../../../lib/animations';
import { useTheme, typography} from '@/lib/theme';

export default function BodyAnalysisScreen() {
  const { colors, module } = useTheme();
  const accent = module.body;

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
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="analysis-body-screen"
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <Animated.View entering={staggeredEntry(0)} style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>체형 분석</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            키, 체중과 전신 사진으로{'\n'}나에게 맞는 스타일을 찾아보세요
          </Text>
        </Animated.View>

        {/* 신체 정보 입력 */}
        <Animated.View entering={staggeredEntry(1)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>신체 정보</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>키 (cm)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.muted,
                },
              ]}
              placeholder="예: 165"
              placeholderTextColor={colors.mutedForeground}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              maxLength={5}
              accessibilityLabel="키 입력, cm"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>체중 (kg)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.muted,
                },
              ]}
              placeholder="예: 55"
              placeholderTextColor={colors.mutedForeground}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              maxLength={5}
              accessibilityLabel="체중 입력, kg"
            />
          </View>
        </Animated.View>

        {/* 이미지 업로드 */}
        <Animated.View entering={staggeredEntry(2)} style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>전신 사진</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            정면에서 촬영한 전신 사진을 선택해주세요
          </Text>

          <Pressable
            style={[
              styles.imagePickerButton,
              { borderColor: colors.border },
              imageUri && [styles.imagePickerButtonSelected, { borderColor: accent.base, backgroundColor: colors.muted }],
            ]}
            onPress={pickImage}
            accessibilityRole="button"
            accessibilityLabel={imageUri ? '사진이 선택됨, 다시 선택하기' : '갤러리에서 전신 사진 선택'}
          >
            {imageUri ? (
              <Text style={[styles.imagePickerTextSelected, { color: accent.base }]}>사진이 선택되었습니다</Text>
            ) : (
              <>
                <Text style={[styles.imagePickerIcon, { color: colors.mutedForeground }]}>+</Text>
                <Text style={[styles.imagePickerText, { color: colors.mutedForeground }]}>
                  갤러리에서 선택
                </Text>
              </>
            )}
          </Pressable>

          <View style={[styles.guideBox, { backgroundColor: colors.muted }]}>
            <Text style={[styles.guideTitle, { color: colors.foreground }]}>촬영 가이드</Text>
            <Text style={[styles.guideText, { color: colors.mutedForeground }]}>
              • 밝은 배경에서 촬영해주세요
            </Text>
            <Text style={[styles.guideText, { color: colors.mutedForeground }]}>
              • 몸에 맞는 옷을 입고 촬영하면 좋아요
            </Text>
            <Text style={[styles.guideText, { color: colors.mutedForeground }]}>
              • 정면을 바라보고 자연스럽게 서주세요
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 분석 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.analyzeButton,
            { backgroundColor: accent.base },
            (!height || !weight || !imageUri) && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={!height || !weight || !imageUri}
          accessibilityRole="button"
          accessibilityLabel="체형 분석하기"
          accessibilityState={{ disabled: !height || !weight || !imageUri }}
        >
          <Text style={[styles.analyzeButtonText, { color: colors.card }]}>체형 분석하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: typography.weight.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.size.base,
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: typography.size.sm,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: typography.size.sm,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: typography.size.base,
  },
  imagePickerButton: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePickerButtonSelected: {
    borderStyle: 'solid',
  },
  imagePickerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: typography.size.sm,
  },
  imagePickerTextSelected: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  guideBox: {
    borderRadius: 12,
    padding: 16,
  },
  guideTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: 8,
  },
  guideText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  analyzeButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
