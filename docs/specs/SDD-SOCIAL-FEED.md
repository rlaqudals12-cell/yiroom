# SDD: 소셜 피드

> **Status**: ✅ Implemented
> **Version**: 1.0
> **Created**: 2026-01-19
> **Updated**: 2026-01-19
> **Phase**: K (소셜)

> 사용자 분석 결과 공유 및 커뮤니티 피드 시스템

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 보안 패턴](../principles/security-patterns.md) - RLS 정책, 데이터 접근 제어

### ADR
- [ADR-028: 소셜 피드 아키텍처](../adr/ADR-028-social-feed.md) - 피드 시스템 설계
- [ADR-004: 인증 전략](../adr/ADR-004-auth-strategy.md) - Clerk + RLS

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"분석 결과 기반 활발한 웰니스 커뮤니티"

- **피드 알고리즘**: ML 기반 개인화 피드 (관심사, 분석 유형별)
- **콘텐츠 다양성**: 분석 공유, 스타일링 팁, Before/After, 질문/답변
- **소셜 그래프**: 팔로우/팔로워, 관심사 기반 사용자 추천
- **실시간 상호작용**: 좋아요, 댓글, 저장, 공유, DM
- **바이럴 기능**: 해시태그, 트렌딩, 챌린지

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 모더레이션 | 부적절 콘텐츠 필터링 인력/비용 |
| 개인정보 | 분석 결과 공유 시 민감정보 노출 위험 |
| 스팸 방지 | 봇/스팸 계정 탐지 비용 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| 피드 알고리즘 | ML 개인화 | 시간순 | 30% |
| 콘텐츠 유형 | 10+ 유형 | 분석 공유 | 20% |
| 소셜 기능 | 팔로우+DM | 좋아요+댓글 | 60% |
| 바이럴 기능 | 해시태그+챌린지 | 없음 | 0% |
| 모더레이션 | AI+수동 | 기본 필터 | 30% |

### 현재 목표

**종합 달성률**: **60%** (MVP 소셜 피드)

### 의도적 제외 (이번 버전)

- ML 기반 피드 알고리즘 (시간순 우선)
- 팔로우/팔로워 시스템 (Phase 2)
- DM 기능 (Phase 3)
- 해시태그/챌린지 (Phase 2)

---

## 1. 비즈니스 목표

### 핵심 가치
- 사용자 간 분석 결과/팁 공유
- 커뮤니티 형성 및 참여 유도
- 바이럴 성장 (공유 기반)

### 사용자 스토리

```
AS A 사용자
I WANT TO 내 분석 결과와 스타일링 팁을 공유
SO THAT 다른 사용자들과 정보를 교환할 수 있다
```

---

## 2. 기능 스펙

### 2.1 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| 포스트 CRUD | ✅ 완료 | `/api/feed/` |
| 좋아요 | ✅ 완료 | `/api/feed/[id]/like/` |
| 댓글 | ✅ 완료 | `/api/feed/[id]/comments/` |
| 저장 | ✅ 완료 | `/api/feed/[id]/save/` |

### 2.2 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/feed` | GET | 피드 목록 조회 |
| `/api/feed` | POST | 포스트 생성 |
| `/api/feed/[id]` | GET | 포스트 상세 |
| `/api/feed/[id]` | DELETE | 포스트 삭제 |
| `/api/feed/[id]/like` | POST | 좋아요 토글 |
| `/api/feed/[id]/save` | POST | 저장 토글 |
| `/api/feed/[id]/comments` | GET | 댓글 목록 |
| `/api/feed/[id]/comments` | POST | 댓글 작성 |

### 2.3 포스트 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `result_share` | 분석 결과 공유 | "봄 웜 브라이트 진단 받았어요!" |
| `style_tip` | 스타일링 팁 | "봄 웜에게 추천하는 립스틱" |
| `daily_record` | 일상 기록 | "오늘의 운동 완료" |
| `question` | 질문 | "가을 웜인데 어떤 색 옷이 좋을까요?" |

---

## 3. 데이터 모델

### 3.1 스키마

```sql
-- 포스트
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  post_type TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  analysis_id UUID,           -- 분석 결과 연결 (선택)
  like_count INT DEFAULT 0,   -- 비정규화 (성능)
  comment_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 좋아요 (복합 PK)
CREATE TABLE feed_likes (
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, clerk_user_id)
);

-- 댓글
CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 저장
CREATE TABLE feed_saves (
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, clerk_user_id)
);
```

### 3.2 RLS 정책

