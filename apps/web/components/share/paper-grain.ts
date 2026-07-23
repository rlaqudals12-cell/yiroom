/**
 * 종이 질감 그레인 — 캡처 산출물(공유카드·리포트)에 인쇄물의 소유감을 입힌다.
 *
 * 왜: 비주얼 패널(2026-07-17)에서 GPT 목업이 이기는 마지막 지점이 "인쇄물 질감의
 * 소유감·따뜻함"으로 판정됨. 글로우·그라데이션(슬롭) 없이 이 갭을 메우는 유일한
 * 수단이 지질(紙質) 노이즈다.
 *
 * 왜 인라인 SVG data URI: 외부 요청 0(캡처 CSP·CORS 안전), html-to-image가 배경을
 * 그대로 인라인하므로 저장 PNG에도 질감이 구워진다. feTurbulence = 파일 0KB.
 *
 * 2026-07-23 업그레이드(디자인 자원 조사): 평면 노이즈 1겹 → 2겹 합성.
 * ①요철 레이어: 저주파 fractalNoise를 feDiffuseLighting으로 비추어 "빛이 종이 섬유에
 *   닿는" 미세 굴곡(Codrops/Sara Soueidan 레시피 파라미터 참고, 마크업 자작).
 * ②미세 그레인: 기존 고주파 노이즈(baseFrequency 0.8) 유지.
 * seed 고정 = 결정론(같은 카드는 언제나 같은 질감 — 재현성 계약과 동일 결).
 *
 * 사용 규율: opacity 0.03~0.05 초과 금지 — 질감은 "느껴지되 보이지 않아야" 한다.
 */
const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' seed='7' stitchTiles='stitch' result='n'/><feDiffuseLighting in='n' lighting-color='white' surfaceScale='1.6' diffuseConstant='1.1'><feDistantLight azimuth='235' elevation='55'/></feDiffuseLighting></filter><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='7' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23p)' opacity='0.5'/><rect width='100%25' height='100%25' filter='url(%23g)' opacity='0.65'/></svg>`;

export const PAPER_GRAIN_URI = `url("data:image/svg+xml,${GRAIN_SVG.replace(/'/g, '%27').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`;
