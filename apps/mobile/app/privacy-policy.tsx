/**
 * 개인정보처리방침 네이티브 화면
 *
 * 웹 PrivacyContent.tsx와 동일한 내용을 네이티브로 표시.
 * 한/영 토글 지원.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../lib/theme';

type Lang = 'ko' | 'en';

export default function PrivacyPolicyScreen() {
  const { colors, brand: brandColors, radii, isDark } = useTheme();
  const [lang, setLang] = useState<Lang>('ko');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
      testID="privacy-policy-screen"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 언어 토글 */}
        <View style={styles.langToggle}>
          <TouchableOpacity
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
          </TouchableOpacity>
          <TouchableOpacity
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
          </TouchableOpacity>
        </View>

        {lang === 'ko' ? (
          <KoreanContent colors={colors} isDark={isDark} />
        ) : (
          <EnglishContent colors={colors} isDark={isDark} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 색상 타입
interface ContentProps {
  colors: {
    foreground: string;
    mutedForeground: string;
    muted: string;
    card: string;
    cardForeground: string;
  };
  isDark: boolean;
}

function SectionTitle({ children, colors }: { children: string; colors: ContentProps['colors'] }) {
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{children}</Text>;
}

function Paragraph({ children, colors }: { children: string; colors: ContentProps['colors'] }) {
  return <Text style={[styles.paragraph, { color: colors.foreground }]}>{children}</Text>;
}

function BulletItem({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ContentProps['colors'];
}) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, { color: colors.mutedForeground }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.foreground }]}>{children}</Text>
    </View>
  );
}

function InfoBox({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ContentProps['colors'];
}) {
  return <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>{children}</View>;
}

