'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Info } from 'lucide-react';
import { toast } from 'sonner';

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

      toast.success(
        checked ? '마케팅 정보 수신에 동의했습니다' : '마케팅 정보 수신 동의를 철회했습니다'
      );
    } catch {
      // 롤백
      setIsAgreed(previousValue);
      toast.error('설정 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 표시할 날짜 결정
  const displayDate = isAgreed ? agreedAt : withdrawnAt;
  const dateLabel = isAgreed ? '동의일' : '철회일';

  return (
    <Card data-testid="marketing-consent-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="w-5 h-5" />
          마케팅 정보 수신 동의
        </CardTitle>
        <CardDescription>프로모션, 이벤트, 맞춤 추천 알림을 받습니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">마케팅 정보 수신</span>
          <Switch
            checked={isAgreed}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            aria-label="마케팅 정보 수신 동의"
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
          {isAgreed
            ? '언제든 설정에서 수신 동의를 철회할 수 있습니다.'
            : '마케팅 정보를 받지 않습니다.'}
        </p>
      </CardContent>
    </Card>
  );
}
