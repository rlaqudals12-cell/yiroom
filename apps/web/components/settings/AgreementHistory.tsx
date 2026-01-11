'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { FileText, Shield, CheckCircle, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserAgreement {
  terms_agreed: boolean;
  terms_agreed_at: string | null;
  terms_version: string | null;
  privacy_agreed: boolean;
  privacy_agreed_at: string | null;
  privacy_version: string | null;
  marketing_agreed: boolean;
  marketing_agreed_at: string | null;
  created_at: string;
}

interface AgreementItemProps {
  icon: typeof FileText;
  title: string;
  agreed: boolean;
  agreedAt: string | null;
  version?: string | null;
  href: string;
}

function AgreementItem({ icon: Icon, title, agreed, agreedAt, version, href }: AgreementItemProps) {
  return (
    <Link href={href} className="block">
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {agreed ? (
                <>
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>
                    {agreedAt
                      ? new Date(agreedAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '동의함'}
                    {version && ` (${version})`}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-muted-foreground" />
                  <span>미동의</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

/**
 * 약관 동의 내역 컴포넌트
 * SDD-LEGAL-SUPPORT.md §3.4
 */
export function AgreementHistory() {
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  const [agreement, setAgreement] = useState<UserAgreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgreement = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const { data, error } = await supabase
        .from('user_agreements')
        .select(
          'terms_agreed, terms_agreed_at, terms_version, privacy_agreed, privacy_agreed_at, privacy_version, marketing_agreed, marketing_agreed_at, created_at'
        )
        .maybeSingle();

      if (error) {
        console.error('[AgreementHistory] Failed to fetch:', error);
      } else if (data) {
        setAgreement(data);
      }
    } catch (err) {
      console.error('[AgreementHistory] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, supabase]);

  useEffect(() => {
    if (isLoaded) {
      fetchAgreement();
    }
  }, [isLoaded, fetchAgreement]);

  if (!isLoaded || isLoading) {
    return (
      <Card data-testid="agreement-history-loading">
        <CardHeader>
          <CardTitle className="text-base">약관 동의 내역</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // 동의 기록이 없는 경우 (가입 시점에 동의했으므로 기본값으로 표시)
  const termsAgreed = agreement?.terms_agreed ?? true;
  const privacyAgreed = agreement?.privacy_agreed ?? true;
  const signupDate = agreement?.created_at ?? new Date().toISOString();

  return (
    <Card data-testid="agreement-history">
      <CardHeader>
        <CardTitle className="text-base">약관 동의 내역</CardTitle>
        <CardDescription>서비스 이용을 위해 동의한 약관 및 정책입니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 -mx-2">
        <AgreementItem
          icon={FileText}
          title="이용약관"
          agreed={termsAgreed}
          agreedAt={agreement?.terms_agreed_at ?? signupDate}
          version={agreement?.terms_version ?? 'v1.0'}
          href="/terms"
        />
        <AgreementItem
          icon={Shield}
          title="개인정보처리방침"
          agreed={privacyAgreed}
          agreedAt={agreement?.privacy_agreed_at ?? signupDate}
          version={agreement?.privacy_version ?? 'v1.0'}
          href="/privacy-policy"
        />
      </CardContent>
      <div className="px-6 pb-6">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/help">고객센터 문의하기</Link>
        </Button>
      </div>
    </Card>
  );
}
