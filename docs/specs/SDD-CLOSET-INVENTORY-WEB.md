# SDD: 웹 옷장 등록 UI — Phase 1.5

> **상태**: 초안 (Phase 1.5 — 출시 후 4~8주 착수 예정)
> **작성일**: 2026-04-26
> **연관 ADR**: [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md) §0 의도적 제외 #2 ("웹 인벤토리 등록 UI"), [ADR-099~104](../adr/ADR-099-integrated-analysis-flow.md)
> **선행 의존**: 모바일 옷장 인벤토리 UI `implemented` (ADR-098 시점 이미 존재)
> **트리거 플래그**: `FEATURE_FLAGS.CLOSET_INTEGRATION`

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
웹 사용자도 모바일과 동일하게 옷장 아이템을 등록·관리하고, C-1 결과 페이지의
"내 옷장과 연결" 섹션 ③에서 실제 옷장 조합을 받는다.

현재(2026-04-26): 모바일은 옷장 등록 가능, 웹은 "준비 중" 안내만.
사용자가 데스크톱에서 진단 후 옷장 매칭을 시도하면 막다른 길.

Phase 1.5 도입 시: ClosetPromptCard.tsx의 CLOSET_INTEGRATION=true 분기가
자연스럽게 활성화되어 /closet 라우트로 진입 → 등록·매칭·관리 모두 가능.
```

### 100점 기준

- 웹에서 옷장 아이템 등록 (사진 업로드, 메타데이터 입력)
- 모바일과 동일한 데이터 모델 — 양방향 동기화 (이미 모바일이 쓰는 DB 사용)
- 체형(C-1) + 퍼스널컬러(PC-1) 기반 옷장 매칭 결과 표시
- 통합 분석 큐레이션(`/closet/recommend?source=integrated&...`)에서 진입 시
  맥락 유지 (이미 Phase G에서 useSearchParams 보강 완료)
- 모바일 미설치 사용자도 데스크톱에서 단일 디바이스로 완결

### 현재 목표 (Phase 1.5 첫 출시)

70% — 등록·삭제·매칭은 우선, 자동 카테고리 분류와 AI 추천 정렬은 1.6.

---

## 1. 맥락 (Context)

### 1.1 기존 자산 (재활용 가능)

| 자산                                     | 위치                                      | 비고                               |
| ---------------------------------------- | ----------------------------------------- | ---------------------------------- |
| 옷장 데이터 모델                         | DB `closet_items` 테이블                  | 모바일이 이미 사용 중              |
| 모바일 옷장 UI                           | `apps/mobile/app/(closet)/`               | 등록/조회/매칭 전부 구현           |
| 매칭 알고리즘                            | `apps/mobile/lib/closet/closetMatcher.ts` | 체형/PC 기반 점수 — shared로 이관  |
| 옷장 매칭 결과 페이지                    | `apps/web/app/(main)/closet/recommend/`   | 이미 존재 (조회만, 등록 UI는 부재) |
| Phase G 큐레이션 진입 파라미터           | useSearchParams 핸들링                    | 이미 처리 완료                     |
| ClosetPromptCard CLOSET_INTEGRATION 분기 | C-1 결과 페이지 섹션 ③                    | 이미 존재 (true 전환만 남음)       |

### 1.2 신규 필요한 것

- 웹 옷장 **등록/편집/삭제** UI (모바일 1:1 포팅)
- 사진 업로드 (Supabase Storage 통합 — 이미 통합 분석에서 사용)
- 카테고리/색상/시즌 메타 입력 폼

---

## 2. 결정 (Decision)

### 2.1 모바일 1:1 포팅 + 웹 UX 최적화

모바일 패턴(ADR-102 모바일 통합 분석 포팅과 동일 구조)을 웹에 거울 포팅하되,
데스크톱에 맞게 그리드 레이아웃과 키보드 단축키 보강.

### 2.2 데이터 모델은 모바일과 동일

기존 `closet_items` 테이블 그대로. 신규 마이그레이션 없음.

### 2.3 매칭 로직은 `@yiroom/shared`로 이관

모바일 `closetMatcher.ts`를 `packages/shared/src/closet/`로 이동 → 웹/모바일
공통. 이미 STYLING_PRINCIPLES가 shared로 이동한 패턴 재활용.

### 2.4 라우트 구조

```
apps/web/app/(main)/closet/
├── page.tsx              # 옷장 그리드 (조회) — 신규
├── add/
│   └── page.tsx          # 등록 페이지 — 신규
├── [itemId]/
│   ├── page.tsx          # 아이템 상세 — 신규
│   └── edit/page.tsx     # 편집 — 신규
└── recommend/page.tsx    # 매칭 결과 (이미 존재)
```

### 2.5 FEATURE_FLAGS 단계적 활성화

```typescript
// 1단계 (Phase 1.5 a): 등록 UI 출시
CLOSET_INTEGRATION: 'register-only',

