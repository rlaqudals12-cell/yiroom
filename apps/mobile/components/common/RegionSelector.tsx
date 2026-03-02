/**
 * 지역 선택기
 *
 * 국가/지역 선택 + 자동 감지 기능
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { useTheme, spacing, radii, typography } from '../../lib/theme';

/** 지원 국가 코드 */
export type SupportedCountry = 'KR' | 'US' | 'JP' | 'CN' | 'GB';

export interface RegionOption {
  code: SupportedCountry;
  name: string;
  flag: string;
}

export interface RegionSelectorProps {
  /** 현재 선택된 지역 코드 */
  value: SupportedCountry;
  /** 변경 콜백 */
  onChange: (code: SupportedCountry) => void;
  /** 선택 가능한 지역 목록 */
  options?: RegionOption[];
  /** 라벨 */
  label?: string;
}

const DEFAULT_OPTIONS: RegionOption[] = [
  { code: 'KR', name: '대한민국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
  { code: 'JP', name: '일본', flag: '🇯🇵' },
  { code: 'CN', name: '중국', flag: '🇨🇳' },
  { code: 'GB', name: '영국', flag: '🇬🇧' },
];

export function RegionSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  label = '지역',
}: RegionSelectorProps): React.ReactElement {
  const { colors, brand, typography } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selected = options.find((o) => o.code === value) ?? options[0];

  const handleSelect = useCallback(
    (code: SupportedCountry) => {
      onChange(code);
      setModalVisible(false);
    },
    [onChange],
  );

  return (
    <View testID="region-selector">
      {/* 라벨 */}
      {label && (
        <Text style={[styles.label, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
          {label}
        </Text>
      )}

      {/* 선택 버튼 */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={`지역 선택: 현재 ${selected.name}`}
        testID="region-selector-button"
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={[styles.selectedName, { color: colors.foreground, fontSize: typography.size.sm }]}>
          {selected.name}
        </Text>
        <Text style={{ color: colors.mutedForeground }}>▼</Text>
      </Pressable>

      {/* 선택 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modal, { backgroundColor: colors.card }]}
            testID="region-selector-modal"
          >
            <Text style={[styles.modalTitle, { color: colors.foreground, fontSize: typography.size.lg }]}>
              지역 선택
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.code)}
                  style={[
                    styles.option,
                    item.code === value && { backgroundColor: `${brand.primary}10` },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: item.code === value }}
                >
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.optionName,
                      {
                        color: item.code === value ? brand.primary : colors.foreground,
                        fontSize: typography.size.base,
                        fontWeight: item.code === value ? '600' : '400',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.code === value && (
                    <Text style={{ color: brand.primary }}>✓</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.smx,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  flag: {
    fontSize: typography.size.xl,
    marginRight: spacing.sm,
  },
  selectedName: {
    flex: 1,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    borderRadius: radii.xl,
    padding: spacing.mlg,
    width: '100%',
    maxHeight: 400,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.smx,
    paddingHorizontal: spacing.smx,
    borderRadius: radii.md,
  },
  optionFlag: {
    fontSize: typography.size['2xl'],
    marginRight: spacing.smx,
  },
  optionName: {
    flex: 1,
  },
});
