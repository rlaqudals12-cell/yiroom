# ADR-028: 소셜 피드 아키텍처

## 상태

`accepted`

## 날짜

2026-01-19

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 사용자의 웰니스 여정이 자연스럽게 공유되고, 서로 영감을 주는 커뮤니티"

- **실시간 피드**: 팔로우한 사용자의 포스트가 즉시 업데이트
- **AI 큐레이션**: 사용자 관심사/분석 결과 기반 개인화 피드
- **풍부한 상호작용**: 댓글, 좋아요, 저장, 공유, 멘션, DM
- **콘텐츠 검색**: 해시태그, 키워드, 분석 타입별 검색

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 실시간 동기화 | WebSocket 연결 유지 비용, 대규모 동시 접속 처리 |
| 콘텐츠 모더레이션 | AI 자동 검토 + 사용자 신고 조합 필요 |
| 스케일링 | 피드 조회 쿼리 복잡도 증가 시 성능 저하 |
| 프라이버시 | 민감한 분석 결과 공유 범위 제어 필요 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 피드 로딩 | < 200ms | 400ms | 캐싱 최적화 필요 |
| 실시간 업데이트 | WebSocket 기반 | 없음 | 폴링 방식 |
| 콘텐츠 모더레이션 | AI + 수동 조합 | 없음 | 신고 기능만 |
| 개인화 추천 | ML 기반 | 없음 | 시간순 정렬만 |

### 현재 목표: 70%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 실시간 WebSocket | 인프라 복잡도 (HIGH_COMPLEXITY) | MAU 5만+ |
| AI 콘텐츠 모더레이션 | 비용 대비 ROI (FINANCIAL_HOLD) | 신고 건수 급증 시 |
| DM (다이렉트 메시지) | 핵심 기능 아님 (NOT_NEEDED) | 사용자 요청 시 |
| 스토리 기능 | 범위 초과 (SCOPE_EXCEED) | Phase 3 |

---

## 맥락 (Context)

이룸은 사용자들이 자신의 분석 결과, 스타일링 팁, 운동/식단 기록을 공유하는 소셜 피드 기능이 필요합니다.

### 요구사항

1. **다양한 포스트 타입**: 결과 공유, 팁, 일상 기록
2. **인터랙션**: 좋아요, 댓글, 저장
3. **필터링**: 타입별, 해시태그별, 사용자별
4. **페이지네이션**: 무한 스크롤 지원

## 결정 (Decision)

**RLS 기반 피드 시스템** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                    소셜 피드 아키텍처                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  포스트 타입                                                  │
│  ├── result_share: 분석 결과 공유                           │
│  ├── style_tip: 스타일링 팁                                 │
│  ├── daily_record: 일상 기록                                │
│  └── question: 질문                                         │
│                                                              │
│  데이터 구조                                                  │
│  ├── feed_posts: 포스트 본문                                │
│  ├── feed_likes: 좋아요 (복합 PK)                           │
│  ├── feed_comments: 댓글                                    │
│  └── feed_saves: 저장 (북마크)                              │
│                                                              │
│  API 엔드포인트                                               │
│  ├── GET /api/feed              # 목록 조회                 │
│  ├── POST /api/feed             # 포스트 생성               │
│  ├── GET /api/feed/[id]         # 상세 조회                 │
│  ├── DELETE /api/feed/[id]      # 삭제                      │
│  ├── POST /api/feed/[id]/like   # 좋아요 토글              │
│  ├── POST /api/feed/[id]/save   # 저장 토글                │
│  └── GET/POST /api/feed/[id]/comments  # 댓글              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 데이터베이스 스키마

```sql
-- 포스트
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('result_share', 'style_tip', 'daily_record', 'question')),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  analysis_id UUID REFERENCES analysis_results(id),
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 좋아요
CREATE TABLE feed_likes (
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, clerk_user_id)
);

-- RLS 정책
CREATE POLICY "public_read" ON feed_posts
  FOR SELECT USING (is_public = true OR clerk_user_id = auth.get_user_id());

CREATE POLICY "owner_write" ON feed_posts
  FOR ALL USING (clerk_user_id = auth.get_user_id());
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| Firebase Firestore | 실시간 동기화 | 벤더 종속, 비용 | `FINANCIAL_HOLD` - 비용 예측 어려움 |
| Redis + PostgreSQL | 고성능 | 복잡도 증가 | `HIGH_COMPLEXITY` - 캐싱 레이어 별도 관리 |
| MongoDB | 유연한 스키마 | 기존 스택 불일치 | `ALT_SUFFICIENT` - Supabase JSONB 충분 |

## 결과 (Consequences)

### 긍정적 결과

- **일관된 스택**: Supabase + RLS 기존 패턴 활용
- **자동 보안**: RLS로 데이터 접근 제어
- **간단한 쿼리**: 관계형 조인으로 복잡한 조회

### 부정적 결과

- **스케일 제한**: 대규모 피드 시 성능 저하 가능
- **실시간 미지원**: 실시간 업데이트는 별도 구현 필요

### 리스크

- 인기 포스트 조회 병목 → **like_count 비정규화 + 인덱스**

## 구현 가이드

### 파일 구조

```
app/api/feed/
├── route.ts              # 목록/생성
└── [id]/
    ├── route.ts          # 상세/삭제
    ├── like/route.ts     # 좋아요
    ├── save/route.ts     # 저장
    └── comments/route.ts # 댓글

lib/feed/
├── index.ts              # 통합 export
├── posts.ts              # 포스트 CRUD
├── interactions.ts       # 좋아요/저장
└── comments.ts           # 댓글
```

### 쿼리 최적화

```typescript
// 피드 조회 - 필요한 필드만 선택
const { data } = await supabase
  .from('feed_posts')
  .select(`
    id, content, media_urls, post_type, hashtags,
    like_count, comment_count, created_at,
    user:clerk_user_id (nickname, avatar_url),
    is_liked:feed_likes!inner(clerk_user_id)
  `)
  .eq('is_public', true)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 보안 패턴](../principles/security-patterns.md) - RLS 정책, 데이터 접근 제어

### 관련 ADR
- [ADR-004: 인증 전략](./ADR-004-auth-strategy.md) - Clerk + RLS
- [ADR-008: Repository-Service 계층](./ADR-008-repository-service-layer.md) - 데이터 접근 패턴

### 구현 스펙
- [SDD-SOCIAL-FEED](../specs/SDD-SOCIAL-FEED.md) - 소셜 피드 기능

---

**Author**: Claude Code
**Reviewed by**: -
