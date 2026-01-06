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

| 항목 | 기존 (리뷰) | 신규 (피드) |
|------|-------------|-------------|
| 형태 | 제품 상세 내 리뷰 | 독립 피드 페이지 |
| 콘텐츠 | 텍스트 + 별점 | 사진/영상 + 텍스트 |
| 상호작용 | 좋아요 | 좋아요, 댓글, 저장, 공유 |
| 발견성 | 제품 검색 후 | 피드 스크롤 |

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

## 2. 그룹 챌린지 확장

### 현재 상태

기존 `challenges` 테이블 존재 (Phase H)

### 확장 기능

```yaml
팀 배틀:
  - 2개 팀 대결 형식
  - 팀 총 점수/평균 점수 경쟁
  - 실시간 리더보드

기업 웰니스:
  - 회사/부서 단위 챌린지
  - 관리자 대시보드
  - 참여율/성과 리포트

시즌제:
  - 월간/분기별 시즌
  - 시즌 보상
  - 명예의 전당
```

### 팀 배틀 플로우

```
[챌린지 생성]
    ↓
[팀 A vs 팀 B 구성]
    ↓
[참가자 모집 (각 팀 최대 10명)]
    ↓
[기간 중 활동 기록]
    ↓
[실시간 점수 집계]
    ↓
[종료 시 승리 팀 발표 + 보상]
```

### DB 스키마 확장

```sql
-- 기존 challenge_teams 확장
ALTER TABLE challenge_teams ADD COLUMN opponent_team_id UUID;

-- 팀 배틀 매치
CREATE TABLE team_battles (
  id UUID PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id),
  team_a_id UUID REFERENCES challenge_teams(id),
  team_b_id UUID REFERENCES challenge_teams(id),
  winner_team_id UUID,
  status TEXT DEFAULT 'ongoing', -- ongoing | completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기업 챌린지
CREATE TABLE corporate_challenges (
  id UUID PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id),
  company_name TEXT NOT NULL,
  department TEXT,
  admin_user_id TEXT NOT NULL,
  participant_limit INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 예상 작업량: 20h

---

## 구현 파일

### 뷰티 피드

| 파일 | 내용 |
|------|------|
| `app/(main)/feed/page.tsx` | 피드 메인 |
| `app/(main)/feed/post/[id]/page.tsx` | 포스트 상세 |
| `app/(main)/feed/create/page.tsx` | 포스트 작성 |
| `components/feed/FeedCard.tsx` | 피드 카드 |
| `components/feed/CommentSection.tsx` | 댓글 섹션 |
| `app/api/feed/` | 피드 API (CRUD) |

### 그룹 챌린지

| 파일 | 내용 |
|------|------|
| `app/(main)/challenges/battle/page.tsx` | 팀 배틀 목록 |
| `app/(main)/challenges/battle/[id]/page.tsx` | 배틀 상세 |
| `components/challenges/TeamBattleCard.tsx` | 배틀 카드 |
| `components/challenges/LiveScoreboard.tsx` | 실시간 점수판 |
| `app/api/challenges/battle/` | 배틀 API |

---

## 시지푸스 판정

| 기능 | 파일 수 | 복잡도 | 판정 |
|------|---------|--------|------|
| 뷰티 피드 | 10개+ | 55점 | ✅ 시지푸스 필요 |
| 그룹 챌린지 | 8개 | 45점 | ✅ 시지푸스 필요 |

---

**Status**: Draft (승인 대기)
