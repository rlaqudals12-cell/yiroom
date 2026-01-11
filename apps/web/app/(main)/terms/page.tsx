'use client';

/**
 * 이용약관 페이지
 * SDD-LEGAL-SUPPORT.md §3.1
 */

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TERMS_SECTIONS = [
  {
    id: 'purpose',
    title: '제1조 (목적)',
    content: `이 약관은 이룸(Yiroom, 이하 "서비스")을 제공하는 운영자(이하 "회사")와 서비스를 이용하는 회원(이하 "이용자") 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.`,
  },
  {
    id: 'definitions',
    title: '제2조 (정의)',
    content: `① "서비스"란 이룸 앱을 통해 제공되는 AI 피부 분석, 체형 분석, 퍼스널컬러 진단, 운동 및 영양 관리 등 모든 서비스를 의미합니다.
② "이용자"란 이 약관에 동의하고 서비스를 이용하는 회원을 말합니다.
③ "콘텐츠"란 서비스 내에서 이용자가 생성하거나 업로드한 텍스트, 이미지, 분석 결과 등을 의미합니다.`,
  },
  {
    id: 'agreement',
    title: '제3조 (약관의 효력 및 변경)',
    content: `① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
② 회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있습니다.
③ 약관이 변경되는 경우 회사는 변경 내용을 시행일 7일 전부터 서비스 내 공지합니다.`,
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
    id: 'service',
    title: '제5조 (서비스의 제공)',
    content: `① 회사는 다음과 같은 서비스를 제공합니다:
  1. AI 기반 피부, 체형, 퍼스널컬러 분석
  2. 맞춤형 운동 및 영양 관리 추천
  3. 제품 추천 및 정보 제공
  4. 기타 회사가 정하는 서비스
② 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
③ 회사는 시스템 점검, 장애 등의 사유로 서비스 제공을 일시적으로 중단할 수 있습니다.`,
  },
  {
    id: 'obligation-company',
    title: '제6조 (회사의 의무)',
    content: `① 회사는 관련 법령과 이 약관이 정하는 바에 따라 지속적이고 안정적인 서비스를 제공합니다.
② 회사는 이용자의 개인정보를 보호하기 위해 보안 시스템을 갖추고 개인정보처리방침을 공시합니다.
③ 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 인정되면 적절한 조치를 취합니다.`,
  },
  {
    id: 'obligation-user',
    title: '제7조 (이용자의 의무)',
    content: `① 이용자는 다음 행위를 하여서는 안 됩니다:
  1. 타인의 정보 도용
  2. 서비스를 이용하여 얻은 정보의 무단 복제, 배포
  3. 회사의 저작권, 지적재산권 침해
  4. 회사 및 제3자의 명예를 훼손하는 행위
  5. 기타 관련 법령이나 약관에 위반되는 행위
② 이용자는 분석을 위해 업로드하는 이미지가 본인의 것임을 확인합니다.`,
  },
  {
    id: 'termination',
    title: '제8조 (서비스 이용 제한 및 해지)',
    content: `① 회사는 이용자가 약관을 위반하거나 서비스 운영을 방해한 경우 서비스 이용을 제한할 수 있습니다.
② 이용자는 언제든지 서비스 내 설정에서 회원 탈퇴를 요청할 수 있습니다.
③ 회원 탈퇴 시 이용자의 개인정보 및 콘텐츠는 관련 법령에 따라 처리됩니다.`,
  },
  {
    id: 'disclaimer',
    title: '제9조 (면책조항)',
    content: `① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인한 서비스 제공 불가에 대해 책임을 지지 않습니다.
② AI 분석 결과는 참고용이며, 의료적 진단이나 치료를 대체하지 않습니다.
③ 이용자가 서비스를 통해 제공받은 정보를 활용하여 발생한 결과에 대해 회사는 책임을 지지 않습니다.`,
  },
  {
    id: 'dispute',
    title: '제10조 (분쟁 해결)',
    content: `① 이 약관에 명시되지 않은 사항은 관련 법령에 따릅니다.
② 서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="terms-page">
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
              <FileText className="w-5 h-5" />
              이용약관
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

        {/* 약관 섹션 */}
        {TERMS_SECTIONS.map((section) => (
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base">부칙</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              이 약관은 2026년 1월 1일부터 시행합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
