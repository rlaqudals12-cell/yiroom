# 소셜 피드 원리

> 이 문서는 소셜 피드 모듈의 기반이 되는 기본 원리를 설명한다.

## 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서                                           | 설명                         |
| ---------------------------------------------- | ---------------------------- |
| [SDD-SOCIAL-FEED](../specs/SDD-SOCIAL-FEED.md) | 소셜 피드 스펙, P3 원자 분해 |

### 관련 ADR

| 문서                                       | 설명                    |
| ------------------------------------------ | ----------------------- |
| [ADR-028](../adr/ADR-028-social-feed.md)   | 소셜 피드 아키텍처 결정 |
| [ADR-004](../adr/ADR-004-auth-strategy.md) | 인증 전략 (Clerk + RLS) |

### 관련 원리 문서

| 문서                                           | 설명                       |
| ---------------------------------------------- | -------------------------- |
| [security-patterns.md](./security-patterns.md) | RLS 정책, 데이터 접근 제어 |

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"분석 결과 기반 활발한 웰니스 커뮤니티"

- ML 기반 개인화 피드 (관심사, 분석 유형별 추천)
- 다양한 콘텐츠: 분석 공유, 스타일링 팁, Before/After, Q&A
- 소셜 그래프: 팔로우/팔로워, 관심사 기반 사용자 추천
- 실시간 상호작용: 좋아요, 댓글, 저장, 공유, DM
- 바이럴 기능: 해시태그, 트렌딩, 챌린지
```

### 물리적 한계

| 항목        | 한계                                 |
| ----------- | ------------------------------------ |
| 모더레이션  | 부적절 콘텐츠 필터링 인력/비용 제약  |
| 개인정보    | 분석 결과 공유 시 민감정보 노출 위험 |
| 스팸 방지   | 봇/스팸 계정 탐지 비용               |
| 콜드 스타트 | 초기 사용자 부족으로 콘텐츠 부족     |

### 100점 기준

| 항목          | 100점 기준                        | 측정 방법    |
| ------------- | --------------------------------- | ------------ |
| 피드 알고리즘 | ML 개인화 (관심사/분석 유형 기반) | 추천 클릭률  |
| 콘텐츠 유형   | 10+ 유형 지원                     | 유형별 비율  |
| 소셜 기능     | 팔로우 + DM + 알림                | 기능 완성도  |
| 바이럴 기능   | 해시태그 + 챌린지 + 트렌딩        | DAU/MAU 비율 |
| 모더레이션    | AI + 수동 이중 검토               | 신고 처리율  |

### 현재 목표: 60%

- 시간순 피드 (ML 개인화 미적용)
- 기본 소셜 기능 (좋아요, 댓글, 저장)
- RLS 기반 프라이버시 (공개/비공개)
- 4가지 포스트 타입 (result_share, style_tip, daily_record, question)

### 의도적 제외

| 제외 항목        | 이유                       | 재검토 시점 |
| ---------------- | -------------------------- | ----------- |
| ML 피드 알고리즘 | MAU 부족으로 데이터 불충분 | MAU 10,000+ |
| 팔로우/팔로워    | 소셜 그래프 구축 비용      | Phase 2     |
| DM 기능          | 모더레이션 리소스 부족     | Phase 3     |
| 해시태그/챌린지  | MVP 범위 초과              | Phase 2     |

---

## 1. 핵심 개념

### 1.1 피드 (Feed)

사용자가 작성한 콘텐츠를 시간순 또는 알고리즘 기반으로 정렬하여 보여주는 목록.

**피드 유형**:

- **시간순 (Chronological)**: 최신 콘텐츠 먼저 표시 (현재 적용)
- **개인화 (Personalized)**: 사용자 관심사/상호작용 기반 (향후)
- **트렌딩 (Trending)**: 좋아요/댓글 수 기반 인기 콘텐츠 (향후)

### 1.2 포스트 타입 (Post Types)

```typescript
type PostType =
  | 'result_share' // 분석 결과 공유
  | 'style_tip' // 스타일링 팁
  | 'daily_record' // 일상 기록
  | 'question'; // 질문
```

**타입별 특성**:
| 타입 | 콘텐츠 예시 | 분석 연결 |
|------|----------|---------|
| result_share | "봄 웜 브라이트 진단 받았어요!" | ✅ 필수 |
| style_tip | "봄 웜에게 추천하는 립스틱" | ⚪ 선택 |
| daily_record | "오늘의 운동 완료" | ⚪ 선택 |
| question | "가을 웜인데 어떤 색 옷이 좋을까요?" | ⚪ 선택 |

### 1.3 상호작용 (Interactions)

| 상호작용       | 데이터 모델         | 비정규화      |
| -------------- | ------------------- | ------------- |
| 좋아요 (Like)  | feed_likes (M:N)    | like_count    |
| 댓글 (Comment) | feed_comments (1:N) | comment_count |
| 저장 (Save)    | feed_saves (M:N)    | -             |

**비정규화 이유**: 매 조회마다 COUNT(\*) 쿼리 방지 → 성능 최적화

### 1.4 RLS 기반 프라이버시

```sql
-- 공개/비공개 정책
is_public = true  → 모든 사용자 조회 가능
is_public = false → 본인만 조회 가능
```

---

## 2. 수학적/알고리즘적 기반

### 2.1 피드 랭킹 알고리즘 (향후)

```
Score = α × Recency + β × Engagement + γ × Relevance

