/**
 * 이용약관 네이티브 화면
 *
 * Google Play 제출 요건을 위한 서비스 이용약관.
 * 한/영 토글 지원.
 *
 * 정본 = 웹 이용약관(apps/web/app/(main)/terms/page.tsx)의 15조 체계(2026-07-12).
 * 미성년자 이용(제5조), 서비스 변경·중단·종료(제7조), 이용자 게시물 관리(제10조),
 * 손해배상 및 책임의 제한(제14조) 포함. 서비스 목록은 실제 제공 기능만 기재
 * (게이팅으로 미제공 중인 운동·영양·소셜 기능 광고 문구 제거).
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { ScreenContainer } from '@/components/ui';

import { useTheme, typography, spacing, radii } from '../lib/theme';

type Lang = 'ko' | 'en';

interface TermsSection {
  id: string;
  title: string;
  content: string;
}

// 웹 정본(TERMS_KO)과 실질 동일 — 문구 수정 시 웹 먼저 갱신 후 동기화
const TERMS_KO: TermsSection[] = [
  {
    id: 'purpose',
    title: '제1조 (목적)',
    content: `이 약관은 이룸(Yiroom, 이하 "서비스")을 제공하는 운영자(이하 "회사")와 서비스를 이용하는 회원(이하 "이용자") 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.`,
  },
  {
    id: 'definitions',
    title: '제2조 (정의)',
    content: `① "서비스"란 이룸 앱을 통해 제공되는 AI 퍼스널컬러 진단, 피부·체형·헤어·메이크업 분석, 맞춤 스타일링 제안 등 모든 서비스를 의미합니다.
② "이용자"란 이 약관에 동의하고 서비스를 이용하는 회원을 말합니다.
③ "콘텐츠"란 서비스 내에서 이용자가 생성하거나 업로드한 텍스트, 이미지, 분석 결과 등을 의미합니다.
④ "AI 분석"이란 이용자가 업로드한 이미지를 Google Gemini 등의 AI 모델을 통해 분석하여 제공하는 결과를 말합니다.`,
  },
  {
    id: 'agreement',
    title: '제3조 (약관의 효력 및 변경)',
    content: `① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
② 회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있습니다.
③ 약관이 변경되는 경우 회사는 변경 내용을 시행일 7일 전부터 서비스 내 공지합니다. 다만, 이용자에게 불리하거나 중대한 변경의 경우에는 시행일 30일 전부터 공지합니다.
④ 이용자가 변경된 약관의 시행일 이후에도 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 봅니다. 변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.`,
  },
  {
    id: 'registration',
    title: '제4조 (서비스 이용 계약)',
    content: `① 이용계약은 이용자가 약관의 내용에 동의하고, 회사가 정한 가입 절차를 완료함으로써 체결됩니다.
② 회사는 다음 각 호에 해당하는 경우 이용 신청을 거부할 수 있습니다:
  1. 실명이 아니거나 타인의 정보를 이용한 경우
  2. 이전에 이용 자격을 상실한 적이 있는 경우
  3. 기타 서비스 운영에 지장을 초래하는 경우`,
  },
  {
    id: 'minors',
    title: '제5조 (미성년자의 이용)',
    content: `① 서비스는 만 14세 이상인 자만 이용할 수 있으며, 만 14세 미만의 아동은 서비스 가입 및 이용이 제한됩니다.
② 만 14세 이상 만 19세 미만의 미성년자가 서비스를 이용하고자 하는 경우, 법정대리인(부모 등)의 동의를 받아야 하며, 이용자는 가입 시 이에 동의한 것으로 봅니다.
③ 회사는 이용자가 만 14세 미만임을 확인한 경우 해당 계정의 이용을 제한하거나 관련 정보를 지체 없이 파기할 수 있습니다.
④ 미성년자가 법정대리인의 동의 없이 서비스를 이용하여 발생한 결과에 대한 책임은 해당 이용자 및 그 법정대리인에게 있습니다.`,
  },
  {
    id: 'service',
    title: '제6조 (서비스의 제공)',
    content: `① 회사는 다음과 같은 서비스를 제공합니다:
  1. AI 기반 퍼스널컬러, 피부, 체형, 헤어, 메이크업 분석
  2. 분석 결과 기반 맞춤 스타일링 제안 (배색, 코디, 루틴)
  3. AI 코치 상담 서비스
  4. 제품 추천 및 정보 제공
② 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
③ 회사는 시스템 점검, 장애 등의 사유로 서비스 제공을 일시적으로 중단할 수 있습니다.`,
  },
  {
    id: 'service-change',
    title: '제7조 (서비스의 변경 및 중단·종료)',
    content: `① 회사는 운영상·기술상의 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경할 수 있으며, 변경 사항은 서비스 내 공지를 통해 안내합니다.
② 무료로 제공되는 서비스의 특성상, 회사는 경영상·기술상의 상당한 이유가 있는 경우 서비스의 전부 또는 일부를 수정, 중단, 변경할 수 있으며, 이에 대하여 관련 법령에 특별한 규정이 없는 한 이용자에게 별도의 보상을 하지 않습니다.
③ 회사가 서비스를 전면 종료하고자 하는 경우, 종료일로부터 최소 30일 전에 서비스 내 공지 또는 이메일 등을 통해 이용자에게 사전 고지합니다.
④ 서비스 종료 시 이용자의 개인정보 및 분석 결과는 개인정보처리방침 및 관련 법령에 따라 파기되며, 이용자는 종료 고지 기간 내에 자신의 데이터를 백업(다운로드)할 수 있습니다.`,
  },
  {
    id: 'obligation-company',
    title: '제8조 (회사의 의무)',
    content: `① 회사는 관련 법령과 이 약관이 정하는 바에 따라 지속적이고 안정적인 서비스를 제공합니다.
② 회사는 이용자의 개인정보를 보호하기 위해 보안 시스템을 갖추고 개인정보처리방침을 공시합니다.
③ 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 인정되면 적절한 조치를 취합니다.`,
  },
  {
    id: 'obligation-user',
    title: '제9조 (이용자의 의무)',
    content: `① 이용자는 다음 행위를 하여서는 안 됩니다:
  1. 타인의 정보 도용
  2. 서비스를 이용하여 얻은 정보의 무단 복제, 배포
  3. 회사의 저작권, 지적재산권 침해
  4. 회사 및 제3자의 명예를 훼손하는 행위
  5. 기타 관련 법령이나 약관에 위반되는 행위
② 이용자는 분석을 위해 업로드하는 이미지가 본인의 것임을 확인합니다.`,
  },
  {
    id: 'user-content',
    title: '제10조 (이용자 게시물 및 콘텐츠 관리)',
    content: `① 이용자가 서비스 내에 게시하거나 등록한 게시물(사진, 텍스트, 댓글, 후기, 평가 등, 이하 "게시물")에 대한 저작권은 이용자 본인에게 귀속됩니다.
② 이용자는 회사가 서비스의 운영, 개선 및 홍보를 위하여 필요한 범위 내에서 게시물을 무상으로 사용(저장, 복제, 수정, 공개, 전시 등)할 수 있는 권리를 회사에 부여합니다. 다만, 회사는 이용자가 업로드한 얼굴·신체 이미지 등 생체정보를 홍보 목적으로 사용하지 않으며, 오직 분석 서비스 제공 목적으로만 이용합니다.
③ 이용자는 다음 각 호에 해당하는 게시물을 등록해서는 안 됩니다:
  1. 타인의 명예를 훼손하거나 권리를 침해하는 내용
  2. 음란, 폭력적이거나 공서양속에 반하는 내용
  3. 타인의 개인정보나 초상을 무단으로 포함하는 내용
  4. 허위 정보 또는 광고성·스팸성 내용
  5. 기타 관련 법령 또는 이 약관에 위반되는 내용
④ 회사는 제3항에 해당하거나 그 우려가 있는 게시물에 대하여 사전 통지 없이 삭제, 이동, 게시 중단(블라인드) 등의 조치를 취할 수 있습니다.
⑤ 이용자는 언제든지 자신이 등록한 게시물을 삭제할 수 있으며, 삭제된 게시물은 복구되지 않습니다.`,
  },
  {
    id: 'termination',
    title: '제11조 (계정 관리 및 해지)',
    content: `① 회사는 이용자가 약관을 위반하거나 서비스 운영을 방해한 경우 서비스 이용을 제한할 수 있습니다.
② 이용자는 언제든지 서비스 내 설정에서 회원 탈퇴를 요청할 수 있습니다.
③ 탈퇴 시 모든 개인정보와 분석 결과는 30일 이내에 완전 파기됩니다.
④ 탈퇴 후 동일 이메일로 재가입은 가능하나, 이전 데이터는 복구할 수 없습니다.`,
  },
  {
    id: 'ip',
    title: '제12조 (지적재산권)',
    content: `① 서비스에 포함된 콘텐츠에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.
② 이용자가 업로드한 이미지에 대한 저작권은 이용자에게 있으며, 회사는 서비스 제공 목적으로만 이를 이용합니다.
③ AI 분석 결과에 대한 저작권은 회사에 귀속되며, 이용자는 개인적 용도로 자유롭게 이용할 수 있습니다.`,
  },
  {
    id: 'disclaimer',
    title: '제13조 (면책조항)',
    content: `① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인한 서비스 제공 불가에 대해 책임을 지지 않습니다.
② AI 분석 결과는 참고용이며, 의료적 진단이나 치료를 대체하지 않습니다.
③ 이용자가 서비스 내 제휴 링크를 통해 외부 서비스를 이용하는 경우, 해당 외부 서비스에서 발생하는 문제에 대해 회사는 책임지지 않습니다.`,
  },
  {
    id: 'liability',
    title: '제14조 (손해배상 및 책임의 제한)',
    content: `① 회사는 무료로 제공되는 서비스와 관련하여 관련 법령에 특별한 규정이 없는 한 이용자에게 발생한 손해에 대하여 책임을 지지 않습니다. 다만, 회사의 고의 또는 중대한 과실로 인한 손해의 경우에는 그러하지 아니합니다.
② 회사가 이용자에게 손해배상 책임을 부담하는 경우에도, 배상 범위는 통상의 손해에 한하며, 특별한 사정으로 인한 손해에 대하여는 회사가 그 사정을 알았거나 알 수 있었을 경우에 한하여 책임을 집니다.
③ 서비스가 무료로 제공되는 점을 고려하여, 회사의 손해배상 책임은 관련 법령이 허용하는 최대 범위 내에서 제한됩니다.
④ AI 분석 결과 및 제품 추천은 이용자가 제공한 이미지와 정보를 기반으로 한 참고 자료이며, 회사는 그 정확성, 완전성 또는 특정 목적에의 적합성을 보장하지 않습니다. 이용자가 분석 결과나 추천에 의존하여 내린 결정 및 그 결과에 대한 책임은 이용자에게 있습니다.
⑤ 회사는 이용자 상호간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대하여 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임을 지지 않습니다.`,
  },
  {
    id: 'dispute',
    title: '제15조 (분쟁 해결)',
    content: `① 이 약관에 명시되지 않은 사항은 관련 법령에 따릅니다.
② 서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.`,
  },
];

// 웹 정본(TERMS_EN)과 실질 동일
const TERMS_EN: TermsSection[] = [
  {
    id: 'purpose',
    title: '1. Purpose',
    content: `These Terms of Service ("Terms") govern your use of the Yiroom platform and services ("Service") provided by Yiroom ("Company"). By accessing or using the Service, you agree to be bound by these Terms.`,
  },
  {
    id: 'definitions',
    title: '2. Definitions',
    content: `"Service" refers to all services provided through the Yiroom platform, including AI-powered personal color diagnosis, skin, body type, hair, and makeup analysis, personalized styling suggestions, and AI coaching.
"User" refers to any individual who agrees to these Terms and uses the Service.
"Content" refers to text, images, analysis results, and other materials created or uploaded by Users within the Service.
"AI Analysis" refers to results generated by processing user-uploaded images through AI models including Google Gemini.`,
  },
  {
    id: 'agreement',
    title: '3. Effectiveness and Changes',
    content: `These Terms become effective when posted on the Service screen or communicated to Users by other means.
The Company may modify these Terms as necessary within the scope of applicable laws.
Users will be notified of changes at least 7 days in advance through in-service announcements; for changes that are unfavorable or material to Users, notice will be given at least 30 days in advance.
If a User continues to use the Service after the effective date of the revised Terms, the User is deemed to have agreed to the revised Terms. A User who does not agree may discontinue use and delete their account.`,
  },
  {
    id: 'registration',
    title: '4. Service Agreement',
    content: `The service agreement is established when the User agrees to these Terms and completes the registration process.
The Company may refuse registration in the following cases:
  1. Using a false identity or another person's information
  2. Previously having lost eligibility to use the Service
  3. Other cases that may impede Service operations`,
  },
  {
    id: 'minors',
    title: '5. Minors',
    content: `The Service is available only to individuals aged 14 or older. Children under the age of 14 are prohibited from registering for or using the Service.
Minors aged 14 to 18 must obtain the consent of a legal guardian (e.g., a parent) to use the Service, and are deemed to have obtained such consent upon registration.
If the Company confirms that a User is under the age of 14, it may restrict the account and promptly destroy the related information.
The User and their legal guardian are responsible for any consequences arising from a minor using the Service without guardian consent.`,
  },
  {
    id: 'service',
    title: '6. Service Description',
    content: `The Company provides the following services:
  1. AI-powered personal color, skin, body type, hair, and makeup analysis
  2. Personalized styling suggestions based on analysis results (color palettes, outfits, routines)
  3. AI coaching and consultation
  4. Product recommendations and information
The Service is available 24/7 in principle, but may be temporarily suspended for maintenance or technical reasons.`,
  },
  {
    id: 'service-change',
    title: '7. Modification, Suspension, and Termination of Service',
    content: `The Company may change all or part of the Service as required for operational or technical reasons, and will announce such changes within the Service.
Given that the Service is provided free of charge, the Company may modify, suspend, or discontinue all or part of the Service for substantial managerial or technical reasons, and shall not compensate Users unless otherwise required by applicable law.
If the Company intends to fully terminate the Service, it will notify Users at least 30 days before the termination date through in-service announcements or email.
Upon termination of the Service, Users' personal data and analysis results will be destroyed in accordance with the Privacy Policy and applicable laws. Users may back up (download) their data within the notice period.`,
  },
  {
    id: 'obligation-company',
    title: '8. Company Obligations',
    content: `The Company shall provide continuous and stable Service in accordance with applicable laws and these Terms.
The Company shall maintain security systems to protect User personal information and publish a Privacy Policy.
The Company shall take appropriate measures when User complaints or feedback are deemed valid.`,
  },
  {
    id: 'obligation-user',
    title: '9. User Obligations',
    content: `Users must not:
  1. Use another person's identity or information
  2. Reproduce or distribute information obtained through the Service without authorization
  3. Infringe on the Company's copyrights or intellectual property
  4. Defame or harm the Company or third parties
  5. Violate applicable laws or these Terms
Users confirm that images uploaded for analysis are their own.`,
  },
  {
    id: 'user-content',
    title: '10. User Content and Moderation',
    content: `Copyright in content posted or submitted by Users within the Service (photos, text, comments, reviews, ratings, etc., "User Content") belongs to the User.
The User grants the Company a royalty-free license to use (store, reproduce, modify, publish, and display) User Content to the extent necessary to operate, improve, and promote the Service. However, the Company does not use uploaded facial or body images or other biometric information for promotional purposes, and uses them solely to provide the analysis Service.
Users must not post User Content that:
  1. Defames others or infringes their rights
  2. Is obscene, violent, or contrary to public order and morals
  3. Contains others' personal information or likeness without authorization
  4. Contains false information, advertising, or spam
  5. Otherwise violates applicable laws or these Terms
The Company may delete, move, or block (hide) User Content that falls under, or is likely to fall under, the above without prior notice.
Users may delete their own User Content at any time; deleted content cannot be recovered.`,
  },
  {
    id: 'termination',
    title: '11. Account Management',
    content: `The Company may restrict Service use if a User violates these Terms or disrupts Service operations.
Users may request account deletion at any time through the Settings menu.
Upon deletion, all personal data and analysis results will be permanently destroyed within 30 days.
Re-registration with the same email is possible, but previous data cannot be recovered.`,
  },
  {
    id: 'ip',
    title: '12. Intellectual Property',
    content: `All content within the Service is owned by the Company.
Users retain copyright over images they upload. The Company uses uploaded images solely for providing the Service.
AI analysis results are owned by the Company. Users may freely use their analysis results for personal purposes.`,
  },
  {
    id: 'disclaimer',
    title: '13. Disclaimers',
    content: `The Company is not liable for service interruptions caused by force majeure events (natural disasters, war, infrastructure failures, etc.).
AI analysis results are for reference purposes only and do not constitute medical diagnosis or treatment. Always consult qualified professionals for health decisions.
When Users access external services through affiliate links within the Service, the Company is not responsible for issues arising from those external services.`,
  },
  {
    id: 'liability',
    title: '14. Limitation of Liability',
    content: `With respect to the Service provided free of charge, the Company shall not be liable for damages incurred by Users unless otherwise required by applicable law. This limitation does not apply to damages caused by the Company's intent or gross negligence.
Even where the Company is liable, the scope of damages shall be limited to ordinary damages; the Company shall be liable for damages arising from special circumstances only if it knew or could have known of such circumstances.
Considering that the Service is provided free of charge, the Company's liability is limited to the maximum extent permitted by applicable law.
AI analysis results and product recommendations are reference materials based on the images and information you provide, and the Company does not guarantee their accuracy, completeness, or fitness for a particular purpose. Users are responsible for decisions made in reliance on analysis results or recommendations.
The Company has no obligation to intervene in disputes between Users, or between a User and a third party, arising through the Service, and shall not be liable for any resulting damages.`,
  },
  {
    id: 'dispute',
    title: '15. Governing Law',
    content: `Matters not specified in these Terms shall be governed by applicable laws.
Any disputes arising from Service use shall be subject to the exclusive jurisdiction of the courts at the location of the Company's headquarters in the Republic of Korea.`,
  },
];

// 언어별 부속 텍스트 (시행일·부칙·문의·최신 전문 안내)
const META = {
  ko: {
    updated: '최종 수정일: 2026년 7월 12일 | 시행일: 2026년 7월 12일',
    supplementTitle: '부칙',
    supplement: `① 이 약관은 2026년 7월 12일부터 시행합니다.
② 2026년 7월 12일 개정으로 미성년자 이용(제5조), 서비스 변경·중단·종료(제7조), 이용자 게시물 관리(제10조), 손해배상 및 책임의 제한(제14조) 조항이 신설·정비되었습니다.`,
    contactTitle: '문의',
    contact: '이메일: contact@yiroom.app',
    latestNotice:
      '최신 전문: 이 약관의 최신 전문은 이룸(yiroom) 웹 이용약관 페이지에서 확인하실 수 있습니다. 앱 내 표시 내용과 차이가 있는 경우 웹에 게시된 약관이 우선합니다.',
  },
  en: {
    updated: 'Last updated: July 12, 2026 | Effective: July 12, 2026',
    supplementTitle: 'Supplementary Provisions',
    supplement: `1. These Terms are effective as of July 12, 2026.
2. The July 12, 2026 revision added and reorganized provisions on Minors (Art. 5), Modification/Termination of Service (Art. 7), User Content and Moderation (Art. 10), and Limitation of Liability (Art. 14).`,
    contactTitle: 'Contact',
    contact: 'Email: contact@yiroom.app',
    latestNotice:
      'Latest version: The most up-to-date full text of these Terms is available on the Yiroom web Terms of Service page. If there is any discrepancy with the text shown in the app, the version published on the web prevails.',
  },
} as const;

export default function TermsScreen() {
  const { colors, brand: brandColors } = useTheme();
  const [lang, setLang] = useState<Lang>('ko');

  return (
    <ScreenContainer
      edges={['bottom']}
      testID="terms-screen"
      contentContainerStyle={styles.content}
      backgroundGradient="profile"
    >
      {/* 언어 토글 */}
      <View style={styles.langToggle}>
        <Pressable
          style={[
            styles.langButton,
            {
              backgroundColor: lang === 'ko' ? brandColors.primary : colors.muted,
              borderRadius: radii.xl,
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
              borderRadius: radii.xl,
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

      <TermsContent lang={lang} colors={colors} />
    </ScreenContainer>
  );
}

interface TermsColors {
  foreground: string;
  mutedForeground: string;
  muted: string;
  cardForeground: string;
}

function SectionTitle({ children, colors }: { children: string; colors: TermsColors }) {
  return <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{children}</Text>;
}

function Paragraph({ children, colors }: { children: string; colors: TermsColors }) {
  return <Text style={[styles.paragraph, { color: colors.foreground }]}>{children}</Text>;
}

function TermsContent({ lang, colors }: { lang: Lang; colors: TermsColors }) {
  const sections = lang === 'ko' ? TERMS_KO : TERMS_EN;
  const meta = META[lang];

  return (
    <View>
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>{meta.updated}</Text>

      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <SectionTitle colors={colors}>{section.title}</SectionTitle>
          <Paragraph colors={colors}>{section.content}</Paragraph>
        </View>
      ))}

      {/* 부칙 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>{meta.supplementTitle}</SectionTitle>
        <Paragraph colors={colors}>{meta.supplement}</Paragraph>
      </View>

      {/* 문의 */}
      <View style={[styles.contactBox, { backgroundColor: colors.muted }]}>
        <Text style={[styles.contactTitle, { color: colors.cardForeground }]}>
          {meta.contactTitle}
        </Text>
        <Text style={[styles.contactText, { color: colors.cardForeground }]}>{meta.contact}</Text>
      </View>

      {/* 드리프트 가드 — 웹 게시본이 정본임을 안내 */}
      <Text style={[styles.latestNotice, { color: colors.mutedForeground }]}>
        {meta.latestNotice}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  langToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  langButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  langButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  lastUpdated: {
    fontSize: typography.size.sm,
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  contactBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.xl,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
  latestNotice: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginTop: spacing.lg,
  },
});
