'use client';

/**
 * 고객센터 메인 페이지
 * SDD-LEGAL-SUPPORT.md §3.3
 */

import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  Mail,
  FileText,
  Shield,
  Bell,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppVersion } from '@/components/settings';

interface HelpMenuItem {
  id: string;
  icon: typeof HelpCircle;
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

const HELP_MENU: HelpMenuItem[] = [
  {
    id: 'faq',
    icon: HelpCircle,
    title: '자주 묻는 질문',
    description: '궁금한 점을 빠르게 확인하세요',
    href: '/help/faq',
  },
  {
    id: 'feedback',
    icon: MessageSquare,
    title: '피드백 / 건의하기',
    description: '서비스 개선 의견을 보내주세요',
    href: '/help/feedback',
  },
  {
    id: 'announcements',
    icon: Bell,
    title: '공지사항',
    description: '새로운 소식과 업데이트',
    href: '/announcements',
  },
  {
    id: 'contact',
    icon: Mail,
    title: '이메일 문의',
    description: 'support@yiroom.app',
    href: 'mailto:support@yiroom.app',
    external: true,
  },
];

const LEGAL_MENU: HelpMenuItem[] = [
  {
    id: 'terms',
    icon: FileText,
    title: '이용약관',
    description: '서비스 이용 약관 확인',
    href: '/terms',
  },
  {
    id: 'privacy',
    icon: Shield,
    title: '개인정보처리방침',
    description: '개인정보 보호 정책',
    href: '/privacy-policy',
  },
];

function MenuItem({ item }: { item: HelpMenuItem }) {
  const Icon = item.icon;

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        data-testid={`help-menu-${item.id}`}
      >
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground truncate">{item.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
      </a>
    );
  }

  return (
    <Link href={item.href} className="block" data-testid={`help-menu-${item.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground truncate">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="help-page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              고객센터
            </h1>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 도움말 메뉴 */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">도움말</h2>
          <div className="space-y-3">
            {HELP_MENU.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* 약관 메뉴 */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">약관 및 정책</h2>
          <div className="space-y-3">
            {LEGAL_MENU.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* 운영 시간 안내 */}
        <section>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">고객센터 운영 안내</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>이메일 문의: 평일 10:00 - 18:00 (주말/공휴일 제외)</p>
                <p>응답 소요 시간: 최대 2영업일</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 앱 버전 */}
        <section className="pt-4">
          <AppVersion />
        </section>
      </div>
    </div>
  );
}
