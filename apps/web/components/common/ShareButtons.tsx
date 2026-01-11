'use client';

/**
 * 소셜 공유 버튼 컴포넌트
 * - X (Twitter), 카카오톡, 링크 복사, Instagram 이미지 저장
 */

import { useState } from 'react';
import { shareToX, shareToKakao, downloadShareImage, type ShareContent } from '@/lib/share/social';
import { copyToClipboard } from '@/lib/share/shareUtils';
import { toast } from 'sonner';
import { Link2, Check, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  content: ShareContent;
  showInstagram?: boolean;
  className?: string;
}

export function ShareButtons({ content, showInstagram = false, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleX = () => {
    shareToX(content);
  };

  const handleKakao = async () => {
    const success = await shareToKakao(content);
    if (!success) {
      toast.error('카카오톡 공유에 실패했습니다');
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(content.url);
    if (success) {
      setCopied(true);
      toast.success('링크가 복사되었습니다');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('복사에 실패했습니다');
    }
  };

  const handleInstagram = async () => {
    if (content.imageUrl) {
      const success = await downloadShareImage(content.imageUrl, 'yiroom-result');
      if (success) {
        toast.success('이미지가 저장되었습니다. Instagram에서 공유해주세요!');
      } else {
        toast.error('이미지 저장에 실패했습니다');
      }
    }
  };

  return (
    <div data-testid="share-buttons" className={cn('flex gap-2', className)}>
      {/* X (Twitter) */}
      <button
        onClick={handleX}
        className={cn(
          'p-3 rounded-full transition-colors',
          'bg-black text-white hover:bg-gray-800'
        )}
        aria-label="X에 공유"
      >
        <XIcon className="w-5 h-5" />
      </button>

      {/* 카카오톡 */}
      <button
        onClick={handleKakao}
        className={cn(
          'p-3 rounded-full transition-colors',
          'bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]'
        )}
        aria-label="카카오톡 공유"
      >
        <KakaoIcon className="w-5 h-5" />
      </button>

      {/* 링크 복사 */}
      <button
        onClick={handleCopy}
        className={cn(
          'p-3 rounded-full transition-colors',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        )}
        aria-label="링크 복사"
      >
        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Link2 className="w-5 h-5" />}
      </button>

      {/* Instagram (이미지 저장) */}
      {showInstagram && content.imageUrl && (
        <button
          onClick={handleInstagram}
          className={cn(
            'p-3 rounded-full transition-colors',
            'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
            'hover:from-purple-600 hover:to-pink-600'
          )}
          aria-label="Instagram용 이미지 저장"
        >
          <Download className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// X (Twitter) 아이콘
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// 카카오톡 아이콘
function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.463 2 10.733c0 2.697 1.744 5.076 4.389 6.445-.14.518-.505 1.877-.579 2.168-.091.357.131.353.276.256.114-.076 1.813-1.235 2.547-1.738.445.065.904.099 1.367.099 5.523 0 10-3.463 10-7.733S17.523 3 12 3z" />
    </svg>
  );
}
