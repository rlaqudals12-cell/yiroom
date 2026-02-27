/**
 * 이용약관 네이티브 화면
 *
 * Google Play 제출 요건을 위한 서비스 이용약관.
 * 한/영 토글 지원.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';

import { ScreenContainer } from '@/components/ui';
import { useTheme, typography} from '../lib/theme';

type Lang = 'ko' | 'en';

export default function TermsScreen() {
  const { colors, brand: brandColors, radii, isDark, typography } = useTheme();
  const [lang, setLang] = useState<Lang>('ko');

  return (
    <ScreenContainer
      edges={['bottom']}
      testID="terms-screen"
      contentContainerStyle={styles.content}
    >
        {/* 언어 토글 */}
        <View style={styles.langToggle}>
          <Pressable
            style={[
              styles.langButton,
              {
                backgroundColor: lang === 'ko' ? brandColors.primary : colors.muted,
                borderRadius: radii.lg,
              },
            ]}
            onPress={() => setLang('ko')}
            accessibilityLabel="한국어로 보기"
          >
            <Text
              style={[
                styles.langButtonText,
                {
                  color: lang === 'ko' ? brandColors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              한국어
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.langButton,
              {
                backgroundColor: lang === 'en' ? brandColors.primary : colors.muted,
                borderRadius: radii.lg,
              },
            ]}
            onPress={() => setLang('en')}
            accessibilityLabel="View in English"
          >
            <Text
              style={[
                styles.langButtonText,
                {
                  color: lang === 'en' ? brandColors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              English
            </Text>
          </Pressable>
        </View>

        {lang === 'ko' ? <KoreanTerms colors={colors} /> : <EnglishTerms colors={colors} />}
    </ScreenContainer>
  );
}

interface TermsProps {
  colors: {
    foreground: string;
    mutedForeground: string;
    muted: string;
    cardForeground: string;
  };
}

function SectionTitle({ children, colors }: { children: string; colors: TermsProps['colors'] }) {
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{children}</Text>;
}

function Paragraph({ children, colors }: { children: string; colors: TermsProps['colors'] }) {
  return <Text style={[styles.paragraph, { color: colors.foreground }]}>{children}</Text>;
}

function BulletItem({ children, colors }: { children: string; colors: TermsProps['colors'] }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, { color: colors.mutedForeground }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.foreground }]}>{children}</Text>
    </View>
  );
}

