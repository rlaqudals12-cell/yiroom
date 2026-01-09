'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, Shield, ChevronRight } from 'lucide-react';
import { NotificationSettings } from '@/components/notifications';
import { DataExportCard } from '@/components/settings';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 설정 페이지
 * 알림, 계정 등 앱 설정 관리
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" aria-hidden="true" />
              설정
            </h1>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 개인정보 설정 */}
        <Link href="/settings/privacy" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  개인정보 설정
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardTitle>
              <CardDescription>이미지 저장 동의, 데이터 보관 기간 관리</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* 알림 설정 */}
        <NotificationSettings />

        {/* 데이터 관리 */}
        <DataExportCard />

        {/* 추가 설정 섹션 (필요시 확장) */}
        {/* <AccountSettings /> */}
        {/* <AppearanceSettings /> */}
      </div>
    </div>
  );
}
