import { redirect } from 'next/navigation';

// 배치 R(9/8 수리): 출시 동선이 없는 캡슐 3페이지(대시보드·gap·[domain])만 (retired) 라우트 그룹에서
// 서버 경계로 숨긴다. /capsule/daily는 ADR-111 정본 표면(홈 위젯 "전체 루틴 보기")이라 그룹 밖에 둔다.
export default function RetiredCapsuleLayout(): never {
  redirect('/home');
}
