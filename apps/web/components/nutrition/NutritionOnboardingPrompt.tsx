/**
 * N-1 영양 온보딩 유도 컴포넌트 (P3-2.2)
 *
 * 영양 설정이 없을 때 표시
 * workout/page.tsx의 OnboardingPrompt 패턴 참고
 */

import Link from 'next/link';
import { Utensils } from 'lucide-react';

export default function NutritionOnboardingPrompt() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-8" data-testid="nutrition-onboarding-prompt">
      <div className="text-center space-y-6">
        {/* 아이콘 */}
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <Utensils className="h-10 w-10 text-green-500" />
        </div>

        {/* 텍스트 */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">나만의 식단 관리</h2>
          <p className="text-muted-foreground">목표에 맞는 맞춤 칼로리와 영양소를 설정해요</p>
        </div>

        {/* 시작 버튼 */}
        <Link
          href="/nutrition/onboarding/step1"
          className="block w-full py-4 bg-green-500 hover:bg-green-600 text-white text-center font-medium rounded-xl transition-colors"
        >
          식단 설정 시작하기
        </Link>

        {/* 설명 */}
        <div className="text-left bg-muted rounded-xl p-4">
          <p className="text-sm text-muted-foreground font-medium mb-2">
            이런 기능을 사용할 수 있어요:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ 내 목표에 맞는 칼로리 계산</li>
            <li>✓ AI 음식 인식 및 영양 분석</li>
            <li>✓ 수분 섭취 트래킹</li>
            <li>✓ 간헐적 단식 타이머</li>
            <li>✓ 주간/월간 영양 리포트</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
