'use client';

import Link from 'next/link';
import { Palette, Sparkles, Activity, Scissors, ChevronRight } from 'lucide-react';

/**
 * /analysis 메인 페이지
 * 분석 모듈 메뉴 목록
 */

interface AnalysisModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const ANALYSIS_MODULES: AnalysisModule[] = [
  {
    id: 'personal-color',
    title: '퍼스널 컬러',
    description: '나에게 어울리는 컬러를 찾아보세요',
    href: '/analysis/personal-color',
    icon: <Palette className="w-6 h-6" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'skin',
    title: '피부 분석',
    description: 'AI가 피부 상태를 정밀 분석해요',
    href: '/analysis/skin',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'body',
    title: '체형 분석',
    description: '체형에 맞는 스타일을 추천해요',
    href: '/analysis/body',
    icon: <Activity className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'hair',
    title: '헤어 분석',
    description: '두피와 모발 상태를 분석해요',
    href: '/analysis/hair',
    icon: <Scissors className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

export default function AnalysisPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-muted pb-24" data-testid="analysis-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">AI 분석</h1>
          <p className="text-muted-foreground mt-2">나를 더 잘 알아가는 첫 걸음</p>
        </header>

        {/* 분석 모듈 목록 */}
        <div className="space-y-3">
          {ANALYSIS_MODULES.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`analysis-module-${module.id}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full ${module.bgColor} ${module.color} flex items-center justify-center`}
                >
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>

        {/* 추가 안내 */}
        <div className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            모든 분석은 AI 기반으로 진행되며,
            <br />
            결과는 참고용으로만 사용해주세요.
          </p>
        </div>
      </div>
    </main>
  );
}
