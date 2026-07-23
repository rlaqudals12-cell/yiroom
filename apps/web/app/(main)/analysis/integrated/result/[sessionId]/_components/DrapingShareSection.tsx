'use client';

/**
 * 드레이핑 카드 공유 섹션 — 얼굴 포함 공유의 옵트인 관문 (7/15 배치 C)
 *
 * 확정 설계(문화·법 조사): 디폴트 = 얼굴 없는 카드(PersonaShareSection)가 담당,
 * 이 섹션은 **명시적 옵트인(기본 OFF)** 시에만 얼굴 카드를 렌더한다.
 * (눈가림 밴드는 7/16 제거 — 검은 밴드 = 성형·의료 검열 코드로 문화 부정합,
 *  얼굴을 가리려는 유저는 기본 카드가 담당. 이원화: 얼굴無 기본 / 얼굴 그대로 옵트인.)
 *
 * 프라이버시: 카드 생성·캡처 전 과정이 이 기기(브라우저)에서만 일어난다.
 * 이 파일에는 fetch/업로드 코드가 없다(서버 미저장 보장 — PR 체크포인트).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { track } from '@vercel/analytics';
import { Download, Share2 } from 'lucide-react';
import { DrapingShareCard } from '@/components/share/DrapingShareCard';
import type { PaletteColor } from '@/components/share/PersonaShareCard';
import { captureElementAsImage } from '@/lib/share/imageGenerator';
import { cn } from '@/lib/utils';

interface DrapingShareSectionProps {
  /** 분석 사진 서명 URL */
  imageUrl: string;
  /** 진단명(로케일 라벨) */
  toneName?: string;
  /** 진단 베스트 팔레트 (드레이프 색 선택지 + 카드 미니 밴드) */
  bestColors: PaletteColor[];
  /** 발급 번호 */
  serialNo?: number | null;
}

// 유입 링크 — PersonaShareSection과 동일 정본 패턴(카드발 귀속은 ref=card로 통일)
const SHARE_LANDING_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app'}/?ref=card`;

export function DrapingShareSection({
  imageUrl,
  toneName,
  bestColors,
  serialNo,
}: DrapingShareSectionProps): React.JSX.Element | null {
  const t = useTranslations('analysis.integratedResult');
  const cardRef = useRef<HTMLDivElement>(null);
  // 옵트인 — 기본 OFF: 얼굴 포함 여부는 사용자가 명시적으로 켠다
  const [optedIn, setOptedIn] = useState(false);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [drapeIdx, setDrapeIdx] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // 옵트인 시에만 이미지 로드 — 선택 전에는 얼굴을 이 섹션에 그리지 않는다
  useEffect(() => {
    if (!optedIn || img) return;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.onerror = () => setFailed(true);
    image.src = imageUrl;
  }, [optedIn, img, imageUrl]);

  const makeBlob = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    return captureElementAsImage(cardRef.current, { backgroundColor: 'transparent', scale: 3 });
  }, []);

  const handleDownload = async (): Promise<void> => {
    setIsBusy(true);
    setMessage(null);
    try {
      const blob = await makeBlob();
      if (!blob) {
        setMessage(t('shareCard.imageError'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yiroom-draping-card.png';
      a.click();
      URL.revokeObjectURL(url);
      track('draping_card_share', { method: 'download' });
      setMessage(t('shareCard.saved'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleNativeShare = async (): Promise<void> => {
    setIsBusy(true);
    setMessage(null);
    try {
      const blob = await makeBlob();
      if (!blob) {
        setMessage(t('shareCard.imageError'));
        return;
      }
      const file = new File([blob], 'yiroom-draping-card.png', { type: 'image/png' });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        await handleDownload();
        return;
      }
      await navigator.share({
        files: [file],
        title: t('shareCard.shareTitle'),
        text: `${t('drapingCard.shareText')}\n${SHARE_LANDING_URL}`,
        url: SHARE_LANDING_URL,
      });
      track('draping_card_share', { method: 'native' });
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessage(t('shareCard.shareFailed'));
      }
    } finally {
      setIsBusy(false);
    }
  };

  if (bestColors.length === 0) return null;
  const drape = bestColors[Math.min(drapeIdx, bestColors.length - 1)];

  return (
    <section className="rounded-2xl border bg-card p-5" data-testid="draping-share-section">
      <h2 className="text-sm font-semibold text-foreground">{t('drapingCard.heading')}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t('drapingCard.subtitle')}</p>

      {/* 옵트인 — 기본 OFF. 얼굴 포함은 사용자의 명시적 선택 */}
      <label className="mt-3 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={optedIn}
          onChange={(e) => setOptedIn(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          data-testid="draping-share-optin"
        />
        <span className="text-xs text-foreground">{t('drapingCard.optIn')}</span>
      </label>

      {/* 인라인 고지(법④) — 기기 내 생성·서버 미저장·공유는 본인 결정 */}
      <p className="mt-2 text-[11px] text-muted-foreground" data-testid="draping-share-notice">
        {t('drapingCard.notice')}
      </p>

      {optedIn && failed && (
        <p className="mt-4 text-center text-xs text-muted-foreground">{t('draping.loadError')}</p>
      )}

      {optedIn && !failed && !img && (
        <div className="mt-4 h-48 animate-pulse rounded-xl bg-secondary" aria-hidden="true" />
      )}

      {optedIn && img && (
        <>
          {/* 컨트롤: 드레이프 색 */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-1.5" role="group">
              {bestColors.slice(0, 6).map((c, i) => (
                <button
                  key={`${c.hex}-${i}`}
                  type="button"
                  onClick={() => setDrapeIdx(i)}
                  aria-pressed={drapeIdx === i}
                  title={c.name}
                  className={cn(
                    'h-6 w-6 rounded-full border transition-transform',
                    drapeIdx === i ? 'ring-2 ring-primary ring-offset-1' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* 카드 미리보기 — 캡처 원본 크기 유지. justify-center 금지: 센터 정렬 플렉스의
              시작쪽 오버플로는 스크롤 도달 불가(좌측 영구 클리핑) — mx-auto 래퍼로 대체(QA 7/23) */}
          <div className="mt-4 flex overflow-x-auto pb-1">
            <div className="mx-auto shrink-0">
              <DrapingShareCard
                ref={cardRef}
                img={img}
                drapeHex={drape.hex}
                toneName={toneName}
                bestColors={bestColors}
                serialNo={serialNo}
                inviteText={t('shareCard.invite')}
                drapeLabel={t('reportCard.drapingLabel')}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              data-testid="draping-share-download"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {t('shareCard.downloadButton')}
            </button>
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                data-testid="draping-share-native"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {t('shareCard.shareButton')}
              </button>
            )}
          </div>
        </>
      )}

      {message && (
        <p
          className="mt-3 text-center text-xs text-muted-foreground"
          data-testid="draping-share-message"
        >
          {message}
        </p>
      )}
    </section>
  );
}
