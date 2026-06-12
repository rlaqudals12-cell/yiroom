'use client';

import { useMemo } from 'react';
import { Palette } from 'lucide-react';
import { complementary, analogous, triadic, tonOnTone } from '@/lib/color/harmony';

interface ColorHarmonyGuideProps {
  /** 기준 대표색 HEX (퍼스널컬러 베스트 컬러 첫 항목) */
  baseHex: string;
  /** 기준색 이름 (한국어) */
  baseName?: string;
  className?: string;
}

/** 색상 스와치 한 줄 */
function Swatch({ hex }: { hex: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-10 w-10 rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: hex }}
        aria-label={hex}
      />
      <span className="text-[10px] text-muted-foreground">{hex.toUpperCase()}</span>
    </div>
  );
}

/**
 * 배색 가이드 — 진단된 대표색에서 배색 이론(보색/유사색/삼각/톤온톤)으로
 * 코디 시 함께 쓸 색을 안내한다. "예쁜 색 박기"가 아니라 사용자 톤 기반 계산.
 *
 * @see lib/color/harmony.ts
 */
export function ColorHarmonyGuide({ baseHex, baseName, className }: ColorHarmonyGuideProps) {
  const harmony = useMemo(
    () => ({
      tonOnTone: tonOnTone(baseHex, 3),
      analogous: analogous(baseHex, 30),
      accent: complementary(baseHex),
      triadic: triadic(baseHex),
    }),
    [baseHex]
  );

  const rows: { title: string; desc: string; colors: string[] }[] = [
    {
      title: '톤온톤',
      desc: '같은 계열 명도 변화 — 안정적인 단색 코디',
      colors: harmony.tonOnTone,
    },
    {
      title: '유사색',
      desc: '대표색 양옆 — 조화로운 기본 배색',
      colors: harmony.analogous,
    },
    {
      title: '포인트 컬러',
      desc: '강한 대비 — 가방·액세서리 한 점에',
      colors: [harmony.accent],
    },
    {
      title: '삼각 배색',
      desc: '활기찬 3색 조합 — 룩에 생기를',
      colors: [baseHex, ...harmony.triadic],
    },
  ];

  return (
    <section
      className={`rounded-xl border border-border bg-card p-5 ${className ?? ''}`}
      data-testid="color-harmony-guide"
      aria-label="배색 가이드"
    >
      <div className="mb-4 flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">배색 가이드</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {baseName ? `대표색 "${baseName}"` : '대표색'}을 기준으로 함께 쓰면 좋은 색을 색채학 배색
        이론으로 계산했어요.
      </p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.title}>
            <div className="mb-2">
              <span className="text-sm font-medium text-foreground">{row.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{row.desc}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {row.colors.map((hex, i) => (
                <Swatch key={`${row.title}-${i}-${hex}`} hex={hex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ColorHarmonyGuide;
