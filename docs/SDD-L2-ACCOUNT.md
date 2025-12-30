# Task: 계정 관리 기능 (SDD-L2-ACCOUNT)

**Phase**: L-2 (운영 안정화)
**작성일**: 2025-01-20
**우선순위**: 🟡 중간 (UX 완성)

---

## 1. 비즈니스 목표

사용자 계정 관리 기능 완성으로 UX 향상 및 설정 페이지 TODO 해소

### 사용자 스토리
```
As a 사용자
I want to 프로필을 편집하고 로그아웃할 수 있기를
So that 내 정보를 관리하고 다른 계정으로 전환할 수 있다
```

---

## 2. 현재 상태 분석

### 2.1 설정 페이지 TODO 항목

**파일**: `apps/web/app/(main)/profile/settings/page.tsx`

| 기능 | 라인 | 현재 상태 |
|------|------|----------|
| 프로필 편집 | 181 | `router.push('/profile/edit')` - 페이지 없음 |
| 비밀번호/보안 | 187 | `router.push('/profile/security')` - 페이지 없음 |
| 로그아웃 | 194 | TODO 주석 - 미구현 |

### 2.2 Clerk 제공 기능

Clerk은 이미 다음 기능을 제공:
- `<UserButton />`: 프로필 사진, 이름, 로그아웃 내장
- `<UserProfile />`: 전체 프로필 관리 UI
- `useSignOut()`: 프로그래밍 방식 로그아웃

**판단**: Clerk 내장 UI 활용으로 개발 비용 최소화

---

## 3. 구현 범위

### IN (포함)
- [x] 로그아웃 버튼 Clerk 연동
- [x] 프로필 편집 → Clerk UserProfile 모달로 대체
- [x] 보안 설정 → Clerk UserProfile 모달로 대체

### OUT (제외)
- [ ] 커스텀 프로필 편집 페이지 (Clerk UI 사용)
- [ ] 커스텀 비밀번호 변경 (Clerk UI 사용)
- [ ] 2FA 설정 UI (Clerk 대시보드에서 관리)

---

## 4. 기술 명세

### 4.1 로그아웃 기능

**현재** (Navbar.tsx):
```typescript
// UserButton에 로그아웃 포함됨
<UserButton afterSignOutUrl="/" />
```

**설정 페이지 추가**:
```typescript
// app/(main)/profile/settings/page.tsx
import { useClerk } from '@clerk/nextjs';

export default function SettingsPage() {
  const { signOut } = useClerk();

  // 계정 탭 렌더링
  case 'account':
    return (
      <SettingItem
        icon={LogOut}
        label="로그아웃"
        description="현재 기기에서 로그아웃"
        onClick={() => signOut({ redirectUrl: '/' })}
      />
    );
}
```

### 4.2 프로필 편집 (Clerk UserProfile 활용)

**방식 A**: 모달로 표시 (추천)
```typescript
import { useClerk } from '@clerk/nextjs';

export default function SettingsPage() {
  const { openUserProfile } = useClerk();

  // 계정 탭 렌더링
  case 'account':
    return (
      <>
        <SettingItem
          icon={User}
          label="프로필 편집"
          description="이름, 프로필 사진 변경"
          onClick={() => openUserProfile()}
        />
        <SettingItem
          icon={Lock}
          label="비밀번호 및 보안"
          description="비밀번호 변경, 2단계 인증"
          onClick={() => openUserProfile()}
        />
      </>
    );
}
```

**방식 B**: 별도 페이지로 표시
```typescript
// app/(main)/profile/edit/page.tsx
import { UserProfile } from '@clerk/nextjs';

export default function ProfileEditPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-2xl px-4">
        <UserProfile
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border rounded-xl',
            }
          }}
        />
      </div>
    </div>
  );
}
```

### 4.3 추천 구현 방식

| 기능 | 방식 | 이유 |
|------|------|------|
| 로그아웃 | `signOut()` 직접 호출 | 간단, 즉시 실행 |
| 프로필 편집 | `openUserProfile()` 모달 | 페이지 이동 없이 빠름 |
| 보안 설정 | `openUserProfile()` 모달 | Clerk UI 재사용 |

---

## 5. UI/UX 명세

### 5.1 설정 페이지 계정 탭 (수정 후)

```
┌─────────────────────────────────────┐
│ 설정 > 계정                          │
├─────────────────────────────────────┤
│                                     │
│ 👤 프로필 편집                       │
│ 이름, 프로필 사진 변경                │
│                              [→]    │
│ ─────────────────────────────────── │
│ 🔒 비밀번호 및 보안                   │
│ 비밀번호 변경, 2단계 인증             │
│                              [→]    │
│ ─────────────────────────────────── │
│ 🚪 로그아웃                          │
│ 현재 기기에서 로그아웃                │
│                              [→]    │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 Clerk UserProfile 모달

```
┌─────────────────────────────────────┐
│              Profile                │
│                 ✕                   │
├─────────────────────────────────────┤
│                                     │
│        ┌──────────┐                 │
│        │  Avatar  │                 │
│        └──────────┘                 │
│         홍길동                       │
│         hong@example.com            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Profile                         │ │
│ │ • Update profile                │ │
│ │ • Change avatar                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Security                        │ │
│ │ • Password                      │ │
│ │ • Two-factor authentication     │ │
│ │ • Active devices                │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 5.3 로그아웃 확인 (선택)