```sql
-- 공개 포스트 읽기 또는 본인 포스트
CREATE POLICY "public_or_owner_read" ON feed_posts
  FOR SELECT USING (is_public = true OR clerk_user_id = auth.get_user_id());

-- 본인만 쓰기
CREATE POLICY "owner_write" ON feed_posts
  FOR INSERT WITH CHECK (clerk_user_id = auth.get_user_id());

CREATE POLICY "owner_delete" ON feed_posts
  FOR DELETE USING (clerk_user_id = auth.get_user_id());
```

---

## 4. API 스펙

### 4.1 피드 목록 조회

```typescript
// GET /api/feed?page=1&limit=20&post_type=result_share&hashtag=봄웜
interface FeedListParams {
  page?: number;           // 기본 1
  limit?: number;          // 기본 20, 최대 50
  post_type?: PostType;    // 필터
  hashtag?: string;        // 해시태그 필터
  user_id?: string;        // 사용자 필터
}

interface FeedListResponse {
  success: boolean;
  posts: FeedPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 4.2 포스트 생성

```typescript
// POST /api/feed
interface CreatePostInput {
  post_type: PostType;
  content: string;
  media_urls?: string[];
  hashtags?: string[];
  analysis_id?: string;    // 분석 결과 연결
  is_public?: boolean;     // 기본 true
}
```

---

## 5. 구현 상세

### 5.1 파일 구조

```
apps/web/
├── app/api/feed/
│   ├── route.ts              # 목록/생성
│   └── [id]/
│       ├── route.ts          # 상세/삭제
│       ├── like/route.ts     # 좋아요
│       ├── save/route.ts     # 저장
│       └── comments/route.ts # 댓글
├── lib/feed/
│   ├── index.ts              # export
│   ├── posts.ts              # 포스트 CRUD
│   ├── interactions.ts       # 좋아요/저장
│   └── comments.ts           # 댓글
└── components/feed/
    ├── FeedList.tsx          # 피드 리스트
    ├── FeedPost.tsx          # 포스트 카드
    ├── CreatePost.tsx        # 포스트 작성
    └── CommentSection.tsx    # 댓글 영역
```

---

## 6. 원자 분해 (P3)

### 6.1 ATOM 테이블

| ID | 원자 | 입력 | 출력 | 시간 | 의존성 |
|----|------|------|------|------|--------|
| SF-A1 | 피드 목록 API | 페이지/필터 파라미터 | `FeedListResponse` | 1.5h | - |
| SF-A2 | 포스트 생성 API | `CreatePostInput` | `FeedPost` | 1.5h | - |
| SF-A3 | 포스트 상세/삭제 API | `postId` | `FeedPost` / void | 1h | SF-A2 |
| SF-A4 | 좋아요 토글 API | `postId`, `userId` | `{ liked: boolean, count: number }` | 1h | SF-A2 |
| SF-A5 | 저장 토글 API | `postId`, `userId` | `{ saved: boolean }` | 1h | SF-A2 |
| SF-A6 | 댓글 목록/작성 API | `postId`, `content?` | `Comment[]` / `Comment` | 1.5h | SF-A2 |
| SF-B1 | FeedList 컴포넌트 | `posts[]` | React 컴포넌트 | 1.5h | SF-A1 |
| SF-B2 | FeedPost 카드 | `post` | React 컴포넌트 | 1.5h | - |
| SF-B3 | CreatePost 폼 | `onSubmit` | React 컴포넌트 | 1.5h | SF-A2 |
| SF-B4 | CommentSection | `postId` | React 컴포넌트 | 1.5h | SF-A6 |
| SF-C1 | lib/feed/posts.ts | CRUD 함수 | Supabase 연동 | 1.5h | - |
| SF-C2 | lib/feed/interactions.ts | 좋아요/저장 함수 | Supabase 연동 | 1h | SF-C1 |
| SF-C3 | lib/feed/comments.ts | 댓글 함수 | Supabase 연동 | 1h | SF-C1 |
| SF-T1 | 단위 테스트 | 코드 | 테스트 파일 | 2h | SF-A*, SF-C* |
| SF-T2 | 통합 테스트 | API + DB | E2E 검증 | 1.5h | SF-T1 |

**총 예상 시간**: 19.5시간

### 6.2 의존성 그래프

```
┌─────────────────────────────────────────────────────────────────┐
│                       의존성 그래프                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────┐     ┌───────┐     ┌───────┐                        │
│  │SF-C1  │◀────│SF-C2  │     │SF-C3  │                        │
│  │posts  │     │inter  │     │comments│                       │
│  └───┬───┘     └───────┘     └───┬───┘                        │
│      │                           │                             │
│      ▼                           ▼                             │
│  ┌───────┐     ┌───────┐     ┌───────┐     ┌───────┐         │
│  │SF-A1  │     │SF-A2  │────▶│SF-A3  │     │SF-A6  │         │
│  │목록   │     │생성   │     │상세   │     │댓글   │          │
│  └───┬───┘     └───┬───┘     └───────┘     └───┬───┘         │
│      │             │                           │               │
│      │             ├─────────┬─────────┐      │               │
│      │             ▼         ▼         ▼      │               │
│      │         ┌───────┐ ┌───────┐           │               │
│      │         │SF-A4  │ │SF-A5  │           │               │
│      │         │좋아요 │ │저장   │            │               │
│      │         └───────┘ └───────┘           │               │
│      │                                        │               │
│      ▼                                        ▼               │
│  ┌───────┐     ┌───────┐     ┌───────┐     ┌───────┐         │
│  │SF-B1  │     │SF-B2  │     │SF-B3  │     │SF-B4  │         │
│  │List   │────▶│Card   │     │Create │     │Comment│         │
│  └───────┘     └───────┘     └───────┘     └───────┘         │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 병렬 실행 그룹

