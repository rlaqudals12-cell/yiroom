/**
 * 이용약관 페이지
 */
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '이용약관 | 이룸',
  description: '이룸 서비스 이용약관입니다.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">이용약관</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            최종 업데이트: 2025년 1월 20일
          </p>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제1조 (목적)</h2>
            <p>
              본 약관은 이룸(이하 &quot;회사&quot;)이 제공하는 서비스(이하 &quot;서비스&quot;)의
              이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을
              규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제2조 (정의)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>&quot;서비스&quot;</strong>란 회사가 제공하는 퍼스널 컬러 진단, 피부 분석, 체형 분석, 운동/영양 관리 등의 웰니스 AI 서비스를 말합니다.</li>
              <li><strong>&quot;이용자&quot;</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li><strong>&quot;회원&quot;</strong>이란 회사와 이용계약을 체결하고 이용자 아이디(ID)를 부여받은 자를 말합니다.</li>
              <li><strong>&quot;비회원&quot;</strong>이란 회원으로 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제3조 (약관의 효력 및 변경)</h2>
            <ul className="list-decimal pl-6 space-y-2">
              <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</li>
              <li>회사는 관련 법률을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우 회사는 변경 사항을 시행일자 7일 전부터 서비스 내에 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제4조 (서비스의 제공)</h2>
            <p>회사가 제공하는 서비스는 다음과 같습니다:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>퍼스널 컬러 진단 서비스 (PC-1)</li>
              <li>피부 분석 서비스 (S-1)</li>
              <li>체형 분석 서비스 (C-1)</li>
              <li>운동/피트니스 관리 서비스 (W-1)</li>
              <li>영양/식단 관리 서비스 (N-1)</li>
              <li>통합 리포트 서비스 (R-1)</li>
              <li>AI 웰니스 코치 서비스</li>
              <li>소셜 기능 (친구, 활동 피드, 리더보드, 챌린지)</li>
              <li>제품 추천 및 제휴 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제5조 (서비스 이용)</h2>
            <ul className="list-decimal pl-6 space-y-2">
              <li>서비스는 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.</li>
              <li>회사는 서비스의 제공에 필요한 경우 정기점검을 실시할 수 있으며, 정기점검시간은 서비스 제공화면에 공지한 바에 따릅니다.</li>
              <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 또는 운영상 상당한 이유가 있는 경우 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제6조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>신청 또는 변경 시 허위내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
              <li>타인의 얼굴/신체 사진을 무단으로 업로드하는 행위</li>
              <li>소셜 기능(활동 피드, 댓글, 챌린지)에서 타 이용자를 비방하거나 괴롭히는 행위</li>
              <li>허위 정보 또는 스팸성 게시물을 작성하는 행위</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제7조 (AI 분석 서비스의 한계)</h2>
            <ul className="list-decimal pl-6 space-y-2">
              <li>회사가 제공하는 AI 분석 서비스는 참고용 정보를 제공하는 것으로, 의료적 진단이나 처방을 대체할 수 없습니다.</li>
              <li>피부 분석 결과는 전문 피부과 의사의 진단을 대체하지 않습니다.</li>
              <li>체형 분석 및 운동 추천은 전문 트레이너의 지도를 대체하지 않습니다.</li>
              <li>영양 분석 및 식단 추천은 전문 영양사의 상담을 대체하지 않습니다.</li>
              <li>AI 웰니스 코치의 조언은 일반적인 정보 제공 목적이며, 개인의 특수한 건강 상태를 고려하지 않습니다.</li>
              <li>이용자는 건강 관련 중요한 결정을 내리기 전에 반드시 전문가와 상담해야 합니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제7조의2 (제휴 서비스)</h2>
            <ul className="list-decimal pl-6 space-y-2">
              <li>회사는 제품 추천 시 제휴 파트너(쿠팡 파트너스 등)의 링크를 제공할 수 있습니다.</li>
              <li>제휴 링크를 통한 구매는 해당 외부 서비스의 이용약관이 적용됩니다.</li>
              <li>회사는 외부 서비스에서의 거래, 배송, 환불 등에 대해 책임지지 않습니다.</li>
              <li>제휴 링크 이용으로 인해 회사에 수수료가 발생할 수 있으며, 이는 서비스 운영에 사용됩니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제8조 (저작권 및 지적재산권)</h2>
            <ul className="list-decimal pl-6 space-y-2">
              <li>서비스에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.</li>
              <li>이용자가 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다.</li>
              <li>이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제9조 (면책조항)</h2>
            <ul className="list-decimal pl-6 space-y-2">
              <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">제10조 (분쟁해결)</h2>
            <ul className="list-decimal pl-6 space-y-2">
              <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 고객센터를 운영합니다.</li>
              <li>회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다.</li>
              <li>본 약관에 명시되지 않은 사항은 관계법령 및 상관례에 따릅니다.</li>
              <li>서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">부칙</h2>
            <p>본 약관은 2025년 1월 20일부터 시행됩니다.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
              <li>2025년 12월 4일 ~ 2025년 1월 19일 적용 버전</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
