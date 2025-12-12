import Link from 'next/link';
import { Home, Sparkles, Dumbbell, Utensils, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-pink-50 to-white">
      {/* 404 표시 */}
      <div className="text-center mb-8">
        <h1 className="text-8xl font-bold text-pink-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          페이지를 찾을 수 없어요
        </h2>
        <p className="text-gray-500">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있어요.
        </p>
      </div>

      {/* 홈으로 버튼 */}
      <Link href="/">
        <Button size="lg" className="mb-8 gap-2">
          <Home className="h-5 w-5" />
          홈으로 돌아가기
        </Button>
      </Link>

      {/* 인기 기능 링크 */}
      <div className="w-full max-w-md">
        <p className="text-sm text-gray-400 text-center mb-4">
          이런 기능은 어떠세요?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/analysis/personal-color"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50 transition-colors"
          >
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">퍼스널 컬러</p>
              <p className="text-xs text-gray-400">나만의 색상 찾기</p>
            </div>
          </Link>

          <Link
            href="/workout"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">운동</p>
              <p className="text-xs text-gray-400">맞춤 운동 플랜</p>
            </div>
          </Link>

          <Link
            href="/nutrition"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Utensils className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">영양</p>
              <p className="text-xs text-gray-400">식단 관리</p>
            </div>
          </Link>

          <Link
            href="/products"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">제품</p>
              <p className="text-xs text-gray-400">맞춤 추천</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
