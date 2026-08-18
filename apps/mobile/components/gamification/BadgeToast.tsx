'use client';

import { Text, View } from 'react-native';

import { RARITY_COLORS } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import { Badge as BadgeType } from '@/types/gamification';

interface BadgeToastProps {
  badge: BadgeType;
}

/**
 * 배지 획득 알림용 Toast 컴포넌트
 * sonner의 custom toast로 사용
 */
export function BadgeToast({ badge }: BadgeToastProps) {
  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <View testID="badge-toast" className="flex-row items-center gap-3 p-1">
      {/* 배지 아이콘 */}
      <View
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
          'shadow-lg',
          rarityColor.bg,
          rarityColor.border,
          rarityColor.glow
        )}
      >
        <Text className="text-2xl">{badge.icon}</Text>
      </View>

      {/* 텍스트 */}
      <View className="flex-col">
        <Text className="text-xs font-medium text-muted-foreground">배지 획득!</Text>
        <Text className="font-semibold">{badge.name}</Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {badge.description}
        </Text>
      </View>
    </View>
  );
}

export default BadgeToast;
