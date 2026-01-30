# INF-4-R1: 모노레포 공유

## 1. 핵심 요약

Turborepo 2.x 모노레포에서 **Next.js 16 + Expo SDK 54** 간 코드 공유를 최적화하려면 다음 핵심 원칙을 따른다. 첫째, **packages/shared는 Just-in-Time 패키지** 전략으로 구성하여 번들러가 직접 TypeScript를 컴파일하게 한다. 둘째, **Barrel exports(index.ts)를 피하고** package.json의 `exports` 필드로 granular exports를 설정하여 tree-shaking을 최적화한다. 셋째, 플랫폼별 코드는 `.native.ts`/`.web.ts` 확장자로 분리하고, **Zod 스키마를 공유 패키지에서 정의**하여 타입과 검증 로직을 동시에 공유한다. 넷째, **Remote Cache(Vercel)를 활성화**하고 `turbo.json`의 `inputs`/`outputs`/`env`를 세밀하게 설정하여 캐시 히트율을 극대화한다. 마지막으로, 내부 패키지는 `workspace:*` 프로토콜로 연결하고 `private: true` + 버전 `0.0.0`으로 설정한다.

---

## 2. 상세 내용

### 2.1 packages/shared 구조

Turborepo 공식 문서에서는 **Barrel files가 번들러와 컴파일러에 성능 문제를 일으킬 수 있다**고 명시한다. 따라서 루트 `index.ts`에서 모든 것을 re-export하는 대신, `package.json`의 `exports` 필드를 활용한 granular exports 패턴을 권장한다.

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── domain/           # User, Beauty, Booking 등 도메인 엔티티
│   │   │   ├── user.ts
│   │   │   ├── beauty.ts
│   │   │   └── index.ts      # 도메인별 barrel (선택적)
│   │   ├── api/              # Supabase 타입, Request/Response
│   │   │   ├── request.ts
│   │   │   ├── response.ts
│   │   │   └── index.ts
│   │   └── common/           # Pagination, Error 등 제네릭 타입
│   │       ├── pagination.ts
│   │       ├── error.ts
│   │       └── index.ts
│   ├── utils/
│   │   ├── date/             # formatDate, parseDate, getRelativeTime
│   │   │   ├── format.ts
│   │   │   ├── parse.ts
│   │   │   └── index.ts
│   │   ├── string/           # sanitize, truncate, slugify
│   │   ├── validation/       # isValidEmail, isValidPhone
│   │   └── color/            # 퍼스널 컬러 관련 유틸 (Yiroom 특화)
│   ├── constants/
│   │   ├── config/           # API_CONFIG, APP_CONFIG
│   │   │   ├── api.ts
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   ├── enums/            # BookingStatus, SkinType, ColorSeason
│   │   │   ├── status.ts
│   │   │   ├── beauty.ts
│   │   │   └── index.ts
│   │   └── messages/         # ERROR_MESSAGES, VALIDATION_MESSAGES
│   └── schemas/              # Zod 스키마 (타입+검증 통합)
│       ├── user.ts
│       ├── beauty-profile.ts
│       └── forms/
├── package.json
└── tsconfig.json
```

**package.json exports 설정** (Granular exports 패턴):

```json
{
  "name": "@yiroom/shared",
  "version": "0.0.0",
  "private": true,
  "sideEffects": false,
  "exports": {
    "./types/user": "./src/types/domain/user.ts",
    "./types/beauty": "./src/types/domain/beauty.ts",
    "./types/api": "./src/types/api/index.ts",
    "./types/common": "./src/types/common/index.ts",
    "./utils/date": "./src/utils/date/index.ts",
    "./utils/string": "./src/utils/string/index.ts",
    "./utils/validation": "./src/utils/validation/index.ts",
    "./constants/config": "./src/constants/config/index.ts",
    "./constants/enums": "./src/constants/enums/index.ts",
    "./constants/messages": "./src/constants/messages/index.ts",
    "./schemas/*": "./src/schemas/*.ts"
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "devDependencies": {
    "@yiroom/typescript-config": "workspace:*",
    "typescript": "^5.5.0",
    "zod": "^3.23.0"
  }
}
```

**Just-in-Time Package 전략**을 채택하면 `build` 스크립트 없이 Next.js와 Expo의 번들러(Webpack/Metro)가 직접 TypeScript 소스를 컴파일한다. 이 방식은 설정이 단순하고 코드 변경이 즉시 반영되지만, Turborepo의 빌드 캐싱 이점을 활용할 수 없다. 대규모 shared 패키지의 경우 **Compiled Package** 전략(tsc로 dist/ 생성)을 고려할 수 있다.

---

### 2.2 타입 공유 패턴

**플랫폼별 파일 확장자**는 Metro(React Native)와 Webpack(Next.js)이 자동으로 해석한다. 해석 우선순위는 다음과 같다:

| 확장자 | 대상 플랫폼 | 해석 번들러 |
|--------|------------|------------|
| `.android.tsx` | Android 전용 | Metro |
| `.ios.tsx` | iOS 전용 | Metro |
| `.native.tsx` | iOS + Android | Metro |
| `.web.tsx` | Web 전용 | Webpack/Vite |
| `.tsx` | 기본 (모든 플랫폼) | 모두 |

**공유 UI 컴포넌트 패턴** (플랫폼별 구현 분리):

```typescript
// packages/ui/src/Button/types.ts - 공유 타입
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

// packages/ui/src/Button/Button.native.tsx - 모바일 구현
import { Pressable, Text, ActivityIndicator } from 'react-native';
import type { ButtonProps } from './types';

export function Button({ variant = 'primary', loading, onPress, children }: ButtonProps) {
  return (
    <Pressable onPress={onPress} className="rounded-lg px-4 py-3 bg-primary">
      {loading ? <ActivityIndicator color="white" /> : <Text className="text-white">{children}</Text>}
    </Pressable>
  );
}

// packages/ui/src/Button/Button.web.tsx - 웹 구현
import type { ButtonProps } from './types';

export function Button({ variant = 'primary', loading, onPress, children }: ButtonProps) {
  return (
    <button onClick={onPress} className="rounded-lg px-4 py-3 bg-primary text-white hover:bg-primary/90">
      {loading ? <span className="animate-spin">⏳</span> : children}
    </button>
  );
}
```

**Zod 스키마 공유 패턴**은 타입 정의와 런타임 검증을 단일 소스에서 관리할 수 있어 특히 유용하다:

```typescript
// packages/shared/src/schemas/beauty-profile.ts
import { z } from 'zod';

export const SkinTypeSchema = z.enum(['dry', 'oily', 'combination', 'normal']);
export const ColorSeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);

