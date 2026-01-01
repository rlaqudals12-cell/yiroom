/**
 * 기록 탭
 * 운동 기록, 식단 기록, 통계
 */
import { useRouter } from 'expo-router';
import {
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
  Calendar,
} from 'lucide-react-native';
import { View, Text, ScrollView, Pressable } from 'react-native';

export default function RecordsTab() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-6">기록</Text>

        {/* 오늘의 기록 요약 */}
        <View className="bg-primary/10 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <Calendar size={20} color="#2e5afa" />
            <Text className="text-lg font-semibold text-foreground ml-2">
              오늘
            </Text>
          </View>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">0</Text>
              <Text className="text-muted-foreground text-sm">운동</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">0</Text>
              <Text className="text-muted-foreground text-sm">식사</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary">0</Text>
              <Text className="text-muted-foreground text-sm">칼로리</Text>
            </View>
          </View>
        </View>

        {/* 운동 기록 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/workout')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
              <Dumbbell size={20} color="#f97316" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              운동 기록
            </Text>
          </View>
          <Text className="text-muted-foreground">
            운동 루틴을 기록하고 진행 상황을 확인하세요
          </Text>
        </Pressable>

        {/* 식단 기록 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/nutrition')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center mr-3">
              <UtensilsCrossed size={20} color="#10b981" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              식단 기록
            </Text>
          </View>
          <Text className="text-muted-foreground">
            식사를 기록하고 영양 균형을 확인하세요
          </Text>
        </Pressable>

        {/* 통계 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/reports')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-violet-100 rounded-full items-center justify-center mr-3">
              <BarChart3 size={20} color="#8b5cf6" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              주간 리포트
            </Text>
          </View>
          <Text className="text-muted-foreground">
            일주일간의 활동을 분석한 리포트를 확인하세요
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
