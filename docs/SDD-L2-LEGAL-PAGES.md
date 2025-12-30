# Task: 법적 페이지 정비 (SDD-L2-LEGAL-PAGES)

**Phase**: L-2 (운영 안정화)
**작성일**: 2025-01-20
**우선순위**: 🔴 높음 (출시 필수)

---

## 1. 비즈니스 목표

앱스토어 정책 및 법적 요구사항 충족을 위한 법적 페이지 정비

### 사용자 스토리
```
As a 사용자
I want to 앱의 이용약관과 개인정보처리방침을 확인
So that 서비스 이용 조건을 이해하고 신뢰할 수 있다
```

---

## 2. 현재 상태 분석

### 2.1 존재하는 페이지
| 페이지 | 실제 경로 | 상태 |
|--------|----------|------|
| 개인정보처리방침 | `/privacy` | ✅ 완료 |
| 이용약관 | `/terms` | ✅ 완료 |

### 2.2 문제점
| 문제 | 설명 | 영향 |
|------|------|------|
| **경로 불일치** | 설정 페이지에서 `/legal/*` 경로 사용 | 404 에러 발생 |
| **라이선스 페이지 없음** | `/legal/licenses` 페이지 미존재 | 오픈소스 라이선스 고지 불가 |

### 2.3 관련 파일
- 설정 페이지: `apps/web/app/(main)/profile/settings/page.tsx`
  - Line 474: `router.push('/legal/terms')`
  - Line 479: `router.push('/legal/privacy')`
  - Line 484: `router.push('/legal/licenses')`

---

## 3. 구현 범위

### IN (포함)
- [x] 설정 페이지 경로 수정 (`/legal/*` → `/terms`, `/privacy`)
- [x] 오픈소스 라이선스 페이지 생성 (`/licenses`)
- [x] 페이지 간 네비게이션 링크 추가

### OUT (제외)
- [ ] 법적 문서 내용 수정 (별도 검토 필요)
- [ ] 다국어 번역 (Phase L-3)

---

## 4. 기술 명세

### 4.1 경로 수정

```typescript
// Before (settings/page.tsx)
onClick={() => router.push('/legal/terms')}
onClick={() => router.push('/legal/privacy')}
onClick={() => router.push('/legal/licenses')}

// After
onClick={() => router.push('/terms')}
onClick={() => router.push('/privacy')}
onClick={() => router.push('/licenses')}
```

### 4.2 오픈소스 라이선스 페이지

**경로**: `apps/web/app/licenses/page.tsx`

```typescript
// 메타데이터
export const metadata: Metadata = {
  title: '오픈소스 라이선스 | 이룸',
  description: '이룸 서비스에서 사용하는 오픈소스 라이브러리 목록입니다.',
};

// 컴포넌트 구조
export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1>오픈소스 라이선스</h1>
        {/* 주요 라이브러리 목록 */}
        {/* 라이선스 유형별 분류 */}
        {/* 전체 라이선스 링크 */}
      </div>
    </div>
  );
}
```

### 4.3 주요 오픈소스 라이브러리

| 라이브러리 | 라이선스 | 용도 |
|-----------|---------|------|
| Next.js | MIT | 프레임워크 |
| React | MIT | UI 라이브러리 |
| Tailwind CSS | MIT | 스타일링 |
| Radix UI | MIT | UI 컴포넌트 |
| Clerk | Proprietary | 인증 |
| Supabase | Apache 2.0 | 데이터베이스 |
| Zustand | MIT | 상태 관리 |
| Zod | MIT | 유효성 검사 |
| Lucide React | ISC | 아이콘 |

---

## 5. UI/UX 명세

### 5.1 라이선스 페이지 레이아웃

```
┌─────────────────────────────────────┐
│ ← 뒤로가기        오픈소스 라이선스    │
├─────────────────────────────────────┤
│                                     │
│ 이룸은 다음 오픈소스 라이브러리를      │
│ 사용하여 만들어졌습니다.              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 프레임워크                    │ │
│ │ • Next.js (MIT)                │ │
│ │ • React (MIT)                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎨 UI/스타일링                   │ │
│ │ • Tailwind CSS (MIT)           │ │
│ │ • Radix UI (MIT)               │ │
│ │ • Lucide React (ISC)           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔧 유틸리티                      │ │
│ │ • Zustand (MIT)                │ │
│ │ • Zod (MIT)                    │ │
│ │ • date-fns (MIT)               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [전체 라이선스 텍스트 보기 →]         │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 스타일 가이드
- 기존 `/privacy`, `/terms` 페이지와 동일한 스타일 사용
- `prose` 클래스 적용
- 카테고리별 카드 형태로 그룹화

---

## 6. 테스트 시나리오

### 6.1 경로 테스트
```typescript
describe('Legal Pages Navigation', () => {
  it('설정 > 이용약관 클릭 시 /terms로 이동', async () => {
    // 설정 페이지 이동
    // 이용약관 클릭
    // /terms 페이지 확인
  });

  it('설정 > 개인정보처리방침 클릭 시 /privacy로 이동', async () => {
    // 설정 페이지 이동
    // 개인정보처리방침 클릭
    // /privacy 페이지 확인
  });

  it('설정 > 오픈소스 라이선스 클릭 시 /licenses로 이동', async () => {
    // 설정 페이지 이동
    // 오픈소스 라이선스 클릭
    // /licenses 페이지 확인
  });
});
```

### 6.2 페이지 렌더링 테스트
```typescript
describe('LicensesPage', () => {
  it('페이지 제목이 표시됨', () => {
    render(<LicensesPage />);
    expect(screen.getByText('오픈소스 라이선스')).toBeInTheDocument();
  });

  it('주요 라이브러리가 표시됨', () => {
    render(<LicensesPage />);
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
```

---

## 7. 체크리스트

### 구현 전
- [x] 스펙 문서 작성
- [ ] 사용자 검토/승인

### 구현
- [ ] 설정 페이지 경로 수정 (3줄)
- [ ] 라이선스 페이지 생성
- [ ] 메타데이터 설정

### 검증
- [ ] 수동 네비게이션 테스트
- [ ] 404 발생 없음 확인
- [ ] 모바일 반응형 확인

### 완료
- [ ] typecheck 통과
- [ ] lint 통과
- [ ] 커밋

---

## 8. 예상 소요 시간

| 작업 | 시간 |
|------|------|
| 경로 수정 | 5분 |
| 라이선스 페이지 생성 | 20분 |
| 테스트 | 10분 |
| **합계** | **35분** |

---

## 9. 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 추가 법적 페이지 필요 | 낮음 | 중간 | 추후 확장 가능한 구조 |
| 라이선스 누락 | 중간 | 낮음 | package.json 기반 자동 생성 검토 |

---

**다음 단계**: 사용자 승인 후 구현 진행
