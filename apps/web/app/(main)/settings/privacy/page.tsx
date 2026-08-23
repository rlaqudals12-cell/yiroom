'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { ArrowLeft, Shield, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ConsentStatus, type AnalysisType, type ImageConsent } from '@/components/analysis/consent';
import { MarketingConsentToggle, AgreementHistory } from '@/components/settings';
import { isImageConsentActive } from '@/lib/consent/version-check';

const IMAGE_CONSENT_AXES: ReadonlyArray<{
  type: AnalysisType;
  label: string;
  analysisHref: string | null;
}> = [
  { type: 'skin', label: '피부 분석', analysisHref: '/analysis/skin?forceNew=true' },
  { type: 'body', label: '체형 분석', analysisHref: null },
  { type: 'personal-color', label: '퍼스널 컬러', analysisHref: '/analysis/personal-color' },
  { type: 'hair', label: '헤어 분석', analysisHref: '/analysis/hair' },
  { type: 'makeup', label: '메이크업 분석', analysisHref: '/analysis/makeup' },
];

type ConsentByAxis = Partial<Record<AnalysisType, ImageConsent>>;
type RetryablePurgeByAxis = Partial<Record<AnalysisType, boolean>>;
type ReconciliationPendingByAxis = Partial<Record<AnalysisType, boolean>>;

interface ConsentApiError {
  error?: {
    userMessage?: string;
    details?: { consentRevoked?: boolean; retryable?: boolean };
  };
}

