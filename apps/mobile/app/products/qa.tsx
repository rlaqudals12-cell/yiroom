/**
 * 제품 Q&A 화면
 *
 * 제품에 대한 질문과 답변을 확인하고 작성한다.
 */
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';

import { useTheme } from '../../lib/theme';

interface QAItem {
  id: string;
  question: string;
  author: string;
  date: string;
  answer: string | null;
  answeredBy: string | null;
  likes: number;
}

const MOCK_QA: QAItem[] = [
  {
    id: '1',
    question: '민감성 피부에도 사용 가능한가요?',
    author: '뷰티러버',
    date: '2026-02-28',
    answer: '네, 이 제품은 저자극 테스트를 완료했으며 민감성 피부에도 적합합니다. 다만 처음 사용 시 팔 안쪽에 패치 테스트를 권장해요.',
    answeredBy: '이룸 뷰티 전문가',
    likes: 12,
  },
  {
    id: '2',
    question: '여름에도 사용해도 되나요? 끈적임이 있나요?',
    author: '여름피부',
    date: '2026-02-25',
    answer: '가벼운 젤 타입이라 여름에도 끈적임 없이 사용 가능해요. 자외선 차단제와 함께 사용하면 더 좋아요.',
    answeredBy: '이룸 뷰티 전문가',
    likes: 8,
  },
  {
    id: '3',
    question: '임산부도 사용 가능한가요?',
    author: '예비맘',
    date: '2026-02-20',
    answer: null,
    answeredBy: null,
    likes: 5,
  },
  {
    id: '4',
    question: '유통기한이 개봉 후 얼마나 되나요?',
    author: '궁금이',
    date: '2026-02-15',
    answer: '개봉 후 12개월 이내에 사용을 권장해요. 직사광선을 피해 서늘한 곳에 보관하세요.',
    answeredBy: '이룸 뷰티 전문가',
    likes: 3,
  },
];

export default function ProductQAScreen(): React.ReactElement {
  const { colors, spacing, radii, typography, brand } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollView
      testID="product-qa-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        제품 Q&A
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        궁금한 점을 질문하고 답변을 확인하세요
      </Text>

      {/* 질문하기 CTA */}
      <Pressable
        accessibilityLabel="새 질문 작성"
        style={{
          backgroundColor: brand.primary,
          borderRadius: radii.lg,
          paddingVertical: spacing.smx,
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: brand.primaryForeground }}>
          질문하기
        </Text>
      </Pressable>

      {/* Q&A 목록 */}
      <View style={{ gap: spacing.sm }}>
        {MOCK_QA.map((item) => {
          const expanded = expandedId === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityLabel={`질문: ${item.question}`}
              onPress={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
              style={{
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: spacing.md,
              }}
            >
              {/* 질문 */}
              <View style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: typography.size.base, color: brand.primary, marginRight: spacing.xs, fontWeight: typography.weight.bold }}>
                  Q
                </Text>
                <Text style={{ flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
                  {item.question}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                  {item.author} · {item.date}
                </Text>
                <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                  ♥ {item.likes}
                </Text>
              </View>

              {/* 답변 */}
              {expanded && (
                <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                  {item.answer ? (
                    <>
                      <View style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
                        <Text style={{ fontSize: typography.size.base, color: colors.accent, marginRight: spacing.xs, fontWeight: typography.weight.bold }}>
                          A
                        </Text>
                        <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 }}>
                          {item.answer}
                        </Text>
                      </View>
                      <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, textAlign: 'right' }}>
                        {item.answeredBy}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, fontStyle: 'italic' }}>
                      아직 답변이 없어요. 곧 전문가가 답변할 예정이에요.
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