export const BeautyProfileSchema = z.object({
  userId: z.string().uuid(),
  skinType: SkinTypeSchema,
  colorSeason: ColorSeasonSchema.optional(),
  concerns: z.array(z.string()).min(1, { message: '최소 1개 이상 선택하세요' }),
  undertone: z.enum(['warm', 'cool', 'neutral']).optional(),
});

// 타입 자동 추론 - 별도 interface 정의 불필요
export type BeautyProfile = z.infer<typeof BeautyProfileSchema>;
export type SkinType = z.infer<typeof SkinTypeSchema>;
export type ColorSeason = z.infer<typeof ColorSeasonSchema>;
```

**React Hook Form 통합** (Web과 Mobile에서 동일 스키마 사용):

```typescript
// apps/web 또는 apps/mobile 에서
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BeautyProfileSchema, BeautyProfile } from '@yiroom/shared/schemas/beauty-profile';

const { control, handleSubmit, formState: { errors } } = useForm<BeautyProfile>({
  resolver: zodResolver(BeautyProfileSchema),
});
```

**package.json conditional exports**로 플랫폼별 진입점을 설정할 수 있다:

```json
{
  "name": "@yiroom/ui",
  "exports": {
    "./Button": {
      "types": "./src/Button/types.ts",
      "react-native": "./src/Button/Button.native.tsx",
      "browser": "./src/Button/Button.web.tsx",
      "default": "./src/Button/Button.tsx"
    }
  }
}
```

---

### 2.3 빌드 캐시 최적화

**turbo.json 최적 설정** (Next.js 16 + Expo SDK 54 기준):

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalDependencies": [".env", "tsconfig.json"],
  "globalEnv": ["NODE_ENV", "CI"],
  "globalPassThroughEnv": ["AWS_SECRET_KEY", "GITHUB_TOKEN"],
  "envMode": "strict",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*", "tsconfig.json"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["DATABASE_URL", "NEXT_PUBLIC_*", "EXPO_PUBLIC_*"]
    },
    "build:expo": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*", "app.json"],
      "outputs": ["dist/**", ".expo/**"],
      "env": ["EXPO_PUBLIC_*"]
    },
    "lint": {
      "dependsOn": ["^lint"],
      "inputs": ["$TURBO_DEFAULT$", "eslint.config.*"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["$TURBO_DEFAULT$", "src/**/*.ts", "**/*.test.ts"],
      "outputs": ["coverage/**"],
      "env": ["CI"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/tsconfig.json"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "interactive": true
    }
  },
  "remoteCache": {
    "enabled": true,
    "signature": true,
    "timeout": 60
  }
}
```

