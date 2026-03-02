/**
 * AddClothingSheet — 의류 추가 바텀시트 폼
 *
 * BottomSheet 내부 콘텐츠로 사용. 의류 정보(이름, 카테고리, 색상, 사진)를 입력받아
 * onAdd 콜백으로 전달. visible/onClose로 시트 노출을 제어.
 */
import React, { useState, useCallback } from 'react';
import { Camera } from 'lucide-react-native';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';
import { BottomSheet } from '../ui/BottomSheet';
import type { ClosetCategory } from './ClothingCard';

export interface NewClothingItem {
  name: string;
  category: ClosetCategory;
  color: string;
  /** 사진 URI (갤러리/카메라에서 선택) */
  photoUri?: string;
}

export interface AddClothingSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: NewClothingItem) => void;
  style?: ViewStyle;
}

const CATEGORIES: { key: ClosetCategory; label: string; emoji: string }[] = [
  { key: 'top', label: '상의', emoji: '👕' },
  { key: 'bottom', label: '하의', emoji: '👖' },
  { key: 'outer', label: '아우터', emoji: '🧥' },
  { key: 'dress', label: '원피스', emoji: '👗' },
  { key: 'shoes', label: '신발', emoji: '👟' },
  { key: 'accessory', label: '악세서리', emoji: '💍' },
];

const COLOR_PRESETS: { label: string; value: string }[] = [
  { label: '블랙', value: '블랙' },
  { label: '화이트', value: '화이트' },
  { label: '네이비', value: '네이비' },
  { label: '그레이', value: '그레이' },
  { label: '베이지', value: '베이지' },
  { label: '브라운', value: '브라운' },
  { label: '핑크', value: '핑크' },
  { label: '레드', value: '레드' },
  { label: '블루', value: '블루' },
  { label: '그린', value: '그린' },
];

export function AddClothingSheet({
  visible,
  onClose,
  onAdd,
  style,
}: AddClothingSheetProps): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, module: moduleColors } = useTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClosetCategory>('top');
  const [color, setColor] = useState('');
  const [customColor, setCustomColor] = useState('');

  // 폼 초기화
  const resetForm = useCallback((): void => {
    setName('');
    setCategory('top');
    setColor('');
    setCustomColor('');
  }, []);

  // 저장 핸들러
  const handleAdd = useCallback((): void => {
    const finalColor = color || customColor;
    if (!name.trim() || !finalColor.trim()) return;

    onAdd({
      name: name.trim(),
      category,
      color: finalColor.trim(),
    });
    resetForm();
    onClose();
  }, [name, category, color, customColor, onAdd, onClose, resetForm]);

  // 취소 핸들러
  const handleCancel = useCallback((): void => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const isFormValid = name.trim().length > 0 && (color.length > 0 || customColor.trim().length > 0);

  return (
    <BottomSheet
      isVisible={visible}
      onClose={handleCancel}
      snapPoints={['70%']}
      title="의류 추가"
      testID="add-clothing-sheet"
    >
      <ScrollView
        style={style}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 사진 촬영 영역 */}
        <Pressable
          testID="add-clothing-photo"
          accessibilityLabel="사진 추가"
          accessibilityRole="button"
          style={[
            styles.photoArea,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.xl,
              borderColor: colors.border,
              padding: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.cameraIcon,
              { backgroundColor: moduleColors.personalColor.light + '30' },
            ]}
          >
            <Camera size={24} color={moduleColors.personalColor.dark} />
          </View>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: spacing.sm,
            }}
          >
            사진을 추가해주세요
          </Text>
        </Pressable>

        {/* 이름 입력 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
            marginTop: spacing.md,
            marginBottom: spacing.xs,
          }}
        >
          이름
        </Text>
        <TextInput
          testID="add-clothing-name-input"
          accessibilityLabel="의류 이름 입력"
          style={[
            styles.textInput,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.lg,
              borderColor: colors.border,
              padding: spacing.sm,
              fontSize: typography.size.sm,
              color: colors.foreground,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="예: 스트라이프 셔츠"
          placeholderTextColor={colors.mutedForeground}
          maxLength={50}
        />

        {/* 카테고리 선택 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
            marginTop: spacing.md,
            marginBottom: spacing.xs,
          }}
        >
          카테고리
        </Text>
        <View style={[styles.categoryGrid, { gap: spacing.xs }]}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.key;
            return (
              <Pressable
                key={cat.key}
                testID={`category-${cat.key}`}
                accessibilityLabel={`${cat.label}${isSelected ? ', 선택됨' : ''}`}
                accessibilityRole="button"
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? moduleColors.personalColor.base
                      : colors.secondary,
                    borderRadius: radii.lg,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={{ fontSize: typography.size.base }}>{cat.emoji}</Text>
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: isSelected ? typography.weight.bold : typography.weight.normal,
                    color: isSelected ? colors.overlayForeground : colors.foreground,
                    marginTop: spacing.xxs,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 색상 선택 */}
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
            marginTop: spacing.md,
            marginBottom: spacing.xs,
          }}
        >
          색상
        </Text>
        <View style={[styles.colorGrid, { gap: spacing.xs }]}>
          {COLOR_PRESETS.map((preset) => {
            const isSelected = color === preset.value;
            return (
              <Pressable
                key={preset.value}
                testID={`color-${preset.value}`}
                accessibilityLabel={`${preset.label}${isSelected ? ', 선택됨' : ''}`}
                accessibilityRole="button"
                style={[
                  styles.colorChip,
                  {
                    backgroundColor: isSelected
                      ? moduleColors.personalColor.base + '30'
                      : colors.secondary,
                    borderRadius: radii.full,
                    borderColor: isSelected ? moduleColors.personalColor.base : 'transparent',
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
                onPress={() => {
                  setColor(isSelected ? '' : preset.value);
                  if (!isSelected) setCustomColor('');
                }}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: isSelected ? typography.weight.bold : typography.weight.normal,
                    color: isSelected ? moduleColors.personalColor.dark : colors.foreground,
                  }}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 직접 입력 */}
        <TextInput
          testID="add-clothing-custom-color"
          accessibilityLabel="색상 직접 입력"
          style={[
            styles.textInput,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.lg,
              borderColor: colors.border,
              padding: spacing.sm,
              fontSize: typography.size.sm,
              color: colors.foreground,
              marginTop: spacing.sm,
            },
          ]}
          value={customColor}
          onChangeText={(text) => {
            setCustomColor(text);
            if (text.length > 0) setColor('');
          }}
          placeholder="또는 직접 입력 (예: 라벤더)"
          placeholderTextColor={colors.mutedForeground}
          maxLength={20}
        />

        {/* 하단 버튼 */}
        <View style={[styles.buttonRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
          <Pressable
            testID="add-clothing-cancel"
            accessibilityLabel="취소"
            accessibilityRole="button"
            style={[
              styles.button,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={handleCancel}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              취소
            </Text>
          </Pressable>
          <Pressable
            testID="add-clothing-save"
            accessibilityLabel="저장"
            accessibilityRole="button"
            style={[
              styles.button,
              {
                backgroundColor: isFormValid ? brand.primary : colors.secondary,
                borderRadius: radii.lg,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={handleAdd}
            disabled={!isFormValid}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: isFormValid ? brand.primaryForeground : colors.mutedForeground,
                textAlign: 'center',
              }}
            >
              추가하기
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  photoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  cameraIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    alignItems: 'center',
    minWidth: 56,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorChip: {
    borderWidth: 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
});
