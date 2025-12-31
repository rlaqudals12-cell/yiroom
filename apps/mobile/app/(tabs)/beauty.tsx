/**
 * 뷰티 탭
 * 피부 분석, 퍼스널 컬러, 화장품 추천
 */
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Palette, Droplets } from 'lucide-react-native';

export default function BeautyTab() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-6">뷰티</Text>

        {/* 피부 분석 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/(analysis)/skin')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mr-3">
              <Droplets size={20} color="#ec4899" />
            </View>
            <Text className="text-lg font-semibold text-foreground">피부 분석</Text>
          </View>
          <Text className="text-muted-foreground">
            AI가 피부 상태를 분석하고 맞춤 케어를 추천해요
          </Text>
        </Pressable>

        {/* 퍼스널 컬러 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/(analysis)/personal-color')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
              <Palette size={20} color="#a855f7" />
            </View>
            <Text className="text-lg font-semibold text-foreground">퍼스널 컬러</Text>
          </View>
          <Text className="text-muted-foreground">
            나에게 어울리는 색상을 찾아보세요
          </Text>
        </Pressable>

        {/* 화장품 추천 카드 */}
        <Pressable
          className="bg-card rounded-2xl p-5 mb-4 border border-border"
          onPress={() => router.push('/products?category=cosmetics')}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-rose-100 rounded-full items-center justify-center mr-3">
              <Sparkles size={20} color="#f43f5e" />
            </View>
            <Text className="text-lg font-semibold text-foreground">추천 제품</Text>
          </View>
          <Text className="text-muted-foreground">
            내 피부 타입에 맞는 화장품을 추천받으세요
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