**Vercel Remote Cache 설정**은 팀 전체와 CI에서 캐시를 공유하여 빌드 시간을 **50-90%** 단축할 수 있다:

```bash
# 로컬 개발 환경 설정
npx turbo login          # Vercel 계정 인증
npx turbo link           # 저장소 연결

# CI/CD 환경 변수 (GitHub Actions)
TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

**환경변수와 캐시 무효화 관계**는 Turborepo 2.x의 핵심 개념이다:

| 설정 | 범위 | 캐시 영향 |
|------|------|---------|
| `globalEnv` | 모든 태스크 | 변경 시 **모든** 캐시 무효화 |
| `env` | 특정 태스크 | 해당 태스크 캐시만 무효화 |
| `globalPassThroughEnv` | 모든 태스크 | 캐시에 **영향 없음** |
| `passThroughEnv` | 특정 태스크 | 캐시에 **영향 없음** |

Turborepo 2.x는 **프레임워크별 환경변수를 자동 추론**한다. `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, `VITE_*` 접두사는 자동으로 해당 빌드에 포함된다. **envMode: "strict"**가 기본값이므로, 필요한 환경변수를 명시적으로 선언해야 한다.

**캐시 디버깅 명령어**:

```bash
turbo build --dry-run              # 실행 계획 확인
turbo build --summarize            # 실행 후 요약 생성
turbo build --output-logs=hash-only # 해시 변경 추적
```

**Turborepo 2.x 주요 신기능**: `turbo watch` 개발 모드, `--affected` 플래그로 변경된 패키지만 빌드, `turbo query`로 GraphQL 쿼리, `turbo devtools`로 패키지/태스크 그래프 시각화, `$TURBO_ROOT$` 매크로로 워크스페이스 루트 참조.

---

### 2.4 의존성 관리

**pnpm-workspace.yaml 구성**:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - '!**/test/**'
```

**.npmrc 권장 설정**:

```ini
link-workspace-packages=false
save-workspace-protocol=rolling
strict-peer-dependencies=true
auto-install-peers=true
resolve-peers-from-workspace-root=true
disallowWorkspaceCycles=true
```

**workspace: 프로토콜 vs * 버전**의 차이점을 이해하는 것이 중요하다. `workspace:*`는 pnpm에게 **로컬 워크스페이스 패키지만** 사용하도록 강제하며, npm 레지스트리를 조회하지 않는다:

| 프로토콜 | 개발 시 | 배포 시 변환 |
|---------|--------|-------------|
| `workspace:*` | 현재 로컬 버전 | `1.5.0` (정확한 버전) |
| `workspace:^` | 현재 로컬 버전 | `^1.5.0` (마이너 허용) |
| `workspace:~` | 현재 로컬 버전 | `~1.5.0` (패치 허용) |

**의존성 배치 원칙**:

```json
// packages/ui/package.json
{
  "name": "@yiroom/ui",
  "version": "0.0.0",
  "private": true,
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-native": ">=0.73.0"
  },
  "peerDependenciesMeta": {
    "react-native": { "optional": true }
  },
  "devDependencies": {
    "@yiroom/typescript-config": "workspace:*",
    "react": "^19.0.0",
    "typescript": "^5.5.0"
  }
}

