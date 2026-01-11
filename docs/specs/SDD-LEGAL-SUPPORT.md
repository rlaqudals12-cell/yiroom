# SDD: 법적 필수 페이지 및 고객 지원

> 이용약관, 개인정보처리방침, 고객센터 통합 스펙

## 1. 개요

### 1.1 목적

- 법적 필수 페이지 (이용약관, 개인정보처리방침) 구현
- 고객센터 메인 페이지 구현
- 약관 동의 내역 표시 기능 추가

### 1.2 범위

| 항목                    | 우선순위 | 복잡도 |
| ----------------------- | -------- | ------ |
| 이용약관 페이지         | 필수     | 낮음   |
| 개인정보처리방침 페이지 | 필수     | 낮음   |
| 고객센터 메인 페이지    | 높음     | 낮음   |
| 약관 동의 내역          | 높음     | 중간   |
| 1:1 문의 연결           | 높음     | 낮음   |

---

## 2. 라우트 구조

```
app/(main)/
├── terms/
│   └── page.tsx              # 이용약관
├── privacy-policy/
│   └── page.tsx              # 개인정보처리방침
├── help/
│   ├── page.tsx              # 고객센터 메인 (신규)
│   ├── faq/page.tsx          # FAQ (기존)
│   ├── feedback/page.tsx     # 피드백 (기존)
│   └── guide/page.tsx        # 앱 사용 가이드 (선택)
└── settings/
    └── agreements/page.tsx   # 약관 동의 내역 (신규)
```

---

## 3. 컴포넌트 스펙

### 3.1 이용약관 페이지 (`/terms`)

```tsx
// 정적 콘텐츠 페이지
// 마크다운 또는 정적 텍스트로 렌더링

interface TermsSection {
  id: string;
  title: string;
  content: string;
}

// 섹션 목록
const TERMS_SECTIONS: TermsSection[] = [
  { id: 'purpose', title: '제1조 (목적)', content: '...' },
  { id: 'definitions', title: '제2조 (정의)', content: '...' },
  { id: 'terms', title: '제3조 (약관의 효력)', content: '...' },
  // ... 기타 조항
];
```

**UI 요소:**

- 헤더: 뒤로가기 + "이용약관" 제목
- 목차 (선택적)
- 섹션별 접기/펼치기
- 최종 수정일 표시

### 3.2 개인정보처리방침 페이지 (`/privacy-policy`)

```tsx
// 정적 콘텐츠 페이지
// PIPA (개인정보보호법) 기준

interface PrivacySection {
  id: string;
  title: string;
  content: string;
}

// 필수 섹션 (PIPA 기준)
const PRIVACY_SECTIONS: PrivacySection[] = [
  { id: 'purpose', title: '1. 개인정보 수집 및 이용 목적', content: '...' },
  { id: 'items', title: '2. 수집하는 개인정보 항목', content: '...' },
  { id: 'period', title: '3. 개인정보 보유 및 이용 기간', content: '...' },
  { id: 'sharing', title: '4. 개인정보 제3자 제공', content: '...' },
  { id: 'outsourcing', title: '5. 개인정보 처리 위탁', content: '...' },
  { id: 'rights', title: '6. 정보주체의 권리', content: '...' },
  { id: 'security', title: '7. 개인정보 보호 조치', content: '...' },
  { id: 'officer', title: '8. 개인정보 보호책임자', content: '...' },
  { id: 'changes', title: '9. 개인정보 처리방침 변경', content: '...' },
];
```

### 3.3 고객센터 메인 페이지 (`/help`)

```tsx
// 고객 지원 허브 페이지

interface HelpMenuItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const HELP_MENU: HelpMenuItem[] = [
  {
    id: 'faq',
    icon: HelpCircle,
    title: '자주 묻는 질문',
    description: '궁금한 점을 빠르게 확인하세요',
    href: '/help/faq',
  },
  {
    id: 'feedback',
    icon: MessageSquare,
    title: '피드백 / 건의하기',
    description: '서비스 개선 의견을 보내주세요',
    href: '/help/feedback',
  },
  {
    id: 'contact',
    icon: Mail,
    title: '1:1 문의',
    description: '이메일로 직접 문의하세요',
    href: 'mailto:support@yiroom.app',
  },
  {
    id: 'kakao',
    icon: MessageCircle,
    title: '카카오톡 문의',
    description: '카카오톡으로 빠르게 상담받으세요',
    href: 'https://pf.kakao.com/_xxxxx', // 카카오 채널 URL
  },
];
```

**UI 요소:**

- 헤더: 뒤로가기 + "고객센터" 제목
- 메뉴 카드 그리드 (2열)
- 앱 버전 정보 (하단)
- 운영 시간 안내

### 3.4 약관 동의 내역 (`/settings/agreements`)

```tsx
// 사용자가 동의한 약관 목록 및 관리

interface AgreementItem {
  id: string;
  type: 'required' | 'optional';
  title: string;
  agreedAt: Date | null;
  version: string;
  canWithdraw: boolean;
}

// DB 테이블: user_agreements
// 기존 테이블 활용 또는 확장
```

**UI 요소:**

- 필수 약관 섹션
  - 이용약관 (동의일, 버전)
  - 개인정보처리방침 (동의일, 버전)
- 선택 약관 섹션
  - 마케팅 정보 수신 (토글)
  - 이미지 저장 동의 (토글)
- 각 항목에 "상세보기" 링크

---

## 4. DB 스키마

### 4.1 기존 테이블 활용

```sql
-- user_agreements 테이블 (기존)
-- 필요시 컬럼 추가

ALTER TABLE user_agreements ADD COLUMN IF NOT EXISTS
  terms_agreed_at TIMESTAMPTZ,
  terms_version VARCHAR(20),
  privacy_agreed_at TIMESTAMPTZ,
  privacy_version VARCHAR(20);
```

### 4.2 약관 버전 관리

```typescript
// lib/legal/versions.ts

export const LEGAL_VERSIONS = {
  terms: '2026.01.01',
  privacy: '2026.01.01',
} as const;
```

---

## 5. 구현 순서 (병렬 가능)

### Phase 1: 정적 페이지 (병렬 작업 가능)

- [ ] `/terms` 이용약관 페이지
- [ ] `/privacy-policy` 개인정보처리방침 페이지
- [ ] `/help` 고객센터 메인 페이지

### Phase 2: 동의 관리

- [ ] 약관 동의 내역 페이지
- [ ] user_agreements 테이블 확장
- [ ] 설정에서 진입점 추가

---

## 6. 테스트 항목

- [ ] 이용약관 페이지 렌더링
- [ ] 개인정보처리방침 페이지 렌더링
- [ ] 고객센터 메인 페이지 렌더링
- [ ] 메뉴 링크 동작 확인
- [ ] 외부 링크 (mailto, 카카오) 동작

---

## 7. 접근성

- 모든 페이지에 `data-testid` 속성
- 헤딩 계층 구조 준수 (h1 → h2 → h3)
- 외부 링크에 `target="_blank" rel="noopener noreferrer"`

---

**Version**: 1.0 | **Created**: 2026-01-11
