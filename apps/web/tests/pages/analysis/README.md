# 분석 모듈 페이지 테스트

> 퍼스널 컬러(PC-1), 피부 분석(S-1), 체형 분석(C-1) 페이지 테스트

## 테스트 파일

| 파일                      | 대상 페이지                | 테스트 수 |
| ------------------------- | -------------------------- | --------- |
| `personal-color.test.tsx` | `/analysis/personal-color` | 13        |
| `skin.test.tsx`           | `/analysis/skin`           | 17        |
| `body.test.tsx`           | `/analysis/body`           | 15        |

## 테스트 실행

```bash
# 전체 분석 페이지 테스트
cd apps/web
npm run test -- tests/pages/analysis/

# 개별 모듈 테스트
npm run test -- tests/pages/analysis/personal-color.test.tsx
npm run test -- tests/pages/analysis/skin.test.tsx
npm run test -- tests/pages/analysis/body.test.tsx

# Watch 모드
npm run test -- tests/pages/analysis/ --watch

# 커버리지
npm run test:coverage -- tests/pages/analysis/
```

## 테스트 커버리지

### 퍼스널 컬러 분석 (PC-1)

#### 정상 케이스

- ✅ 페이지 렌더링
- ✅ 조명 가이드 → 다각도 촬영 → 손목 촬영 → 분석 플로우
- ✅ 손목 촬영 건너뛰기
- ✅ 기존 퍼스널 컬러 입력 플로우 (건너뛰기)
- ✅ 퍼스널 컬러 입력 → 즉시 결과 표시

#### 에러 케이스

- ✅ 인증 로딩 중 렌더링 방지
- ✅ API 호출 실패 시 에러 처리

#### 엣지 케이스

- ✅ 다각도 촬영 취소 → 가이드 복귀
- ✅ 퍼스널 컬러 입력 뒤로가기
- ✅ 결과 화면 다시 분석하기
- ✅ 기존 분석 결과 배너 표시

### 피부 분석 (S-1)

#### 정상 케이스

- ✅ 페이지 렌더링
- ✅ 조명 가이드 → 모드 선택 → 카메라/갤러리 플로우
- ✅ 카메라 모드 (다각도 촬영 3장)
- ✅ 카메라 모드 (정면만 촬영 1장)
- ✅ 갤러리 모드 (단일 이미지)
- ✅ 기존 피부 타입 입력 플로우
- ✅ Confetti 축하 효과
- ✅ 공유 버튼 표시

#### 에러 케이스

- ✅ API 에러 시 에러 메시지 + 촬영 화면 복귀

#### 엣지 케이스

- ✅ 다각도 촬영 취소 → 모드 선택 복귀
- ✅ 피부 타입 입력 뒤로가기
- ✅ 결과 화면 다시 분석하기
- ✅ 기존 분석 결과 배너 표시
- ✅ 모드 선택 설명 텍스트

### 체형 분석 (C-1)

#### 정상 케이스

- ✅ 페이지 렌더링
- ✅ 가이드 → 입력 폼 → 사진 업로드 → 분석 플로우
- ✅ 기존 체형 타입 입력 플로우
- ✅ Confetti 축하 효과
- ✅ 공유 버튼 표시

#### 에러 케이스

- ✅ API 호출 실패 시 에러 처리
- ✅ 네트워크 에러 처리

#### 엣지 케이스

- ✅ 체형 타입 입력 뒤로가기
- ✅ 결과 화면 다시 분석하기
- ✅ 기존 분석 결과 배너 표시
- ✅ 사용자 입력 데이터 API 전송 확인

## 주요 Mock 패턴

### Clerk 인증

```typescript
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
}));
```

### Supabase 클라이언트

```typescript
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    }),
  }),
}));
```

### 컴포넌트 Mock

```typescript
vi.mock('@/app/(main)/analysis/skin/_components/LightingGuide', () => ({
  default: ({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) => (
    <div data-testid="lighting-guide">
      <button onClick={onContinue}>계속하기</button>
      <button onClick={onSkip}>건너뛰기</button>
    </div>
  ),
}));
```

### API Fetch Mock

```typescript
global.fetch = vi.fn().mockResolvedValueOnce({
  ok: true,
  json: async () => ({ result: { ... } }),
});
```

## 테스트 작성 규칙

### Given-When-Then 패턴

```typescript
it('가이드 → 다각도촬영 → 분석 단계로 진행된다', async () => {
  // Given: 페이지 렌더링
  const user = userEvent.setup();
  render(<PersonalColorPage />);

  // When: 사용자 액션
  await user.click(screen.getByTestId('continue-button'));
  await user.click(screen.getByTestId('capture-complete'));

  // Then: 기대 결과
  await waitFor(() => {
    expect(screen.getByTestId('analysis-loading')).toBeInTheDocument();
  });
});
```

### 비동기 처리

```typescript
// waitFor 사용 (타임아웃 조정 가능)
await waitFor(
  () => {
    expect(screen.getByTestId('result')).toBeInTheDocument();
  },
  { timeout: 3000 }
);
```

### 에러 시나리오

```typescript
// API 에러
global.fetch = vi.fn().mockResolvedValueOnce({
  ok: false,
  json: async () => ({ error: 'Analysis failed' }),
});

// 네트워크 에러
global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
```

## 공통 이슈 해결

### 1. "Cannot find module" 에러

```bash
# 타입 재생성
cd apps/web
npm run typecheck
```

### 2. Mock 함수가 호출되지 않음

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // 각 테스트 전에 초기화
});
```

### 3. waitFor 타임아웃

```typescript
// 타임아웃 늘리기
await waitFor(() => { ... }, { timeout: 5000 });
```

### 4. File 객체 생성 (브라우저 환경)

```typescript
const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
```

## 테스트 확장 가이드

### 새로운 단계 추가 시

1. 해당 컴포넌트 Mock 추가
2. 플로우 테스트에 단계 추가
3. 개별 단계 테스트 작성

### 새로운 에러 케이스 추가 시

```typescript
describe('에러 처리', () => {
  it('새로운 에러 시나리오', async () => {
    // API/컴포넌트에서 에러 발생시키기
    // 에러 메시지 확인
    // 복구 플로우 확인
  });
});
```

## 관련 문서

- [테스트 규칙](../../CLAUDE.md)
- [API 테스트](../../api/analyze/)
- [컴포넌트 테스트](../../components/analysis/)
