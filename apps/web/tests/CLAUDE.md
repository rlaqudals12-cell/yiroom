# 🧪 tests/CLAUDE.md - 테스트 규칙

## 테스트 도구
```yaml
테스트 러너: Vitest
컴포넌트 테스트: @testing-library/react
E2E 테스트: Playwright (Phase 2)
```

## 폴더 구조
```
tests/
├── unit/           # 유닛 테스트
│   ├── lib/        # 유틸리티 함수
│   └── hooks/      # Custom Hooks
├── components/     # 컴포넌트 테스트
└── integration/    # 통합 테스트
```

## 네이밍 규칙
```yaml
파일명: [대상].test.ts(x)
예시:
  - utils.test.ts
  - ImageUploader.test.tsx
  - useAuth.test.ts
```

## 테스트 템플릿
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('함수/컴포넌트명', () => {
  // 정상 케이스
  it('should [예상 동작] when [조건]', () => {
    // Arrange
    const input = ...
    
    // Act
    const result = ...
    
    // Assert
    expect(result).toBe(...)
  })

  // 엣지 케이스
  it('should handle edge case: [케이스]', () => { })

  // 에러 케이스
  it('should throw error when [조건]', () => { })
})
```

## 컴포넌트 테스트
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

it('should render correctly', () => {
  render(<Component />)
  expect(screen.getByText('텍스트')).toBeInTheDocument()
})

it('should handle click', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick} />)
  await fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalled()
})
```

## 목표 커버리지
```yaml
전체: 70% 이상
핵심 로직 (lib/): 90% 이상
훅 (hooks/): 80% 이상
컴포넌트: 60% 이상
```

## 테스트 실행
```bash
npm run test              # 전체 테스트
npm run test:watch        # 워치 모드
npm run test:coverage     # 커버리지 리포트
npm run test -- [파일명]  # 특정 파일
```

## 주의사항
- ❌ 테스트 없이 PR 금지
- ❌ console.log 테스트에 남기지 않기
- ✅ 각 테스트는 독립적으로 실행 가능
- ✅ 한국어로 테스트 설명 가능 (describe/it)
