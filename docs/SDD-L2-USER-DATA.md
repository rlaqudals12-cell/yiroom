# Task: 사용자 데이터 관리 (SDD-L2-USER-DATA)

**Phase**: L-2 (운영 안정화)
**작성일**: 2025-01-20
**우선순위**: 🔴 최상 (법적 필수)

---

## 1. 비즈니스 목표

GDPR/PIPA 및 App Store 정책 준수를 위한 사용자 데이터 관리 기능 구현

### 법적 근거
| 규정 | 요구사항 |
|------|----------|
| **GDPR Art.20** | 데이터 이동권 (Data Portability) |
| **GDPR Art.17** | 삭제권 (Right to Erasure) |
| **PIPA 제4조** | 개인정보 열람권 |
| **App Store 5.1.1(v)** | 계정 삭제 기능 필수 (2024~) |

### 사용자 스토리
```
As a 사용자
I want to 내 데이터를 내보내거나 계정을 삭제
So that 데이터 소유권을 행사하고 서비스를 떠날 수 있다
```

---

## 2. 현재 상태 분석

### 2.1 설정 페이지 현황
**파일**: `apps/web/app/(main)/profile/settings/page.tsx`

```typescript
// Line 441-444: 데이터 내보내기
onClick={() => {
  // TODO: 데이터 내보내기
  alert('데이터 내보내기 기능 준비 중');
}}

// Line 450-454: 계정 삭제
onClick={() => {
  // TODO: 계정 삭제 확인 모달
  if (confirm('정말 계정을 삭제하시겠습니까?')) {
    alert('계정 삭제 기능 준비 중');
  }
}}
```

### 2.2 사용자 데이터 범위

| 테이블 | 데이터 유형 | 포함 여부 |
|--------|-----------|----------|
| `users` | 기본 정보 (이름, 이메일) | ✅ 필수 |
| `personal_color_assessments` | PC-1 진단 결과 | ✅ 필수 |
| `skin_analyses` | S-1 피부 분석 | ✅ 필수 |
| `body_analyses` | C-1 체형 분석 | ✅ 필수 |
| `workout_analyses` | W-1 운동 분석 | ✅ 필수 |
| `workout_plans` | 운동 플랜 | ✅ 필수 |
| `workout_logs` | 운동 기록 | ✅ 필수 |
| `nutrition_settings` | 영양 설정 | ✅ 필수 |
| `meal_records` | 식사 기록 | ✅ 필수 |
| `water_records` | 수분 기록 | ✅ 필수 |
| `daily_nutrition_summary` | 영양 요약 | ✅ 필수 |
| `user_wishlists` | 위시리스트 | ✅ 필수 |
| `friendships` | 친구 관계 | ✅ 필수 |
| `user_levels` | 레벨/경험치 | ✅ 필수 |
| `user_badges` | 획득 뱃지 | ✅ 필수 |
| `wellness_scores` | 웰니스 점수 | ✅ 필수 |
| `challenge_participations` | 챌린지 참가 | ✅ 필수 |
| `feedback` | 피드백 | ⚠️ 선택 |

---

## 3. 구현 범위

### IN (포함)
- [x] 데이터 내보내기 API (`POST /api/user/export`)
- [x] 계정 삭제 API (`DELETE /api/user/account`)
- [x] 삭제 확인 모달 UI
- [x] 내보내기 진행 상태 UI
- [x] 이메일 확인 (계정 삭제 시)

### OUT (제외)
- [ ] 30일 유예 기간 (즉시 삭제 방식 채택)
- [ ] 데이터 복구 기능
- [ ] 부분 데이터 삭제

---

## 4. 기술 명세

### 4.1 데이터 내보내기 API

**엔드포인트**: `POST /api/user/export`

```typescript
// Request
// Authorization: Bearer <clerk_token>
// Body: none

// Response (200 OK)
interface ExportResponse {
  success: true;
  data: UserExportData;
  exportedAt: string; // ISO 8601
  format: 'json';
}

interface UserExportData {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  analyses: {
    personalColor: PersonalColorAssessment | null;
    skin: SkinAnalysis | null;
    body: BodyAnalysis | null;
    workout: WorkoutAnalysis | null;
  };
  records: {
    workoutLogs: WorkoutLog[];
    mealRecords: MealRecord[];
    waterRecords: WaterRecord[];
  };
  social: {
    friends: Friend[];
    badges: Badge[];
    level: UserLevel;
    wellnessScores: WellnessScore[];
  };
  preferences: {
    nutritionSettings: NutritionSettings | null;
    wishlists: Wishlist[];
  };
}
```

