'use client';

/**
 * 개인정보처리방침 페이지
 * SDD-LEGAL-SUPPORT.md §3.2
 * PIPA (개인정보보호법) 기준
 */

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIVACY_SECTIONS = [
  {
    id: 'purpose',
    title: '1. 개인정보 수집 및 이용 목적',
    content: `이룸(Yiroom)은 다음의 목적을 위해 개인정보를 처리합니다:

① 회원 가입 및 관리
  - 회원 식별, 본인 확인, 서비스 부정 이용 방지

② AI 분석 서비스 제공
  - 피부, 체형, 퍼스널컬러 분석을 위한 이미지 처리
  - 맞춤형 추천 서비스 제공

③ 서비스 개선
  - 서비스 이용 통계 분석, 신규 기능 개발

④ 마케팅 및 광고 (선택 동의 시)
  - 맞춤형 광고 제공, 이벤트 정보 전달`,
  },
  {
    id: 'items',
    title: '2. 수집하는 개인정보 항목',
    content: `① 필수 수집 항목
  - 이메일 주소, 이름, 프로필 사진

② 분석 서비스 이용 시 (선택)
  - 얼굴/신체 이미지 (피부, 체형 분석용)
  - 피부 타입, 피부 고민 정보
  - 신체 치수 정보

③ 자동 수집 항목
  - 기기 정보 (OS, 앱 버전)
  - 서비스 이용 기록, 접속 로그`,
  },
  {
    id: 'period',
    title: '3. 개인정보 보유 및 이용 기간',
    content: `① 회원 정보: 회원 탈퇴 시까지
② 분석 이미지: 동의일로부터 1년 (만료 시 자동 삭제)
③ 서비스 이용 기록: 3년 (전자상거래법)
④ 부정 이용 기록: 5년 (재가입 방지)

※ 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.`,
  },
  {
    id: 'sharing',
    title: '4. 개인정보 제3자 제공',
    content: `이룸은 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.

다만, 다음의 경우에는 예외로 합니다:
① 이용자가 사전에 동의한 경우
② 법령의 규정에 따르거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 요청이 있는 경우`,
  },
  {
    id: 'outsourcing',
    title: '5. 개인정보 처리 위탁',
    content: `이룸은 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다:

① 클라우드 서비스
  - 위탁업체: Supabase
  - 위탁 내용: 데이터 저장 및 관리

② AI 분석 서비스
  - 위탁업체: Google (Gemini API)
  - 위탁 내용: 이미지 분석 처리
  - ※ 이미지는 분석 후 즉시 삭제되며 저장되지 않습니다.

③ 인증 서비스
  - 위탁업체: Clerk
  - 위탁 내용: 회원 인증 및 관리`,
  },
  {
    id: 'rights',
    title: '6. 정보주체의 권리',
    content: `이용자는 언제든지 다음의 권리를 행사할 수 있습니다:

① 개인정보 열람 요청
② 개인정보 정정 요청
③ 개인정보 삭제 요청
④ 개인정보 처리 정지 요청
⑤ 동의 철회

※ 권리 행사는 앱 내 설정 > 개인정보 설정에서 직접 하시거나,
   고객센터를 통해 요청하실 수 있습니다.`,
  },
  {
    id: 'security',
    title: '7. 개인정보 보호 조치',
    content: `이룸은 개인정보의 안전성 확보를 위해 다음 조치를 취하고 있습니다:

① 관리적 조치
  - 내부 관리 계획 수립 및 시행
  - 개인정보 취급자 최소화

② 기술적 조치
  - 개인정보 암호화 (전송 시 TLS, 저장 시 AES-256)
  - 접근 통제 및 접근 권한 관리 (Supabase RLS)
  - 보안 프로그램 설치 및 갱신

③ 물리적 조치
  - 클라우드 데이터센터 보안 (AWS 기반)`,
  },
  {
    id: 'officer',
    title: '8. 개인정보 보호책임자',
    content: `이룸의 개인정보 보호책임자는 다음과 같습니다:

• 담당자: 개인정보 보호팀
• 이메일: privacy@yiroom.app

개인정보 침해에 대한 신고나 상담이 필요하신 경우,
아래 기관에 문의하실 수 있습니다:

• 개인정보 침해신고센터: 118
• 개인정보 분쟁조정위원회: 1833-6972
• 대검찰청 사이버수사과: 1301
• 경찰청 사이버안전국: 182`,
  },
  {
    id: 'changes',
    title: '9. 개인정보 처리방침 변경',
    content: `이 개인정보 처리방침은 시행일로부터 적용되며,
법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
변경사항의 시행 7일 전부터 앱 내 공지사항을 통해 고지합니다.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="privacy-policy-page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/help"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="고객센터로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              개인정보처리방침
            </h1>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 최종 수정일 */}
        <p className="text-sm text-muted-foreground">
          최종 수정일: 2026년 1월 1일 | 시행일: 2026년 1월 1일
        </p>

        {/* 개요 */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              이룸(Yiroom)은 개인정보보호법(PIPA)에 따라 이용자의 개인정보를 보호하고, 이와 관련한
              고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을
              수립·공개합니다.
            </p>
          </CardContent>
        </Card>

        {/* 방침 섹션 */}
        {PRIVACY_SECTIONS.map((section) => (
          <Card key={section.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{section.content}</p>
            </CardContent>
          </Card>
        ))}

        {/* 부칙 */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              이 개인정보처리방침은 2026년 1월 1일부터 시행합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
