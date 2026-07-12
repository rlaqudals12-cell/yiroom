'use client';

import { useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import { Download, Share2 } from 'lucide-react';
import { PersonaShareCard, type PersonaBadge } from '@/components/share/PersonaShareCard';
import { captureElementAsImage } from '@/lib/share/imageGenerator';

interface PersonaShareSectionProps {
  oneLine: string;
  badges: PersonaBadge[];
  season?: string | null;
}

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
  badges,
  season,
}: PersonaShareSectionProps): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  // 실패는 정직하게 알린다 — 조용한 무반응 금지
  const [message, setMessage] = useState<string | null>(null);

  // navigator.share(files)를 지원하는 환경(주로 모바일 브라우저)에서만 공유 버튼 노출
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const makeBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    // 카드 자체가 그라데이션 배경을 가지므로 캡처 배경은 투명 — 라운드 코너 유지
    return captureElementAsImage(cardRef.current, { backgroundColor: 'transparent' });
  };

  const handleDownload = async (): Promise<void> => {
    setIsBusy(true);
    setMessage(null);
    try {
      const blob = await makeBlob();
      if (!blob) {
        setMessage('카드 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yiroom-identity-card.png';
      a.click();
      URL.revokeObjectURL(url);
      track('persona_card_share', { method: 'download' });
      setMessage('카드를 저장했어요. 어디든 자랑해 보세요!');
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
        setMessage('카드 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
        return;
      }
      const file = new File([blob], 'yiroom-identity-card.png', { type: 'image/png' });
      // 파일 공유 미지원 기기는 다운로드로 정직하게 폴백
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        await handleDownload();
        return;
      }
      await navigator.share({
        files: [file],
        title: '나의 이룸 정체성 카드',
        text: `${oneLine} — 이룸에서 나의 5축 정체성을 알아보세요`,
      });
      track('persona_card_share', { method: 'native' });
    } catch (err) {
      // 사용자가 공유 시트를 닫은 경우(AbortError)는 실패가 아니다
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessage('공유에 실패했어요. 이미지 저장을 이용해주세요.');
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section
      className="rounded-2xl border border-zinc-800 bg-neutral-900/50 p-5"
      data-testid="persona-share-section"
    >
      <h2 className="text-sm font-semibold text-white">내 정체성 카드</h2>
      <p className="mt-0.5 text-xs text-zinc-400">
        저장해서 어디든 자랑해 보세요 — 사진은 담기지 않아요
      </p>

      {/* 카드 미리보기 — 좁은 화면에선 가로 스크롤 (카드 원본 크기 유지 = 캡처 품질 보장) */}
      <div className="mt-4 flex justify-center overflow-x-auto pb-1">
        <PersonaShareCard ref={cardRef} oneLine={oneLine} badges={badges} season={season} />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-500 disabled:opacity-50"
          data-testid="persona-share-download"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          이미지 저장
        </button>
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-pink-500 hover:text-pink-400 disabled:opacity-50"
            data-testid="persona-share-native"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            공유하기
          </button>
        )}
      </div>

      {message && (
        <p className="mt-3 text-center text-xs text-zinc-400" data-testid="persona-share-message">
          {message}
        </p>
      )}
    </section>
  );
}
