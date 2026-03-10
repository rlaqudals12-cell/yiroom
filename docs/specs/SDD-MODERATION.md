# SDD: 모더레이션 시스템 (신고/차단)

> **ADR**: ADR-082 Report Block Moderation
> **상태**: 스펙 확정 | **작성일**: 2026-03-11

---

## 1. 개요

소셜 피드의 신고(Report) 및 사용자 차단(Block) 시스템. API + UI 구현 완료, 테스트 보강 필요.

## 2. API 계약

### 2.1 신고 API

```
POST /api/feed/{postId}/report
```

| 필드        | 타입         | 필수 | 설명                                                           |
| ----------- | ------------ | ---- | -------------------------------------------------------------- |
| reason      | ReportReason | ✅   | spam, harassment, inappropriate_content, misinformation, other |
| description | string       | ❌   | 상세 설명 (max 500자)                                          |

**응답:**

- `200`: `{ success: true, report: FeedReport }`
- `400`: 잘못된 사유
- `401`: 미인증
- `409`: 중복 신고

### 2.2 차단 API

```
GET    /api/user/blocks          → { success: true, blockedUserIds: string[] }
POST   /api/user/blocks          → { success: true, block: UserBlock }
DELETE  /api/user/blocks          → { success: true }
```

| 필드            | 타입   | 필수 | 설명                    |
| --------------- | ------ | ---- | ----------------------- |
| blocked_user_id | string | ✅   | 차단 대상 clerk_user_id |

**에러:**

- `400`: 자기 자신 차단 시도
- `401`: 미인증
- `409`: 이미 차단됨

### 2.3 관리자 API

```
GET   /api/admin/reports?status=pending   → { success: true, reports: FeedReport[] }
PATCH /api/admin/reports                   → { success: true, report: FeedReport }
```

| 필드      | 타입         | 설명                                   |
| --------- | ------------ | -------------------------------------- |
| report_id | string       | 대상 리포트 ID                         |
| status    | ReportStatus | pending, reviewed, resolved, dismissed |

## 3. 타입 정의

```typescript
type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'misinformation' | 'other';
type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

interface FeedReport {
  id: string;
  reporter_clerk_user_id: string;
  post_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

interface UserBlock {
  id: string;
  blocker_clerk_user_id: string;
  blocked_clerk_user_id: string;
  created_at: string;
}
```

## 4. UI 플로우

### 4.1 신고 플로우

1. 피드 게시물 `...` 메뉴 → "신고" 클릭
2. `ReportModal` 열림 → 사유 5개 중 1개 선택
3. (선택) 상세 설명 입력
4. "신고하기" 버튼 → POST API 호출
5. 성공: 토스트 "신고가 접수되었습니다" + 모달 닫기
6. 실패(409): 토스트 "이미 신고한 게시물입니다"

### 4.2 차단 플로우

1. 피드 게시물 `...` 메뉴 → "이 사용자 차단" 클릭
2. `BlockConfirmDialog` 열림 → 결과 안내 (3가지)
3. "차단하기" 버튼 → POST API 호출
4. 성공: 피드에서 해당 사용자 게시물 즉시 필터링

### 4.3 피드 필터링

- `getFeedPosts()`: 차단한 사용자 + 차단당한 사용자 양방향 필터링
- `getBlockedUserIds()` + `getBlockedByUserIds()` → 합집합 제외

## 5. 테스트 매트릭스

### 5.1 API 라우트 테스트

| 테스트 파일             | 케이스          | 검증                 |
| ----------------------- | --------------- | -------------------- |
| `feed-report.test.ts`   | 정상 신고       | 200 + report 객체    |
|                         | 중복 신고       | 409                  |
|                         | 잘못된 사유     | 400                  |
|                         | 미인증          | 401                  |
| `user-blocks.test.ts`   | 정상 차단       | 200 + block 객체     |
|                         | 차단 해제       | 200                  |
|                         | 차단 목록 조회  | 200 + blockedUserIds |
|                         | 자기 차단       | 400                  |
|                         | 중복 차단       | 409                  |
| `admin-reports.test.ts` | GET 필터        | status별 조회        |
|                         | PATCH 상태 변경 | reviewed_at 설정     |

### 5.2 컴포넌트 테스트

| 컴포넌트           | 케이스                                                 |
| ------------------ | ------------------------------------------------------ |
| ReportModal        | 렌더링, 사유 선택, API 호출 mock, 로딩 상태, 에러 상태 |
| BlockConfirmDialog | 렌더링, 확인 콜백, 취소                                |

### 5.3 통합 테스트

| 시나리오           | 검증                    |
| ------------------ | ----------------------- |
| 차단 → 피드 필터링 | 차단 사용자 게시물 숨김 |

## 6. DB 테이블

- `feed_reports`: 마이그레이션 `20260309_feed_reports_blocks.sql`
- `user_blocks`: 동일 마이그레이션
- RLS: `clerk_user_id` 기반 본인 데이터만 접근

---

**Version**: 1.0
