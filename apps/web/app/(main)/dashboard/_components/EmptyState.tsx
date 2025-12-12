'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState() {
  return (
    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-module-personal-color-light flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-module-personal-color" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        아직 분석 결과가 없어요
      </h3>

      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        퍼스널 컬러 진단을 먼저 진행하면
        <br />
        피부와 체형 분석에서 더 정확한 추천을 받을 수 있어요
      </p>

      <Link href="/analysis/personal-color">
        <Button className="gap-2 bg-gradient-brand hover:opacity-90">
          <Sparkles className="w-4 h-4" />
          퍼스널 컬러 진단 시작하기
        </Button>
      </Link>
    </div>
  );
}
