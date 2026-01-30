'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Calendar, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { isValidBirthDate, MINIMUM_AGE } from '@/lib/age-verification';

/**
 * 프로필 완성 페이지 - 생년월일 필수 입력
 * 회원가입 후 생년월일이 없는 사용자를 이 페이지로 리다이렉트
 */
export default function CompleteProfilePage() {
  const router = useRouter();
  const { signOut } = useClerk();

  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 최대 날짜 (오늘)
  const today = new Date().toISOString().split('T')[0];

  // 최소 날짜 (150년 전)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 클라이언트 검증
    if (!birthDate) {
      setError('생년월일을 입력해 주세요.');
      return;
    }

    if (!isValidBirthDate(birthDate)) {
      setError('올바른 생년월일을 입력해 주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/birthdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 만 14세 미만인 경우
        if (data.isMinor) {
          router.push('/age-restricted');
          return;
        }
        setError(data.message || '저장 중 오류가 발생했습니다.');
        return;
      }

      // 성공 - 대시보드로 이동
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to save birthdate:', err);
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      data-testid="complete-profile-page"
    >
      <div className="max-w-md w-full space-y-6">
        {/* 아이콘 */}
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Calendar className="w-8 h-8 text-primary" />
        </div>

        {/* 제목 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            생년월일을 입력해 주세요
          </h1>
          <p className="text-muted-foreground">
            서비스 이용을 위해 생년월일 확인이 필요합니다.
          </p>
        </div>

        {/* 안내 박스 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>왜 생년월일이 필요한가요?</strong>
            <br />
            한국 청소년보호법에 따라 만 {MINIMUM_AGE}세 이상만 서비스를 이용할 수
            있습니다. 입력하신 생년월일은 연령 확인 목적으로만 사용됩니다.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="birthDate"
              className="block text-sm font-medium text-foreground"
            >
              생년월일
            </label>
            <input
              type="date"
              id="birthDate"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              min={minDateStr}
              max={today}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !birthDate}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                저장 중...
              </>
            ) : (
              '시작하기'
            )}
          </button>
        </form>

        {/* 로그아웃 옵션 */}
        <div className="text-center pt-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
          >
            <LogOut className="w-4 h-4" />
            다른 계정으로 로그인
          </button>
        </div>

        {/* 하단 안내 */}
        <p className="text-xs text-center text-muted-foreground">
          계속 진행하면{' '}
          <a href="/terms" className="text-primary hover:underline">
            이용약관
          </a>
          {' 및 '}
          <a href="/privacy" className="text-primary hover:underline">
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
