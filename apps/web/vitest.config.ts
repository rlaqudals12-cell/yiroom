import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  css: {
    // PostCSS 비활성화 (Tailwind v4와 Vite 호환성 문제 해결)
    postcss: {},
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    // 메모리 최적화 설정
    pool: 'forks', // threads보다 메모리 효율적
    poolOptions: {
      forks: {
        maxForks: 4, // 동시 워커 수 제한
        minForks: 1,
      },
    },
    maxConcurrency: 10, // 동시 테스트 수 제한
    testTimeout: 30000, // 30초 타임아웃
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/**', // 테스트 파일 제외
        'e2e/**', // E2E 테스트 제외
        'scripts/**', // 빌드/시드 스크립트 제외
        'public/**', // 정적 파일 제외
        'worker/**', // 서비스 워커 제외
        'supabase/**', // Supabase 마이그레이션 제외
        '**/*.test.ts', // 테스트 파일 제외
        '**/*.test.tsx', // 테스트 파일 제외
        '**/*.spec.ts', // 스펙 파일 제외
        '**/*.d.ts',
        '**/*.config.*',
        '**/components/ui/**', // shadcn 컴포넌트 제외
        '**/types/**', // 타입 정의 파일 제외
        '**/lib/supabase/**', // Supabase 인프라 코드 제외
        '**/mocks/**', // Mock 파일 제외
        '**/__mocks__/**', // Mock 파일 제외
      ],
    },
    css: false, // CSS 처리 비활성화 (Tailwind v4 PostCSS 호환성)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // @imgly/background-removal은 선택적 의존성 - 테스트에서 모킹
      '@imgly/background-removal': path.resolve(__dirname, './tests/__mocks__/imgly-background-removal.ts'),
    },
  },
})