function KoreanContent({ colors, isDark }: ContentProps) {
  return (
    <View>
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
        최종 업데이트: 2026년 2월 20일
      </Text>

      {/* 1. 개인정보의 처리 목적 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>1. 개인정보의 처리 목적</SectionTitle>
        <Paragraph colors={colors}>
          이룸(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는
          다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를
          받는 등 필요한 조치를 이행할 예정입니다.
        </Paragraph>
        <BulletItem colors={colors}>
          회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증
        </BulletItem>
        <BulletItem colors={colors}>
          서비스 제공: 퍼스널 컬러 진단, 피부 분석, 체형 분석, 운동/영양 관리 서비스 제공
        </BulletItem>
        <BulletItem colors={colors}>
          AI 분석: 사용자가 업로드한 이미지를 기반으로 한 AI 분석 서비스 제공
        </BulletItem>
        <BulletItem colors={colors}>
          AI 코치: 사용자 맞춤형 웰니스 조언을 위한 AI 코칭 서비스 제공
        </BulletItem>
        <BulletItem colors={colors}>
          소셜 기능: 친구 연결, 활동 피드, 리더보드, 챌린지 참여 기능 제공
        </BulletItem>
        <BulletItem colors={colors}>
          제품 추천: 사용자 분석 결과 기반 맞춤형 제품 추천 및 제휴 서비스 제공
        </BulletItem>
        <BulletItem colors={colors}>
          서비스 개선: 서비스 이용 기록 분석, 서비스 개선 및 신규 서비스 개발
        </BulletItem>
      </View>

      {/* 2. 수집하는 개인정보 항목 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>2. 수집하는 개인정보 항목</SectionTitle>
        <Paragraph colors={colors}>
          회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
        </Paragraph>
        <BulletItem colors={colors}>필수 항목: 이메일 주소, 비밀번호, 닉네임</BulletItem>
        <BulletItem colors={colors}>선택 항목: 프로필 사진, 키, 체중, 생년월일, 성별</BulletItem>
        <BulletItem colors={colors}>
          서비스 이용 시 수집: 얼굴/체형 이미지, 운동 기록, 식단 기록, AI 코치 대화 내용
        </BulletItem>
        <BulletItem colors={colors}>
          소셜 기능 이용 시: 친구 목록, 활동 피드 게시물, 댓글, 좋아요 기록
        </BulletItem>
        <BulletItem colors={colors}>
          자동 수집: 서비스 이용 기록, 접속 로그, 기기 정보, 제휴 링크 클릭 기록
        </BulletItem>
      </View>

      {/* 3. 개인정보의 보유 및 이용 기간 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>3. 개인정보의 보유 및 이용 기간</SectionTitle>
        <Paragraph colors={colors}>
          회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
          동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
        </Paragraph>
        <BulletItem colors={colors}>
          회원 정보: 회원 탈퇴 시까지 (탈퇴 후 30일 이내 파기)
        </BulletItem>
        <BulletItem colors={colors}>
          분석 이미지: 별도 동의 시 동의일로부터 1년간 보관, 미동의 시 분석 완료 후 즉시 삭제
        </BulletItem>
        <BulletItem colors={colors}>
          AI 코치 대화: 세션 종료 시 삭제 (대화 내용은 서버에 영구 저장하지 않음)
        </BulletItem>
        <BulletItem colors={colors}>
          소셜 활동 기록: 회원 탈퇴 시까지 (탈퇴 후 30일 이내 파기)
        </BulletItem>
        <BulletItem colors={colors}>서비스 이용 기록: 3년</BulletItem>
      </View>

      {/* 4. 민감정보(생체정보)의 처리 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>4. 민감정보(생체정보)의 처리</SectionTitle>
        <Paragraph colors={colors}>
          회사는 개인정보보호법 제23조에 따라 사용자의 얼굴, 체형 등 생체정보를 수집·이용하는 경우
          별도의 동의를 받습니다.
        </Paragraph>
        <BulletItem colors={colors}>
          수집 항목: 피부 분석용 얼굴 이미지, 체형 분석용 전신 이미지, 퍼스널 컬러 분석용 이미지
        </BulletItem>
        <BulletItem colors={colors}>
          처리 목적: AI 기반 피부/체형/퍼스널컬러 분석 및 변화 추적
        </BulletItem>
        <BulletItem colors={colors}>보유 기간: 동의 시 1년, 동의 철회 시 즉시 삭제</BulletItem>
        <BulletItem colors={colors}>동의 방법: 분석 기능 사용 시 별도 동의 화면 제공</BulletItem>
        <BulletItem colors={colors}>
          {'동의 철회: 설정 > 개인정보 메뉴에서 언제든지 철회 가능'}
        </BulletItem>
        <View style={[styles.warningBox, isDark && styles.warningBoxDark]}>
          <Text style={[styles.warningText, isDark && styles.warningTextDark]}>
            안내: 이미지 저장에 동의하지 않아도 분석 서비스는 이용 가능합니다. 다만 이전 분석
            결과와의 비교(변화 추적) 기능은 사용할 수 없습니다.
          </Text>
        </View>
      </View>

      {/* 5. 개인정보의 제3자 제공 및 AI 서비스 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>5. 개인정보의 제3자 제공 및 AI 서비스</SectionTitle>
        <Paragraph colors={colors}>
          회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며,
          다음의 경우를 제외하고는 정보주체의 사전 동의 없이 본래의 목적 범위를 초과하여 처리하거나
          제3자에게 제공하지 않습니다.
        </Paragraph>
        <BulletItem colors={colors}>정보주체로부터 별도의 동의를 받은 경우</BulletItem>
        <BulletItem colors={colors}>법률에 특별한 규정이 있는 경우</BulletItem>
        <BulletItem colors={colors}>
          정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전
          동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을
          위하여 필요하다고 인정되는 경우
        </BulletItem>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            AI 분석 서비스 관련 제3자 제공
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            이룸의 AI 분석 기능(퍼스널컬러, 피부, 체형 등)은 Google Gemini API를 활용합니다. 분석 시
            사용자의 이미지 데이터가 Google의 AI 서버로 전송되어 처리됩니다.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://ai.google.dev/gemini-api/terms')}
          >
            <Text style={styles.linkText}>Google Gemini API Terms of Service →</Text>
          </TouchableOpacity>
        </InfoBox>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            제휴 서비스 이용 시 안내
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            서비스 내 제품 추천 링크를 통해 외부 쇼핑몰(쿠팡 등)로 이동하는 경우, 해당 외부 서비스의
            개인정보처리방침이 적용됩니다. 이룸은 제휴 링크 클릭 여부만 익명으로 집계하며, 외부
            서비스에서의 구매 정보는 수집하지 않습니다.
          </Text>
        </InfoBox>
      </View>

      {/* 6. 개인정보의 파기 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>6. 개인정보의 파기</SectionTitle>
        <Paragraph colors={colors}>
          회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
          지체없이 해당 개인정보를 파기합니다.
        </Paragraph>
        <BulletItem colors={colors}>
          전자적 파일 형태: 복구 및 재생이 불가능하도록 안전하게 삭제
        </BulletItem>
        <BulletItem colors={colors}>기록물, 인쇄물, 서면 등: 분쇄기로 분쇄하거나 소각</BulletItem>
      </View>

      {/* 7. 이용자의 권리 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>7. 이용자의 권리</SectionTitle>
        <Paragraph colors={colors}>
          정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
        </Paragraph>
        <BulletItem colors={colors}>개인정보 열람 요구</BulletItem>
        <BulletItem colors={colors}>오류 등이 있을 경우 정정 요구</BulletItem>
        <BulletItem colors={colors}>삭제 요구</BulletItem>
        <BulletItem colors={colors}>처리정지 요구</BulletItem>
      </View>

      {/* 8. 계정 삭제 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>8. 계정 삭제</SectionTitle>
        <Paragraph colors={colors}>
          사용자는 언제든지 자신의 계정과 관련 데이터를 삭제할 수 있습니다:
        </Paragraph>
        <BulletItem colors={colors}>{'설정 > 계정 관리 > 회원 탈퇴를 통해 직접 삭제'}</BulletItem>
        <BulletItem colors={colors}>이메일(privacy@yiroom.app)로 삭제 요청</BulletItem>
        <BulletItem colors={colors}>
          탈퇴 시 모든 개인정보 및 분석 결과는 30일 이내 완전 파기
        </BulletItem>
      </View>

      {/* 9. 개인정보 보호책임자 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>9. 개인정보 보호책임자</SectionTitle>
        <Paragraph colors={colors}>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
          불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </Paragraph>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            개인정보 보호책임자
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            이메일: privacy@yiroom.app
          </Text>
        </InfoBox>
      </View>

      {/* 10. 개인정보처리방침의 변경 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>10. 개인정보처리방침의 변경</SectionTitle>
        <Paragraph colors={colors}>
          이 개인정보처리방침은 2026년 2월 20일부터 적용됩니다. 이전의 개인정보처리방침은 아래에서
          확인하실 수 있습니다.
        </Paragraph>
        <Text style={[styles.historyItem, { color: colors.mutedForeground }]}>
          • 2026년 1월 8일 ~ 2026년 2월 19일 적용 버전
        </Text>
        <Text style={[styles.historyItem, { color: colors.mutedForeground }]}>
          • 2025년 1월 20일 ~ 2026년 1월 7일 적용 버전
        </Text>
      </View>
    </View>
  );
}

function EnglishContent({ colors, isDark }: ContentProps) {
  return (
    <View>
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
        Last updated: February 20, 2026
      </Text>

      {/* 1. Purpose */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>1. Purpose of Processing Personal Data</SectionTitle>
        <Paragraph colors={colors}>
          Yiroom ("Company") processes personal data for the following purposes. Data collected will
          not be used beyond these stated purposes. If purposes change, we will obtain separate
          consent and take necessary measures.
        </Paragraph>
        <BulletItem colors={colors}>
          Membership management: identity verification and authentication for account registration
        </BulletItem>
        <BulletItem colors={colors}>
          Service delivery: personal color diagnosis, skin analysis, body type analysis, workout and
          nutrition management
        </BulletItem>
        <BulletItem colors={colors}>
          AI analysis: AI-powered analysis based on user-uploaded images
        </BulletItem>
        <BulletItem colors={colors}>
          AI coaching: personalized wellness advice through AI coaching
        </BulletItem>
        <BulletItem colors={colors}>
          Social features: friend connections, activity feeds, leaderboards, and challenges
        </BulletItem>
        <BulletItem colors={colors}>
          Product recommendations: personalized product suggestions based on analysis results and
          affiliate services
        </BulletItem>
        <BulletItem colors={colors}>
          Service improvement: analysis of usage records, service improvement, and new feature
          development
        </BulletItem>
      </View>

      {/* 2. Categories */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>2. Categories of Personal Data Collected</SectionTitle>
        <Paragraph colors={colors}>
          The Company collects the following personal data to provide its services:
        </Paragraph>
        <BulletItem colors={colors}>Required: Email address, password, nickname</BulletItem>
        <BulletItem colors={colors}>
          Optional: Profile photo, height, weight, date of birth, gender
        </BulletItem>
        <BulletItem colors={colors}>
          Collected during service use: Face/body images, workout records, diet records, AI coach
          conversation content
        </BulletItem>
        <BulletItem colors={colors}>
          Social features: Friend lists, activity feed posts, comments, likes
        </BulletItem>
        <BulletItem colors={colors}>
          Automatically collected: Service usage logs, access logs, device information, affiliate
          link click records
        </BulletItem>
      </View>

      {/* 3. Retention */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>3. Data Retention Periods</SectionTitle>
        <Paragraph colors={colors}>
          The Company retains and processes personal data within the retention period required by
          applicable laws or as agreed upon during data collection.
        </Paragraph>
        <BulletItem colors={colors}>
          Account information: Until account deletion (destroyed within 30 days of deletion)
        </BulletItem>
        <BulletItem colors={colors}>
          Analysis images: Retained for 1 year with consent; immediately deleted after analysis if
          no consent given
        </BulletItem>
        <BulletItem colors={colors}>
          AI coach conversations: Deleted upon session end (conversations are not permanently stored
          on servers)
        </BulletItem>
        <BulletItem colors={colors}>
          Social activity records: Until account deletion (destroyed within 30 days of deletion)
        </BulletItem>
        <BulletItem colors={colors}>Service usage logs: 3 years</BulletItem>
      </View>

      {/* 4. Biometric */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>4. Processing of Biometric Data</SectionTitle>
        <Paragraph colors={colors}>
          In accordance with Article 23 of the Personal Information Protection Act (Korea), the
          Company obtains separate consent when collecting and using biometric data such as facial
          features and body shape.
        </Paragraph>
        <BulletItem colors={colors}>
          Data collected: Facial images for skin analysis, full-body images for body type analysis,
          images for personal color analysis
        </BulletItem>
        <BulletItem colors={colors}>
          Purpose: AI-powered skin, body type, and personal color analysis, and progress tracking
        </BulletItem>
        <BulletItem colors={colors}>
          Retention: 1 year with consent; immediately deleted upon consent withdrawal
        </BulletItem>
        <BulletItem colors={colors}>
          Consent method: Separate consent screen provided when using analysis features
        </BulletItem>
        <BulletItem colors={colors}>
          {'Withdrawal: Can be withdrawn anytime via Settings > Privacy'}
        </BulletItem>
        <View style={[styles.warningBox, isDark && styles.warningBoxDark]}>
          <Text style={[styles.warningText, isDark && styles.warningTextDark]}>
            Note: Analysis services are available even without consenting to image storage. However,
            comparison with previous results (progress tracking) will not be available.
          </Text>
        </View>
      </View>

      {/* 5. Third-Party */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>5. Third-Party Data Sharing and AI Services</SectionTitle>
        <Paragraph colors={colors}>
          The Company does not share personal data with third parties beyond the stated purposes
          without prior consent, except in the following cases:
        </Paragraph>
        <BulletItem colors={colors}>
          When separate consent has been obtained from the data subject
        </BulletItem>
        <BulletItem colors={colors}>When required by law or regulation</BulletItem>
        <BulletItem colors={colors}>
          When necessary for the urgent protection of life, body, or property and the data subject
          is unable to express consent
        </BulletItem>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            AI Analysis Service — Third-Party Processing
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            Yiroom's AI analysis features (personal color, skin, body type, etc.) utilize the Google
            Gemini API. When you use these features, your image data is transmitted to and processed
            by Google's AI servers.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://ai.google.dev/gemini-api/terms')}
          >
            <Text style={styles.linkText}>Google Gemini API Terms of Service →</Text>
          </TouchableOpacity>
        </InfoBox>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            Affiliate Services
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            When you click product recommendation links within the service, you will be redirected
            to external shopping platforms (e.g., Coupang). Their respective privacy policies apply.
            Yiroom only collects anonymized click statistics and does not collect any purchase
            information from external services.
          </Text>
        </InfoBox>
      </View>

      {/* 6. Destruction */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>6. Data Destruction</SectionTitle>
        <Paragraph colors={colors}>
          When personal data is no longer needed due to expiration of retention period or
          fulfillment of processing purpose, the Company destroys the data without delay.
        </Paragraph>
        <BulletItem colors={colors}>
          Electronic files: Securely deleted to prevent recovery or reproduction
        </BulletItem>
        <BulletItem colors={colors}>
          Physical records: Destroyed by shredding or incineration
        </BulletItem>
      </View>

      {/* 7. User Rights */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>7. User Rights</SectionTitle>
        <Paragraph colors={colors}>
          Users may exercise the following rights regarding their personal data at any time:
        </Paragraph>
        <BulletItem colors={colors}>Request access to personal data</BulletItem>
        <BulletItem colors={colors}>Request correction of inaccurate data</BulletItem>
        <BulletItem colors={colors}>Request deletion of personal data</BulletItem>
        <BulletItem colors={colors}>Request suspension of data processing</BulletItem>
      </View>

      {/* 8. Account Deletion */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>8. Account Deletion</SectionTitle>
        <Paragraph colors={colors}>
          Users may delete their account and all associated data at any time through:
        </Paragraph>
        <BulletItem colors={colors}>
          {'Self-service deletion via Settings > Account Management > Delete Account'}
        </BulletItem>
        <BulletItem colors={colors}>Email request to privacy@yiroom.app</BulletItem>
        <BulletItem colors={colors}>
          Upon deletion, all personal data and analysis results are permanently destroyed within 30
          days
        </BulletItem>
      </View>

      {/* 9. DPO */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>9. Data Protection Officer</SectionTitle>
        <Paragraph colors={colors}>
          The Company has designated a Data Protection Officer to oversee all personal data
          processing and to address complaints and remedies related to data protection.
        </Paragraph>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            Data Protection Officer
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            Email: privacy@yiroom.app
          </Text>
        </InfoBox>
      </View>

      {/* 10. Changes */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>10. Changes to This Policy</SectionTitle>
        <Paragraph colors={colors}>
          This Privacy Policy is effective as of February 20, 2026. Previous versions are available
          below:
        </Paragraph>
        <Text style={[styles.historyItem, { color: colors.mutedForeground }]}>
          • Version effective January 8, 2026 – February 19, 2026
        </Text>
        <Text style={[styles.historyItem, { color: colors.mutedForeground }]}>
          • Version effective January 20, 2025 – January 7, 2026
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  infoBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  linkText: {
    fontSize: 14,
    color: '#F8C8DC',
    marginTop: 8,
    fontWeight: '500',
  },
  warningBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningBoxDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#92400E',
  },
  warningTextDark: {
    color: '#FCD34D',
  },
  historyItem: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    paddingLeft: 8,
  },
});
