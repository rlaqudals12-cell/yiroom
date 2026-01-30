import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import sonarjs from "eslint-plugin-sonarjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 제외 디렉토리 설정
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "scripts/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // SonarJS 플러그인 (코드 스멜 감지)
  sonarjs.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      // SonarJS 규칙 조정
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/no-duplicate-string": "off",
      // P4: 단순화 - 점진적 개선을 위해 warn으로 조정
      "sonarjs/no-nested-conditional": "warn",
      "sonarjs/pseudo-random": "off", // Mock 데이터 생성에 Math.random 사용 허용
      "sonarjs/no-nested-functions": "warn",
      "sonarjs/no-nested-template-literals": "warn",
      "sonarjs/slow-regex": "warn", // 성능 경고로 처리
      // 코드 스타일 관련 규칙 - 점진적 개선
      "sonarjs/use-type-alias": "warn", // 타입 별칭 권장 - warn으로
      "sonarjs/single-character-alternation": "warn", // regex 스타일
      "sonarjs/concise-regex": "warn", // regex 간결화
      "sonarjs/todo-tag": "warn", // TODO 태그 허용 (추적용)
      "sonarjs/no-intrusive-permissions": "warn", // geolocation 사용 확인
      "sonarjs/no-hardcoded-ip": "warn", // 테스트용 IP 허용
      "sonarjs/redundant-type-aliases": "warn", // 중복 타입 별칭
      "sonarjs/table-header": "warn", // 테이블 헤더 권장
      "sonarjs/no-commented-code": "warn", // 주석 코드 허용 (참조용)
      "sonarjs/void-use": "off", // fire-and-forget async 패턴 허용
      // 하드코딩 색상 방지 규칙 (Task 2.2)
      // Tailwind 임의값으로 색상 하드코딩 금지
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/bg-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "하드코딩 색상 금지. CSS 변수 사용하세요: style={{ backgroundColor: 'var(--color-name)' }}"
        },
        {
          selector: "Literal[value=/text-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "하드코딩 색상 금지. CSS 변수 사용하세요: style={{ color: 'var(--color-name)' }}"
        },
        {
          selector: "Literal[value=/border-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "하드코딩 색상 금지. CSS 변수 사용하세요: style={{ borderColor: 'var(--color-name)' }}"
        },
        {
          selector: "Literal[value=/hover:bg-\\[#[0-9a-fA-F]{3,8}\\]/]",
          message: "하드코딩 호버 색상 금지. onMouseOver/onMouseOut 핸들러와 CSS 변수 사용하세요."
        }
      ],
    },
  },
  // 테스트/E2E 파일은 덜 엄격하게
  {
    files: ["tests/**", "e2e/**", "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "sonarjs/assertions-in-tests": "warn", // 테스트 헬퍼 패턴 허용
      "sonarjs/no-empty-collection": "off", // 테스트용 mock 허용
      "sonarjs/no-identical-functions": "off", // 테스트 코드 중복 허용
      "sonarjs/no-all-duplicated-branches": "warn", // 테스트 내 조건문 허용
      "sonarjs/no-gratuitous-expressions": "warn", // 테스트 표현식 허용
      "sonarjs/no-collection-size-mischeck": "warn", // 테스트 컬렉션 검사 허용
      "sonarjs/no-dead-store": "off", // 테스트용 변수 할당 허용
    },
  },
];

export default eslintConfig;
