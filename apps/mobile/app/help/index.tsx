/**
 * 도움말/FAQ 스크린
 */
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/theme';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: '1',
    question: '분석 결과는 얼마나 정확한가요?',
    answer:
      'AI 분석 결과는 참고용이에요. 퍼스널 컬러, 피부, 체형 분석 모두 전문가 상담을 대체하지 않아요. 조명과 사진 품질에 따라 결과가 달라질 수 있어요.',
  },
  {
    id: '2',
    question: '사진은 어떻게 촬영하면 좋나요?',
    answer:
      '자연광에서 정면을 바라보고 촬영하세요. 화장을 하지 않은 상태가 피부/퍼스널 컬러 분석에 가장 정확해요. 체형 분석은 밝은 배경에서 전신이 나오도록 촬영해주세요.',
  },
  {
    id: '3',
    question: '분석 결과를 다시 받을 수 있나요?',
    answer:
      '네, 언제든 다시 분석할 수 있어요. 새로운 사진으로 분석하면 이전 결과와 비교할 수도 있어요.',
  },
  {
    id: '4',
    question: '운동/식단 데이터는 어디에 저장되나요?',
    answer:
      '모든 데이터는 안전한 클라우드 서버에 암호화되어 저장돼요. 본인만 접근할 수 있으며, 계정 삭제 시 모든 데이터가 영구 삭제돼요.',
  },
  {
    id: '5',
    question: '오프라인에서도 사용할 수 있나요?',
    answer:
      '기본적인 기록 확인과 일부 기능은 오프라인에서도 가능해요. AI 분석과 데이터 동기화는 인터넷 연결이 필요해요.',
  },
  {
    id: '6',
    question: '알림이 오지 않아요',
    answer:
      '설정 > 알림 설정에서 알림이 활성화되어 있는지 확인해주세요. 기기의 알림 권한도 허용되어 있어야 해요. (설정 앱 > 이룸 > 알림 허용)',
  },
];

export default function HelpScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView
      testID="help-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md + 4 }}>
        {/* 헤더 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: typography.size.xl,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            도움말
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
            }}
          >
            자주 묻는 질문을 확인해보세요
          </Text>
        </View>

        {/* FAQ 목록 */}
        {FAQ_LIST.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              marginBottom: spacing.sm + 2,
            }}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.questionRow}>
              <Text
                style={{
                  flex: 1,
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.medium,
                  color: colors.foreground,
                  lineHeight: 22,
                }}
              >
                {item.question}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.mutedForeground,
                  marginLeft: spacing.sm,
                }}
              >
                {expandedId === item.id ? '▲' : '▼'}
              </Text>
            </View>
            {expandedId === item.id && (
              <Text
                style={{
                  marginTop: spacing.sm + 2,
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  lineHeight: 22,
                }}
              >
                {item.answer}
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {/* 문의하기 */}
        <View
          style={{
            backgroundColor: brand.primary + '15',
            borderRadius: radii.lg,
            padding: spacing.md + 4,
            alignItems: 'center',
            marginTop: spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
              marginBottom: spacing.sm,
            }}
          >
            찾는 답이 없나요?
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: brand.primary,
              borderRadius: radii.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
            }}
            onPress={() => Linking.openURL('mailto:support@yiroom.app')}
          >
            <Text
              style={{
                color: brand.primaryForeground,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
              }}
            >
              문의하기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
