'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { track } from '@vercel/analytics';
import { Download, Share2 } from 'lucide-react';
import {
  PersonaShareCard,
  type PersonaBadge,
  type PersonaCardFormat,
  type PersonaCardFinish,
  type PaletteColor,
} from '@/components/share/PersonaShareCard';
import { PhotocardTilt } from '@/components/share/PhotocardTilt';
import {
  PersonaReportCard,
  type ReportRow,
  type ReportAction,
  type ReportStyleChip,
} from '@/components/share/PersonaReportCard';
import { captureElementAsImage } from '@/lib/share/imageGenerator';
import { cn } from '@/lib/utils';

/** 리포트 포맷용 데이터(서버에서 로케일 완료 문자열로 조립) — 없으면 리포트 토글 미노출 */
export interface PersonaReportData {
  /** 퍼스널컬러 속성표(실데이터 행만) */
  attrs: ReportRow[];
  /** "분석 한눈에 보기" — persona.keyInsights */
  checklist?: string[];
  /** 포인트 컬러(톤 표준 큐레이션) */
  accents?: PaletteColor[];
  /** 액세서리 금속(웜=골드계/쿨=실버계) */
  metals?: PaletteColor[];
  /** 축 요약(퍼컬 제외 성공 축만) */
  axisRows: ReportRow[];
  /** 피부 관리 포인트(저장된 관심사) */
  skinNote?: string;
  /** 추천 헤어 스타일(이름 + 저장된 어울림 fit, ≤3) */
  hairStyles?: ReportStyleChip[];
  /** 계절 인장(점수 없는 타입 확정 스탬프) */
  sealText?: string;
  /** 피하면 좋은 색의 "왜" 한 줄(12톤 정의 파생) */
  avoidNote?: string;
  /** 개선 포인트(결정론 액션 플랜) */
  actionItems?: ReportAction[];
  /** 전속 뷰티팀 총평(persona.narrative) */
  note?: string;
  /** "분석 신뢰도 87%" — 퍼컬 실측 성공 시에만 */
  confidenceText?: string;
  /** 재현성 한 줄 */
  reproducibilityText: string;
  /** 발급일(로케일 포맷) */
  dateText: string;
}

interface PersonaShareSectionProps {
  oneLine: string;
  /** 진단명(로케일 라벨) — 카드 히어로. 퍼컬 실패 시 undefined(은유가 히어로) */
  toneName?: string;
  /** 퍼컬 외 성공 축 값(피부·체형·헤어) — 퍼컬은 toneName이 담당(중복 금지) */
  badges: PersonaBadge[];
  /** 베스트 컬러 팔레트(hex + 색이름) — 카드의 주인공 */
  palette?: PaletteColor[];
  /** 피해야 할 색 — 소밴드(재미·전문성 신호) */
  worstPalette?: PaletteColor[];
  /** 발급 번호(실제 세션 순번) — 정직한 희소성 */
  serialNo?: number | null;
  /** 진단지 리포트 데이터 — 세 번째 포맷(세로 진단지 한 장, 2026-07-16 v1) */
  report?: PersonaReportData;
  /** 분석 사진 서명 URL — 리포트 사진 옵트인용(기본 무사진, 기기 내 캔버스 합성) */
  reportPhotoUrl?: string | null;
}

/** 공유 포맷 — 카드 2종 + 진단지 리포트 */
type ShareFormat = PersonaCardFormat | 'report';

const CARD_FORMATS: readonly ShareFormat[] = ['square', 'story'];

/**
 * 카드가 돌아다닐 때 "돌아올 길" — 공유의 유일한 존재 이유.
 *
 * 왜 필요한가: 이미지만 공유하면 클릭 가능한 링크가 없어 **공유 100건 = 유입 0건**이 된다
 * (바이럴 루프 단절). 카드에 구운 워터마크는 텍스트라 클릭이 안 된다.
 *
 * url + text 양쪽에 싣는 이유: Web Share에 `files`가 동반되면 `url`을 무시하고 text만
 * 전달하는 타깃이 실재한다. 링크가 중복 노출되는 손해보다 링크가 아예 없는 손해가 크다.
 *
 * 도메인은 코드베이스 정본 패턴(`NEXT_PUBLIC_SITE_URL || yiroom.app` — kakao/qr/metadata와 동일).
 * `?ref=card`로 카드발 유입을 귀속한다.
 */
const SHARE_LANDING_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app'}/?ref=card`;

