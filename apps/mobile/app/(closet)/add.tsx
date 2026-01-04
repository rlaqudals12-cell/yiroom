/**
 * 옷장 아이템 추가 페이지
 * @description 새 옷 아이템 등록 (사진 + 메타데이터)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAppPreferencesStore } from '@/lib/stores';
import { useCloset, type ClothingCategory, type Season } from '@/lib/inventory';

// 카테고리 옵션
const CATEGORIES = [
  { value: 'top', label: '상의', icon: '👕' },
  { value: 'bottom', label: '하의', icon: '👖' },
  { value: 'outer', label: '아우터', icon: '🧥' },
  { value: 'dress', label: '원피스', icon: '👗' },
  { value: 'shoes', label: '신발', icon: '👟' },
  { value: 'bag', label: '가방', icon: '👜' },
  { value: 'accessory', label: '액세서리', icon: '💍' },
];

// 색상 옵션
const COLORS = [
  { value: 'black', label: '블랙', hex: '#000000' },
  { value: 'white', label: '화이트', hex: '#FFFFFF' },
  { value: 'gray', label: '그레이', hex: '#808080' },
  { value: 'navy', label: '네이비', hex: '#1E3A5F' },
  { value: 'beige', label: '베이지', hex: '#D4C4A8' },
  { value: 'brown', label: '브라운', hex: '#8B4513' },
  { value: 'red', label: '레드', hex: '#E53935' },
  { value: 'pink', label: '핑크', hex: '#F8BBD9' },
  { value: 'blue', label: '블루', hex: '#2196F3' },
  { value: 'green', label: '그린', hex: '#4CAF50' },
  { value: 'yellow', label: '옐로우', hex: '#FFEB3B' },
  { value: 'purple', label: '퍼플', hex: '#9C27B0' },
];

// 시즌 옵션
const SEASONS = [
  { value: 'spring', label: '봄', icon: '🌸' },
  { value: 'summer', label: '여름', icon: '☀️' },
  { value: 'fall', label: '가을', icon: '🍂' },
  { value: 'winter', label: '겨울', icon: '❄️' },
];

// 상황 옵션
const OCCASIONS = [
  { value: 'daily', label: '데일리' },
  { value: 'work', label: '출근' },
  { value: 'date', label: '데이트' },
  { value: 'travel', label: '여행' },
  { value: 'formal', label: '포멀' },
  { value: 'sports', label: '운동' },
];

interface FormData {
  imageUri: string | null;
  name: string;
  brand: string;
  category: string;
  colors: string[];
  seasons: string[];
  occasions: string[];
  notes: string;
}

export default function ClosetAddScreen() {
  const router = useRouter();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);
  const { addItem } = useCloset();

  const [formData, setFormData] = useState<FormData>({
    imageUri: null,
    name: '',
    brand: '',
    category: '',
    colors: [],
    seasons: [],
    occasions: [],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미지 선택
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  // 카메라 촬영
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  // 다중 선택 토글
  const toggleSelection = useCallback(
    (field: 'colors' | 'seasons' | 'occasions', value: string) => {
      if (hapticEnabled) {
        Haptics.selectionAsync();
      }

      setFormData((prev) => {
        const current = prev[field];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [field]: updated };
      });
    },
    [hapticEnabled]
  );

  // 카테고리 선택
  const selectCategory = useCallback(
    (value: string) => {
      if (hapticEnabled) {
        Haptics.selectionAsync();
      }
      setFormData((prev) => ({ ...prev, category: value }));
    },
    [hapticEnabled]
  );

  // 유효성 검증
  const isValid = () => {
    return (
      formData.imageUri &&
      formData.name.trim() &&
      formData.category &&
      formData.colors.length > 0 &&
      formData.seasons.length > 0
    );
  };

  // 저장
  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert('입력 확인', '필수 항목을 모두 입력해주세요.');
      return;
    }

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    try {
      // 메타데이터 구성 (옷장 아이템 형식)
      const metadata = {
        colors: formData.colors,
        seasons: formData.seasons as Season[],
        occasions: formData.occasions,
        notes: formData.notes,
      };

      // API 연동 - useCloset().addItem() 호출
      // imageUri는 isValid()에서 이미 검증됨
      const result = await addItem({
        category: 'closet',
        subCategory: formData.category as ClothingCategory,
        name: formData.name.trim(),
        imageUrl: formData.imageUri!,
        originalImageUrl: formData.imageUri,
        brand: formData.brand.trim() || null,
        tags: [...formData.colors, ...formData.seasons, ...formData.occasions],
        isFavorite: false,
        useCount: 0,
        lastUsedAt: null,
        expiryDate: null,
        metadata,
      });

      if (result) {
        Alert.alert('저장 완료', '옷장에 아이템이 추가되었습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('[Closet] Add item error:', error);
      Alert.alert('오류', '저장 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '아이템 추가',
          headerBackTitle: '취소',
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 이미지 섹션 */}
        <View style={styles.imageSection}>
          {formData.imageUri ? (
            <Pressable onPress={handleImagePick}>
              <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>변경</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>사진을 추가해주세요</Text>
              <View style={styles.imageButtons}>
                <Pressable
                  onPress={handleCamera}
                  style={({ pressed }) => [styles.imageButton, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.imageButtonText}>📸 촬영</Text>
                </Pressable>
                <Pressable
                  onPress={handleImagePick}
                  style={({ pressed }) => [styles.imageButton, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.imageButtonText}>🖼️ 앨범</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <Text style={styles.label}>아이템 이름 *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
            placeholder="예: 화이트 셔츠"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>브랜드</Text>
          <TextInput
            style={styles.input}
            value={formData.brand}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, brand: text }))}
            placeholder="예: ZARA"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* 카테고리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리 *</Text>
          <View style={styles.optionGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => selectCategory(cat.value)}
                style={[
                  styles.optionButton,
                  formData.category === cat.value && styles.optionButtonSelected,
                ]}
              >
                <Text style={styles.optionIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    formData.category === cat.value && styles.optionLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 색상 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>색상 * (복수 선택)</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <Pressable
                key={color.value}
                onPress={() => toggleSelection('colors', color.value)}
                style={[
                  styles.colorButton,
                  formData.colors.includes(color.value) && styles.colorButtonSelected,
                ]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: color.hex }]} />
                <Text
                  style={[
                    styles.colorLabel,
                    formData.colors.includes(color.value) && styles.colorLabelSelected,
                  ]}
                >
                  {color.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 시즌 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시즌 * (복수 선택)</Text>
          <View style={styles.optionRow}>
            {SEASONS.map((season) => (
              <Pressable
                key={season.value}
                onPress={() => toggleSelection('seasons', season.value)}
                style={[
                  styles.seasonButton,
                  formData.seasons.includes(season.value) && styles.seasonButtonSelected,
                ]}
              >
                <Text style={styles.seasonIcon}>{season.icon}</Text>
                <Text
                  style={[
                    styles.seasonLabel,
                    formData.seasons.includes(season.value) && styles.seasonLabelSelected,
                  ]}
                >
                  {season.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 상황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>착용 상황 (선택)</Text>
          <View style={styles.chipContainer}>
            {OCCASIONS.map((occ) => (
              <Pressable
                key={occ.value}
                onPress={() => toggleSelection('occasions', occ.value)}
                style={[
                  styles.chip,
                  formData.occasions.includes(occ.value) && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.occasions.includes(occ.value) && styles.chipTextSelected,
                  ]}
                >
                  {occ.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 메모 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>메모</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, notes: text }))}
            placeholder="이 아이템에 대한 메모를 남겨보세요"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid() || isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            (!isValid() || isSubmitting) && styles.submitButtonDisabled,
            pressed && { opacity: 0.8 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>옷장에 추가</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  imageSection: {
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 267,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  imagePlaceholder: {
    width: 200,
    height: 267,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    color: '#6B7280',
    marginBottom: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  imageButtonText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
  },
  optionButtonSelected: {
    backgroundColor: '#1F2937',
  },
  optionIcon: {
    fontSize: 16,
  },
  optionLabel: {
    color: '#4B5563',
    fontSize: 13,
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    gap: 6,
  },
  colorButtonSelected: {
    backgroundColor: '#1F2937',
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorLabel: {
    color: '#4B5563',
    fontSize: 12,
  },
  colorLabelSelected: {
    color: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  seasonButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  seasonButtonSelected: {
    backgroundColor: '#1F2937',
  },
  seasonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  seasonLabel: {
    color: '#4B5563',
    fontSize: 12,
  },
  seasonLabelSelected: {
    color: '#FFFFFF',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  chipSelected: {
    backgroundColor: '#1F2937',
  },
  chipText: {
    color: '#4B5563',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
