# 피처 플래그 규칙

> 기능 ON/OFF 토글 시스템

## 현재 구현

> **위치**: `lib/admin/feature-flags.ts`
> **저장소**: Supabase `feature_flags` 테이블 (DB 기반)
> **캐싱**: 1분 TTL 메모리 캐시

### 구조

```typescript
// lib/admin/feature-flags.ts
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 12개 Feature Flag 키 (타입 안전성)
export type FeatureFlagKey =
  | 'analysis_personal_color'
  | 'analysis_skin'
  | 'analysis_body'
  | 'workout_module'
  | 'nutrition_module'
  | 'reports_module'
  | 'product_recommendations'
  | 'product_wishlist'
  | 'ai_qa'
  | 'ingredient_warning'
  | 'price_crawler'
  | 'share_results';
```

### API

| 함수                              | 용도             | 클라이언트      |
| --------------------------------- | ---------------- | --------------- |
| `isFeatureEnabled(key)`           | 단일 플래그 확인 | 공개 (supabase) |
| `getAllFeatureFlags()`            | 전체 조회        | Service Role    |
| `toggleFeatureFlag(key, enabled)` | ON/OFF 토글      | Service Role    |
| `createFeatureFlag(flag)`         | 생성             | Service Role    |
| `deleteFeatureFlag(key)`          | 삭제             | Service Role    |
| `getEnabledFeatures(keys)`        | 일괄 확인        | Service Role    |
| `getCachedFeatureFlags()`         | 캐시된 전체 조회 | 공개            |

### 사용 패턴

```typescript
// 서버/API에서 확인
import { isFeatureEnabled } from '@/lib/admin/feature-flags';

const enabled = await isFeatureEnabled('product_recommendations');
if (!enabled) {
  return NextResponse.json({ error: '비활성화된 기능' }, { status: 503 });
}

// 관리자 페이지에서 토글
import { toggleFeatureFlag } from '@/lib/admin/feature-flags';
await toggleFeatureFlag('ai_qa', false); // 킬스위치
```

### 기본 동작

- 플래그가 DB에 없으면 **활성화** (`?? true`) — 안전한 기본값
- Service Role: 관리자 CRUD (RLS 우회)
- 공개 클라이언트: 읽기 전용

## 네이밍 규칙

```
snake_case 사용 (DB 컬럼 호환)

[모듈]_[기능]
analysis_personal_color   # 분석 모듈
product_recommendations   # 제품 추천
ai_qa                     # AI Q&A
```

## 플래그 추가 시 체크리스트

```markdown
1. [ ] FeatureFlagKey 타입에 키 추가
2. [ ] Supabase feature_flags 테이블에 INSERT
3. [ ] 관련 코드에서 isFeatureEnabled() 호출 추가
4. [ ] 관리자 페이지에서 토글 가능 확인
```

## 향후 확장 (미구현)

MAU 증가 시 다음 기능 도입 검토:

- **롤아웃 퍼센티지**: 사용자 ID 해싱 기반 점진적 출시
- **사용자별 활성화**: 특정 사용자 그룹 타겟팅
- **플래그 만료일**: 자동 정리 스크립트
- **A/B 테스트**: 실험 플래그 + 결과 측정

---

**Version**: 2.0 | **Updated**: 2026-02-11 | 실제 DB 기반 구현과 동기화
