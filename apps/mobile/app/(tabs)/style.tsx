/**
 * 스타일 탭
 * 체형 분석, 패션 추천, 코디 가이드, 내 옷장
 */
import { useRouter } from 'expo-router';
import { Shirt, Ruler, ShoppingBag, Package, Wand2 } from 'lucide-react-native';
import { View, Text, ScrollView, Pressable } from 'react-native';

export default function StyleTab() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-6">스타일</Text>

        {/* 체형 분석 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/(analysis)/body')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Ruler size={20} color="#3b82f6" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              체형 분석
            </Text>
          </View>
          <Text className="text-muted-foreground">
            AI가 체형을 분석하고 어울리는 스타일을 추천해요
          </Text>
        </Pressable>

        {/* 패션 추천 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/products?category=fashion')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
              <Shirt size={20} color="#6366f1" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              패션 추천
            </Text>
          </View>
          <Text className="text-muted-foreground">
            체형과 퍼스널 컬러에 맞는 옷을 추천받으세요
          </Text>
        </Pressable>

        {/* 내 옷장 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/(closet)')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
              <Package size={20} color="#8b5cf6" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              내 옷장
            </Text>
          </View>
          <Text className="text-muted-foreground">
            옷장을 관리하고 AI 코디 추천을 받으세요
          </Text>
        </Pressable>

        {/* 코디 추천 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/(closet)/recommend')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mr-3">
              <Wand2 size={20} color="#ec4899" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              오늘의 코디
            </Text>
          </View>
          <Text className="text-muted-foreground">
            퍼스널컬러와 체형에 맞는 코디를 추천받으세요
          </Text>
        </Pressable>

        {/* 쇼핑 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/products')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
              <ShoppingBag size={20} color="#22c55e" />
            </View>
            <Text className="text-lg font-semibold text-foreground">
              제품 둘러보기
            </Text>
          </View>
          <Text className="text-muted-foreground">
            인기 제품과 할인 정보를 확인하세요
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