// apps/web/package.json
{
  "name": "@yiroom/web",
  "dependencies": {
    "@yiroom/shared": "workspace:*",
    "@yiroom/ui": "workspace:*",
    "next": "^16.0.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@yiroom/eslint-config": "workspace:*",
    "@yiroom/typescript-config": "workspace:*"
  }
}
```

**순환 의존성 방지**는 모노레포 건강성의 핵심이다. `.npmrc`에 `disallowWorkspaceCycles=true`를 설정하면 순환 의존성 발생 시 설치가 실패한다. 추가로 **madge**나 **ESLint import/no-cycle**로 CI에서 검증한다:

```bash
# madge로 순환 의존성 검사
npx madge --circular --ts-config ./tsconfig.json --extensions ts,tsx packages/
```

---

### 2.5 버전 관리

**내부 패키지 버전 전략**은 NPM 게시 여부에 따라 결정한다. Yiroom처럼 **내부 전용 패키지**는 `version: "0.0.0"` + `private: true`로 설정하여 버전 번호가 무의미함을 명시한다. 외부 게시용 패키지는 **Changesets**로 시맨틱 버저닝을 관리한다.

**Changesets 설정** (외부 게시 시):

```bash
pnpm add -D @changesets/cli
pnpm changeset init
```

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "yiroom/monorepo" }],
  "commit": false,
  "linked": [["@yiroom/*"]],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@yiroom/web", "@yiroom/mobile"]
}
```

**CI/CD 변경 감지**는 `turbo-ignore`와 `--affected` 플래그로 구현한다:

```yaml
# .github/workflows/deploy.yml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      web-changed: ${{ steps.check-web.outputs.result }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # --affected에 필요
      
      - name: Check web changes
        id: check-web
        run: |
          npx turbo-ignore web --fallback=HEAD~1 && \
          echo "result=false" >> $GITHUB_OUTPUT || \
          echo "result=true" >> $GITHUB_OUTPUT

  deploy-web:
    needs: detect-changes
    if: needs.detect-changes.outputs.web-changed == 'true'
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ vars.TURBO_TEAM }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build --filter=web
```

**turbo prune**으로 Docker 이미지 최적화:

```bash
turbo prune web --docker

# 출력 구조:
# out/
#   json/           # package.json만 (의존성 설치 레이어용)
#   full/           # 전체 소스코드
#   pnpm-lock.yaml
```

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY out/json/ .
COPY out/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY out/full/ .
RUN pnpm turbo run build --filter=web

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
CMD ["pnpm", "start"]
```

---

## 3. 구현 시 필수 사항

- [ ] **packages/shared 구조 설정**: `src/types/`, `src/utils/`, `src/constants/`, `src/schemas/` 폴더 생성
- [ ] **package.json exports 필드 구성**: granular exports로 barrel files 대체
- [ ] **`sideEffects: false` 설정**: 모든 shared 패키지에 추가하여 tree-shaking 활성화
- [ ] **Zod 스키마 패키지 생성**: 타입 정의와 검증 로직을 단일 소스로 통합
- [ ] **turbo.json 최적화**: `inputs`, `outputs`, `env` 세밀하게 설정
- [ ] **Remote Cache 활성화**: `npx turbo login && npx turbo link` 실행
- [ ] **pnpm-workspace.yaml 구성**: apps/*, packages/* 포함
- [ ] **.npmrc 설정**: `disallowWorkspaceCycles=true`, `strict-peer-dependencies=true`
- [ ] **workspace: 프로토콜 적용**: 모든 내부 패키지 의존성에 `workspace:*` 사용
- [ ] **내부 패키지 버전 설정**: `version: "0.0.0"` + `private: true`
- [ ] **CI 변경 감지 구성**: `turbo-ignore` 또는 `--affected` 플래그 적용
- [ ] **순환 의존성 검사**: madge 또는 ESLint import/no-cycle CI 단계 추가

---

## 4. 코드 예시

### 공유 타입 및 Zod 스키마

```typescript
// packages/shared/src/schemas/user.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email({ message: '올바른 이메일을 입력하세요' }),
  name: z.string().min(2, { message: '이름은 2자 이상이어야 합니다' }),
  avatarUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// packages/shared/src/schemas/beauty-profile.ts