Recency = 1 / (1 + decay × hours_since_post)
Engagement = log(1 + likes) + 2 × log(1 + comments)
Relevance = cosine_similarity(user_interests, post_tags)

α = 0.3, β = 0.4, γ = 0.3 (튜닝 파라미터)
```

### 2.2 시간순 정렬 (현재)

```sql
ORDER BY created_at DESC
LIMIT 20
OFFSET (page - 1) * 20
```

### 2.3 비정규화 카운트 업데이트

```sql
-- 좋아요 추가 시
UPDATE feed_posts SET like_count = like_count + 1 WHERE id = $1;

-- 좋아요 취소 시
UPDATE feed_posts SET like_count = like_count - 1 WHERE id = $1;
```

**주의**: 동시성 문제 방지를 위해 트랜잭션 내에서 처리

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

| 원리        | 알고리즘                         |
| ----------- | -------------------------------- |
| 시간순 피드 | created_at DESC + 페이지네이션   |
| 좋아요 토글 | INSERT OR DELETE (복합 PK)       |
| 댓글 목록   | post_id 기준 ORDER BY created_at |
| 저장 토글   | INSERT OR DELETE (복합 PK)       |
| 프라이버시  | RLS USING (is_public OR owner)   |

### 3.2 알고리즘 → 코드

**피드 조회**:

```typescript
// lib/feed/posts.ts
async function getFeedPosts(params: FeedParams) {
  const { data } = await supabase
    .from('feed_posts')
    .select('*, user:users(*)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  return data;
}
```

**좋아요 토글**:

```typescript
// lib/feed/interactions.ts
async function toggleLike(postId: string, userId: string) {
  const existing = await supabase
    .from('feed_likes')
    .select()
    .eq('post_id', postId)
    .eq('clerk_user_id', userId)
    .single();

  if (existing.data) {
    await supabase.from('feed_likes').delete().eq('post_id', postId).eq('clerk_user_id', userId);
    return { liked: false };
  } else {
    await supabase.from('feed_likes').insert({ post_id: postId, clerk_user_id: userId });
    return { liked: true };
  }
}
```

---

## 4. 검증 방법

### 4.1 원리 준수 검증

| 검증 항목     | 방법                              |
| ------------- | --------------------------------- |
| 시간순 정렬   | 연속 포스트의 created_at 비교     |
| 프라이버시    | 비공개 포스트 타인 조회 불가 확인 |
| 좋아요 토글   | 연속 클릭 시 상태 전환 확인       |
| 카운트 일관성 | like_count == COUNT(feed_likes)   |

### 4.2 테스트 케이스

```typescript
describe('Feed Posts', () => {
  it('should return posts in descending order by created_at');
  it('should not return private posts to non-owners');
  it('should include user information');
});

describe('Like Toggle', () => {
  it('should add like on first click');
  it('should remove like on second click');
  it('should update like_count atomically');
});
```

---

## 5. 성능 고려사항

### 5.1 인덱스 전략

```sql
-- 피드 조회 최적화
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_user ON feed_posts(clerk_user_id);
CREATE INDEX idx_feed_posts_type ON feed_posts(post_type);

-- 좋아요/저장 조회 최적화
CREATE INDEX idx_feed_likes_post ON feed_likes(post_id);
CREATE INDEX idx_feed_saves_user ON feed_saves(clerk_user_id);
```

### 5.2 N+1 쿼리 방지

```typescript
// ❌ 나쁜 예: 포스트별 사용자 조회
const posts = await getPosts();
for (const post of posts) {
  post.user = await getUser(post.clerk_user_id); // N번 쿼리
}

// ✅ 좋은 예: JOIN으로 한 번에 조회
const posts = await supabase.from('feed_posts').select('*, user:users(*)'); // 1번 쿼리
```

---

## 6. 참고 자료

- [Twitter Feed Algorithm](https://blog.twitter.com/engineering/en_us/topics/insights/2017/using-deep-learning-at-scale-in-twitters-timelines)
- [Instagram Ranking Factors](https://about.instagram.com/blog/announcements/shedding-more-light-on-how-instagram-works)
- [Facebook News Feed Algorithm](https://engineering.fb.com/2021/01/26/ml-applications/news-feed-ranking/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Version**: 1.0 | **Created**: 2026-02-03 | **Updated**: 2026-02-03
