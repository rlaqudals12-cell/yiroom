/**
 * 모바일 축 조합 인사이트 (ADR-104 체크리스트 #4)
 *
 * @module lib/integrated/cross-insights
 * @description
 *   웹 apps/web/lib/analysis/integrated/cross-insights.ts 동일 로직 복제.
 *   모바일은 IntegratedAnalysisResult.axes를 직접 입력.
 *
 * @see apps/web/lib/analysis/integrated/cross-insights.ts (원본)
 */

import type { AxisData, IntegratedAnalysisResult } from '@/lib/api';

export interface CrossInsight {
  id: string;
  combo: string;
  title: string;
  body: string;
}

export interface CrossInsights {
  items: CrossInsight[];
}

// ============================================
// 축 데이터 추출
// ============================================

function getPC(
  r: IntegratedAnalysisResult['axes']['personalColor']
): { season: string; undertone: string; tone: string } | null {
  if (!r.success) return null;
  const d = r.data as AxisData;
  return {
    season: String(d.season ?? ''),
    undertone: String(d.undertone ?? '').toLowerCase(),
    tone: String(d.tone ?? ''),
  };
}

function getSkin(
  r: IntegratedAnalysisResult['axes']['skin']
): { type: string; score: number } | null {
  if (!r.success) return null;
  const d = r.data as AxisData;
  return {
    type: String(d.skinType ?? '').toLowerCase(),
    score: Number(d.overallScore ?? 0),
  };
}

function getBody(r: IntegratedAnalysisResult['axes']['body']): { type: string } | null {
  if (!r.success) return null;
  return { type: String((r.data as AxisData).bodyType ?? '') };
}

function getHair(r: IntegratedAnalysisResult['axes']['hair']): { faceShape: string } | null {
  if (!r.success) return null;
  return { faceShape: String((r.data as AxisData).faceShape ?? '') };
}

function getMakeup(r: IntegratedAnalysisResult['axes']['makeup']): { base: string } | null {
  if (!r.success) return null;
  return { base: String((r.data as AxisData).baseRecommendation ?? '') };
}

// ============================================
// 조합 규칙
// ============================================

function pcXskin(pc: { undertone: string }, skin: { type: string }) {
  const warm = pc.undertone === 'warm';
  const tone = warm ? '코랄' : '로즈';
  let finish = '사틴 피니시';
  if (skin.type.includes('oil')) finish = '매트 피니시';
  else if (skin.type.includes('dry')) finish = '듀이 피니시';
  else if (skin.type.includes('combination')) finish = '세미매트 피니시';
  return {
    title: `${tone} × ${finish}`,
    body: `${pc.undertone}톤 혈색에 ${skin.type} 피부가 만나면 ${tone} 계열 베이스 + ${finish}가 가장 자연스러워요.`,
  };
}

function pcXmakeup(pc: { undertone: string; season: string }) {
  const warm = pc.undertone === 'warm';
  const lip = warm ? '코랄/오렌지' : '로즈/베리';
  const eye = warm ? '골드/브라운' : '실버/플럼';
  return {
    title: `${lip} 립 + ${eye} 섀도`,
    body: `${pc.season} ${pc.undertone}톤 팔레트로 립은 ${lip}, 아이는 ${eye} 조합이 얼굴을 가장 또렷하게 살려요.`,
  };
}

function bodyXhair(body: { type: string }, hair: { faceShape: string }) {
  const face = hair.faceShape.toLowerCase();
  let style = '레이어드 컷';
  if (face.includes('round')) style = '얼굴선을 길게 빼는 사이드 컷';
  else if (face.includes('square')) style = '턱선 부드럽게 감싸는 웨이브';
  else if (face.includes('heart') || face.includes('triangle')) style = '턱 아래 볼륨 주는 컷';
  else if (face.includes('oval')) style = '자유로운 스타일';
  else if (face.includes('oblong') || face.includes('long')) style = '가로 볼륨을 만드는 뱅';
  return {
    title: `${body.type} × ${style}`,
    body: `${body.type} 실루엣과 ${hair.faceShape}형 얼굴의 균형은 ${style}이(가) 완성해요.`,
  };
}

function skinXmakeup(skin: { type: string; score: number }) {
  const t = skin.type;
  const low = skin.score < 65;
  if (t.includes('oil'))
    return {
      title: 'T존 컨트롤 + 세팅 파우더',
      body: '지성 피부는 프라이머-세팅 파우더 이중 구조로 유분을 붙잡아주는 게 핵심이에요.',
    };
  if (t.includes('dry'))
    return {
      title: '보습 프라이머 + 쿠션',
      body: '건성 피부는 보습 프라이머 → 쿠션 순서로 겹쳐야 들뜸 없이 촉촉해요.',
    };
  if (t.includes('sensitiv'))
    return {
      title: '저자극 베이스 + 미네랄 파우더',
      body: '민감 피부는 무향/무알코올 베이스 + 미네랄 파우더로 자극 없이 마무리.',
    };
  if (t.includes('combination'))
    return {
      title: 'T존 매트 + U존 듀이',
      body: '복합성은 부위별 다른 피니시가 정답이에요. T존만 파우더로 세팅하세요.',
    };
  return {
    title: low ? '기초 루틴 안정화 먼저' : '현재 루틴 유지',
    body: low
      ? '메이크업 전 기본 보습/차단부터 1-2주 안정화하면 발색이 달라져요.'
      : '좋은 상태에 유지 중심. 주간 각질 관리로 베이스 밀착을 높이세요.',
  };
}

function pcXbody(pc: { undertone: string; season: string }, body: { type: string }) {
  const warm = pc.undertone === 'warm';
  const topTone = warm ? '따뜻한 아이보리/카멜' : '쿨 그레이/네이비';
  return {
    title: `${topTone} × ${body.type} 핏`,
    body: `${pc.season} ${pc.undertone}톤에 ${body.type} 체형은 ${topTone} 상의 + 핏 포인트를 살린 하의 조합이 안정적이에요.`,
  };
}

// ============================================
// 조합기
// ============================================

export function composeCrossInsights(axes: IntegratedAnalysisResult['axes']): CrossInsights {
  const pc = getPC(axes.personalColor);
  const skin = getSkin(axes.skin);
  const body = getBody(axes.body);
  const hair = getHair(axes.hair);
  const makeup = getMakeup(axes.makeup);

  const items: CrossInsight[] = [];

  if (pc && skin) items.push({ id: 'pc_s', combo: '색 × 피부', ...pcXskin(pc, skin) });
  if (pc && makeup) items.push({ id: 'pc_m', combo: '색 × 메이크업', ...pcXmakeup(pc) });
  if (body && hair) items.push({ id: 'c_h', combo: '체형 × 헤어', ...bodyXhair(body, hair) });
  if (skin && makeup) items.push({ id: 's_m', combo: '피부 × 메이크업', ...skinXmakeup(skin) });
  if (pc && body) items.push({ id: 'pc_c', combo: '색 × 체형', ...pcXbody(pc, body) });

  return { items };
}
