/**
 * 개인정보처리방침 네이티브 화면
 *
 * 정본 = 웹 apps/web/app/privacy/PrivacyContent.tsx (KoreanContent §1~§13).
 * 웹 법적 감사(2026-07-12) 반영: 성별·생년월일 필수화, 생체정보 보유기간(동의일로부터 1년),
 * AI 코치 대화 서버 저장, 국외이전(Google/미국·거부방법), 쿠키·자동수집, 위탁 현황,
 * 자동화된 결정, 안전성 확보조치, 아동 보호, 보호책임자 성명.
 * 영문 전문은 웹 개인정보처리방침 링크로 갈음.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';

import { ScreenContainer } from '@/components/ui';

import { useTheme, typography, spacing, brand, radii } from '../lib/theme';

type Lang = 'ko' | 'en';

// 웹 개인정보처리방침 URL (전문 정본 — 드리프트 가드)
const WEB_PRIVACY_URL = 'https://yiroom.vercel.app/privacy';

export default function PrivacyPolicyScreen() {
  const { colors, brand: brandColors } = useTheme();
  const [lang, setLang] = useState<Lang>('ko');

  return (
    <ScreenContainer edges={['bottom']} testID="privacy-policy-screen" backgroundGradient="profile">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        {lang === 'ko' ? <KoreanContent colors={colors} /> : <EnglishContent colors={colors} />}
      </ScrollView>
    </ScreenContainer>
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

function KoreanContent({ colors }: ContentProps) {
  const { status } = useTheme();
  return (
    <View>
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
        최종 업데이트: 2026년 7월 12일
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
        <BulletItem colors={colors}>
          필수 항목: 이메일 주소, 비밀번호, 닉네임, 생년월일(연령 확인 — 만 14세 이상 확인 목적),
          성별(맞춤 분석 목적)
        </BulletItem>
        <BulletItem colors={colors}>선택 항목: 프로필 사진, 키, 체중</BulletItem>
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
          분석 이미지: 저장에 동의한 경우 동의일로부터 1년간 보관 후 자동 파기되며, 그 전에도 요청
          시 언제든 삭제할 수 있습니다 (회원 탈퇴 시 파기)
        </BulletItem>
        <BulletItem colors={colors}>
          AI 코치 대화: 대화 이어보기 기능 제공을 위해 서버에 저장되며, 설정 또는 삭제 요청으로
          언제든 삭제 가능 (회원 탈퇴 시 파기)
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
        <BulletItem colors={colors}>
          보유 기간: 저장 동의 시 동의일로부터 1년간 보관 후 자동 파기, 회원 탈퇴 또는 삭제 요청 시
          즉시 파기
        </BulletItem>
        <BulletItem colors={colors}>
          동의 방법: 가입 시 약관 동의 단계에서 별도의 필수 동의 항목으로 수집 (이미지 촬영 전 사전
          동의)
        </BulletItem>
        <BulletItem colors={colors}>
          {'동의 철회: 설정 > 개인정보 메뉴에서 언제든지 철회 가능'}
        </BulletItem>
        <View
          style={[
            styles.warningBox,
            {
              backgroundColor: status.warning + '15',
              borderColor: status.warning + '30',
            },
          ]}
        >
          <Text style={[styles.warningText, { color: status.warning }]}>
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
            사용자의 이미지 데이터가 Google의 AI 서버로 전송되어 처리됩니다. Google의 데이터 처리에
            관한 자세한 내용은 Google Gemini API Terms of Service를 참조해주세요.
          </Text>
          <Pressable onPress={() => Linking.openURL('https://ai.google.dev/gemini-api/terms')}>
            <Text style={styles.linkText}>Google Gemini API Terms of Service →</Text>
          </Pressable>
        </InfoBox>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            개인정보의 국외 이전
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            AI 분석 서비스 제공을 위해 아래와 같이 개인정보가 국외로 이전됩니다 (개인정보보호법
            제28조의8).
          </Text>
          <BulletItem colors={colors}>이전받는 자: Google LLC (Google Gemini API)</BulletItem>
          <BulletItem colors={colors}>
            이전 국가: 미국 등 Google이 운영하는 데이터센터 소재국
          </BulletItem>
          <BulletItem colors={colors}>이전 항목: 분석용 얼굴/체형/퍼스널컬러 이미지</BulletItem>
          <BulletItem colors={colors}>
            이전 일시 및 방법: 분석 요청 시 암호화된 통신(HTTPS)으로 실시간 전송
          </BulletItem>
          <BulletItem colors={colors}>이용 목적: AI 이미지 분석 처리</BulletItem>
          <BulletItem colors={colors}>
            보유·이용 기간: 실시간 처리 후 Gemini API 약관에 따라 모델 학습 목적으로 저장·이용되지
            않음
          </BulletItem>
          <BulletItem colors={colors}>
            이전 거부 방법 및 효과: 분석 기능을 이용하지 않거나 계정을 삭제하면 이전이 중단됩니다.
            다만 이전을 거부하시면 AI 분석 서비스를 이용하실 수 없습니다.
          </BulletItem>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            또한 데이터 저장(Supabase) 및 회원 인증(Clerk) 제공업체의 인프라가 국외에 위치할 수
            있으며, 서비스를 이용함으로써 이러한 국외 이전에 동의하게 됩니다. 회사는 이전받는 자와의
            계약을 통해 개인정보가 안전하게 보호되도록 합니다.
          </Text>
        </InfoBox>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            제휴 서비스 이용 시 안내
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            서비스 내 제품 추천 링크를 통해 외부 쇼핑몰(쿠팡 등)로 이동하는 경우, 해당 외부 서비스의
            개인정보처리방침이 적용됩니다. 이룸은 제휴 링크 클릭 기록을 회원 식별자와 함께 서비스
            내부에 저장하지만(추천 개선·전환 확인 목적), 외부 파트너에게 회원 식별 정보를 전달하지
            않습니다. 외부 서비스에서의 구매 정보는 수집하지 않습니다.
          </Text>
        </InfoBox>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            개인정보 처리 위탁 현황
          </Text>
          <BulletItem colors={colors}>
            Supabase: 데이터 저장 및 관리 (클라우드 데이터베이스)
          </BulletItem>
          <BulletItem colors={colors}>Google (Gemini API): AI 이미지 분석 처리</BulletItem>
          <BulletItem colors={colors}>Clerk: 회원 인증 및 계정 관리</BulletItem>
          <BulletItem colors={colors}>Vercel: 서비스 호스팅 및 트래픽 통계</BulletItem>
          <BulletItem colors={colors}>Tawk.to: 고객 상담 위젯 운영</BulletItem>
          <BulletItem colors={colors}>Sentry: 오류 모니터링</BulletItem>
        </InfoBox>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            쿠키 등 자동수집장치의 설치·운영 및 거부
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            회사는 서비스 제공을 위해 아래와 같은 쿠키 및 유사 기술을 사용합니다.
          </Text>
          <BulletItem colors={colors}>Clerk 로그인 세션 쿠키: 로그인 상태 유지 (필수)</BulletItem>
          <BulletItem colors={colors}>Tawk.to 고객상담 위젯 쿠키: 상담 세션 유지</BulletItem>
          <BulletItem colors={colors}>언어 설정 쿠키: 언어를 직접 선택한 경우 설정 저장</BulletItem>
          <BulletItem colors={colors}>
            Vercel Analytics: 쿠키 없이 익명 방문 통계를 수집합니다
          </BulletItem>
          <BulletItem colors={colors}>
            Sentry: 오류 모니터링 목적으로 브라우저·기기 등 기술 정보를 수집합니다
          </BulletItem>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            거부 방법: 브라우저 설정에서 쿠키 저장을 차단하거나 삭제할 수 있습니다. 다만 필수 쿠키를
            차단하면 로그인 등 일부 기능 이용이 제한될 수 있습니다.
          </Text>
        </InfoBox>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>위치정보의 이용</Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            코디 추천 및 날씨 기반 조언 시, 사용자가 기기에서 위치 접근을 명시적으로 허용한 경우에
            한해 기기의 대략적인 위치(좌표)를 일시적으로 사용합니다. 이 위치정보는 별도로 저장되지
            않으며, 날씨 조회(Open-Meteo)에만 이용됩니다. 기기 설정에서 위치 접근을 거부하거나
            차단할 수 있으며, 이 경우 위치 기반 추천 기능만 제한되고 다른 기능은 정상적으로 이용하실
            수 있습니다.
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

      {/* 8. 자동화된 결정 및 프로파일링 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>8. 자동화된 결정 및 프로파일링</SectionTitle>
        <Paragraph colors={colors}>
          회사는 사용자가 업로드한 이미지를 AI(Google Gemini)로 분석하여 퍼스널 컬러, 피부, 체형,
          헤어, 메이크업 등 시각적 특성에 관한 프로파일과 맞춤 조언을 자동으로 생성합니다.
        </Paragraph>
        <BulletItem colors={colors}>
          처리 기준: 이미지에서 추출한 색상·명암·형태 등 시각적 특징을 학술적 분석
          기준(색채학·피부생리학 등)에 대입하여 결과를 산출합니다.
        </BulletItem>
        <BulletItem colors={colors}>
          처리 절차: 이미지 전송, AI 특징 추출, 분석 기준 적용, 결과 표시의 순서로 처리되며,
          결과에는 신뢰도가 함께 표시됩니다.
        </BulletItem>
        <BulletItem colors={colors}>
          결과의 성격: 분석 결과는 참고용 미용 조언이며, 사용자의 권리·의무에 법적 효력을 미치는
          결정이 아닙니다.
        </BulletItem>
        <BulletItem colors={colors}>
          거부 및 설명 요구: 분석 기능을 이용하지 않음으로써 자동화된 처리를 거부할 수 있으며,
          결과에 대한 설명 요구 또는 재분석·삭제 요청은 privacy@yiroom.app으로 하실 수 있습니다.
        </BulletItem>
      </View>

      {/* 9. 개인정보의 안전성 확보조치 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>9. 개인정보의 안전성 확보조치</SectionTitle>
        <Paragraph colors={colors}>
          회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
        </Paragraph>
        <BulletItem colors={colors}>
          전송 구간 암호화: 모든 데이터는 HTTPS(TLS) 암호화 통신으로 전송됩니다.
        </BulletItem>
        <BulletItem colors={colors}>
          저장 데이터 암호화: 이미지 및 개인정보는 암호화된 클라우드 스토리지에 저장됩니다.
        </BulletItem>
        <BulletItem colors={colors}>
          접근 권한 통제: 최소 권한 원칙에 따라 접근 권한을 부여·관리하며, 본인 데이터에만 접근할 수
          있도록 행 수준 접근제어(RLS)를 적용합니다.
        </BulletItem>
        <BulletItem colors={colors}>
          접속기록 보관·점검: 개인정보 처리 시스템의 접속 기록을 보관하고 위·변조를 방지합니다.
        </BulletItem>
      </View>

      {/* 10. 아동의 개인정보 보호 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>10. 아동의 개인정보 보호</SectionTitle>
        <Paragraph colors={colors}>
          이룸은 만 14세 미만 아동을 대상으로 서비스를 제공하지 않으며, 가입 시 만 14세 이상임을
          확인합니다. 만 14세 미만 아동의 개인정보가 수집된 사실을 인지한 경우, 회사는 지체 없이
          해당 정보를 파기합니다.
        </Paragraph>
      </View>

      {/* 11. 계정 삭제 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>11. 계정 삭제</SectionTitle>
        <Paragraph colors={colors}>
          사용자는 언제든지 자신의 계정과 관련 데이터를 삭제할 수 있습니다:
        </Paragraph>
        <BulletItem colors={colors}>{'설정 > 계정 관리 > 회원 탈퇴를 통해 직접 삭제'}</BulletItem>
        <BulletItem colors={colors}>이메일(privacy@yiroom.app)로 삭제 요청</BulletItem>
        <BulletItem colors={colors}>
          탈퇴 시 모든 개인정보 및 분석 결과는 30일 이내 완전 파기
        </BulletItem>
      </View>

      {/* 12. 개인정보 보호책임자 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>12. 개인정보 보호책임자</SectionTitle>
        <Paragraph colors={colors}>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
          불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </Paragraph>
        <InfoBox colors={colors}>
          <Text style={[styles.infoTitle, { color: colors.cardForeground }]}>
            개인정보 보호책임자
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            성명: 김병민 (대표)
          </Text>
          <Text style={[styles.infoText, { color: colors.cardForeground }]}>
            이메일: privacy@yiroom.app
          </Text>
        </InfoBox>
        <Paragraph colors={colors}>
          개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다:
        </Paragraph>
        <BulletItem colors={colors}>개인정보 침해신고센터: 118</BulletItem>
        <BulletItem colors={colors}>개인정보 분쟁조정위원회: 1833-6972</BulletItem>
        <BulletItem colors={colors}>대검찰청 사이버수사과: 1301</BulletItem>
        <BulletItem colors={colors}>경찰청 사이버안전국: 182</BulletItem>
      </View>

      {/* 13. 개인정보처리방침의 변경 */}
      <View style={styles.section}>
        <SectionTitle colors={colors}>13. 개인정보처리방침의 변경</SectionTitle>
        <Paragraph colors={colors}>
          이 개인정보처리방침은 2026년 7월 12일부터 적용됩니다. 이전의 개인정보처리방침은 아래에서
          확인하실 수 있습니다.
        </Paragraph>
        <Text style={[styles.historyItem, { color: colors.mutedForeground }]}>
          • 2026년 2월 20일 ~ 2026년 7월 11일 적용 버전
        </Text>
        <Text style={[styles.historyItem, { color: colors.mutedForeground }]}>
          • 2026년 1월 8일 ~ 2026년 2월 19일 적용 버전
        </Text>
        <Text style={[styles.historyItem, { color: colors.mutedForeground }]}>
          • 2025년 1월 20일 ~ 2026년 1월 7일 적용 버전
        </Text>
      </View>

      {/* 드리프트 가드: 웹 전문 안내 */}
      <InfoBox colors={colors}>
        <Text style={[styles.infoText, { color: colors.cardForeground }]}>
          최신 전문은 이룸 웹 개인정보처리방침에서 확인하실 수 있습니다.
        </Text>
        <Pressable onPress={() => Linking.openURL(WEB_PRIVACY_URL)}>
          <Text style={styles.linkText}>웹 개인정보처리방침 전문 보기 →</Text>
        </Pressable>
      </InfoBox>
    </View>
  );
}

