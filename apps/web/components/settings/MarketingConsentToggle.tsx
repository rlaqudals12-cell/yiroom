'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface MarketingConsentToggleProps {
  initialValue: boolean;
  agreedAt: string | null;
  withdrawnAt: string | null;
}

/**
 * 마케팅 정보 수신 동의 토글 컴포넌트
 * SDD-MARKETING-TOGGLE-UI.md §4 - 설정 > 개인정보 페이지
 */
export function MarketingConsentToggle({
  initialValue,
  agreedAt,
  withdrawnAt,
}: MarketingConsentToggleProps) {
  const t = useTranslations('settingsUI');
  const [isAgreed, setIsAgreed] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    const previousValue = isAgreed;

    // 낙관적 업데이트
    setIsAgreed(checked);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agreement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingAgreed: checked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      toast.success(checked ? t('marketingConsentToggle0') : t('marketingConsentToggle1'));
    } catch {
      // 롤백
      setIsAgreed(previousValue);
      toast.error(t('marketingConsentToggle2'));
    } finally {
      setIsLoading(false);
    }
  };

  // 표시할 날짜 결정
  const displayDate = isAgreed ? agreedAt : withdrawnAt;
  const dateLabel = isAgreed ? t('marketingConsentToggle3') : t('marketingConsentToggle4');

  return (
    <Card data-testid="marketing-consent-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="w-5 h-5" />
          마케팅 정보 수신 동의
        </CardTitle>
        <CardDescription>{t('marketingConsentToggle5')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('marketingConsentToggle6')}</span>
          <Switch
            checked={isAgreed}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            aria-label={t('marketingConsentToggle7')}
          />
        </div>

        {displayDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              {dateLabel}: {new Date(displayDate).toLocaleDateString('ko-KR')}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {isAgreed ? t('marketingConsentToggle8') : t('marketingConsentToggle9')}
        </p>
      </CardContent>
    </Card>
  );
}
