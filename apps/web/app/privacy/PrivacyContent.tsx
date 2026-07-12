'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Lang = 'ko' | 'en';

export function PrivacyContent() {
  const searchParams = useSearchParams();
  const initialLang = searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const [lang, setLang] = useState<Lang>(initialLang);

  return (
    <div className="min-h-screen bg-background" data-testid="privacy-page">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* 언어 토글 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('ko')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                lang === 'ko'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-label="한국어로 보기"
            >
              한국어
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                lang === 'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-label="View in English"
            >
              English
            </button>
          </div>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          {lang === 'ko' ? <KoreanContent /> : <EnglishContent />}
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link href="/" className="text-primary hover:underline">
            {lang === 'ko' ? '← 홈으로 돌아가기' : '← Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}

function KoreanContent() {
  return (
    <>
      <p className="text-muted-foreground">최종 업데이트: 2026년 2월 20일</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">1. 개인정보의 처리 목적</h2>
        <p>
          이룸(이하 &quot;회사&quot;)은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
          개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
          별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
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
          <li>
            <strong>필수 항목:</strong> 이메일 주소, 비밀번호, 닉네임, 생년월일(연령 확인 — 만 14세
            이상 확인 목적), 성별(맞춤 분석 목적)
          </li>
          <li>
            <strong>선택 항목:</strong> 프로필 사진, 키, 체중
          </li>
          <li>
            <strong>서비스 이용 시 수집:</strong> 얼굴/체형 이미지, 운동 기록, 식단 기록, AI 코치
            대화 내용
          </li>
          <li>
            <strong>소셜 기능 이용 시:</strong> 친구 목록, 활동 피드 게시물, 댓글, 좋아요 기록
          </li>
          <li>
            <strong>자동 수집:</strong> 서비스 이용 기록, 접속 로그, 기기 정보, 제휴 링크 클릭 기록
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">3. 개인정보의 보유 및 이용 기간</h2>
        <p>
          회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
          동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 후 30일 이내 파기)</li>
          <li>
            분석 이미지: 저장에 동의한 경우 동의일로부터 1년간 보관 후 자동 파기되며, 그 전에도 요청
            시 언제든 삭제할 수 있습니다 (회원 탈퇴 시 파기)
          </li>
          <li>
            AI 코치 대화: 대화 이어보기 기능 제공을 위해 서버에 저장되며, 설정 또는 삭제 요청으로
            언제든 삭제 가능 (회원 탈퇴 시 파기)
          </li>
          <li>소셜 활동 기록: 회원 탈퇴 시까지 (탈퇴 후 30일 이내 파기)</li>
          <li>서비스 이용 기록: 3년</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">4. 민감정보(생체정보)의 처리</h2>
        <p>
          회사는 개인정보보호법 제23조에 따라 사용자의 얼굴, 체형 등 생체정보를 수집·이용하는 경우
          별도의 동의를 받습니다.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>수집 항목:</strong> 피부 분석용 얼굴 이미지, 체형 분석용 전신 이미지, 퍼스널
            컬러 분석용 이미지
          </li>
          <li>
            <strong>처리 목적:</strong> AI 기반 피부/체형/퍼스널컬러 분석 및 변화 추적
          </li>
          <li>
            <strong>보유 기간:</strong> 삭제 요청 또는 회원 탈퇴 시까지 (요청 시 즉시 파기)
          </li>
          <li>
            <strong>동의 방법:</strong> 가입 시 약관 동의 단계에서 별도의 필수 동의 항목으로 수집
            (이미지 촬영 전 사전 동의)
          </li>
          <li>
            <strong>동의 철회:</strong> 설정 &gt; 개인정보 메뉴에서 언제든지 철회 가능
          </li>
        </ul>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>안내:</strong> 이미지 저장에 동의하지 않아도 분석 서비스는 이용 가능합니다. 다만
            이전 분석 결과와의 비교(변화 추적) 기능은 사용할 수 없습니다.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">5. 개인정보의 제3자 제공 및 AI 서비스</h2>
        <p>
          회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며,
          다음의 경우를 제외하고는 정보주체의 사전 동의 없이 본래의 목적 범위를 초과하여 처리하거나
          제3자에게 제공하지 않습니다.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>정보주체로부터 별도의 동의를 받은 경우</li>
          <li>법률에 특별한 규정이 있는 경우</li>
          <li>
            정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전
            동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의
            이익을 위하여 필요하다고 인정되는 경우
          </li>
        </ul>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">AI 분석 서비스 관련 제3자 제공</p>
          <p className="mt-2 text-sm">
            이룸의 AI 분석 기능(퍼스널컬러, 피부, 체형 등)은 Google Gemini API를 활용합니다. 분석 시
            사용자의 이미지 데이터가 Google의 AI 서버로 전송되어 처리됩니다. Google의 데이터 처리에
            관한 자세한 내용은{' '}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Gemini API Terms of Service
            </a>
            를 참조해주세요.
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">개인정보의 국외 이전</p>
          <p className="mt-2 text-sm">
            AI 분석 서비스 제공을 위해 아래와 같이 개인정보가 국외로 이전됩니다 (개인정보보호법
            제28조의8).
          </p>
          <ul className="mt-2 text-sm list-disc pl-6 space-y-1">
            <li>이전받는 자: Google LLC (Google Gemini API)</li>
            <li>이전 국가: 미국 등 Google이 운영하는 데이터센터 소재국</li>
            <li>이전 항목: 분석용 얼굴/체형/퍼스널컬러 이미지</li>
            <li>이전 일시 및 방법: 분석 요청 시 암호화된 통신(HTTPS)으로 실시간 전송</li>
            <li>이용 목적: AI 이미지 분석 처리</li>
            <li>
              보유·이용 기간: 실시간 처리 후 Gemini API 약관에 따라 모델 학습 목적으로 저장·이용되지
              않음
            </li>
            <li>
              이전 거부 방법 및 효과: 분석 기능을 이용하지 않거나 계정을 삭제하면 이전이 중단됩니다.
              다만 이전을 거부하시면 AI 분석 서비스를 이용하실 수 없습니다.
            </li>
          </ul>
          <p className="mt-2 text-sm">
            또한 데이터 저장(Supabase) 및 회원 인증(Clerk) 제공업체의 인프라가 국외에 위치할 수
            있으며, 서비스를 이용함으로써 이러한 국외 이전에 동의하게 됩니다. 회사는 이전받는 자와의
            계약을 통해 개인정보가 안전하게 보호되도록 합니다.
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">제휴 서비스 이용 시 안내</p>
          <p className="mt-2 text-sm">
            서비스 내 제품 추천 링크를 통해 외부 쇼핑몰(쿠팡 등)로 이동하는 경우, 해당 외부 서비스의
            개인정보처리방침이 적용됩니다. 이룸은 제휴 링크 클릭 기록을 회원 식별자와 함께 서비스
            내부에 저장하지만(추천 개선·전환 확인 목적), 외부 파트너에게 회원 식별 정보를 전달하지
            않습니다. 외부 서비스에서의 구매 정보는 수집하지 않습니다.
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">개인정보 처리 위탁 현황</p>
          <ul className="mt-2 text-sm list-disc pl-6 space-y-1">
            <li>Supabase: 데이터 저장 및 관리 (클라우드 데이터베이스)</li>
            <li>Google (Gemini API): AI 이미지 분석 처리</li>
            <li>Clerk: 회원 인증 및 계정 관리</li>
            <li>Vercel: 서비스 호스팅 및 트래픽 통계</li>
            <li>Tawk.to: 고객 상담 위젯 운영</li>
            <li>Sentry: 오류 모니터링</li>
          </ul>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">쿠키 등 자동수집장치의 설치·운영 및 거부</p>
          <p className="mt-2 text-sm">
            회사는 서비스 제공을 위해 아래와 같은 쿠키 및 유사 기술을 사용합니다.
          </p>
          <ul className="mt-2 text-sm list-disc pl-6 space-y-1">
            <li>Clerk 로그인 세션 쿠키: 로그인 상태 유지 (필수)</li>
            <li>Tawk.to 고객상담 위젯 쿠키: 상담 세션 유지</li>
            <li>언어 설정 쿠키: 언어를 직접 선택한 경우 설정 저장</li>
            <li>Vercel Analytics: 쿠키 없이 익명 방문 통계를 수집합니다</li>
            <li>Sentry: 오류 모니터링 목적으로 브라우저·기기 등 기술 정보를 수집합니다</li>
          </ul>
          <p className="mt-2 text-sm">
            거부 방법: 브라우저 설정에서 쿠키 저장을 차단하거나 삭제할 수 있습니다. 다만 필수 쿠키를
            차단하면 로그인 등 일부 기능 이용이 제한될 수 있습니다.
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">위치정보의 이용</p>
          <p className="mt-2 text-sm">
            코디 추천 및 날씨 기반 조언 시, 사용자가 브라우저에서 위치 접근을 명시적으로 허용한
            경우에 한해 기기의 대략적인 위치(좌표)를 <strong>일시적으로</strong> 사용합니다. 이
            위치정보는 별도로 저장되지 않으며, 날씨 조회(Open-Meteo)에만 이용됩니다. 브라우저
            설정에서 위치 접근을 거부하거나 차단할 수 있으며, 이 경우 위치 기반 추천 기능만 제한되고
            다른 기능은 정상적으로 이용하실 수 있습니다.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">6. 개인정보의 파기</h2>
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
        <h2 className="text-xl font-semibold mb-4">7. 이용자의 권리</h2>
        <p>
          정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리정지 요구</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">8. 자동화된 결정 및 프로파일링</h2>
        <p>
          회사는 사용자가 업로드한 이미지를 AI(Google Gemini)로 분석하여 퍼스널 컬러, 피부, 체형,
          헤어, 메이크업 등 시각적 특성에 관한 프로파일과 맞춤 조언을 자동으로 생성합니다.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>처리 기준:</strong> 이미지에서 추출한 색상·명암·형태 등 시각적 특징을 학술적
            분석 기준(색채학·피부생리학 등)에 대입하여 결과를 산출합니다.
          </li>
          <li>
            <strong>처리 절차:</strong> 이미지 전송, AI 특징 추출, 분석 기준 적용, 결과 표시의
            순서로 처리되며, 결과에는 신뢰도가 함께 표시됩니다.
          </li>
          <li>
            <strong>결과의 성격:</strong> 분석 결과는 참고용 미용 조언이며, 사용자의 권리·의무에
            법적 효력을 미치는 결정이 아닙니다.
          </li>
          <li>
            <strong>거부 및 설명 요구:</strong> 분석 기능을 이용하지 않음으로써 자동화된 처리를
            거부할 수 있으며, 결과에 대한 설명 요구 또는 재분석·삭제 요청은 privacy@yiroom.app으로
            하실 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">9. 개인정보의 안전성 확보조치</h2>
        <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>전송 구간 암호화: 모든 데이터는 HTTPS(TLS) 암호화 통신으로 전송됩니다.</li>
          <li>저장 데이터 암호화: 이미지 및 개인정보는 암호화된 클라우드 스토리지에 저장됩니다.</li>
          <li>
            접근 권한 통제: 최소 권한 원칙에 따라 접근 권한을 부여·관리하며, 본인 데이터에만 접근할
            수 있도록 행 수준 접근제어(RLS)를 적용합니다.
          </li>
          <li>
            접속기록 보관·점검: 개인정보 처리 시스템의 접속 기록을 보관하고 위·변조를 방지합니다.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">10. 아동의 개인정보 보호</h2>
        <p>
          이룸은 만 14세 미만 아동을 대상으로 서비스를 제공하지 않으며, 가입 시 만 14세 이상임을
          확인합니다. 만 14세 미만 아동의 개인정보가 수집된 사실을 인지한 경우, 회사는 지체 없이
          해당 정보를 파기합니다.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">11. 계정 삭제</h2>
        <p>사용자는 언제든지 자신의 계정과 관련 데이터를 삭제할 수 있습니다:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>설정 &gt; 계정 관리 &gt; 회원 탈퇴를 통해 직접 삭제</li>
          <li>이메일(privacy@yiroom.app)로 삭제 요청</li>
          <li>탈퇴 시 모든 개인정보 및 분석 결과는 30일 이내 완전 파기</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">12. 개인정보 보호책임자</h2>
        <p>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
          불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p>
            <strong>개인정보 보호책임자</strong>
          </p>
          <p>성명: 김병민 (대표)</p>
          <p>이메일: privacy@yiroom.app</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
          <li>개인정보 침해신고센터: 118</li>
          <li>개인정보 분쟁조정위원회: 1833-6972</li>
          <li>대검찰청 사이버수사과: 1301</li>
          <li>경찰청 사이버안전국: 182</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">13. 개인정보처리방침의 변경</h2>
        <p>
          이 개인정보처리방침은 2026년 2월 20일부터 적용됩니다. 이전의 개인정보처리방침은 아래에서
          확인하실 수 있습니다.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
          <li>2026년 1월 8일 ~ 2026년 2월 19일 적용 버전</li>
          <li>2025년 1월 20일 ~ 2026년 1월 7일 적용 버전</li>
        </ul>
      </section>
    </>
  );
}

function EnglishContent() {
  return (
    <>
      <p className="text-muted-foreground">Last updated: February 20, 2026</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">1. Purpose of Processing Personal Data</h2>
        <p>
          Yiroom (&quot;Company&quot;) processes personal data for the following purposes. Data
          collected will not be used beyond these stated purposes. If purposes change, we will
          obtain separate consent and take necessary measures.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            Membership management: identity verification and authentication for account registration
          </li>
          <li>
            Service delivery: personal color diagnosis, skin analysis, body type analysis, workout
            and nutrition management
          </li>
          <li>AI analysis: AI-powered analysis based on user-uploaded images</li>
          <li>AI coaching: personalized wellness advice through AI coaching</li>
          <li>Social features: friend connections, activity feeds, leaderboards, and challenges</li>
          <li>
            Product recommendations: personalized product suggestions based on analysis results and
            affiliate services
          </li>
          <li>
            Service improvement: analysis of usage records, service improvement, and new feature
            development
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">2. Categories of Personal Data Collected</h2>
        <p>The Company collects the following personal data to provide its services:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>Required:</strong> Email address, password, nickname, date of birth (for age
            verification &mdash; 14 or older), gender (for personalized analysis)
          </li>
          <li>
            <strong>Optional:</strong> Profile photo, height, weight
          </li>
          <li>
            <strong>Collected during service use:</strong> Face/body images, workout records, diet
            records, AI coach conversation content
          </li>
          <li>
            <strong>Social features:</strong> Friend lists, activity feed posts, comments, likes
          </li>
          <li>
            <strong>Automatically collected:</strong> Service usage logs, access logs, device
            information, affiliate link click records
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">3. Data Retention Periods</h2>
        <p>
          The Company retains and processes personal data within the retention period required by
          applicable laws or as agreed upon during data collection.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            Account information: Until account deletion (destroyed within 30 days of deletion)
          </li>
          <li>
            Analysis images: When you consent to storage, retained for 1 year from the consent date
            and then automatically destroyed; can be deleted earlier anytime upon request (destroyed
            upon account deletion)
          </li>
          <li>
            AI coach conversations: Stored on our servers so you can resume previous conversations;
            you can delete them anytime via settings or by request (destroyed upon account deletion)
          </li>
          <li>
            Social activity records: Until account deletion (destroyed within 30 days of deletion)
          </li>
          <li>Service usage logs: 3 years</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">4. Processing of Biometric Data</h2>
        <p>
          In accordance with Article 23 of the Personal Information Protection Act (Korea), the
          Company obtains separate consent when collecting and using biometric data such as facial
          features and body shape.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>Data collected:</strong> Facial images for skin analysis, full-body images for
            body type analysis, images for personal color analysis
          </li>
          <li>
            <strong>Purpose:</strong> AI-powered skin, body type, and personal color analysis, and
            progress tracking
          </li>
          <li>
            <strong>Retention:</strong> Until deletion request or account deletion (destroyed
            immediately upon request)
          </li>
          <li>
            <strong>Consent method:</strong> Collected as a separate, mandatory consent item during
            sign-up, before any image is captured
          </li>
          <li>
            <strong>Withdrawal:</strong> Can be withdrawn anytime via Settings &gt; Privacy
          </li>
        </ul>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> Analysis services are available even without consenting to image
            storage. However, comparison with previous results (progress tracking) will not be
            available.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">5. Third-Party Data Sharing and AI Services</h2>
        <p>
          The Company does not share personal data with third parties beyond the stated purposes
          without prior consent, except in the following cases:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>When separate consent has been obtained from the data subject</li>
          <li>When required by law or regulation</li>
          <li>
            When necessary for the urgent protection of life, body, or property and the data subject
            is unable to express consent
          </li>
        </ul>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">AI Analysis Service &mdash; Third-Party Processing</p>
          <p className="mt-2 text-sm">
            Yiroom&apos;s AI analysis features (personal color, skin, body type, etc.) utilize the{' '}
            <strong>Google Gemini API</strong>. When you use these features, your image data is
            transmitted to and processed by Google&apos;s AI servers. Images are processed in
            real-time and are not stored by Google for model training purposes under the Gemini API
            terms. For details on Google&apos;s data handling, please refer to the{' '}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Gemini API Terms of Service
            </a>
            .
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">International Data Transfer</p>
          <p className="mt-2 text-sm">
            To provide AI analysis, personal data is transferred internationally as follows (PIPA
            Art. 28-8; GDPR Art. 44&ndash;49):
          </p>
          <ul className="mt-2 text-sm list-disc pl-6 space-y-1">
            <li>Recipient: Google LLC (Google Gemini API)</li>
            <li>
              Destination: United States and other countries where Google operates data centers
            </li>
            <li>Data transferred: Facial/body/personal-color images for analysis</li>
            <li>
              Timing &amp; method: Transmitted in real time over encrypted connections (HTTPS) when
              you request an analysis
            </li>
            <li>Purpose: AI image analysis processing</li>
            <li>
              Retention: Processed in real time; not stored for model training under the Gemini API
              terms
            </li>
            <li>
              How to refuse &amp; effect: You may refuse the transfer by not using the analysis
              features or by deleting your account. If you refuse, the AI analysis services cannot
              be provided.
            </li>
          </ul>
          <p className="mt-2 text-sm">
            In addition, our storage (Supabase) and authentication (Clerk) providers may host
            infrastructure outside Korea or the EU. By using the service you consent to these
            international transfers. The Company relies on contractual safeguards (e.g., data
            processing agreements and standard contractual clauses) with these recipients.
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">Affiliate Services</p>
          <p className="mt-2 text-sm">
            When you click product recommendation links within the service, you will be redirected
            to external shopping platforms (e.g., Coupang). Their respective privacy policies apply.
            Yiroom records affiliate link clicks together with your account identifier within the
            service (to improve recommendations and confirm conversions), but does not pass any
            personal identifiers to external partners. Yiroom does not collect any purchase
            information from external services.
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">Data Processing Partners</p>
          <ul className="mt-2 text-sm list-disc pl-6 space-y-1">
            <li>Supabase: Data storage and management (cloud database)</li>
            <li>Google (Gemini API): AI image analysis processing</li>
            <li>Clerk: Member authentication and account management</li>
            <li>Vercel: Service hosting and traffic analytics</li>
            <li>Tawk.to: Customer support chat widget</li>
            <li>Sentry: Error monitoring</li>
          </ul>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">Cookies and Automatic Collection</p>
          <p className="mt-2 text-sm">
            The Company uses cookies and similar technologies as follows:
          </p>
          <ul className="mt-2 text-sm list-disc pl-6 space-y-1">
            <li>Clerk login session cookies: Keep you signed in (essential)</li>
            <li>Tawk.to support widget cookies: Maintain your support chat session</li>
            <li>Language preference cookie: Stores your language choice when you select one</li>
            <li>Vercel Analytics: Collects anonymous visit statistics without using cookies</li>
            <li>
              Sentry: Collects technical information (browser, device, etc.) for error monitoring
            </li>
          </ul>
          <p className="mt-2 text-sm">
            How to refuse: You can block or delete cookies in your browser settings. Blocking
            essential cookies may limit features such as sign-in.
          </p>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium">Use of Location Data</p>
          <p className="mt-2 text-sm">
            For outfit recommendations and weather-based advice, we use your device&apos;s
            approximate location (coordinates) <strong>temporarily</strong>, only when you
            explicitly grant location access in your browser. This location data is not stored and
            is used solely to look up weather (Open-Meteo). You can deny or block location access in
            your browser settings; in that case only location-based recommendations are limited, and
            all other features work normally.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">6. Data Destruction</h2>
        <p>
          When personal data is no longer needed due to expiration of retention period or
          fulfillment of processing purpose, the Company destroys the data without delay.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Electronic files: Securely deleted to prevent recovery or reproduction</li>
          <li>Physical records: Destroyed by shredding or incineration</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">7. User Rights</h2>
        <p>Users may exercise the following rights regarding their personal data at any time:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Request access to personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of personal data</li>
          <li>Request suspension of data processing</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">8. Automated Decision-Making and Profiling</h2>
        <p>
          The Company uses AI (Google Gemini) to analyze the images you upload and automatically
          generate profiles and personalized advice about your visual characteristics&mdash;personal
          color, skin, body type, hair, and makeup.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>Basis of processing:</strong> Visual features such as color, contrast, and shape
            are extracted from the image and evaluated against academic analysis criteria (e.g.,
            color science and skin physiology).
          </li>
          <li>
            <strong>Procedure:</strong> Image transmission, AI feature extraction, application of
            analysis criteria, and presentation of results, with a confidence level shown alongside
            each result.
          </li>
          <li>
            <strong>Nature of results:</strong> Results are advisory beauty guidance and are not
            decisions that produce legal or similarly significant effects on your rights or
            obligations.
          </li>
          <li>
            <strong>Right to object and to an explanation:</strong> You may object to automated
            processing by not using the analysis features. To request an explanation of a result, a
            re-analysis, or deletion, contact privacy@yiroom.app.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">9. Security Measures</h2>
        <p>The Company implements the following measures to safeguard personal data:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            Encryption in transit: All data is transmitted over encrypted HTTPS (TLS) connections.
          </li>
          <li>
            Encryption at rest: Images and personal data are stored in encrypted cloud storage.
          </li>
          <li>
            Access control: Access is granted under the principle of least privilege, and row-level
            security (RLS) ensures you can access only your own data.
          </li>
          <li>
            Access logging: Access to systems that process personal data is logged and protected
            against tampering.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
        <p>
          Yiroom is not directed to children under 13, and we do not knowingly collect personal
          information from children under 13. If we become aware that we have collected personal
          information from a child under 13, we will delete it without undue delay. (Under Korean
          law, the service is limited to users aged 14 and older.)
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">11. Account Deletion</h2>
        <p>Users may delete their account and all associated data at any time through:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Self-service deletion via Settings &gt; Account Management &gt; Delete Account</li>
          <li>Email request to privacy@yiroom.app</li>
          <li>
            Upon deletion, all personal data and analysis results are permanently destroyed within
            30 days
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">12. Data Protection Officer</h2>
        <p>
          The Company has designated a Data Protection Officer to oversee all personal data
          processing and to address complaints and remedies related to data protection.
        </p>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p>
            <strong>Data Protection Officer</strong>
          </p>
          <p>Name: Kim Byeong-min (Representative)</p>
          <p>Email: privacy@yiroom.app</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">13. Changes to This Policy</h2>
        <p>
          This Privacy Policy is effective as of February 20, 2026. Previous versions are available
          below:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Version effective January 8, 2026 &ndash; February 19, 2026</li>
          <li>Version effective January 20, 2025 &ndash; January 7, 2026</li>
        </ul>
      </section>
    </>
  );
}
