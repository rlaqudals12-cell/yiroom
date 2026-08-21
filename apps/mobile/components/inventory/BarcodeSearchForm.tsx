import { Camera, Keyboard, ScanBarcode, Search } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

import type { InputMode, ScanState } from './barcode-scan.types';

interface BarcodeSearchFormProps {
  inputMode: InputMode;
  barcode: string;
  scanState: ScanState;
  onBarcodeChange: (value: string) => void;
  onSearch: () => void;
  onCamera: () => void;
  onManual: () => void;
}

export function BarcodeSearchForm({
  inputMode,
  barcode,
  scanState,
  onBarcodeChange,
  onSearch,
  onCamera,
  onManual,
}: BarcodeSearchFormProps) {
  const { colors, brand, typography, spacing, radii } = useTheme();

  return (
    <>
      <Animated.View
        entering={FadeInUp.duration(TIMING.normal)}
        style={{ marginBottom: spacing.lg }}
      >
        <GlassCard shadowSize="md" style={{ backgroundColor: brand.primary }}>
          <View style={styles.infoRow}>
            <ScanBarcode size={24} color={brand.primaryForeground} />
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: brand.primaryForeground,
                marginLeft: spacing.sm,
              }}
            >
              뷰티 바코드 스캔
            </Text>
          </View>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: brand.primaryForeground + 'D9',
              marginTop: spacing.xs,
              lineHeight: 20,
            }}
          >
            화장품 바코드를 입력하면 제품 정보를 조회하고{'\n'}내 화장대에 추가할 수 있어요
          </Text>
        </GlassCard>
      </Animated.View>

      <View
        style={[
          styles.modeToggle,
          { backgroundColor: colors.secondary, borderRadius: radii.xl, marginBottom: spacing.md },
        ]}
      >
        <ModeButton
          mode="camera"
          selected={inputMode === 'camera'}
          onPress={onCamera}
          label="카메라"
        />
        <ModeButton
          mode="manual"
          selected={inputMode === 'manual'}
          onPress={onManual}
          label="수동 입력"
        />
      </View>

      <Animated.View
        entering={FadeInUp.delay(80).duration(TIMING.normal)}
        style={{ marginBottom: spacing.lg }}
      >
        <GlassCard shadowSize="md">
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginBottom: spacing.sm,
            }}
          >
            바코드 번호 입력
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.xl,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  fontSize: typography.size.base,
                  color: colors.foreground,
                },
              ]}
              value={barcode}
              onChangeText={onBarcodeChange}
              placeholder="8~14자리 바코드 숫자"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={14}
              returnKeyType="search"
              onSubmitEditing={onSearch}
            />
            <Pressable
              style={[
                styles.searchButton,
                { backgroundColor: brand.primary, borderRadius: radii.xl, marginLeft: spacing.sm },
              ]}
              onPress={onSearch}
              disabled={scanState === 'searching'}
            >
              {scanState === 'searching' ? (
                <ActivityIndicator size="small" color={brand.primaryForeground} />
              ) : (
                <Search size={20} color={brand.primaryForeground} />
              )}
            </Pressable>
          </View>
        </GlassCard>
      </Animated.View>
    </>
  );
}

interface ModeButtonProps {
  mode: InputMode;
  selected: boolean;
  onPress: () => void;
  label: string;
}

function ModeButton({ mode, selected, onPress, label }: ModeButtonProps) {
  const { colors, brand, typography, spacing, radii } = useTheme();
  const foreground = selected ? brand.primaryForeground : colors.mutedForeground;

  return (
    <Pressable
      style={[
        styles.modeButton,
        { borderRadius: radii.lg, backgroundColor: selected ? brand.primary : 'transparent' },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      {mode === 'camera' ? (
        <Camera size={16} color={foreground} />
      ) : (
        <Keyboard size={16} color={foreground} />
      )}
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: foreground,
          marginLeft: spacing.xxs,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  modeToggle: { flexDirection: 'row', padding: 3 },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1 },
  searchButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