/** 이미지 원본 저장 선택 동의와 전체 생체정보 철회를 관리한다. */
export default function PrivacySettingsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [imageConsents, setImageConsents] = useState<ConsentByAxis>({});
  const [retryablePurges, setRetryablePurges] = useState<RetryablePurgeByAxis>({});
  const [reconciliationPending, setReconciliationPending] = useState<ReconciliationPendingByAxis>(
    {}
  );
  const [marketingConsent, setMarketingConsent] = useState<{
    agreed: boolean;
    agreedAt: string | null;
    withdrawnAt: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageConsentLoadFailed, setImageConsentLoadFailed] = useState(false);
  const [revokingType, setRevokingType] = useState<AnalysisType | null>(null);
  const [isRevokingBiometric, setIsRevokingBiometric] = useState(false);

  const fetchConsent = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn) {
      setIsLoading(false);
      return false;
    }

    let imageConsentLoaded = false;
    try {
      const { data: imageData, error: imageError } = await supabase
        .from('image_consents')
        .select('*')
        .in(
          'analysis_type',
          IMAGE_CONSENT_AXES.map(({ type }) => type)
        );

      if (imageError) {
        console.error('[Privacy] Failed to fetch image consents:', imageError);
        setImageConsentLoadFailed(true);
      } else {
        setImageConsentLoadFailed(false);
        imageConsentLoaded = true;
        const next: ConsentByAxis = {};
        const pending: RetryablePurgeByAxis = {};
        const reconciling: ReconciliationPendingByAxis = {};
        for (const row of imageData ?? []) {
          const consent = row as ImageConsent;
          if (IMAGE_CONSENT_AXES.some(({ type }) => type === consent.analysis_type)) {
            next[consent.analysis_type] = consent;
            pending[consent.analysis_type] =
              !consent.consent_given &&
              Boolean(consent.withdrawal_at) &&
              Boolean(consent.retention_until);
            reconciling[consent.analysis_type] =
              !consent.consent_given &&
              Boolean(consent.withdrawal_at) &&
              consent.retention_until === null &&
              consent.cleanup_reconciled_at == null;
          }
        }
        setImageConsents(next);
        setRetryablePurges(pending);
        setReconciliationPending(reconciling);
      }

      const { data: agreementData, error: agreementError } = await supabase
        .from('user_agreements')
        .select('marketing_agreed, marketing_agreed_at, marketing_withdrawn_at')
        .maybeSingle();

      if (agreementError) {
        console.error('[Privacy] Failed to fetch marketing consent:', agreementError);
      } else if (agreementData) {
        setMarketingConsent({
          agreed: agreementData.marketing_agreed,
          agreedAt: agreementData.marketing_agreed_at,
          withdrawnAt: agreementData.marketing_withdrawn_at,
        });
      }
      return imageConsentLoaded;
    } catch (error) {
      console.error('[Privacy] Error fetching consent:', error);
      // 조회 예외를 "모두 미동의"로 오인해 새 분석 CTA를 노출하지 않는다.
      setImageConsentLoadFailed(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, supabase]);

  useEffect(() => {
    if (isLoaded) void fetchConsent();
  }, [isLoaded, fetchConsent]);

  const handleRevokeConsent = async (analysisType: AnalysisType) => {
    if (!isSignedIn) return;

    setRevokingType(analysisType);
    try {
      const response = await fetch(`/api/consent?analysisType=${analysisType}`, {
        method: 'DELETE',
      });
      const body = (await response.json()) as ConsentApiError;

      if (!response.ok) {
        const consentRevoked = body.error?.details?.consentRevoked === true;
        if (consentRevoked) {
          setImageConsents((current) => ({
            ...current,
            [analysisType]: current[analysisType]
              ? { ...current[analysisType], consent_given: false }
              : undefined,
          }));
          setRetryablePurges((current) => ({
            ...current,
            [analysisType]: body.error?.details?.retryable === true,
          }));
          setReconciliationPending((current) => ({ ...current, [analysisType]: false }));
        }
        throw new Error(body.error?.userMessage ?? '동의 철회에 실패했습니다. 다시 시도해주세요.');
      }

      setImageConsents((current) => ({
        ...current,
        [analysisType]: current[analysisType]
          ? { ...current[analysisType], consent_given: false }
          : undefined,
      }));
      setRetryablePurges((current) => ({ ...current, [analysisType]: false }));
      setReconciliationPending((current) => ({ ...current, [analysisType]: true }));
      toast.success('원본 사진 저장 동의가 철회되고 저장 사진이 삭제되었습니다.');
    } catch (error) {
      console.error('[Privacy] Failed to revoke image consent:', error);
      toast.error(
        error instanceof Error ? error.message : '동의 철회에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setRevokingType(null);
    }
  };

  const handleBiometricWithdrawal = async () => {
    setIsRevokingBiometric(true);
    try {
      const response = await fetch('/api/agreement/biometric', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      let body: ConsentApiError = {};
      try {
        body = (await response.json()) as ConsentApiError;
      } catch {
        // 응답 파싱 실패여도 서버에서 철회가 진행됐을 수 있으므로 아래 재조회는 생략하지 않는다.
      }
      const imageConsentRefreshed = await fetchConsent();

      if (!imageConsentRefreshed) {
        throw new Error(
          '철회 요청 후 최신 사진 삭제 상태를 확인하지 못했습니다. 개인정보 설정을 다시 불러와주세요.'
        );
      }
      if (!response.ok) {
        throw new Error(
          body.error?.userMessage ?? '생체정보 동의 철회에 실패했습니다. 다시 시도해주세요.'
        );
      }

      toast.success('생체정보 동의가 철회되고 저장 사진이 파기되었습니다.');
    } catch (error) {
      console.error('[Privacy] Failed to revoke biometric consent:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : '생체정보 동의 철회에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsRevokingBiometric(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">개인정보 설정을 확인하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="privacy-settings-page">
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="설정으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <h1 className="font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5" aria-hidden="true" />
            개인정보 설정
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card data-testid="image-consent-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="w-5 h-5" aria-hidden="true" />
              분석 원본 사진 저장 동의
            </CardTitle>
            <CardDescription>
              분석 결과가 아니라, 분석에 사용한 원본 사진을 최대 1년 보관할지 축별로 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {imageConsentLoadFailed ? (
              <div className="space-y-3 py-2" role="alert">
                <p className="text-sm text-muted-foreground">
                  원본 사진 저장 동의 상태를 불러오지 못했습니다.
                </p>
                <Button variant="outline" size="sm" onClick={() => void fetchConsent()}>
                  다시 시도
                </Button>
              </div>
            ) : (
              IMAGE_CONSENT_AXES.map(({ type, label, analysisHref }) => {
                const consent = imageConsents[type] ?? null;
                const isActive = isImageConsentActive(consent);
                const isRevoking = revokingType === type;
                const needsPurgeRetry = retryablePurges[type] === true;
                const isReconciliationPending = reconciliationPending[type] === true;

                return (
                  <section
                    key={type}
                    className="py-4 first:pt-0 last:pb-0"
                    data-testid={`consent-${type}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{label}</span>
                      <ConsentStatus consent={consent} analysisType={type} showDetails={false} />
                    </div>

                    {isActive ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            disabled={isRevoking}
                            aria-label={`${label} 원본 사진 저장 동의 철회`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            철회하고 사진 삭제
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {label} 사진 저장 동의를 철회할까요?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              저장된 원본 사진을 삭제합니다. 텍스트 분석 결과는 유지되지만 사진은
                              다시 볼 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleRevokeConsent(type)}>
                              철회하고 삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : needsPurgeRetry ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-destructive">
                          동의는 철회됐지만 사진 일부를 삭제하지 못했습니다.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRevoking}
                          onClick={() => void handleRevokeConsent(type)}
                        >
                          사진 삭제 다시 시도
                        </Button>
                      </div>
                    ) : isReconciliationPending ? (
                      <div className="mt-3 space-y-1" role="status">
                        <p className="text-sm font-medium text-foreground">사진 삭제 확인 중</p>
                        <p className="text-sm text-muted-foreground">
                          저장된 사진의 삭제 확인을 마무리하고 있습니다. 확인이 끝나면 새 분석에서
                          사진 저장을 다시 선택할 수 있습니다.
                        </p>
                      </div>
                    ) : type === 'body' ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        체형 분석의 새 사진 저장 선택은 현재 지원하지 않습니다.
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        이 축의 원본 사진은 저장하지 않습니다.{' '}
                        {analysisHref ? (
                          <Link className="underline underline-offset-4" href={analysisHref}>
                            새 분석에서 선택하기
                          </Link>
                        ) : null}
                      </p>
                    )}
                  </section>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card data-testid="integrated-image-consent-note">
          <CardHeader>
            <CardTitle className="text-base">통합 분석 사진</CardTitle>
            <CardDescription>
              통합 분석 원본 사진은 분석할 때마다 기본 OFF 상태에서 선택합니다. 저장된 통합 분석
              사진은 생체정보 전체 철회로 함께 파기할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isRevokingBiometric}>
                  생체정보 전체 철회 및 사진 파기
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>생체정보 동의를 모두 철회할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    모든 분석 원본 사진과 이미지 경로가 파기되며, 새 사진 분석을 사용하려면 생체정보
                    수집·이용에 다시 동의해야 합니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleBiometricWithdrawal()}>
                    전체 철회 및 파기
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {marketingConsent && (
          <MarketingConsentToggle
            initialValue={marketingConsent.agreed}
            agreedAt={marketingConsent.agreedAt}
            withdrawnAt={marketingConsent.withdrawnAt}
          />
        )}

        <AgreementHistory />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">개인정보 처리방침</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                사진은 AI 분석을 위해 Google(Gemini)에 전송되며, 선택 동의한 원본만 비공개 저장소에
                최대 1년 보관합니다. 철회하면 더 일찍 파기합니다.
              </p>
            </div>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/privacy-policy">전체 개인정보 처리방침 보기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