import { z } from 'zod';

export const ColorSeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);
export const SkinTypeSchema = z.enum(['dry', 'oily', 'combination', 'normal']);
export const UndertoneSchema = z.enum(['warm', 'cool', 'neutral']);

export const BeautyProfileSchema = z.object({
  userId: z.string().uuid(),
  colorSeason: ColorSeasonSchema,
  skinType: SkinTypeSchema,
  undertone: UndertoneSchema,
  concerns: z.array(z.string()).min(1),
  analyzedAt: z.coerce.date(),
});

export type BeautyProfile = z.infer<typeof BeautyProfileSchema>;
export type ColorSeason = z.infer<typeof ColorSeasonSchema>;
```

### 공유 유틸리티

```typescript
// packages/shared/src/utils/color/recommendations.ts
import type { ColorSeason, Undertone } from '../../schemas/beauty-profile';

export const COLOR_PALETTES: Record<ColorSeason, string[]> = {
  spring: ['#FFB6C1', '#FFDAB9', '#98FB98', '#87CEEB'],
  summer: ['#E6E6FA', '#B0C4DE', '#DDA0DD', '#F0E68C'],
  autumn: ['#D2691E', '#8B4513', '#CD853F', '#A0522D'],
  winter: ['#000080', '#800020', '#4B0082', '#191970'],
};

export function getRecommendedColors(season: ColorSeason): string[] {
  return COLOR_PALETTES[season];
}

export function isColorSuitable(hexColor: string, season: ColorSeason): boolean {
  // 퍼스널 컬러 적합성 판단 로직
  const palette = COLOR_PALETTES[season];
  return palette.some(color => calculateColorDistance(hexColor, color) < 50);
}
```

### 앱에서의 사용 예시

```typescript
// apps/web/app/profile/page.tsx
import { BeautyProfileSchema, type BeautyProfile } from '@yiroom/shared/schemas/beauty-profile';
import { getRecommendedColors } from '@yiroom/shared/utils/color';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function ProfilePage() {
  const { register, handleSubmit, watch } = useForm<BeautyProfile>({
    resolver: zodResolver(BeautyProfileSchema),
  });
  
  const colorSeason = watch('colorSeason');
  const recommendedColors = colorSeason ? getRecommendedColors(colorSeason) : [];
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 폼 구현 */}
    </form>
  );
}
```

### turbo.json 전체 예시

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalDependencies": [".env", "tsconfig.json"],
  "globalEnv": ["NODE_ENV", "CI"],
  "envMode": "strict",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["DATABASE_URL", "NEXT_PUBLIC_*", "EXPO_PUBLIC_*"]
    },
    "lint": {
      "dependsOn": ["^lint"],
      "inputs": ["$TURBO_DEFAULT$", "eslint.config.*"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/tsconfig.json"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 5. 참고 자료

- Turborepo 공식 문서 - Internal Packages: https://turborepo.dev/docs/core-concepts/internal-packages
- Turborepo Caching Guide: https://turborepo.dev/docs/crafting-your-repository/caching
- Turborepo Environment Variables: https://turborepo.dev/docs/crafting-your-repository/using-environment-variables
- Turborepo 2.0 Release Blog: https://turborepo.dev/blog/turbo-2-0
- pnpm Workspaces Documentation: https://pnpm.io/workspaces
- Changesets Documentation: https://github.com/changesets/changesets
- Expo Platform-specific Extensions: https://docs.expo.dev/router/advanced/platform-specific-modules/
- Zod Documentation: https://zod.dev
- React Hook Form + Zod: https://react-hook-form.com/get-started#SchemaValidation
- Barrel Files 분석: https://laniewski.me/blog/pitfalls-of-barrel-files-in-javascript-modules/