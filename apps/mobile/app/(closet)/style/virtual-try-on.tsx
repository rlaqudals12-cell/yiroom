/**
 * Virtual Try-On 모바일 스크린
 * - 립/블러셔/헤어 컬러 시뮬레이션
 * - 이미지 업로드 → 프리셋 선택 → 시뮬레이션 결과
 * - Thin Client: 엔진은 기존 lib/virtual-try-on 모듈 활용
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Palette, Sparkles } from 'lucide-react-native';

import { useTheme, brand } from '../../../lib/theme';
import { LIP_PRESETS, BLUSH_PRESETS, HAIR_PRESETS } from '../../../lib/virtual-try-on/types';
import type { RgbaColor } from '../../../lib/virtual-try-on/types';

type MakeupCategory = 'lip' | 'blush' | 'hair';

const CATEGORIES: { key: MakeupCategory; label: string; icon: typeof Palette }[] = [
  { key: 'lip', label: '립', icon: Palette },
  { key: 'blush', label: '블러셔', icon: Sparkles },
  { key: 'hair', label: '헤어 컬러', icon: Palette },
];

function rgbaToHex(c: RgbaColor): string {
  const hex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
}

export default function VirtualTryOnScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<MakeupCategory>('lip');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // 현재 카테고리의 프리셋
  const presets =
    category === 'lip'
      ? LIP_PRESETS
      : category === 'blush'
        ? BLUSH_PRESETS
        : HAIR_PRESETS.map((p) => ({ name: p.name, color: p.displayColor }));

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
    }
  }, []);

  const handleColorSelect = useCallback(
    (colorHex: string) => {
      setSelectedColor(colorHex);
      if (imageUri) {
        setProcessing(true);
        // 시뮬레이션 처리 (향후 엔진 연동)
        setTimeout(() => setProcessing(false), 800);
      }
    },
    [imageUri]
  );

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="virtual-try-on-screen"
    >
      {/* 이미지 영역 */}
      <View className="px-4 pt-4">
        {imageUri ? (
          <View className="relative rounded-2xl overflow-hidden">
            <Image
              source={{ uri: imageUri }}
              className="w-full aspect-[3/4] rounded-2xl"
              resizeMode="cover"
            />
            {processing && (
              <View className="absolute inset-0 bg-black/30 items-center justify-center">
                <ActivityIndicator size="large" color="#fff" />
                <Text className="text-white mt-2 text-sm">시뮬레이션 중...</Text>
              </View>
            )}
            {selectedColor && !processing && (
              <View className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/50">
                <Text className="text-white text-xs">
                  {presets.find((p) => rgbaToHex(p.color) === selectedColor)?.name ?? '선택됨'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="w-full aspect-[3/4] rounded-2xl bg-muted items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Camera size={48} color={colors.mutedForeground} />
            <Text
              className="mt-3 text-base font-medium"
              style={{ color: colors.mutedForeground }}
            >
              사진을 선택해주세요
            </Text>
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={takePhoto}
                className="px-4 py-2 rounded-full bg-primary"
              >
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

      {/* 카테고리 탭 */}
      <View className="flex-row px-4 mt-4 gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setCategory(cat.key)}
              className={`flex-1 py-2.5 rounded-full items-center ${
                isActive ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isActive ? 'text-white' : ''
                }`}
                style={isActive ? undefined : { color: colors.foreground }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 컬러 프리셋 */}
      <View className="px-4 mt-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.mutedForeground }}
        >
          {category === 'lip' ? '립 컬러' : category === 'blush' ? '블러셔 컬러' : '헤어 컬러'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {presets.map((preset) => {
              const hex = rgbaToHex(preset.color);
              const isSelected = selectedColor === hex;
              return (
                <Pressable
                  key={preset.name}
                  onPress={() => handleColorSelect(hex)}
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
              정면 얼굴 사진을 업로드하면 립, 블러셔, 헤어 컬러를 가상으로 적용해볼 수 있어요.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
