# 🧩 components/CLAUDE.md - 컴포넌트 규칙

## 폴더 구조
```
components/
├── ui/           # shadcn/ui 기본 컴포넌트 (수정 금지)
├── analysis/     # 분석 관련 컴포넌트
├── shared/       # 공통 컴포넌트
└── providers/    # Context Providers
```

## 네이밍 규칙
```yaml
파일명: PascalCase.tsx (예: ImageUploader.tsx)
컴포넌트명: PascalCase (예: ImageUploader)
Props 타입: [컴포넌트명]Props (예: ImageUploaderProps)
```

## 컴포넌트 템플릿
```typescript
'use client' // 필요한 경우에만

import { useState } from 'react'

interface ComponentNameProps {
  // Props 정의
}

// 컴포넌트 설명 주석 (한국어)
export default function ComponentName({ ...props }: ComponentNameProps) {
  // 컴포넌트 로직
  return (
    // JSX
  )
}
```

## Props 규칙
```typescript
// 필수 props는 명시적으로
interface Props {
  title: string           // 필수
  description?: string    // 선택 (?)
  onSubmit: () => void   // 콜백
  children?: React.ReactNode
}
```

## 스타일링
```yaml
우선순위:
  1. Tailwind CSS 클래스
  2. shadcn/ui 컴포넌트
  3. CSS 변수 (globals.css)

금지:
  - inline style 객체
  - CSS Modules
  - styled-components
```

## 접근성
```typescript
// 모든 인터랙티브 요소에 필수
<button aria-label="이미지 업로드">
<img alt="프로필 사진" />
<input aria-describedby="helper-text" />
```

## 주의사항
- ❌ ui/ 폴더 내 컴포넌트 직접 수정 금지
- ❌ any 타입 사용 금지
- ✅ 한 파일에 하나의 export default
- ✅ 복잡한 로직은 hooks/로 분리
