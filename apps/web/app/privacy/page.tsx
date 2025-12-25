/**
 * 개인정보처리방침 페이지
 */
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 이룸',
  description: '이룸 서비스의 개인정보처리방침입니다.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">개인정보처리방침</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            최종 업데이트: 2025년 1월 20일
          </p>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">1. 개인정보의 처리 목적</h2>
            <p>
              이룸(이하 &quot;회사&quot;)은 다음의 목적을 위하여 개인정보를 처리합니다.
              처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
              이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
              <li>서비스 제공: 퍼스널 컬러 진단, 피부 분석, 체형 분석, 운동/영양 관리 서비스 제공</li>
              <li>AI 분석: 사용자가 업로드한 이미지를 기반으로 한 AI 분석 서비스 제공</li>
              <li>AI 코치: 사용자 맞춤형 웰니스 조언을 위한 AI 코칭 서비스 제공</li>
              <li>소셜 기능: 친구 연결, 활동 피드, 리더보드, 챌린지 참여 기능 제공</li>
              <li>제품 추천: 사용자 분석 결과 기반 맞춤형 제품 추천 및 제휴 서비스 제공</li>
              <li>서비스 개선: 서비스 이용 기록 분석, 서비스 개선 및 신규 서비스 개발</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">2. 수집하는 개인정보 항목</h2>
            <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>필수 항목:</strong> 이메일 주소, 비밀번호, 닉네임</li>
              <li><strong>선택 항목:</strong> 프로필 사진, 키, 체중, 생년월일, 성별</li>
              <li><strong>서비스 이용 시 수집:</strong> 얼굴/체형 이미지, 운동 기록, 식단 기록, AI 코치 대화 내용</li>
              <li><strong>소셜 기능 이용 시:</strong> 친구 목록, 활동 피드 게시물, 댓글, 좋아요 기록</li>
              <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 로그, 기기 정보, 제휴 링크 클릭 기록</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">3. 개인정보의 보유 및 이용 기간</h2>
            <p>
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를
              수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 후 30일 이내 파기)</li>
              <li>분석 이미지: 분석 완료 후 즉시 삭제 (서버에 저장하지 않음)</li>
              <li>AI 코치 대화: 세션 종료 시 삭제 (대화 내용은 서버에 영구 저장하지 않음)</li>
              <li>소셜 활동 기록: 회원 탈퇴 시까지 (탈퇴 후 30일 이내 파기)</li>
              <li>서비스 이용 기록: 3년</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서
              처리하며, 다음의 경우를 제외하고는 정보주체의 사전 동의 없이 본래의 목적 범위를
              초과하여 처리하거나 제3자에게 제공하지 않습니다.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>정보주체로부터 별도의 동의를 받은 경우</li>
              <li>법률에 특별한 규정이 있는 경우</li>
              <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나
                  주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는
                  제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
            </ul>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-medium">제휴 서비스 이용 시 안내</p>
              <p className="mt-2 text-sm">
                서비스 내 제품 추천 링크를 통해 외부 쇼핑몰(쿠팡 등)로 이동하는 경우,
                해당 외부 서비스의 개인정보처리방침이 적용됩니다. 이룸은 제휴 링크 클릭 여부만
                익명으로 집계하며, 외부 서비스에서의 구매 정보는 수집하지 않습니다.
              </p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">5. 개인정보의 파기</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체없이 해당 개인정보를 파기합니다.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>전자적 파일 형태: 복구 및 재생이 불가능하도록 안전하게 삭제</li>
              <li>기록물, 인쇄물, 서면 등: 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">6. 이용자의 권리</h2>
            <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">7. 개인정보 보호책임자</h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
              정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를
              지정하고 있습니다.
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p><strong>개인정보 보호책임자</strong></p>
              <p>이메일: privacy@yiroom.com</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">8. 개인정보처리방침의 변경</h2>
            <p>
              이 개인정보처리방침은 2025년 1월 20일부터 적용됩니다.
              이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.
            </p>
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
