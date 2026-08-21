import { router } from 'expo-router';
import { AlertCircle, Package } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TIMING } from '@/lib/animations';
import { useTheme } from '@/lib/theme';

import type { ScanState } from './barcode-scan.types';

interface BarcodeScanStatusProps {
  scanState: ScanState;
  productName?: string;
  errorMessage: string;
  onReset: () => void;
}

export function BarcodeScanStatus({
  scanState,
  productName,
  errorMessage,
  onReset,
}: BarcodeScanStatusProps) {
  if (scanState === 'added' || scanState === 'shelf-added') {
    return <SuccessStatus scanState={scanState} productName={productName} onReset={onReset} />;
  }
  if (scanState === 'not-found') return <NotFoundStatus onReset={onReset} />;
  if (scanState === 'error') {
    return <ErrorStatus errorMessage={errorMessage} onReset={onReset} />;
  }
  return null;
}

function SuccessStatus({
  scanState,
  productName,
  onReset,
}: {
  scanState: 'added' | 'shelf-added';
  productName?: string;
  onReset: () => void;
}) {
  const { colors, brand, status, shadows, typography, spacing, radii } = useTheme();
  const isShelf = scanState === 'shelf-added';

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      style={[
        styles.resultCard,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: status.success + '40',
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.sm }}>
        {'\u2705'}
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: spacing.xs,
        }}
      >
        {isShelf ? '제품함에 추가했어요!' : '화장대에 추가했어요!'}
      </Text>
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginBottom: spacing.md,
        }}
      >
        {productName}
      </Text>
      <View style={styles.actionRow}>
        <Pressable
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.xl,
              flex: 1,
              marginRight: spacing.sm,
            },
          ]}
          onPress={onReset}
        >
          <Text
            style={{
              color: colors.foreground,
              fontWeight: typography.weight.semibold,
              fontSize: typography.size.sm,
            }}
          >
            다른 제품 스캔
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: brand.primary, borderRadius: radii.xl, flex: 1 },
          ]}
          onPress={() => router.push(isShelf ? '/(inventory)/shelf' : '/(inventory)/beauty')}
        >
          <Text
            style={{
              color: brand.primaryForeground,
              fontWeight: typography.weight.semibold,
              fontSize: typography.size.sm,
            }}
          >
            {isShelf ? '제품함 보기' : '화장대 보기'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function NotFoundStatus({ onReset }: { onReset: () => void }) {
  const { colors, brand, typography, spacing, radii } = useTheme();
  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      style={[styles.center, { paddingVertical: spacing.xxl }]}
    >
      <Package size={48} color={colors.mutedForeground} />
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginTop: spacing.md,
        }}
      >
        제품을 찾을 수 없어요
      </Text>
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginTop: spacing.xs,
        }}
      >
        바코드 번호를 확인하거나{'\n'}다른 방법으로 제품을 추가해보세요
      </Text>
      <RetryButton onPress={onReset} backgroundColor={brand.primary} borderRadius={radii.xl} />
    </Animated.View>
  );
}

function ErrorStatus({ errorMessage, onReset }: { errorMessage: string; onReset: () => void }) {
  const { brand, status, typography, spacing, radii } = useTheme();
  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      style={[styles.center, { paddingVertical: spacing.xl }]}
    >
      <AlertCircle size={40} color={status.error} />
      <Text
        style={{
          fontSize: typography.size.sm,
          color: status.error,
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        {errorMessage}
      </Text>
      <RetryButton onPress={onReset} backgroundColor={brand.primary} borderRadius={radii.xl} />
    </Animated.View>
  );
}

function RetryButton({
  onPress,
  backgroundColor,
  borderRadius,
}: {
  onPress: () => void;
  backgroundColor: string;
  borderRadius: number;
}) {
  const { brand, typography, spacing } = useTheme();
  return (
    <Pressable
      style={[styles.retryButton, { backgroundColor, borderRadius, marginTop: spacing.md }]}
      onPress={onPress}
    >
      <Text
        style={{
          color: brand.primaryForeground,
          fontWeight: typography.weight.semibold,
          fontSize: typography.size.sm,
        }}
      >
        다시 시도
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  resultCard: { borderWidth: 1 },
  center: { alignItems: 'center' },
  actionRow: { flexDirection: 'row' },
  actionButton: { paddingVertical: 12, alignItems: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12 },
});