/**
 * 페르소나 공유 섹션 — 결과 페이지에서 "자랑 카드"를 바로 보여주고 저장/공유하게 한다.
 *
 * 왜 인라인 노출인가: 접힌 버튼 뒤에 숨기면 발견성이 죽는다. 한국 사용자에게
 * 퍼스널컬러 결과는 MBTI 같은 정체성 배지 문화라, 카드를 먼저 보여주는 것 자체가
 * 공유 동기를 만든다 (정서 리딩 인사이트 2026-07-12).
 * 사진은 카드에 절대 포함되지 않는다(생체정보 — PersonaShareCard 참조).
 */
export function PersonaShareSection({
  oneLine,
  toneName,
  badges,
  palette = [],
  worstPalette = [],
  serialNo,
  report,
  reportPhotoUrl,
}: PersonaShareSectionProps): React.JSX.Element {
  const t = useTranslations('analysis.integratedResult');
  const cardRef = useRef<HTMLDivElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  // 실패는 정직하게 알린다 — 조용한 무반응 금지
  const [message, setMessage] = useState<string | null>(null);
  // 저장/공유 대상 — 정사각(피드) vs 9:16(스토리) vs 진단지 리포트(세로 한 장)
  const [format, setFormat] = useState<ShareFormat>('square');
  // 카드 마감 — 매트(기본) vs 포일(포토카드 홀로 시머). 리포트엔 미적용(진단지는 무광 지면)
  const [finish, setFinish] = useState<PersonaCardFinish>('matte');
  // 리포트 사진 옵트인 — 기본 OFF(얼굴 포함은 명시적 선택), 켜야만 이미지를 로드한다
  const [photoOptIn, setPhotoOptIn] = useState(false);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    if (!photoOptIn || photoImg || !reportPhotoUrl) return;
    const image = new Image();
    image.crossOrigin = 'anonymous'; // 캔버스 taint 방지(캡처 안전)
    image.onload = () => setPhotoImg(image);
    image.onerror = () => setPhotoFailed(true);
    image.src = reportPhotoUrl;
  }, [photoOptIn, photoImg, reportPhotoUrl]);

  const formats: readonly ShareFormat[] = report ? [...CARD_FORMATS, 'report'] : CARD_FORMATS;
  const formatLabel = (f: ShareFormat): string => {
    if (f === 'square') return t('shareCard.formatSquare');
    if (f === 'story') return t('shareCard.formatStory');
    return t('shareCard.formatReport');
  };

  // navigator.share(files)를 지원하는 환경(주로 모바일 브라우저)에서만 공유 버튼 노출
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const makeBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    // 캡처 배경 투명(라운드 코너 밖) · 카드 scale 3 = 400px → 1200px(인스타 권장 1080px 충족).
    // 리포트는 세로가 길어 scale 2.5 — 장변 4096px(구형 기기 캔버스 한계) 이하 안전권.
    const scale = format === 'report' ? 2.5 : 3;
    return captureElementAsImage(cardRef.current, { backgroundColor: 'transparent', scale });
  };

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
      a.download = format === 'report' ? 'yiroom-identity-report.png' : 'yiroom-identity-card.png';
      a.click();
      URL.revokeObjectURL(url);
      track('persona_card_share', { method: 'download', format });
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
      const file = new File(
        [blob],
        format === 'report' ? 'yiroom-identity-report.png' : 'yiroom-identity-card.png',
        { type: 'image/png' }
      );
      // 파일 공유 미지원 기기는 다운로드로 정직하게 폴백
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        await handleDownload();
        return;
      }
      await navigator.share({
        files: [file],
        title: t('shareCard.shareTitle'),
        // 링크를 text에도 싣는다 — files 동반 시 url을 버리는 공유 타깃이 있어서(유입 0 방지)
        text: `${t('shareCard.shareText', { oneLine })}\n${SHARE_LANDING_URL}`,
        url: SHARE_LANDING_URL,
      });
      track('persona_card_share', { method: 'native', format });
    } catch (err) {
      // 사용자가 공유 시트를 닫은 경우(AbortError)는 실패가 아니다
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessage(t('shareCard.shareFailed'));
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-5" data-testid="persona-share-section">
      <h2 className="text-sm font-semibold text-foreground">{t('shareCard.heading')}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{t('shareCard.subtitle')}</p>

      {/* 포맷 토글 — 피드(1:1) / 스토리(9:16) / 진단지 리포트(세로 한 장) */}
      <div
        className="mt-4 flex justify-center gap-1.5"
        role="group"
        aria-label={t('shareCard.formatLabel')}
        data-testid="persona-share-format-toggle"
      >
        {formats.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className={cn(
              'rounded-full px-3.5 py-1 text-xs font-medium transition-colors',
              format === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {formatLabel(f)}
          </button>
        ))}
      </div>

      {/* 마감 토글 — 포일(포토카드 홀로 시머)은 카드 포맷 전용. 진단지 리포트는 무광 지면 */}
      {format !== 'report' && (
        <div
          className="mt-2 flex justify-center gap-1.5"
          role="group"
          aria-label={t('shareCard.finishLabel')}
          data-testid="persona-share-finish-toggle"
        >
          {(['matte', 'foil'] as const).map((fn) => (
            <button
              key={fn}
              type="button"
              onClick={() => setFinish(fn)}
              aria-pressed={finish === fn}
              className={cn(
                'rounded-full px-3 py-0.5 text-[11px] font-medium transition-colors',
                finish === fn
                  ? 'border border-primary/50 text-primary'
                  : 'border border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {fn === 'matte' ? t('shareCard.finishMatte') : t('shareCard.finishFoil')}
            </button>
          ))}
        </div>
      )}

      {/* 리포트 사진 옵트인 — 기본 무사진. 켜면 기기 내 캔버스로만 합성(서버 미저장) */}
      {format === 'report' && report && reportPhotoUrl && (
        <div className="mt-3">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={photoOptIn}
              onChange={(e) => setPhotoOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
              data-testid="report-photo-optin"
            />
            <span className="text-xs text-foreground">{t('reportCard.photoOptIn')}</span>
          </label>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t('drapingCard.notice')}</p>
          {photoOptIn && photoFailed && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">{t('draping.loadError')}</p>
          )}
        </div>
      )}

      {/* 카드 미리보기 — 좁은 화면에선 가로 스크롤 (카드 원본 크기 유지 = 캡처 품질 보장).
          justify-center 금지: 센터 정렬 플렉스의 시작쪽 오버플로는 스크롤로 도달 불가라
          390px 폰에서 카드 좌측이 영구 클리핑된다 — mx-auto가 공간 남을 때만 센터(QA 7/23) */}
      <div className="mt-4 flex overflow-x-auto pb-1">
        <div className="mx-auto shrink-0">
          {format === 'report' && report ? (
            <PersonaReportCard
              ref={cardRef}
              oneLine={oneLine}
              toneName={toneName}
              attrs={report.attrs}
              photoImg={photoOptIn ? photoImg : null}
              checklist={report.checklist}
              palette={palette}
              accents={report.accents}
              metals={report.metals}
              worstPalette={worstPalette}
              axisRows={report.axisRows}
              skinNote={report.skinNote}
              hairStyles={report.hairStyles}
              sealText={report.sealText}
              avoidNote={report.avoidNote}
              actionItems={report.actionItems}
              note={report.note}
              confidenceText={report.confidenceText}
              confidenceHintText={t('reportCard.confidenceHint')}
              reproducibilityText={report.reproducibilityText}
              reproBadgeText={t('reportCard.reproBadge')}
              dateText={report.dateText}
              groupLabels={{
                best: t('reportCard.bestLabel'),
                accent: t('reportCard.accentLabel'),
                metal: t('reportCard.metalLabel'),
                avoid: t('reportCard.avoidLabel'),
                styles: t('reportCard.stylesLabel'),
                care: t('reportCard.careLabel'),
                bestUse: t('reportCard.bestUse'),
                accentUse: t('reportCard.accentUse'),
                draping: t('reportCard.drapingLabel'),
              }}
              serialNo={serialNo}
              inviteText={t('shareCard.invite')}
            />
          ) : (
            // 틸트 = 실물 포토카드를 손에 든 감각(포인터 추적 3D) — 캡처 PNG에는 무영향
            <PhotocardTilt>
              <PersonaShareCard
                ref={cardRef}
                oneLine={oneLine}
                toneName={toneName}
                badges={badges}
                palette={palette}
                worstPalette={worstPalette}
                serialNo={serialNo}
                inviteText={t('shareCard.invite')}
                format={format === 'report' ? 'square' : format}
                finish={finish}
              />
            </PhotocardTilt>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          data-testid="persona-share-download"
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
            data-testid="persona-share-native"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {t('shareCard.shareButton')}
          </button>
        )}
      </div>

      {message && (
        <p
          className="mt-3 text-center text-xs text-muted-foreground"
          data-testid="persona-share-message"
        >
          {message}
        </p>
      )}
    </section>
  );
}