function EnglishContent({ colors }: ContentProps) {
  // 영문 전문은 웹 정본 링크로 갈음 (문서 이중 관리로 인한 불일치 방지)
  return (
    <View>
      <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
        Last updated: July 12, 2026
      </Text>
      <View style={styles.section}>
        <SectionTitle colors={colors}>Privacy Policy (English)</SectionTitle>
        <Paragraph colors={colors}>
          The full English version of the Yiroom Privacy Policy is maintained on the Yiroom website.
          Please refer to the web version below for the complete and most current text.
        </Paragraph>
        <InfoBox colors={colors}>
          <Pressable onPress={() => Linking.openURL(`${WEB_PRIVACY_URL}?lang=en`)}>
            <Text style={styles.linkText}>View full Privacy Policy (English) →</Text>
          </Pressable>
        </InfoBox>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: spacing.sm,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 15,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  bulletText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    flex: 1,
  },
  infoBox: {
    marginTop: spacing.smx,
    padding: spacing.md,
    borderRadius: radii.xl,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  linkText: {
    fontSize: typography.size.sm,
    color: brand.primary,
    marginTop: spacing.sm,
    fontWeight: typography.weight.medium,
  },
  warningBox: {
    marginTop: spacing.smx,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  warningText: {
    fontSize: typography.size.sm,
    lineHeight: 22,
  },
  historyItem: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
  },
});
