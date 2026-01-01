/**
 * ESLint 설정
 * React Native / Expo 프로젝트용
 */

module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    // Prettier 통합
    'prettier/prettier': 'error',

    // React 규칙
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',

    // React Hooks 규칙
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import 정렬
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // 미사용 변수
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // any 타입 경고
    '@typescript-eslint/no-explicit-any': 'warn',

    // 빈 함수 허용 (이벤트 핸들러 등)
    '@typescript-eslint/no-empty-function': 'off',

    // console.log 경고 (디버깅용)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // 접근성 규칙
    'jsx-a11y/accessible-emoji': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '__tests__/',
    'jest.config.js',
    'jest.setup.js',
    '*.d.ts',
  ],
};
