# SPEC: 커뮤니티/소셜 확장

> 뷰티 후기 SNS 피드, 그룹 챌린지 확장

**Version**: 1.0
**Date**: 2026-01-07
**Status**: Draft
**Author**: Claude Code

---

## 1. 뷰티 후기 SNS 피드

### 목적

사용자들이 제품 리뷰/사용 후기를 SNS 형태로 공유

### 기존 vs 신규

| 항목     | 기존 (리뷰)       | 신규 (피드)              |
| -------- | ----------------- | ------------------------ |
| 형태     | 제품 상세 내 리뷰 | 독립 피드 페이지         |
| 콘텐츠   | 텍스트 + 별점     | 사진/영상 + 텍스트       |
| 상호작용 | 좋아요            | 좋아요, 댓글, 저장, 공유 |
| 발견성   | 제품 검색 후      | 피드 스크롤              |

### 피드 카드 디자인

```
┌─────────────────────────────────────┐
│ 👤 김이룸 · 2시간 전                 │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      [Before/After 사진]        │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 이 세럼 2주 사용 후기! 진짜 피부톤이  │
│ 밝아졌어요 ✨ #피부관리 #세럼추천     │
│                                     │
│ 🏷️ 연관 제품: 비타민C 세럼 (링크)    │
├─────────────────────────────────────┤
│ ❤️ 234  💬 18  🔖 45  📤           │
└─────────────────────────────────────┘
```

### 피드 알고리즘

```yaml
기본 정렬:
  - 팔로잉 우선
  - 시간순 (최신)
  - 인기도 가중치

개인화:
  - 퍼스널 컬러 유사 사용자
  - 피부 타입 유사 사용자
  - 관심 제품 카테고리
```

### DB 스키마

```sql
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[], -- 이미지/영상 URL 배열
  product_ids UUID[], -- 연관 제품
  hashtags TEXT[],
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feed_interactions (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES feed_posts(id),
  clerk_user_id TEXT NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('like', 'save', 'share')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, clerk_user_id, interaction_type)
);

CREATE TABLE feed_comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES feed_posts(id),
  clerk_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES feed_comments(id), -- 대댓글
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 예상 작업량: 24h

---

## 구현 파일

| 파일                                           | 내용               | 상태           |
| ---------------------------------------------- | ------------------ | -------------- |
| `app/(main)/feed/page.tsx`                     | 피드 메인          | ✅ 기존 (Mock) |
| `app/(main)/feed/post/[id]/page.tsx`           | 포스트 상세        | 🔄 구현 필요   |
| `app/(main)/feed/create/page.tsx`              | 포스트 작성        | 🔄 구현 필요   |
| `components/feed/FeedCard.tsx`                 | 피드 카드          | 🔄 구현 필요   |
| `components/feed/CommentSection.tsx`           | 댓글 섹션          | 🔄 구현 필요   |
| `app/api/feed/`                                | 피드 API (CRUD)    | ✅ 완료        |
| `lib/feed/`                                    | Repository + Types | ✅ 완료        |
| `supabase/migrations/20260110_feed_tables.sql` | DB 스키마          | ✅ 완료        |

---

## 시지푸스 판정

| 기능         | 파일 수 | 복잡도 | 판정         |
| ------------ | ------- | ------ | ------------ |
| 뷰티 피드 UI | 5개     | 35점   | ⚠️ 단독 가능 |

---

**Status**: In Progress (API 완료, UI 진행 중)
