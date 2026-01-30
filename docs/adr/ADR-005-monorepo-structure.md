# ADR-005: 모노레포 구조

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"웹과 모바일이 동일한 타입/로직을 공유하며 독립 배포 가능한 구조"

- packages/shared: 타입, 유틸, 상수 100% 공유
- 빌드 캐싱: Turborepo로 증분 빌드 90%+ 캐시 적중
- 독립 배포: 웹/모바일 개별 CI/CD
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 플랫폼 차이 | React vs React Native 컴포넌트 분리 필수 |
| 패키지 호환성 | 일부 라이브러리 웹 전용 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 타입 공유율 | 핵심 타입 100% shared |
| 빌드 캐시 적중 | 90%+ |
| 코드 중복 | 5% 미만 |

### 현재 달성률

**65%** - 타입 공유 중, 유틸리티 부분 공유

### 의도적 제외

| 제외 항목 | 이유 |
|----------|------|
| UI 컴포넌트 공유 | 플랫폼별 UX 최적화 우선 |

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

이룸은 웹(Next.js)과 모바일(Expo React Native) 두 플랫폼을 지원합니다. 코드 공유와 일관성 유지가 필요합니다:

1. **타입 공유**: 웹/모바일 간 동일한 타입 사용
2. **유틸리티 공유**: 색상 변환, 검증 로직 등
3. **일관된 개발 경험**: 하나의 저장소에서 관리

## 결정 (Decision)

**Turborepo 기반 모노레포** 구조를 채택합니다.

```
yiroom/
├── apps/
│   ├── web/              # Next.js 16 웹 앱 (Turbopack)
│   │   ├── app/          # App Router 페이지
│   │   ├── components/   # UI 컴포넌트
│   │   ├── lib/          # 비즈니스 로직
│   │   └── tests/        # 테스트
│   │
│   └── mobile/           # Expo SDK 54 React Native 앱
│       ├── app/          # Expo Router
│       ├── components/   # RN 컴포넌트
│       └── lib/          # 모바일 전용 로직
│
├── packages/
│   └── shared/           # 공통 타입/유틸리티
│       └── src/
│           ├── types/    # 공유 타입 (ImageQualityResult 등)
│           ├── utils/    # 공유 유틸 (color-conversion 등)
│           └── constants/ # 공유 상수 (thresholds 등)
│
├── docs/                 # 설계 문서
├── supabase/             # DB 마이그레이션
└── turbo.json            # Turborepo 설정
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 별도 저장소 | 독립적 배포 | 코드 중복, 타입 불일치 | `LOW_ROI` - 동기화 비용 높음 |
| npm 패키지로 공유 | 버전 관리 | 게시/업데이트 번거로움 | `HIGH_COMPLEXITY` - 개발 속도 저하 |
| Nx 모노레포 | 강력한 기능 | 러닝커브 | `ALT_SUFFICIENT` - Turborepo로 충분 |

## 결과 (Consequences)

### 긍정적 결과

- **타입 안전성**: 웹/모바일이 동일한 타입 공유
- **코드 재사용**: 유틸리티, 상수, 검증 로직 공유
- **빌드 캐싱**: Turborepo가 변경된 부분만 빌드
- **통합 테스트**: 전체 워크스페이스 테스트 가능

### 부정적 결과

- **초기 설정 복잡도**: 모노레포 구성 필요
- **의존성 관리**: 호이스팅 이슈 가능성

### 리스크

- 패키지 버전 충돌 → **동일 버전 강제 (package.json 동기화)**

## 구현 가이드

### packages/shared 구조 (INF-4)

```typescript
// packages/shared/src/types/image-engine.ts
export interface ImageQualityResult {
  isValid: boolean;
  lighting: LightingInfo;
  technical: TechnicalInfo;
  reliability: 'high' | 'medium' | 'low';
}

// 웹/모바일 모두에서 import
import { ImageQualityResult } from '@yiroom/shared/types';
```

### Turborepo 설정

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

### 개발 명령어

```bash
# 전체 워크스페이스
npm run dev          # 모든 앱 개발 서버
npm run build        # 모든 앱 빌드
npm run typecheck    # 타입 체크

# 웹 앱 전용
npm run dev:web      # 웹 개발 서버

# 모바일 앱 전용
cd apps/mobile && npx expo start
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 디자인 시스템](../principles/design-system.md) - 크로스 플랫폼 UI 일관성

### 관련 ADR/스펙
- [ADR-016: Web-Mobile Sync](./ADR-016-web-mobile-sync.md)
- [Mobile Patterns](../../.claude/rules/mobile-patterns.md) - 모바일 개발 규칙

---

**Author**: Claude Code
**Reviewed by**: -
