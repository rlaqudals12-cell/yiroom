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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/components/ui/**', // shadcn 컴포넌트 제외
        '**/types/**', // 타입 정의 파일 제외
        '**/lib/supabase/**', // Supabase 인프라 코드 제외
      ],
    },
    css: false, // CSS 처리 비활성화 (Tailwind v4 PostCSS 호환성)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
