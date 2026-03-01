/**
 * 개인정보/동의 관리 화면
 *
 * 이미지 저장 동의, 데이터 내보내기, 계정 삭제 등 개인정보 관련 설정.
 */
import { useState } from 'react';
import { View, Text, Switch, Pressable, Alert } from 'react-native';

import { useTheme } from '../../lib/theme';
import { ScreenContainer } from '../../components/ui';

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  defaultValue: boolean;
  required?: boolean;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'biometric',
    title: '생체정보(이미지) 저장 동의',
    description: '분석 이미지를 저장하여 변화 추적에 활용해요. 미동의 시에도 분석은 가능해요.',
    defaultValue: false,
  },
  {
    id: 'marketing',
    title: '마케팅 정보 수신 동의',
    description: '새로운 기능, 이벤트, 맞춤 추천 알림을 받아요.',
    defaultValue: false,
  },
  {
    id: 'analytics',
    title: '서비스 개선 데이터 수집',
    description: '앱 사용 패턴을 익명으로 수집하여 서비스를 개선해요.',
    defaultValue: true,
  },
];

export default function PrivacySettingsScreen(): React.ReactElement {
  const { colors, brand, spacing, radii, typography, status } = useTheme();

  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(CONSENT_ITEMS.map((item) => [item.id, item.defaultValue]))
  );

  const toggleConsent = (id: string): void => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportData = (): void => {
    Alert.alert(
      '데이터 내보내기',
      '내 데이터를 JSON 파일로 내보내요. 이메일로 전송될 예정이에요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '내보내기', onPress: () => Alert.alert('알림', '데이터 내보내기 요청이 접수되었어요.') },
      ]
    );
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      '계정 삭제',
      '모든 데이터가 영구 삭제되며 복구할 수 없어요. 정말 삭제하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => Alert.alert('알림', '계정 삭제 요청이 접수되었어요. 30일 이내 처리돼요.'),
        },
      ]
    );
  };

  return (
    <ScreenContainer testID="privacy-settings-screen" edges={['bottom']}>
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        개인정보 관리
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        동의 설정 및 데이터 관리
      </Text>

      {/* 동의 관리 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        동의 관리
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        {CONSENT_ITEMS.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xxs,
                }}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                {item.description}
              </Text>
            </View>
            <Switch
              value={consents[item.id]}
              onValueChange={() => toggleConsent(item.id)}
              trackColor={{ false: colors.secondary, true: brand.primary + '80' }}
              thumbColor={consents[item.id] ? brand.primary : colors.mutedForeground}
              accessibilityLabel={`${item.title} ${consents[item.id] ? '동의함' : '동의 안 함'}`}
            />
          </View>
        ))}
      </View>

      {/* 데이터 관리 */}
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        데이터 관리
      </Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        <Pressable
          accessibilityLabel="내 데이터 내보내기"
          onPress={handleExportData}
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: typography.size.lg, marginRight: spacing.smx }}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground }}>
              내 데이터 내보내기
            </Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
              JSON 형식으로 이메일 전송
            </Text>
          </View>
          <Text style={{ fontSize: typography.size.lg, color: colors.mutedForeground }}>›</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="계정 삭제"
          onPress={handleDeleteAccount}
          style={{
            backgroundColor: status.error + '10',
            borderRadius: radii.lg,
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: status.error + '30',
          }}
        >
          <Text style={{ fontSize: typography.size.lg, marginRight: spacing.smx }}>🗑️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: status.error }}>
              계정 삭제
            </Text>
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
              모든 데이터가 영구 삭제돼요
            </Text>
          </View>
          <Text style={{ fontSize: typography.size.lg, color: status.error }}>›</Text>
        </Pressable>
      </View>

      {/* 안내 */}
      <View
        style={{
          backgroundColor: status.info + '10',
          borderRadius: radii.lg,
          padding: spacing.md,
        }}
      >
        <Text style={{ fontSize: typography.size.sm, color: status.info, lineHeight: 20 }}>
          개인정보 관련 문의: privacy@yiroom.app{'\n'}
          동의 변경은 즉시 적용되며, 과거 수집 데이터에는 영향을 주지 않아요.
        </Text>
      </View>
    </ScreenContainer>
  );
}
