'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry 에러 리포팅 (치명적)
    Sentry.captureException(error, {
      level: 'fatal',
      tags: { type: 'global-error' },
    });
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: '#fdf2f8',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* 에러 아이콘 */}
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#fecaca',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle
              style={{ width: '40px', height: '40px', color: '#dc2626' }}
            />
          </div>

          {/* 에러 메시지 */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#1f2937',
                marginBottom: '0.5rem',
              }}
            >
              앱에 문제가 발생했어요
            </h1>
            <p style={{ color: '#6b7280', maxWidth: '400px' }}>
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후
              다시 시도해 주세요.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginTop: '0.5rem',
                }}
              >
                오류 코드: {error.digest}
              </p>
            )}
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2e5afa',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              홈으로
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
