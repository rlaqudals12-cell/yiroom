/**
 * Virtual Try-On 모바일 스크린
 * - 립/블러셔/아이섀도/파운데이션/헤어 컬러 시뮬레이션
 * - 이미지 업로드 → 프리셋 선택 → API 호출 → 시뮬레이션 결과
 * - Thin Client: 서버 Sharp 렌더링 (ADR-088)
 */

import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera, Palette, Sparkles, Droplets, Eye } from 'lucide-react-native';

import { useTheme, brand } from '../../../lib/theme';
import {
  LIP_PRESETS,
  BLUSH_PRESETS,
  HAIR_PRESETS,
  EYESHADOW_PRESETS,
  FOUNDATION_PRESETS,
} from '../../../lib/virtual-try-on/types';
import type { RgbaColor, MakeupType } from '../../../lib/virtual-try-on/types';

type MakeupCategory = 'lip' | 'blush' | 'eyeshadow' | 'foundation' | 'hair';

const CATEGORIES: { key: MakeupCategory; label: string; icon: typeof Palette }[] = [
  { key: 'lip', label: '립', icon: Palette },
  { key: 'blush', label: '블러셔', icon: Sparkles },
  { key: 'eyeshadow', label: '아이섀도', icon: Eye },
  { key: 'foundation', label: '파운데이션', icon: Droplets },
  { key: 'hair', label: '헤어', icon: Palette },
];

// 카테고리 → API type 매핑
const CATEGORY_TO_API_TYPE: Record<MakeupCategory, MakeupType> = {
  lip: 'lip',
  blush: 'blush',
  eyeshadow: 'eyeshadow',
  foundation: 'foundation',
  hair: 'hair-color',
};

function rgbaToHex(c: RgbaColor): string {
  const hex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
}

// 카테고리별 프리셋
function getPresets(category: MakeupCategory): { name: string; color: RgbaColor }[] {
  switch (category) {
    case 'lip':
      return LIP_PRESETS;
    case 'blush':
      return BLUSH_PRESETS;
    case 'eyeshadow':
      return EYESHADOW_PRESETS;
    case 'foundation':
      return FOUNDATION_PRESETS;
    case 'hair':
      return HAIR_PRESETS.map((p) => ({ name: p.name, color: p.displayColor }));
  }
}

// 카테고리별 라벨
function getCategoryLabel(category: MakeupCategory): string {
  switch (category) {
    case 'lip':
      return '립 컬러';
    case 'blush':
      return '블러셔 컬러';
    case 'eyeshadow':
      return '아이섀도 컬러';
    case 'foundation':
      return '파운데이션 셰이드';
    case 'hair':
      return '헤어 컬러';
  }
}

export default function VirtualTryOnScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [category, setCategory] = useState<MakeupCategory>('lip');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const presets = getPresets(category);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
      setSelectedColor(null);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
      setSelectedColor(null);
    }
  }, []);

  // API 기반 VTO 시뮬레이션
  const applyTryOn = useCallback(
    async (color: RgbaColor) => {
      if (!imageUri) return;

      // 이전 요청 취소
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setProcessing(true);
      try {
        // 이미지 → base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });

        const apiType = CATEGORY_TO_API_TYPE[category];

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/fitting/try-on`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: `data:image/jpeg;base64,${base64}`,
              type: apiType,
              color: { r: color.r, g: color.g, b: color.b, a: color.a },
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data?.resultBase64) {
          setResultUri(data.data.resultBase64);
        } else {
          throw new Error(data.error?.userMessage ?? '시뮬레이션 실패');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('[VTO] API 호출 실패:', err);
        Alert.alert('알림', '시뮬레이션을 처리할 수 없습니다. 다시 시도해주세요.');
        setResultUri(null);
      } finally {
        if (!controller.signal.aborted) {
          setProcessing(false);
        }
      }
    },
    [imageUri, category]
  );

  const handleColorSelect = useCallback(
    (colorHex: string, color: RgbaColor) => {
      setSelectedColor(colorHex);
      if (imageUri) {
        applyTryOn(color);
      }
    },
    [imageUri, applyTryOn]
  );

  // 표시할 이미지: 결과가 있으면 결과, 없으면 원본
  const displayUri = resultUri ?? imageUri;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="virtual-try-on-screen"
    >
      {/* 이미지 영역 */}
      <View className="px-4 pt-4">
        {displayUri ? (
          <View className="relative rounded-2xl overflow-hidden">
            <Image
              source={{ uri: displayUri }}
              className="w-full aspect-[3/4] rounded-2xl"
              resizeMode="cover"
            />
            {processing && (
              <View className="absolute inset-0 bg-black/30 items-center justify-center">
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-white mt-2 text-sm">시뮬레이션 중...</Text>
              </View>
            )}
            {selectedColor && !processing && resultUri && (
              <View className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/50">
                <Text className="text-white text-xs">
                  {presets.find((p) => rgbaToHex(p.color) === selectedColor)?.name ?? '적용됨'}
                </Text>
              </View>
            )}
            {/* 시뮬레이션 미리보기 라벨 */}
            {resultUri && !processing && (
              <View className="absolute top-3 left-3 px-2 py-1 rounded bg-black/40">
                <Text className="text-white text-[10px]">시뮬레이션 미리보기</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="w-full aspect-[3/4] rounded-2xl bg-muted items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Camera size={48} color={colors.mutedForeground} />
            <Text className="mt-3 text-base font-medium" style={{ color: colors.mutedForeground }}>
              사진을 선택해주세요
            </Text>
            <View className="flex-row gap-3 mt-4">
              <Pressable onPress={takePhoto} className="px-4 py-2 rounded-full bg-primary">
                <Text className="text-white text-sm font-medium">촬영</Text>
              </Pressable>
              <Pressable
                onPress={pickImage}
                className="px-4 py-2 rounded-full border border-primary"
              >
                <Text className="text-sm font-medium" style={{ color: brand.primary }}>
                  갤러리
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* 카테고리 탭 — 5개로 확장되어 수평 스크롤 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 px-2">
        <View className="flex-row gap-2 px-2">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  setCategory(cat.key);
                  setSelectedColor(null);
                  setResultUri(null);
                }}
                className={`px-4 py-2.5 rounded-full items-center ${
                  isActive ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}
                  style={isActive ? undefined : { color: colors.foreground }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 컬러 프리셋 */}
      <View className="px-4 mt-4">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
          {getCategoryLabel(category)}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {presets.map((preset) => {
              const hex = rgbaToHex(preset.color);
              const isSelected = selectedColor === hex;
              return (
                <Pressable
                  key={preset.name}
                  onPress={() => handleColorSelect(hex, preset.color)}
                  className="items-center"
                >
                  <View
                    className={`w-12 h-12 rounded-full ${isSelected ? 'border-2 border-primary' : 'border border-gray-200 dark:border-gray-700'}`}
                    style={{ backgroundColor: hex, padding: isSelected ? 2 : 0 }}
                  />
                  <Text
                    className="text-[10px] mt-1 text-center"
                    style={{ color: colors.mutedForeground, maxWidth: 56 }}
                    numberOfLines={1}
                  >
                    {preset.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* 안내 메시지 */}
      {!imageUri && (
        <View className="px-4 mt-6">
          <View className="p-4 rounded-xl bg-muted">
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              정면 얼굴 사진을 업로드하면 립, 블러셔, 아이섀도, 파운데이션, 헤어 컬러를 가상으로
              적용해볼 수 있어요.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