**구현 로직**:
```typescript
// app/api/user/export/route.ts
export async function POST(request: Request) {
  // 1. Clerk 인증 확인
  const { userId } = auth();
  if (!userId) return unauthorized();

  // 2. 각 테이블에서 데이터 조회
  const supabase = createClerkSupabaseClient();

  const [user, analyses, records, social, preferences] = await Promise.all([
    fetchUserData(supabase, userId),
    fetchAnalyses(supabase, userId),
    fetchRecords(supabase, userId),
    fetchSocialData(supabase, userId),
    fetchPreferences(supabase, userId),
  ]);

  // 3. JSON 구조화
  const exportData: UserExportData = {
    user,
    analyses,
    records,
    social,
    preferences,
  };

  // 4. 응답 반환 (Content-Disposition으로 다운로드 유도)
  return new Response(JSON.stringify({
    success: true,
    data: exportData,
    exportedAt: new Date().toISOString(),
    format: 'json',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="yiroom-export-${Date.now()}.json"`,
    },
  });
}
```

### 4.2 계정 삭제 API

**엔드포인트**: `DELETE /api/user/account`

```typescript
// Request
// Authorization: Bearer <clerk_token>
// Body:
interface DeleteAccountRequest {
  confirmation: string; // 사용자 이메일 입력 (확인용)
}

// Response (200 OK)
interface DeleteAccountResponse {
  success: true;
  message: string;
  deletedAt: string;
}

// Response (400 Bad Request)
interface DeleteAccountError {
  success: false;
  error: 'CONFIRMATION_MISMATCH' | 'DELETION_FAILED';
  message: string;
}
```

**구현 로직**:
```typescript
// app/api/user/account/route.ts
export async function DELETE(request: Request) {
  // 1. Clerk 인증 확인
  const { userId } = auth();
  if (!userId) return unauthorized();

  // 2. 이메일 확인
  const { confirmation } = await request.json();
  const user = await clerkClient.users.getUser(userId);

  if (confirmation !== user.emailAddresses[0]?.emailAddress) {
    return Response.json({
      success: false,
      error: 'CONFIRMATION_MISMATCH',
      message: '이메일이 일치하지 않습니다.',
    }, { status: 400 });
  }

  // 3. Supabase 데이터 삭제 (트랜잭션)
  const supabase = createServiceRoleClient(); // RLS 우회

  const tables = [
    'challenge_participations',
    'user_badges',
    'user_levels',
    'wellness_scores',
    'friendships',
    'user_wishlists',
    'daily_nutrition_summary',
    'water_records',
    'meal_records',
    'workout_logs',
    'workout_plans',
    'workout_analyses',
    'body_analyses',
    'skin_analyses',
    'personal_color_assessments',
    'nutrition_settings',
    'feedback',
    'users', // 마지막에 삭제
  ];

  for (const table of tables) {
    await supabase
      .from(table)
      .delete()
      .eq('clerk_user_id', userId);
  }

  // 4. Clerk 계정 삭제
  await clerkClient.users.deleteUser(userId);

  // 5. 응답 반환
  return Response.json({
    success: true,
    message: '계정이 성공적으로 삭제되었습니다.',
    deletedAt: new Date().toISOString(),
  });
}
```

### 4.3 타입 정의

```typescript
// types/user-data.ts
export interface UserExportData {
  user: UserBasicInfo;
  analyses: UserAnalyses;
  records: UserRecords;
  social: UserSocial;
  preferences: UserPreferences;
}

export interface DeleteAccountRequest {
  confirmation: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletedAt?: string;
  error?: 'CONFIRMATION_MISMATCH' | 'DELETION_FAILED';
}
```

---

## 5. UI/UX 명세

### 5.1 데이터 내보내기 플로우

```
┌─────────────────────────────────────┐
│ 설정 > 데이터 관리                    │
├─────────────────────────────────────┤
│                                     │
│ 📥 데이터 내보내기                    │
│ 모든 데이터를 JSON 파일로 다운로드     │
│                        [내보내기 →]  │
│                                     │
└─────────────────────────────────────┘
          │
          ▼ 클릭
┌─────────────────────────────────────┐
│         데이터 내보내기              │
├─────────────────────────────────────┤
│                                     │
│  📦 내보내기 준비 중...              │
│  ████████████░░░░░░░░ 60%          │
│                                     │
│  • 분석 결과 수집 중                 │
│  • 운동 기록 수집 중                 │
│  • 영양 기록 수집 중                 │
│                                     │
└─────────────────────────────────────┘
          │
          ▼ 완료
┌─────────────────────────────────────┐
│         다운로드 완료 ✓              │
├─────────────────────────────────────┤
│                                     │
│  ✅ 데이터 내보내기가 완료되었습니다   │
│                                     │
│  파일명: yiroom-export-2025...json  │
│  크기: 2.4 MB                       │
│                                     │
│           [확인]                    │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 계정 삭제 플로우