// 2단계 (Phase 1.5 b): 매칭 + ClosetPromptCard 활성화
CLOSET_INTEGRATION: true,
```

→ 등록 UI 안정화 후 매칭/CTA 전환. 단순 boolean 그대로 유지하려면 한
릴리즈에서 묶어서 활성화.

---

## 3. 컴포넌트 인터페이스

### 3.1 신규 파일

```
apps/web/
├── app/(main)/closet/
│   ├── page.tsx                       # 옷장 그리드 (조회/검색/필터)
│   ├── _components/
│   │   ├── ClosetGrid.tsx             # 그리드 뷰
│   │   ├── ClosetItemCard.tsx         # 개별 아이템 카드
│   │   ├── ClosetFilterBar.tsx        # 카테고리/색상/시즌 필터
│   │   └── ClosetEmptyState.tsx       # 비어있을 때 등록 CTA
│   ├── add/page.tsx                   # 등록 페이지
│   ├── [itemId]/page.tsx              # 상세 (편집/삭제 진입)
│   └── [itemId]/edit/page.tsx         # 편집
├── components/closet/
│   ├── ClosetItemForm.tsx             # 공통 등록/편집 폼
│   ├── ClosetItemImageUpload.tsx      # Supabase Storage 업로드
│   └── index.ts
├── hooks/
│   ├── useClosetItems.ts              # 옷장 목록 + 필터
│   └── useClosetItemMutation.ts       # 등록/편집/삭제
└── lib/closet/
    ├── api.ts                         # Repository 패턴 DB 접근
    └── index.ts

packages/shared/src/closet/
├── types.ts                           # ClosetItem, ClosetCategory 등
├── matcher.ts                         # 모바일에서 이관
└── index.ts
```

### 3.2 ClosetItemForm 인터페이스

```typescript
import type { ClosetItem, ClosetCategory, ClosetSeason } from '@yiroom/shared';

export interface ClosetItemFormProps {
  mode: 'create' | 'edit';
  initial?: Partial<ClosetItem>;
  onSubmit: (data: ClosetItemInput) => Promise<void>;
  onCancel?: () => void;
}

export interface ClosetItemInput {
  imageUrl: string; // Supabase Storage 업로드 후 URL
  category: ClosetCategory; // top/bottom/dress/outerwear/accessory/shoes
  colorHex: string; // ColorPicker로 추출
  pcSeason?: ClosetSeason; // 사용자가 자기 PC 시즌 매칭 직접 입력
  fit?: 'tight' | 'regular' | 'loose';
  occasion?: string[]; // ['daily', 'work', 'date'] 등
  notes?: string;
}
```

### 3.3 ClosetItemImageUpload — Supabase Storage 패턴

```typescript
// lib/closet/api.ts
export async function uploadClosetImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from('closet-items').upload(path, file);
  if (error) throw error;
  // private 버킷이라 signed URL 발급
  const { data } = await supabase.storage
    .from('closet-items')
    .createSignedUrl(path, 365 * 24 * 60 * 60); // 1년
  return data?.signedUrl ?? '';
}
```

→ Supabase Storage 버킷 `closet-items` 신규 생성 필요 (출시 직전 26항목
체크리스트에 추가).

---

## 4. 데이터 모델

### 4.1 기존 테이블 (이미 모바일이 사용 중)

```sql
-- 모바일 출시 시 이미 존재. 신규 마이그레이션 없음.
CREATE TABLE closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  color_hex TEXT,
  pc_season TEXT,
  fit TEXT,
  occasion TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_items" ON closet_items
  FOR ALL USING (clerk_user_id = auth.get_user_id());
```

### 4.2 Storage 버킷 (Phase 1.5 a 출시 직전 추가)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('closet-items', 'closet-items', false);

CREATE POLICY "user_own_closet_files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'closet-items'
    AND (storage.foldername(name))[1] = auth.get_user_id()
  );
```

---

## 5. 매칭 로직 — `packages/shared`로 이관

### 5.1 이관 대상

```
apps/mobile/lib/closet/closetMatcher.ts
  → packages/shared/src/closet/matcher.ts
```

### 5.2 인터페이스 (모바일 기존 시그니처 보존)

```typescript
// packages/shared/src/closet/matcher.ts
import type { BodyType3, SeasonType } from '../types';

export interface ClosetMatchInput {
  bodyType: BodyType3;
  pcSeason: SeasonType;
  items: ClosetItem[];
}

export interface ClosetMatchResult {
  topMatches: ClosetItem[]; // 상의
  bottomMatches: ClosetItem[]; // 하의
  fullSets: { top: ClosetItem; bottom: ClosetItem; score: number }[];
}

export function matchCloset(input: ClosetMatchInput): ClosetMatchResult { ... }
```