| 그룹 | ATOM IDs | 순서 |
|------|----------|------|
| **Group 1** (병렬) | SF-C1, SF-C2, SF-C3 | 먼저 |
| **Group 2** (병렬) | SF-A1, SF-A2, SF-B2 | Group 1 후 |
| **Group 3** (병렬) | SF-A3, SF-A4, SF-A5, SF-A6 | Group 2 후 |
| **Group 4** (병렬) | SF-B1, SF-B3, SF-B4 | Group 3 후 |
| **Group 5** (순차) | SF-T1 → SF-T2 | 마지막 |

---

## 7. 테스트

### 7.1 테스트 위치

```
tests/api/feed/
├── posts.test.ts          # 포스트 CRUD
├── like.test.ts           # 좋아요
├── comments.test.ts       # 댓글
└── save.test.ts           # 저장
```

### 7.2 테스트 케이스

```typescript
// tests/api/feed/posts.test.ts
describe('POST /api/feed', () => {
  it('should create post with valid input', async () => {
    const input = {
      post_type: 'result_share',
      content: '봄 웜 브라이트 진단 받았어요!',
      hashtags: ['봄웜', '퍼스널컬러'],
    };
    const response = await POST(createMockRequest({ body: input }));
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.post_type).toBe('result_share');
  });

  it('should reject unauthenticated request', async () => {
    const response = await POST(createMockRequest({ body: {}, auth: null }));
    expect(response.status).toBe(401);
  });
});

describe('GET /api/feed', () => {
  it('should return paginated feed list', async () => {
    const response = await GET(createMockRequest({ query: { page: 1, limit: 20 } }));
    const data = await response.json();

    expect(data.posts).toBeInstanceOf(Array);
    expect(data.pagination.page).toBe(1);
  });

  it('should filter by post_type', async () => {
    const response = await GET(createMockRequest({ query: { post_type: 'question' } }));
    const data = await response.json();

    expect(data.posts.every(p => p.post_type === 'question')).toBe(true);
  });
});
```

```typescript
// tests/api/feed/like.test.ts
describe('POST /api/feed/[id]/like', () => {
  it('should toggle like on first call', async () => {
    const response = await POST(createMockRequest({ params: { id: 'post_123' } }));
    const data = await response.json();

    expect(data.liked).toBe(true);
    expect(data.count).toBeGreaterThanOrEqual(1);
  });

  it('should unlike on second call', async () => {
    // 첫 번째 호출 (좋아요)
    await POST(createMockRequest({ params: { id: 'post_123' } }));
    // 두 번째 호출 (좋아요 취소)
    const response = await POST(createMockRequest({ params: { id: 'post_123' } }));
    const data = await response.json();

    expect(data.liked).toBe(false);
  });
});
```

### 7.3 성공 기준 체크리스트

- [ ] 인증된 사용자 포스트 생성
- [ ] 공개 피드 조회 (미인증 가능)
- [ ] 좋아요 토글 동작
- [ ] 댓글 작성 및 삭제
- [ ] 해시태그 필터링
- [ ] 페이지네이션 동작 확인
- [ ] RLS 정책 검증 (본인 포스트만 삭제 가능)

---

## 8. 성공 기준

| 지표 | 목표 |
|------|------|
| 피드 로딩 | < 500ms |
| 좋아요 응답 | < 200ms |
| 페이지네이션 | 무한 스크롤 지원 |
| RLS 적용 | 100% |

---

**Version**: 1.0 | **Updated**: 2026-01-19
