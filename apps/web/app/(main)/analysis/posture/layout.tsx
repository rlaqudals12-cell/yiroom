import { redirect } from 'next/navigation';

/**
 * /analysis/posture — ADR-098 정체성 재정의 v2로 숨김 처리.
 *
 * posture(자세 분석)는 시각 정체성 5축(PC/S/C/H/M)에 속하지 않고
 * W-1(운동) 인접 영역이라, W-1/N-1과 동일하게 "코드/DB 유지 + UI 숨김" 정책 적용.
 * 보류 해제 시 이 layout.tsx만 삭제하면 즉시 복원됨.
 *
 * @see docs/adr/ADR-098-identity-redefinition-5axis-model.md
 */
export default function PostureLayout() {
  redirect('/home');
}
