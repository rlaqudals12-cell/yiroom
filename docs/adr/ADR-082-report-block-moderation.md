# ADR-082: 신고/차단 모더레이션 아키텍처

## 상태

`accepted`

## 날짜

2026-03-09

## 맥락 (Context)

이룸 소셜 피드(ADR-028)가 CRUD + 좋아요 + 댓글 + 저장 기능으로 완전 구현되어 있으나,
사용자 간 불쾌한 콘텐츠 대응 수단이 전혀 없음.

출시 전 최소 요건:

1. 사용자가 부적절한 게시물을 신고할 수 있어야 함
2. 불쾌한 사용자를 차단하여 피드에서 제외할 수 있어야 함
3. 관리자가 신고를 검토하고 조치할 수 있어야 함

## 결정 (Decision)

### 신고 시스템

- **5가지 신고 카테고리**: spam, harassment, inappropriate_content, misinformation, other
- **상태 흐름**: `pending` → `reviewed` → `resolved` / `dismissed`
- **중복 방지**: 동일 사용자가 같은 게시물을 중복 신고 불가
- **개인정보 보호**: 신고자 정보는 피신고자에게 절대 노출하지 않음

### 차단 시스템

- **양방향 차단**: 차단한 사용자와 차단당한 사용자 모두 서로의 게시물을 볼 수 없음
- **DB-level 필터링**: 피드 조회 쿼리에서 차단 사용자 제외 (앱 레벨 아닌 쿼리 레벨)
- **차단 해제**: 차단한 사용자만 해제 가능

### 데이터베이스 설계

#### feed_reports 테이블

| 컬럼                   | 타입                 | 설명                                                       |
| ---------------------- | -------------------- | ---------------------------------------------------------- |
| id                     | UUID PK              | 신고 ID                                                    |
| reporter_clerk_user_id | TEXT NOT NULL        | 신고자                                                     |
| post_id                | UUID FK → feed_posts | 신고 대상 게시물                                           |
| reason                 | TEXT CHECK           | spam/harassment/inappropriate_content/misinformation/other |
| description            | TEXT                 | 추가 설명 (선택)                                           |
| status                 | TEXT CHECK           | pending/reviewed/resolved/dismissed                        |
| reviewed_at            | TIMESTAMPTZ          | 검토 시각                                                  |
| reviewed_by            | TEXT                 | 검토자                                                     |
| created_at             | TIMESTAMPTZ          | 신고 시각                                                  |

#### user_blocks 테이블

| 컬럼                  | 타입               | 설명            |
| --------------------- | ------------------ | --------------- |
| id                    | UUID PK            | 차단 ID         |
| blocker_clerk_user_id | TEXT NOT NULL      | 차단한 사용자   |
| blocked_clerk_user_id | TEXT NOT NULL      | 차단당한 사용자 |
| created_at            | TIMESTAMPTZ        | 차단 시각       |
| UNIQUE                | (blocker, blocked) | 중복 차단 방지  |

### RLS 정책

- `feed_reports`: 본인 신고만 생성/조회 (관리자는 Service Role로 전체 조회)
- `user_blocks`: 본인 차단만 관리 (CRUD 전부 본인만)

## 대안 (Alternatives Considered)

| 대안               | 장점        | 단점                               | 제외 사유                           |
| ------------------ | ----------- | ---------------------------------- | ----------------------------------- |
| 앱 레벨 필터링     | 구현 간단   | 차단 사용자 데이터 노출            | `LOW_SECURITY`                      |
| 단방향 차단        | 간단        | 차단 당한 사용자가 계속 볼 수 있음 | `INCOMPLETE`                        |
| AI 자동 모더레이션 | 선제적 대응 | 비용 + 오탐                        | `FINANCIAL_HOLD` - MAU 증가 후 도입 |

## 관련 문서

- [ADR-028: 소셜 피드](./ADR-028-social-feed.md)
- [보안 체크리스트](../../.claude/rules/security-checklist.md)

---

**Author**: Claude Code