### 5.3 마이그레이션 영향

- 모바일: import 경로만 변경 (`'../../lib/closet/closetMatcher'` → `'@yiroom/shared'`)
- 웹: 신규 import (`/closet/recommend` 페이지에 통합)

---

## 6. CTA / 진입 경로

### 6.1 ClosetPromptCard 활성화 (이미 구현됨)

`components/analysis/body/ClosetPromptCard.tsx`는 CLOSET_INTEGRATION 플래그
분기를 이미 가지고 있음:

```tsx
{
  isClosetActive ? (
    <Link href="/closet">내 옷장으로 이동해서 조합 보기</Link>
  ) : (
    <ComingSoonNotice />
  );
}
```

→ Phase 1.5에서 플래그 true 전환만 하면 자동 활성화.

### 6.2 통합 분석 큐레이션 진입 (이미 Phase G에서 처리)

`/closet/recommend?source=integrated&color=...&item=...`로 진입 시
useSearchParams로 컨텍스트 수신 → 빈 옷장이면 `/closet/add`로 우회 안내.
이미 구현됨.

### 6.3 홈 진입 경로

홈 `IntegratedSessionPromptCard` 또는 Phase 1.5의 ProfileCard에서 옷장
미등록 사용자에게 "옷장에 옷 사진 추가하고 코디 받기" CTA 노출.

---

## 7. 테스트 계획

| 테스트                               | 케이스 수 |
| ------------------------------------ | --------- |
| ClosetItemForm (create/edit/검증)    | ~10       |
| ClosetItemImageUpload (Storage 모킹) | ~6        |
| useClosetItems (필터/페이지네이션)   | ~8        |
| useClosetItemMutation (등록/삭제)    | ~6        |
| matcher.test (shared로 이관)         | 기존 유지 |
| ClosetGrid 렌더링 + 빈 상태          | ~5        |
| /closet/add 페이지 통합 (form 제출)  | ~4        |

총 ~39 신규 테스트 + matcher 기존 유지.

---

## 8. 출시 영향

### 8.1 Phase 1.5 a 단계 (등록 UI만)

- 신규 라우트 `/closet`, `/closet/add`, `/closet/[id]` 노출 (Navbar 진입은 X)
- DB 변경 없음 (기존 테이블)
- Supabase Storage `closet-items` 버킷 생성 필요 ⚠️

### 8.2 Phase 1.5 b 단계 (매칭 + CTA 활성화)

- `FEATURE_FLAGS.CLOSET_INTEGRATION = true`
- ClosetPromptCard "준비 중" → 실제 링크
- C-1 결과 페이지 섹션 ③ 자동 활성화

### 8.3 출시 직전 영향 (지금)

**0** — Phase 1.5는 아직 코드 작성 전. 본 SDD는 설계 초안.

---

## 9. 미해결 항목

| 항목                           | 결정 시점 | 비고                                               |
| ------------------------------ | --------- | -------------------------------------------------- |
| AI 자동 카테고리 분류          | Phase 1.6 | 사진만으로 카테고리/색상 추론 (현재는 사용자 입력) |
| 가상 시착 (VTO) 옷장 통합      | Phase 2   | ADR-072 VTO와 옷장 매칭 연결                       |
| 모바일 ↔ 웹 실시간 동기화      | Phase 1.5 | DB 단일 소스라 자동, 캐시 무효화 정책만 결정       |
| 옷장 공유 (친구에게 코디 추천) | Phase 2   | 소셜 피드 연계 — 별도 ADR 필요                     |
| 일괄 등록 (다중 사진)          | Phase 1.6 | 첫 출시는 1장씩 등록                               |

---

## 10. 관련 문서

- [ADR-098](../adr/ADR-098-identity-redefinition-5axis-model.md) §0 의도적 제외 #2
- [ADR-099](../adr/ADR-099-integrated-analysis-flow.md) — Phase G 큐레이션 진입
- [SDD-INTEGRATED-RESULT-UI](SDD-INTEGRATED-RESULT-UI.md) — 큐레이션 → 옷장 흐름
- [SDD-PROFILE-CARD-PHASE-1.5](SDD-PROFILE-CARD-PHASE-1.5.md) — 동일 Phase, 옷장 등록 CTA 출처
- 모바일 옷장 코드 (참조용): `apps/mobile/app/(closet)/`, `apps/mobile/lib/closet/`

---

**Version**: 0.1 (초안) | **다음 단계**: Phase 1.5 a 착수 시 v1.0으로 격상 + 와이어프레임 + Storage 버킷 생성 가이드 추가
