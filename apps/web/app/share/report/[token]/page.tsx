/**
 * 스타일 리포트 — 공개 공유 페이지 (비로그인 열람)
 *
 * 5축 진단을 하나의 문서로: 오프라인 컬러 컨설팅 결과지의 무료 웹판.
 * 사진·식별 정보 없음 (PublicStyleReport가 화이트리스트 추출) — 바이럴 안전.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSharedReport } from '@/lib/share/report';
import { LIPSTICK_RECOMMENDATIONS, type SeasonType } from '@/lib/mock/personal-color';

interface PageProps {
  params: Promise<{ token: string }>;
}

const SEASON_LABELS: Record<string, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  sensitive: '민감성',
};

const BODY_TYPE_LABELS: Record<string, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
};

const HAIR_TYPE_LABELS: Record<string, string> = {
  straight: '직모',
  wavy: '반곱슬',
  curly: '곱슬',
  coily: '강한 곱슬',
};

function seasonLabel(season: string | undefined): string {
  if (!season) return '';
  return SEASON_LABELS[season.toLowerCase()] ?? season;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const report = await getSharedReport(token);
  const label = report?.personalColor
    ? `${seasonLabel(report.personalColor.season)} 스타일 리포트`
    : '나만의 스타일 리포트';
  const ogUrl = `/api/og/report?label=${encodeURIComponent(label)}`;
  return {
    title: `${label} | 이룸`,
    description: '퍼스널컬러·피부·체형·헤어·메이크업 진단을 담은 스타일 리포트',
    openGraph: {
      title: `${label} | 이룸`,
      description: 'AI가 분석한 나만의 스타일 리포트 — 이룸에서 무료로',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
  };
}

export default async function SharedReportPage({ params }: PageProps) {
  const { token } = await params;
  const report = await getSharedReport(token);
  if (!report) notFound();

  const season = report.personalColor?.season?.toLowerCase() as SeasonType | undefined;
  const lips = season ? (LIPSTICK_RECOMMENDATIONS[season] ?? []).slice(0, 3) : [];
  const date = new Date(report.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div data-testid="shared-report-page" className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* 헤더 */}
        <header className="text-center space-y-1">
          <p className="text-xs tracking-widest text-muted-foreground">YIROOM STYLE REPORT</p>
          <h1 className="text-2xl font-bold">
            {report.personalColor
              ? `${seasonLabel(report.personalColor.season)} 스타일 리포트`
              : '나만의 스타일 리포트'}
          </h1>
          <p className="text-xs text-muted-foreground">{date} · AI 분석 기반</p>
        </header>

        {/* 페르소나 한 줄 */}
        {report.persona && (
          <p className="text-center text-sm text-muted-foreground italic">
            &ldquo;{report.persona}&rdquo;
          </p>
        )}

        {/* 퍼스널컬러 — 히어로 */}
        {report.personalColor && (
          <section className="rounded-2xl border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">🎨 나의 색</h2>
            <p className="text-lg font-bold">
              {seasonLabel(report.personalColor.season)}
              {report.personalColor.undertone && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {report.personalColor.undertone === 'warm' ? '웜 언더톤' : '쿨 언더톤'}
                </span>
              )}
            </p>
            {report.personalColor.bestColors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">잘 어울리는 컬러</p>
                <div className="flex flex-wrap gap-2">
                  {report.personalColor.bestColors.map((c, i) => (
                    <div key={`${c.hex}-${i}`} className="flex flex-col items-center gap-1">
                      <span
                        className="w-9 h-9 rounded-full border shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name && (
                        <span className="text-[9px] text-muted-foreground max-w-12 truncate">
                          {c.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lips.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">추천 립 컬러</p>
                <div className="space-y-1.5">
                  {lips.map((lip) => (
                    <div key={lip.colorName} className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border shrink-0"
                        style={{ backgroundColor: lip.hex }}
                      />
                      <span className="text-sm">{lip.colorName}</span>
                      {(lip.oliveyoungAlt || lip.brandExample) && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          — {lip.oliveyoungAlt || lip.brandExample}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 피부 */}
        {report.skin && (
          <section className="rounded-2xl border bg-card p-5 space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">✨ 나의 피부</h2>
            <p className="text-lg font-bold">
              {SKIN_TYPE_LABELS[report.skin.skinType] ?? report.skin.skinType} 피부
              {report.skin.overallScore != null && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  종합 {report.skin.overallScore}점
                </span>
              )}
            </p>
            {report.skin.foundation && (
              <p className="text-sm text-muted-foreground">
                파운데이션 가이드: {report.skin.foundation}
              </p>
            )}
          </section>
        )}

        {/* 체형 */}
        {report.body && (
          <section className="rounded-2xl border bg-card p-5 space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">👗 나의 체형</h2>
            <p className="text-lg font-bold">
              {BODY_TYPE_LABELS[report.body.bodyType] ?? report.body.bodyType} 타입
            </p>
            {report.body.styleTips.length > 0 && (
              <ul className="space-y-1">
                {report.body.styleTips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {tip}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 헤어 · 메이크업 */}
        {(report.hair || report.makeup) && (
          <section className="rounded-2xl border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">💇 헤어 · 메이크업</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {report.hair?.hairType && (
                <div>
                  <p className="text-xs text-muted-foreground">모발</p>
                  <p className="font-medium">
                    {HAIR_TYPE_LABELS[report.hair.hairType] ?? report.hair.hairType}
                  </p>
                </div>
              )}
              {report.hair?.scalpType && (
                <div>
                  <p className="text-xs text-muted-foreground">두피</p>
                  <p className="font-medium">
                    {SKIN_TYPE_LABELS[report.hair.scalpType] ?? report.hair.scalpType}
                  </p>
                </div>
              )}
              {report.makeup?.undertone && (
                <div>
                  <p className="text-xs text-muted-foreground">언더톤</p>
                  <p className="font-medium">
                    {report.makeup.undertone === 'warm'
                      ? '웜'
                      : report.makeup.undertone === 'cool'
                        ? '쿨'
                        : '뉴트럴'}
                  </p>
                </div>
              )}
            </div>
            {report.makeup && report.makeup.recommendations.length > 0 && (
              <ul className="space-y-1">
                {report.makeup.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {rec}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* CTA — 바이럴 루프 */}
        <section className="rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200 dark:border-pink-900 p-5 text-center space-y-3">
          <p className="text-sm font-medium">나도 내 스타일이 궁금하다면?</p>
          <p className="text-xs text-muted-foreground">
            사진 한 장으로 퍼스널컬러·피부·체형·헤어·메이크업을 한 번에 — 무료
          </p>
          <Link
            href="/home"
            className="inline-block px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            무료로 분석받기
          </Link>
        </section>

        <p className="text-center text-[10px] text-muted-foreground">
          이 리포트는 AI 분석 결과이며 사진 등 개인 정보는 포함되지 않아요 · yiroom
        </p>
      </div>
    </div>
  );
}