```typescript
// 옵션 1: 확인 없이 즉시 로그아웃
onClick={() => signOut({ redirectUrl: '/' })}

// 옵션 2: 확인 다이얼로그
onClick={() => {
  if (confirm('로그아웃 하시겠습니까?')) {
    signOut({ redirectUrl: '/' });
  }
}}
```

**추천**: 옵션 1 (확인 없이 즉시) - 대부분의 앱이 이 방식 사용

---

## 6. 코드 변경 사항

### 6.1 settings/page.tsx 수정

```typescript
// 추가 import
import { useClerk } from '@clerk/nextjs';

// 컴포넌트 내부
const { signOut, openUserProfile } = useClerk();

// case 'account' 렌더링 수정
case 'account':
  return (
    <FadeInUp>
      <div className="space-y-3">
        <SettingItem
          icon={User}
          label="프로필 편집"
          description="이름, 프로필 사진 변경"
          onClick={() => openUserProfile()}
        />
        <SettingItem
          icon={Lock}
          label="비밀번호 및 보안"
          description="비밀번호 변경, 2단계 인증"
          onClick={() => openUserProfile()}
        />
        <SettingItem
          icon={LogOut}
          label="로그아웃"
          description="현재 기기에서 로그아웃"
          onClick={() => signOut({ redirectUrl: '/' })}
        />
      </div>
    </FadeInUp>
  );
```

### 6.2 삭제할 코드

```typescript
// 삭제: 사용되지 않는 라우트 푸시
onClick={() => router.push('/profile/edit')}   // 삭제
onClick={() => router.push('/profile/security')} // 삭제
```

---

## 7. 테스트 시나리오

### 7.1 로그아웃 테스트

```typescript
describe('Logout functionality', () => {
  it('로그아웃 버튼 클릭 시 홈으로 리다이렉트', async () => {
    // 설정 페이지 이동
    // 계정 탭 선택
    // 로그아웃 클릭
    // 홈 페이지 확인
    // 인증 상태 확인 (로그아웃됨)
  });
});
```

### 7.2 프로필 편집 테스트

```typescript
describe('Profile edit', () => {
  it('프로필 편집 클릭 시 Clerk 모달 열림', async () => {
    render(<SettingsPage />);

    const editButton = screen.getByText('프로필 편집');
    await userEvent.click(editButton);

    // Clerk UserProfile 모달 확인
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

---

## 8. 체크리스트

### 구현 전
- [x] 스펙 문서 작성
- [x] 사용자 검토/승인

### 구현
- [x] settings/page.tsx에 useClerk import 추가
- [x] 로그아웃 버튼 signOut() 연동
- [x] 프로필 편집 openUserProfile() 연동
- [x] 비밀번호/보안 openUserProfile() 연동
- [x] 불필요한 라우트 푸시 코드 삭제

### 검증
- [x] 로그아웃 동작 확인
- [x] Clerk 모달 열림 확인
- [x] 404 페이지 발생 없음 확인

### 완료
- [x] typecheck 통과
- [x] lint 통과
- [x] 커밋 (df6c276)

---

## 9. 예상 소요 시간

| 작업 | 시간 |
|------|------|
| settings/page.tsx 수정 | 15분 |
| 테스트 | 10분 |
| **합계** | **25분** |

---

## 10. 대안 검토

### 옵션 A: Clerk 내장 UI 활용 (추천)
- **장점**: 개발 시간 최소화, 유지보수 불필요, 보안 검증됨
- **단점**: 커스터마이징 제한

### 옵션 B: 커스텀 페이지 구현
- **장점**: 완전한 UI 제어
- **단점**: 개발 시간 증가, Clerk API 직접 호출 필요

### 옵션 C: 하이브리드 (일부 커스텀)
- **장점**: 균형
- **단점**: 복잡도 증가

**결정**: 옵션 A - 현재 단계에서 Clerk UI 활용이 가장 효율적

---

## 11. 향후 확장

| 기능 | 우선순위 | 시기 |
|------|----------|------|
| 커스텀 프로필 페이지 | 낮음 | 필요 시 |
| 연결된 계정 관리 | 낮음 | 소셜 로그인 추가 시 |
| 알림 설정 백엔드 | 중간 | Phase L-3 |

---

**다음 단계**: 전체 스펙 문서 검토 요청
