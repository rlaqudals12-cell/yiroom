/**
 * FAQ 화면 — 자주 묻는 질문 검색 + 아코디언
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';

import { useTheme } from '@/lib/theme';
import { ScreenContainer } from '@/components/ui';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'AI 분석은 어떻게 작동하나요?',
    answer: '사진을 업로드하면 AI가 피부, 체형, 퍼스널컬러 등을 분석해요. Google Gemini AI를 활용하여 정밀한 분석 결과를 제공합니다.',
    category: '분석',
  },
  {
    id: '2',
    question: '분석 결과는 정확한가요?',
    answer: 'AI 분석은 참고용이며 전문가 진단을 대체하지 않아요. 조명, 카메라 각도 등에 따라 결과가 달라질 수 있어요. 자연광에서 정면 촬영하면 더 정확한 결과를 얻을 수 있어요.',
    category: '분석',
  },
  {
    id: '3',
    question: '사진 데이터는 안전한가요?',
    answer: '모든 사진은 분석 후 서버에서 즉시 삭제돼요. 개인 정보는 암호화되어 저장되며, 제3자에게 공유되지 않아요.',
    category: '개인정보',
  },
  {
    id: '4',
    question: '무료로 사용할 수 있나요?',
    answer: '기본 분석 기능은 무료로 제공돼요. 일일 분석 횟수 제한이 있을 수 있으며, 향후 프리미엄 기능이 추가될 수 있어요.',
    category: '요금',
  },
  {
    id: '5',
    question: '운동 기록은 어떻게 하나요?',
    answer: '운동 탭에서 운동 종류를 선택하고 시간을 입력하면 칼로리 소모량이 자동 계산돼요. MET 기반 과학적 공식을 사용해요.',
    category: '운동',
  },
  {
    id: '6',
    question: '식단 기록은 어떻게 하나요?',
    answer: '영양 탭에서 음식 사진을 찍거나 검색하여 기록할 수 있어요. AI가 음식을 인식하고 칼로리와 영양소를 자동으로 계산해줘요.',
    category: '영양',
  },
  {
    id: '7',
    question: '퍼스널컬러란 무엇인가요?',
    answer: '퍼스널컬러는 개인의 피부톤, 눈동자색, 머리카락 색상 등을 종합적으로 분석하여 가장 잘 어울리는 색상 팔레트를 찾아주는 시스템이에요. 봄, 여름, 가을, 겨울 4계절로 나뉘어요.',
    category: '분석',
  },
  {
    id: '8',
    question: '계정을 삭제하고 싶어요',
    answer: '프로필 > 설정 > 계정 삭제에서 계정을 삭제할 수 있어요. 삭제 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없어요.',
    category: '계정',
  },
];

export default function FAQScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = searchQuery.trim()
    ? FAQ_DATA.filter(
        (faq) =>
          faq.question.includes(searchQuery) ||
          faq.answer.includes(searchQuery) ||
          faq.category.includes(searchQuery)
      )
    : FAQ_DATA;

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: FAQItem; index: number }) => {
      const isExpanded = expandedId === item.id;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          <Pressable
            style={[
              styles.faqItem,
              {
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                borderColor: isExpanded ? brand.primary + '40' : colors.border,
                padding: spacing.md,
                marginBottom: spacing.sm,
              },
            ]}
            onPress={() => toggleExpand(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.question}
            accessibilityState={{ expanded: isExpanded }}
          >
            <View style={styles.questionRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: brand.primary + '15',
                      borderRadius: radii.sm,
                      marginBottom: spacing.xs,
                      alignSelf: 'flex-start',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: typography.size.xs,
                      color: brand.primary,
                      fontWeight: typography.weight.medium,
                    }}
                  >
                    {item.category}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: colors.foreground,
                    lineHeight: typography.size.sm * 1.5,
                  }}
                >
                  {item.question}
                </Text>
              </View>
              {isExpanded ? (
                <ChevronUp size={18} color={colors.mutedForeground} />
              ) : (
                <ChevronDown size={18} color={colors.mutedForeground} />
              )}
            </View>
            {isExpanded && (
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  lineHeight: typography.size.sm * 1.7,
                  marginTop: spacing.sm,
                }}
              >
                {item.answer}
              </Text>
            )}
          </Pressable>
        </Animated.View>
      );
    },
    [expandedId, colors, spacing, radii, typography, brand, toggleExpand]
  );

  return (
    <ScreenContainer testID="faq-screen" scrollable={false} edges={['bottom']}>
      {/* 검색 */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.lg,
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <Search size={18} color={colors.mutedForeground} />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: colors.foreground,
              fontSize: typography.size.sm,
              marginLeft: spacing.sm,
            },
          ]}
          placeholder="질문을 검색해보세요"
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="FAQ 검색"
          returnKeyType="search"
        />
      </View>

      {/* FAQ 목록 */}
      <FlatList
        data={filteredFAQs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xxl,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔍</Text>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.xs,
              }}
            >
              검색 결과가 없어요
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                textAlign: 'center',
              }}
            >
              다른 키워드로 검색해보세요
            </Text>
          </View>
        }
      />

      {/* 하단 피드백 링크 */}
      <View
        style={[
          styles.feedbackBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            padding: spacing.md,
          },
        ]}
      >
        <Pressable
          style={[
            styles.feedbackButton,
            {
              backgroundColor: brand.primary + '10',
              borderRadius: radii.lg,
              padding: spacing.md,
            },
          ]}
          onPress={() => router.push('/help/feedback')}
          accessibilityRole="button"
          accessibilityLabel="피드백 보내기"
        >
          <MessageCircle size={20} color={brand.primary} />
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: brand.primary,
              marginLeft: spacing.sm,
            }}
          >
            원하는 답변을 찾지 못했나요?
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: 44,
  },
  faqItem: {
    borderWidth: 1,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  categoryBadge: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  feedbackBar: {
    borderTopWidth: 1,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
