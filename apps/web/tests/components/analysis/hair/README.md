# H-1 헤어 분석 테스트

> H-1 헤어 분석 결과 페이지 및 컴포넌트 테스트 스위트

## 테스트 파일

```
tests/components/analysis/hair/
├── README.md (이 파일)
├── HairResultCard.test.tsx (40개 테스트)
└── HairProductRecommendations.test.tsx (35개 테스트)

tests/pages/analysis/hair/
└── result.test.tsx (15개 테스트)
```

**총 테스트 수**: 90개 (예상)

---

## 테스트 실행

```bash
# 컴포넌트 테스트만 실행
npm run test -- tests/components/analysis/hair

# 페이지 테스트 실행
npm run test -- tests/pages/analysis/hair

# 전체 헤어 분석 테스트 + 커버리지
npm run test:coverage -- tests/components/analysis/hair tests/pages/analysis/hair

# watch 모드
npm run test -- tests/components/analysis/hair --watch
```

---

## 테스트 구조

### 1. HairResultCard 컴포넌트 (40개)

**파일**: `HairResultCard.test.tsx`

#### 정상 케이스 (6개)

- 렌더링 성공
- 헤어 타입 표시
- 종합 점수 표시
- 두피 건강도 표시
- 모발 밀도 표시
- 추천 사항 표시

#### 점수에 따른 상태 표시 (3개)

- 좋은 상태 (71-100)
- 보통 상태 (41-70)
- 주의 상태 (0-40)

#### 헤어 타입별 라벨 (4개)

- 직모 타입
- 웨이브 타입
- 곱슬 타입
- 코일리 타입

#### 에러 케이스 (2개)

- 결과 데이터 없을 때
- 필수 필드 누락 시

#### 엣지 케이스 (3개)

- 추천 사항 없을 때
- 점수 0일 때
- 점수 100일 때

---

### 2. HairProductRecommendations 컴포넌트 (35개)

**파일**: `HairProductRecommendations.test.tsx`

#### 정상 케이스 (4개)

- 헤어 타입별 제품 추천
- 두피 건강도에 따른 제품 필터링
- 제품 목록 표시
- 제품 카테고리별 그룹핑

#### 카테고리 라벨 (5개)

- 샴푸
- 컨디셔너
- 트리트먼트
- 두피 케어
- 스타일링

#### 엣지 케이스 (4개)

- 추천 제품 없을 때
- 제품 100개 이상 시 페이지네이션
- 제품 정확히 20개일 때
- 제품 1개일 때

#### 인터랙션 (1개)

- 더보기 버튼 클릭

#### 헤어 타입별 필터링 (4개)

- 직모
- 웨이브
- 곱슬
- 코일리

#### 두피 건강도별 우선순위 (3개)

- 두피 건강 좋음 (71-100)
- 두피 건강 보통 (41-70)
- 두피 건강 나쁨 (0-40)

---

### 3. 결과 페이지 (15개)

**파일**: `tests/pages/analysis/hair/result.test.tsx`

#### 정상 케이스 (5개)

- 페이지 렌더링 성공
- DB에서 분석 결과 조회
- 탭 전환 동작
- 공유 버튼 클릭
- 제품 추천 버튼 클릭

#### 에러 케이스 (2개)

- 분석 결과 없을 때
- DB 조회 실패 시

#### 로딩 상태 (3개)

- 로딩 중 표시
- 로딩 스피너 표시
- 로딩 완료 후 데이터 표시

#### 헤어 타입별 렌더링 (4개)

- 직모
- 웨이브
- 곱슬
- 코일리

---

## Mock 데이터

**파일**: `lib/mock/hair-analysis.ts`

```typescript
interface HairAnalysisResult {
  id: string;
  clerk_user_id: string;
  image_url: string;
  hair_type: 'straight' | 'wavy' | 'curly' | 'coily';
  scalp_health: number; // 0-100
  hair_density: number; // 0-100
  hair_thickness: number; // 0-100
  damage_level: number; // 0-100 (낮을수록 좋음)
  elasticity: number; // 0-100
  shine: number; // 0-100
  overall_score: number; // 0-100
  recommendations: string[];
  product_recommendations?: {
    shampoo: string[];
    conditioner: string[];
    treatment: string[];
    scalp_care: string[];
  };
  hair_care_routine?: {
    morning: string[];
    evening: string[];
    weekly: string[];
  };
  insights?: string;
  analyzed_at: string;
  analysis_reliability: 'low' | 'medium' | 'high';
}
```

**함수**:

- `generateMockHairAnalysis()`: 랜덤 Mock 데이터 생성
- `mockHairAnalysisResult`: 테스트용 고정 데이터

---

## 테스트 패턴

### Given-When-Then 구조

```typescript
it('헤어 타입 표시', () => {
  // Given: wavy 헤어 타입
  const mockResult = {
    hairType: 'wavy',
    overallScore: 85,
  };

  // When: 렌더링
  render(<HairResultCard result={mockResult} />);

  // Then: 웨이브 타입 한글 표시
  expect(screen.getByText('웨이브')).toBeInTheDocument();
});
```

### 테스트 그룹화

```typescript
describe('HairResultCard', () => {
  describe('정상 케이스', () => {
    it('렌더링 성공', () => {});
  });

  describe('에러 케이스', () => {
    it('결과 데이터 없을 때', () => {});
  });

  describe('엣지 케이스', () => {
    it('추천 사항 없을 때', () => {});
  });
});
```

---

## 커버리지 목표

| 항목                       | 목표 커버리지 |
| -------------------------- | ------------- |
| HairResultCard             | 85% 이상      |
| HairProductRecommendations | 80% 이상      |
| result page                | 75% 이상      |
| **전체 (H-1 헤어 분석)**   | **70% 이상**  |

---

## 주의사항

### 1. 컴포넌트 스텁

현재 테스트 파일에는 **임시 컴포넌트 스텁**이 포함되어 있습니다.
실제 컴포넌트 구현 후 제거해야 합니다.

```typescript
// TODO: 실제 구현 후 제거
function HairResultCard({ result }: { result: HairAnalysisResult | null }) {
  // 임시 스텁 코드
}
```

### 2. Mock 설정

테스트 실행 전 다음 Mock 설정 필요:

```typescript
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockSupabase,
}));
```

### 3. 비동기 테스트

비동기 데이터 로딩은 `waitFor` 사용:

```typescript
await waitFor(() => {
  expect(screen.getByText('웨이브')).toBeInTheDocument();
});
```

---

## 참조 문서

- [TEST-PLAN-H1-HAIR-ANALYSIS.md](c:\dev\yiroom\docs\TEST-PLAN-H1-HAIR-ANALYSIS.md) - 전체 테스트 계획
- [tests/CLAUDE.md](c:\dev\yiroom\apps\web\tests\CLAUDE.md) - 테스트 규칙
- [.claude/agents/yiroom-test-writer.md](c:\dev\yiroom.claude\agents\yiroom-test-writer.md) - 테스트 에이전트

---

## 다음 단계

1. [ ] 실제 HairResultCard 컴포넌트 구현
2. [ ] 실제 HairProductRecommendations 컴포넌트 구현
3. [ ] 실제 result/[id]/page.tsx 구현
4. [ ] 테스트 파일에서 임시 스텁 제거
5. [ ] 전체 테스트 실행 및 커버리지 확인
6. [ ] 누락된 테스트 케이스 추가
7. [ ] E2E 테스트 추가 (Playwright)

---

**Version**: 1.0
**Updated**: 2026-01-07
