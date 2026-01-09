'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AgreementCheckbox,
  AgreementAllCheckbox,
  AGREEMENT_ITEMS,
  type AgreementItem,
} from '@/components/agreement';
import { toast } from 'sonner';

type AgreementState = Record<AgreementItem['id'], boolean>;

/**
 * 서비스 약관동의 페이지
 * SDD-TERMS-AGREEMENT.md §6.1
 */
export default function AgreementPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 개별 동의 상태
  const [agreements, setAgreements] = useState<AgreementState>({
    terms: false,
    privacy: false,
    marketing: false,
  });

  // 전체 동의 여부
  const allChecked = useMemo(() => {
    return AGREEMENT_ITEMS.every((item) => agreements[item.id]);
  }, [agreements]);

  // 일부만 체크됨 (indeterminate)
  const someChecked = useMemo(() => {
    const checkedCount = AGREEMENT_ITEMS.filter((item) => agreements[item.id]).length;
    return checkedCount > 0 && checkedCount < AGREEMENT_ITEMS.length;
  }, [agreements]);

  // 필수 동의 완료 여부
  const requiredAllChecked = useMemo(() => {
    return AGREEMENT_ITEMS.filter((item) => item.required).every((item) => agreements[item.id]);
  }, [agreements]);

  // 전체 동의 토글
  const handleAllChange = useCallback((checked: boolean) => {
    setAgreements({
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
  }, []);

  // 개별 동의 토글
  const handleItemChange = useCallback((id: AgreementItem['id'], checked: boolean) => {
    setAgreements((prev) => ({
      ...prev,
      [id]: checked,
    }));
  }, []);

  // 동의하고 시작하기
  const handleSubmit = useCallback(async () => {
    if (!requiredAllChecked) {
      toast.error('필수 약관에 동의해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termsAgreed: agreements.terms,
          privacyAgreed: agreements.privacy,
          marketingAgreed: agreements.marketing,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '동의 저장에 실패했습니다');
      }

      toast.success('환영합니다!');
      router.push('/dashboard');
    } catch (err) {
      console.error('[Agreement] Submit error:', err);
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  }, [agreements, requiredAllChecked, router]);

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 미로그인 상태
  if (!isSignedIn) {
    router.replace('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="agreement-page">
      {/* 헤더 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* 로고 */}
          <div className="text-center mb-8">
            <Image
              src="/logo.svg"
              alt="이룸"
              width={80}
              height={80}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-2xl font-bold text-foreground">고객님 환영합니다!</h1>
            <p className="text-muted-foreground mt-2">서비스 이용을 위해 약관에 동의해주세요.</p>
          </div>

          {/* 동의 항목 */}
          <div className="bg-card rounded-xl border shadow-sm p-4">
            {/* 전체 동의 */}
            <AgreementAllCheckbox
              checked={allChecked}
              indeterminate={someChecked}
              onChange={handleAllChange}
            />

            {/* 개별 동의 항목 */}
            <div className="mt-2">
              {AGREEMENT_ITEMS.map((item) => (
                <AgreementCheckbox
                  key={item.id}
                  item={item}
                  checked={agreements[item.id]}
                  onChange={(checked) => handleItemChange(item.id, checked)}
                />
              ))}
            </div>
          </div>

          {/* 안내 문구 */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            필수 항목에 동의해야 서비스를 이용할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!requiredAllChecked || isSubmitting}
            className="w-full h-12 text-base font-semibold"
            data-testid="agreement-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              '동의하고 시작하기'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
