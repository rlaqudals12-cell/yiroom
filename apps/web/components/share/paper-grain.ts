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
 * 사용 규율: opacity 0.03~0.05 초과 금지 — 질감은 "느껴지되 보이지 않아야" 한다.
 */
const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>`;

export const PAPER_GRAIN_URI = `url("data:image/svg+xml,${GRAIN_SVG.replace(/'/g, '%27').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`;