function KoreanTerms({ colors }: TermsProps) {
  return (
    <View>
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
        시행일: 2026년 2월 20일
      </Text>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제1조 (목적)</SectionTitle>
        <Paragraph colors={colors}>
          이 약관은 이룸(이하 "회사")이 제공하는 통합 웰니스 AI 플랫폼 서비스(이하 "서비스")의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을
          목적으로 합니다.
        </Paragraph>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제2조 (정의)</SectionTitle>
        <BulletItem colors={colors}>
          "서비스"란 회사가 제공하는 퍼스널컬러 진단, 피부 분석, 체형 분석, 운동/영양 관리, AI 코칭
          등의 웰니스 서비스를 말합니다.
        </BulletItem>
        <BulletItem colors={colors}>
          "이용자"란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.
        </BulletItem>
        <BulletItem colors={colors}>
          "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스를 이용할 수 있는 자를
          말합니다.
        </BulletItem>
        <BulletItem colors={colors}>
          "AI 분석"이란 이용자가 업로드한 이미지를 기반으로 인공지능이 수행하는 진단 및 분석
          서비스를 말합니다.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제3조 (약관의 효력 및 변경)</SectionTitle>
        <BulletItem colors={colors}>
          이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.
        </BulletItem>
        <BulletItem colors={colors}>
          회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있습니다.
        </BulletItem>
        <BulletItem colors={colors}>
          약관이 변경되는 경우, 회사는 변경 사항을 시행일 7일 전부터 서비스 내 공지합니다.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제4조 (서비스의 내용)</SectionTitle>
        <Paragraph colors={colors}>회사가 제공하는 서비스는 다음과 같습니다:</Paragraph>
        <BulletItem colors={colors}>
          AI 기반 분석 서비스 (퍼스널컬러, 피부, 체형, 헤어, 메이크업, 구강건강)
        </BulletItem>
        <BulletItem colors={colors}>운동 및 영양 관리 서비스</BulletItem>
        <BulletItem colors={colors}>AI 웰니스 코칭 서비스</BulletItem>
        <BulletItem colors={colors}>맞춤형 제품 추천 서비스</BulletItem>
        <BulletItem colors={colors}>소셜 기능 (친구, 피드, 챌린지, 리더보드)</BulletItem>
        <BulletItem colors={colors}>기타 회사가 추후 개발하여 제공하는 서비스</BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제5조 (AI 분석 서비스 면책)</SectionTitle>
        <Paragraph colors={colors}>
          AI 분석 결과는 참고 목적으로만 제공되며, 의학적 진단이나 전문적 조언을 대체하지 않습니다.
          분석 결과에 따른 의사결정은 이용자 본인의 책임입니다.
        </Paragraph>
        <BulletItem colors={colors}>
          AI 분석은 이미지 품질, 조명 등 환경에 따라 결과가 달라질 수 있습니다.
        </BulletItem>
        <BulletItem colors={colors}>
          피부/건강 관련 우려가 있는 경우 반드시 전문의와 상담하시기 바랍니다.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제6조 (이용자의 의무)</SectionTitle>
        <Paragraph colors={colors}>이용자는 다음 행위를 하여서는 안 됩니다:</Paragraph>
        <BulletItem colors={colors}>타인의 정보를 도용하여 서비스를 이용하는 행위</BulletItem>
        <BulletItem colors={colors}>
          서비스를 통해 얻은 정보를 회사의 사전 승낙 없이 복제, 배포하는 행위
        </BulletItem>
        <BulletItem colors={colors}>회사의 서비스 운영을 방해하는 행위</BulletItem>
        <BulletItem colors={colors}>타인의 명예를 훼손하거나 불이익을 주는 행위</BulletItem>
        <BulletItem colors={colors}>관련 법령에 위반하는 행위</BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제7조 (서비스의 중단)</SectionTitle>
        <Paragraph colors={colors}>
          회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한
          경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
        </Paragraph>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제8조 (회원 탈퇴 및 자격 상실)</SectionTitle>
        <BulletItem colors={colors}>
          회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 처리합니다.
        </BulletItem>
        <BulletItem colors={colors}>
          탈퇴 시 개인정보 및 서비스 이용 기록은 개인정보처리방침에 따라 처리됩니다.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제9조 (저작권)</SectionTitle>
        <Paragraph colors={colors}>
          서비스에서 제공되는 콘텐츠(AI 분석 알고리즘, UI 디자인, 텍스트 등)의 저작권은 회사에
          귀속됩니다. 이용자는 서비스를 이용하여 얻은 정보를 개인적 용도로만 사용할 수 있습니다.
        </Paragraph>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>제10조 (분쟁 해결)</SectionTitle>
        <Paragraph colors={colors}>
          이 약관에 관한 분쟁은 대한민국 법령에 따라 해결하며, 회사의 본사 소재지를 관할하는 법원을
          전속 관할 법원으로 합니다.
        </Paragraph>
      </View>

      <View style={[styles.contactBox, { backgroundColor: colors.muted }]}>
        <Text style={[styles.contactTitle, { color: colors.cardForeground }]}>문의</Text>
        <Text style={[styles.contactText, { color: colors.cardForeground }]}>
          이메일: support@yiroom.app
        </Text>
      </View>
    </View>
  );
}

