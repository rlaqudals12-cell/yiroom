'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  ArrowLeft,
  Shield,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
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
import { ConsentStatus, type ImageConsent } from '@/components/analysis/consent';
import { getDaysUntilExpiry } from '@/lib/consent/version-check';
import { MarketingConsentToggle } from '@/components/settings/MarketingConsentToggle';

/**
 * 개인정보 설정 페이지
 * SDD-VISUAL-SKIN-REPORT.md §4.6 - 설정 > 개인정보 페이지
 */
export default function PrivacySettingsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  const [imageConsent, setImageConsent] = useState<ImageConsent | null>(null);
  const [marketingConsent, setMarketingConsent] = useState<{
    agreed: boolean;
    agreedAt: string | null;
    withdrawnAt: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);

  // 동의 정보 조회
  const fetchConsent = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      // 이미지 동의 정보 조회
      const { data: imageData, error: imageError } = await supabase
        .from('image_consents')
        .select('*')
        .eq('analysis_type', 'skin')
        .maybeSingle();

      if (imageError) {
        console.error('[Privacy] Failed to fetch image consent:', imageError);
      } else if (imageData) {
        setImageConsent(imageData as ImageConsent);
      }

      // 마케팅 동의 정보 조회
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
    } catch (err) {
      console.error('[Privacy] Error fetching consent:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, supabase]);

  useEffect(() => {
    if (isLoaded) {
      fetchConsent();
    }
  }, [isLoaded, fetchConsent]);

  // 동의 철회
  const handleRevokeConsent = async () => {
    if (!isSignedIn) return;

    setIsRevoking(true);
    try {
      const { error } = await supabase
        .from('image_consents')
        .update({
          consent_given: false,
          withdrawal_at: new Date().toISOString(),
        })
        .eq('analysis_type', 'skin');

      if (error) {
        throw error;
      }

      toast.success('이미지 저장 동의가 철회되었습니다');
      setImageConsent((prev) =>
        prev
          ? {
              ...prev,
              consent_given: false,
            }
          : null
      );
    } catch (err) {
      console.error('[Privacy] Failed to revoke consent:', err);
      toast.error('동의 철회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsRevoking(false);
    }
  };

  // 남은 보관일 계산
  const daysRemaining = imageConsent?.retention_until
    ? getDaysUntilExpiry(imageConsent.retention_until)
    : null;

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">개인정보 설정을 확인하려면 로그인해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="privacy-settings-page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="설정으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" aria-hidden="true" />
              개인정보 설정
            </h1>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 이미지 저장 동의 카드 */}
        <Card data-testid="image-consent-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="w-5 h-5" aria-hidden="true" />
              피부 분석 이미지 저장 동의
            </CardTitle>
            <CardDescription>
              분석용 얼굴 이미지의 저장 및 활용 동의 상태를 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 동의 상태 표시 */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">현재 동의 상태</span>
              <ConsentStatus consent={imageConsent} analysisType="skin" showDetails={false} />
            </div>

            {/* 동의 정보 상세 */}
            {imageConsent?.consent_given && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>
                    동의일:{' '}
                    {imageConsent.consent_at
                      ? new Date(imageConsent.consent_at).toLocaleDateString('ko-KR')
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>동의 버전: {imageConsent.consent_version}</span>
                </div>
                {daysRemaining !== null && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>
                      {daysRemaining > 0
                        ? `보관 기한: ${daysRemaining}일 남음`
                        : '보관 기한이 만료되었습니다'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 동의 미제공 시 안내 */}
            {!imageConsent?.consent_given && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  이미지 저장 동의를 하지 않으면 분석 결과를 저장할 수 없어요.
                  <br />
                  피부 분석 시 동의 여부를 선택할 수 있습니다.
                </p>
              </div>
            )}

            {/* 동의 철회 버튼 */}
            {imageConsent?.consent_given && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isRevoking}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    동의 철회하기
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>동의를 철회하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>동의를 철회하면 다음과 같은 변경이 적용됩니다:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>저장된 분석 이미지가 삭제됩니다</li>
                        <li>새 분석 시 결과가 저장되지 않습니다</li>
                        <li>이전 분석 결과는 유지되지만 이미지는 볼 수 없습니다</li>
                      </ul>
                      <p className="font-medium mt-2">이 작업은 되돌릴 수 없습니다.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRevokeConsent}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      철회하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        {/* 마케팅 동의 카드 */}
        {marketingConsent && (
          <MarketingConsentToggle
            initialValue={marketingConsent.agreed}
            agreedAt={marketingConsent.agreedAt}
            withdrawnAt={marketingConsent.withdrawnAt}
          />
        )}

        {/* 개인정보 처리방침 안내 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">개인정보 처리방침</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>이룸은 개인정보보호법(PIPA)을 준수하여 사용자의 개인정보를 보호합니다.</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>수집 목적: AI 피부 분석 및 맞춤 추천 제공</li>
              <li>보관 기간: 동의일로부터 1년 (만료 시 자동 삭제)</li>
              <li>제3자 제공: 없음 (분석 AI에만 전송)</li>
              <li>동의 철회: 언제든 설정에서 철회 가능</li>
            </ul>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/help/privacy">전체 개인정보 처리방침 보기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
