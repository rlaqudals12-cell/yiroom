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
import { AITransparencyNotice } from '@/components/common/AIBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { readReturnToFromLocation } from '@/lib/navigation';

type AgreementState = Record<AgreementItem['id'], boolean>;
type Gender = 'male' | 'female';

/**
 * 서비스 약관동의 페이지
 * SDD-TERMS-AGREEMENT.md §6.1
 * AI 기본법 제31조 준수: AI 기술 사용 고지
 */
export default function AgreementPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 성별 선택 상태
  const [gender, setGender] = useState<Gender | null>(null);

  // 개별 동의 상태
  const [agreements, setAgreements] = useState<AgreementState>({
    terms: false,
    privacy: false,
    biometric: false,
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

  // 필수 동의 완료 여부 (성별 선택 포함)
  const requiredAllChecked = useMemo(() => {
    const agreementsOk = AGREEMENT_ITEMS.filter((item) => item.required).every(
      (item) => agreements[item.id]
    );
    return agreementsOk && gender !== null;
  }, [agreements, gender]);

  // 전체 동의 토글
  const handleAllChange = useCallback((checked: boolean) => {
    setAgreements({
      terms: checked,
      privacy: checked,
      biometric: checked,
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
    if (!gender) {
      toast.error('성별을 선택해주세요');
      return;
    }
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
          biometricAgreed: agreements.biometric,
          gender,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '동의 저장에 실패했습니다');
      }

      toast.success('환영합니다!');
      // returnTo 체인: 가드가 보존한 원 목적지로 복귀 (내부 경로만 허용, 기본 /dashboard)
      // 신규 가입자는 /analysis/integrated?onboarding=1로 돌아가 첫 미팅(통합분석)을 이어간다
      router.push(readReturnToFromLocation() ?? '/dashboard');
    } catch (err) {
      console.error('[Agreement] Submit error:', err);
      toast.error('오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }, [agreements, gender, requiredAllChecked, router]);

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
            <p className="text-muted-foreground mt-2">맞춤 서비스를 위해 정보를 입력해주세요.</p>
          </div>

          {/* AI 기술 사용 고지 (AI 기본법 제31조 준수) */}
          <AITransparencyNotice className="mb-4" />

          {/* 성별 선택 */}
          <div className="bg-card rounded-xl border shadow-sm p-4 mb-4">
            <p className="text-sm font-medium text-foreground mb-3">
              성별 <span className="text-destructive">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex flex-col items-center',
                  gender === 'male'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
                data-testid="gender-male"
              >
                <span className="text-3xl mb-1">👨</span>
                <span className="text-sm font-medium">남성</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex flex-col items-center',
                  gender === 'female'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
                data-testid="gender-female"
              >
                <span className="text-3xl mb-1">👩</span>
                <span className="text-sm font-medium">여성</span>
              </button>
            </div>
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
            성별 선택과 필수 항목에 동의해야 서비스를 이용할 수 있습니다.
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