function EnglishTerms({ colors }: TermsProps) {
  return (
    <View>
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
        Effective: February 20, 2026
      </Text>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 1. Purpose</SectionTitle>
        <Paragraph colors={colors}>
          These Terms of Service ("Terms") govern the use of the integrated wellness AI platform
          service ("Service") provided by Yiroom ("Company") and define the rights, obligations, and
          responsibilities between the Company and users.
        </Paragraph>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 2. Definitions</SectionTitle>
        <BulletItem colors={colors}>
          "Service" refers to the wellness services provided by the Company, including personal
          color diagnosis, skin analysis, body type analysis, workout/nutrition management, and AI
          coaching.
        </BulletItem>
        <BulletItem colors={colors}>
          "User" refers to members and non-members who use the Service in accordance with these
          Terms.
        </BulletItem>
        <BulletItem colors={colors}>
          "Member" refers to a person who has registered as a member by providing personal
          information to the Company.
        </BulletItem>
        <BulletItem colors={colors}>
          "AI Analysis" refers to the diagnosis and analysis services performed by artificial
          intelligence based on images uploaded by users.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 3. Effectiveness and Changes</SectionTitle>
        <BulletItem colors={colors}>
          These Terms apply to all users who wish to use the Service.
        </BulletItem>
        <BulletItem colors={colors}>
          The Company may modify these Terms as necessary, within the scope of applicable laws.
        </BulletItem>
        <BulletItem colors={colors}>
          Changes will be announced within the Service at least 7 days before the effective date.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 4. Service Description</SectionTitle>
        <Paragraph colors={colors}>The Company provides the following services:</Paragraph>
        <BulletItem colors={colors}>
          AI-based analysis services (personal color, skin, body type, hair, makeup, oral health)
        </BulletItem>
        <BulletItem colors={colors}>Workout and nutrition management services</BulletItem>
        <BulletItem colors={colors}>AI wellness coaching services</BulletItem>
        <BulletItem colors={colors}>Personalized product recommendation services</BulletItem>
        <BulletItem colors={colors}>
          Social features (friends, feed, challenges, leaderboard)
        </BulletItem>
        <BulletItem colors={colors}>
          Other services developed and provided by the Company
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 5. AI Analysis Disclaimer</SectionTitle>
        <Paragraph colors={colors}>
          AI analysis results are provided for reference purposes only and do not replace medical
          diagnosis or professional advice. Users are responsible for decisions made based on
          analysis results.
        </Paragraph>
        <BulletItem colors={colors}>
          AI analysis results may vary depending on image quality, lighting, and other environmental
          factors.
        </BulletItem>
        <BulletItem colors={colors}>
          Please consult a medical professional for any skin or health concerns.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 6. User Obligations</SectionTitle>
        <Paragraph colors={colors}>Users must not engage in the following activities:</Paragraph>
        <BulletItem colors={colors}>
          Using the Service by misappropriating another person's information
        </BulletItem>
        <BulletItem colors={colors}>
          Reproducing or distributing information obtained through the Service without prior consent
        </BulletItem>
        <BulletItem colors={colors}>Interfering with the Company's service operations</BulletItem>
        <BulletItem colors={colors}>Defaming or disadvantaging other users</BulletItem>
        <BulletItem colors={colors}>Violating applicable laws and regulations</BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 7. Service Interruption</SectionTitle>
        <Paragraph colors={colors}>
          The Company may temporarily suspend the Service for maintenance, replacement, or failure
          of information and communication facilities, or in the event of communication disruptions.
        </Paragraph>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 8. Account Termination</SectionTitle>
        <BulletItem colors={colors}>
          Members may request account termination at any time, and the Company will process it
          immediately.
        </BulletItem>
        <BulletItem colors={colors}>
          Upon termination, personal data and service usage records will be handled according to the
          Privacy Policy.
        </BulletItem>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 9. Intellectual Property</SectionTitle>
        <Paragraph colors={colors}>
          Copyright of content provided through the Service (AI analysis algorithms, UI design,
          text, etc.) belongs to the Company. Users may only use information obtained through the
          Service for personal purposes.
        </Paragraph>
      </View>

      <View style={styles.section}>
        <SectionTitle colors={colors}>Article 10. Dispute Resolution</SectionTitle>
        <Paragraph colors={colors}>
          Disputes related to these Terms shall be resolved in accordance with the laws of the
          Republic of Korea, and the court with jurisdiction over the Company's headquarters shall
          be the exclusive court of jurisdiction.
        </Paragraph>
      </View>

      <View style={[styles.contactBox, { backgroundColor: colors.muted }]}>
        <Text style={[styles.contactTitle, { color: colors.cardForeground }]}>Contact</Text>
        <Text style={[styles.contactText, { color: colors.cardForeground }]}>
          Email: support@yiroom.app
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  langToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  langButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  lastUpdated: {
    fontSize: typography.size.sm,
    marginBottom: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 15,
    marginRight: 8,
    marginTop: 1,
  },
  bulletText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    flex: 1,
  },
  contactBox: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: 8,
  },
  contactText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
});