```
┌─────────────────────────────────────┐
│ 설정 > 데이터 관리                    │
├─────────────────────────────────────┤
│                                     │
│ 🗑️ 계정 삭제                         │
│ 모든 데이터가 영구적으로 삭제됩니다    │
│                        [삭제하기 →]  │
│                                     │
└─────────────────────────────────────┘
          │
          ▼ 클릭
┌─────────────────────────────────────┐
│         ⚠️ 계정 삭제                 │
├─────────────────────────────────────┤
│                                     │
│  정말 계정을 삭제하시겠습니까?        │
│                                     │
│  삭제되는 데이터:                    │
│  • 모든 분석 결과                    │
│  • 운동/영양 기록                    │
│  • 친구 및 소셜 데이터               │
│  • 위시리스트 및 설정                │
│                                     │
│  ⚠️ 이 작업은 되돌릴 수 없습니다      │
│                                     │
│  확인을 위해 이메일을 입력하세요:      │
│  ┌─────────────────────────────┐    │
│  │ user@example.com           │    │
│  └─────────────────────────────┘    │
│                                     │
│    [취소]        [계정 삭제]         │
│                                     │
└─────────────────────────────────────┘
```

### 5.3 컴포넌트 구조

```typescript
// components/settings/DataExportButton.tsx
interface DataExportButtonProps {
  onExportStart?: () => void;
  onExportComplete?: (data: UserExportData) => void;
  onExportError?: (error: Error) => void;
}

// components/settings/DeleteAccountDialog.tsx
interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  onDeleteConfirm: () => Promise<void>;
}
```

---

## 6. 테스트 시나리오

### 6.1 데이터 내보내기 테스트

```typescript
describe('POST /api/user/export', () => {
  it('인증된 사용자의 데이터를 JSON으로 반환', async () => {
    const response = await fetch('/api/user/export', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user).toBeDefined();
    expect(data.data.analyses).toBeDefined();
  });

  it('미인증 요청은 401 반환', async () => {
    const response = await fetch('/api/user/export', {
      method: 'POST',
    });

    expect(response.status).toBe(401);
  });
});
```

### 6.2 계정 삭제 테스트

```typescript
describe('DELETE /api/user/account', () => {
  it('이메일 확인 후 계정 삭제', async () => {
    const response = await fetch('/api/user/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ confirmation: 'user@example.com' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('이메일 불일치 시 400 반환', async () => {
    const response = await fetch('/api/user/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ confirmation: 'wrong@example.com' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('CONFIRMATION_MISMATCH');
  });
});
```

### 6.3 UI 테스트

```typescript
describe('DeleteAccountDialog', () => {
  it('이메일 입력 전에는 삭제 버튼 비활성화', () => {
    render(<DeleteAccountDialog open={true} userEmail="user@example.com" />);

    const deleteButton = screen.getByRole('button', { name: '계정 삭제' });
    expect(deleteButton).toBeDisabled();
  });

  it('올바른 이메일 입력 시 삭제 버튼 활성화', async () => {
    render(<DeleteAccountDialog open={true} userEmail="user@example.com" />);

    const input = screen.getByPlaceholderText(/이메일/);
    await userEvent.type(input, 'user@example.com');

    const deleteButton = screen.getByRole('button', { name: '계정 삭제' });
    expect(deleteButton).not.toBeDisabled();
  });
});
```

---

## 7. 보안 고려사항

| 위협 | 대응 |
|------|------|
| 무단 데이터 접근 | Clerk 인증 필수, RLS 적용 |
| 타인 계정 삭제 | 이메일 확인 절차 |
| 데이터 유출 | HTTPS 전송, 로컬 다운로드만 |
| 삭제 복구 공격 | 즉시 삭제, 복구 불가 명시 |

---

## 8. 체크리스트

### 구현 전
- [x] 스펙 문서 작성
- [ ] 사용자 검토/승인

### 구현
- [ ] 타입 정의 (`types/user-data.ts`)
- [ ] 내보내기 API (`/api/user/export`)
- [ ] 삭제 API (`/api/user/account`)
- [ ] 내보내기 버튼 컴포넌트
- [ ] 삭제 확인 다이얼로그
- [ ] 설정 페이지 연동

### 검증
- [ ] API 단위 테스트
- [ ] UI 컴포넌트 테스트
- [ ] E2E 테스트 (실제 삭제 제외)
- [ ] 보안 검토

### 완료
- [ ] typecheck 통과
- [ ] lint 통과
- [ ] 커밋

---

## 9. 예상 소요 시간

| 작업 | 시간 |
|------|------|
| 타입 정의 | 15분 |
| 내보내기 API | 30분 |
| 삭제 API | 30분 |
| UI 컴포넌트 | 45분 |
| 설정 페이지 연동 | 15분 |
| 테스트 | 30분 |
| **합계** | **2시간 45분** |

---

## 10. 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Clerk 삭제 API 실패 | 낮음 | 높음 | 재시도 로직, 수동 삭제 안내 |
| 대용량 데이터 타임아웃 | 중간 | 중간 | 스트리밍 응답, 분할 다운로드 |
| 외래키 제약 위반 | 중간 | 높음 | 삭제 순서 준수, CASCADE 검토 |

---

**다음 단계**: SDD-L2-ACCOUNT.md 작성 후 전체 검토
