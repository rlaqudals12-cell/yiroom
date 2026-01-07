# H-1 헤어 분석 테스트 계획

> **작성일**: 2026-01-07
> **대상 모듈**: H-1 헤어 분석 결과 페이지
> **테스트 목표 커버리지**: 70% 이상

---

## 1. 테스트 개요

### 1.1 테스트 대상

```yaml
컴포넌트:
  - HairResultCard: 헤어 분석 결과 카드
  - HairProductRecommendations: 헤어 제품 추천
  - app/(main)/analysis/hair/result/[id]/page.tsx: 결과 페이지

유틸리티:
  - lib/hair/analysis.ts: 헤어 분석 로직
  - lib/hair/product-recommendations.ts: 제품 추천 로직
```

### 1.2 참조 테스트 패턴

- `tests/components/feed/FeedCard.test.tsx` (컴포넌트 테스트 구조)
- `apps/web/app/(main)/analysis/skin/result/[id]/page.tsx` (결과 페이지 패턴)

### 1.3 테스트 우선순위

| 우선순위 | 항목                       | 커버리지 목표 |
| -------- | -------------------------- | ------------- |
| P0       | 결과 렌더링 (정상 케이스)  | 90%           |
| P0       | 에러 처리 (분석 결과 없음) | 90%           |
| P1       | 제품 추천 표시             | 80%           |
| P1       | 공유 버튼 동작             | 70%           |
| P2       | 탭 전환 (기본/상세)        | 70%           |
| P2       | 로딩 상태                  | 60%           |

---

## 2. 테스트 시나리오

### 2.1 HairResultCard 컴포넌트

#### 2.1.1 정상 케이스

```typescript
describe('HairResultCard', () => {
  describe('정상 케이스', () => {
    it('렌더링 성공', () => {
      // Given: 유효한 헤어 분석 결과
      const mockResult = {
        overallScore: 85,
        hairType: 'wavy',
        scalpHealth: 70,
        hairDensity: 80,
        recommendations: ['보습 샴푸 사용', '주 2회 두피 케어'],
      };

      // When: 컴포넌트 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 결과 카드 표시
      expect(screen.getByTestId('hair-result-card')).toBeInTheDocument();
    });

    it('헤어 타입 표시', () => {
      // Given: wavy 헤어 타입
      const mockResult = { hairType: 'wavy', overallScore: 85 };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 웨이브 타입 한글 표시
      expect(screen.getByText('웨이브')).toBeInTheDocument();
    });

    it('종합 점수 표시', () => {
      // Given: 85점 결과
      const mockResult = { overallScore: 85 };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 점수 표시
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('두피 건강도 표시', () => {
      // Given: 두피 건강도 70점
      const mockResult = { scalpHealth: 70 };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 두피 건강 지표 표시
      expect(screen.getByText(/두피 건강/)).toBeInTheDocument();
      expect(screen.getByText('70')).toBeInTheDocument();
    });

    it('모발 밀도 표시', () => {
      // Given: 모발 밀도 80점
      const mockResult = { hairDensity: 80 };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 밀도 지표 표시
      expect(screen.getByText(/모발 밀도/)).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('추천 사항 표시', () => {
      // Given: 3개 추천
      const mockResult = {
        recommendations: ['보습 샴푸 사용', '주 2회 두피 케어', '열 보호 제품 사용'],
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 모든 추천 표시
      expect(screen.getByText('보습 샴푸 사용')).toBeInTheDocument();
      expect(screen.getByText('주 2회 두피 케어')).toBeInTheDocument();
      expect(screen.getByText('열 보호 제품 사용')).toBeInTheDocument();
    });
  });

  describe('점수에 따른 상태 표시', () => {
    it('좋은 상태 (71-100)', () => {
      // Given: 85점 두피 건강
      const mockResult = { scalpHealth: 85 };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 좋은 상태 배지 표시
      expect(screen.getByText(/좋음/)).toBeInTheDocument();
    });

    it('보통 상태 (41-70)', () => {
      // Given: 60점 두피 건강
      const mockResult = { scalpHealth: 60 };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 보통 상태 배지 표시
      expect(screen.getByText(/보통/)).toBeInTheDocument();
    });

    it('주의 상태 (0-40)', () => {
      // Given: 30점 두피 건강
      const mockResult = { scalpHealth: 30 };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 주의 상태 배지 표시
      expect(screen.getByText(/주의/)).toBeInTheDocument();
    });
  });
});
```

#### 2.1.2 에러 케이스

```typescript
describe('에러 케이스', () => {
  it('결과 데이터 없을 때', () => {
    // Given: null 결과
    const mockResult = null;

    // When: 렌더링
    render(<HairResultCard result={mockResult} />);

    // Then: 에러 메시지 표시
    expect(screen.getByText(/분석 결과가 없습니다/)).toBeInTheDocument();
  });

  it('필수 필드 누락 시', () => {
    // Given: overallScore 누락
    const mockResult = { hairType: 'wavy' }; // overallScore 없음

    // When: 렌더링
    render(<HairResultCard result={mockResult} />);

    // Then: 기본값 표시 또는 경고
    expect(screen.getByText(/정보 부족/)).toBeInTheDocument();
  });
});
```

---

### 2.2 HairProductRecommendations 컴포넌트

#### 2.2.1 정상 케이스

```typescript
describe('HairProductRecommendations', () => {
  describe('정상 케이스', () => {
    it('헤어 타입별 제품 추천', () => {
      // Given: wavy 헤어 타입
      const hairType = 'wavy';

      // When: 렌더링
      render(<HairProductRecommendations hairType={hairType} />);

      // Then: 웨이브 헤어 전용 제품 표시
      expect(screen.getByText(/웨이브 전용/)).toBeInTheDocument();
    });

    it('두피 건강도에 따른 제품 필터링', () => {
      // Given: 낮은 두피 건강 (30점)
      const scalpHealth = 30;

      // When: 렌더링
      render(<HairProductRecommendations scalpHealth={scalpHealth} />);

      // Then: 두피 케어 제품 우선 표시
      expect(screen.getByText(/두피 케어/)).toBeInTheDocument();
    });

    it('제품 목록 표시', () => {
      // Given: 5개 추천 제품
      const mockProducts = [
        { id: '1', name: '보습 샴푸', category: 'shampoo' },
        { id: '2', name: '영양 컨디셔너', category: 'conditioner' },
        { id: '3', name: '헤어 오일', category: 'treatment' },
        { id: '4', name: '두피 스케일러', category: 'scalp_care' },
        { id: '5', name: '열 보호 스프레이', category: 'styling' },
      ];

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 모든 제품 표시
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
      });
    });

    it('제품 카테고리별 그룹핑', () => {
      // Given: 카테고리 혼재된 제품
      const mockProducts = [
        { id: '1', category: 'shampoo', name: '샴푸 A' },
        { id: '2', category: 'shampoo', name: '샴푸 B' },
        { id: '3', category: 'conditioner', name: '컨디셔너 A' },
      ];

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 카테고리 헤더 표시
      expect(screen.getByText('샴푸')).toBeInTheDocument();
      expect(screen.getByText('컨디셔너')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('추천 제품 없을 때', () => {
      // Given: 빈 제품 배열
      const mockProducts = [];

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 안내 메시지 표시
      expect(screen.getByText(/추천 제품이 없습니다/)).toBeInTheDocument();
    });

    it('제품 100개 이상 시 페이지네이션', () => {
      // Given: 150개 제품
      const mockProducts = Array.from({ length: 150 }, (_, i) => ({
        id: `${i}`,
        name: `제품 ${i}`,
      }));

      // When: 렌더링
      render(<HairProductRecommendations products={mockProducts} />);

      // Then: 첫 20개만 표시 + "더보기" 버튼
      expect(screen.getAllByRole('listitem')).toHaveLength(20);
      expect(screen.getByText(/더보기/)).toBeInTheDocument();
    });
  });
});
```

---

### 2.3 결과 페이지 (page.tsx)

#### 2.3.1 정상 케이스

```typescript
describe('HairAnalysisResultPage', () => {
  // Mock 설정
  beforeEach(() => {
    vi.mock('@clerk/nextjs', () => ({
      useAuth: () => ({ isSignedIn: true, isLoaded: true }),
    }));

    vi.mock('@/lib/supabase/clerk-client', () => ({
      useClerkSupabaseClient: () => mockSupabase,
    }));
  });

  describe('정상 케이스', () => {
    it('페이지 렌더링 성공', async () => {
      // Given: 유효한 분석 ID
      const analysisId = 'hair-123';

      // When: 페이지 접근
      render(<HairAnalysisResultPage params={{ id: analysisId }} />);

      // Then: 결과 페이지 표시
      await waitFor(() => {
        expect(screen.getByTestId('hair-result-page')).toBeInTheDocument();
      });
    });

    it('DB에서 분석 결과 조회', async () => {
      // Given: Supabase에 저장된 결과
      const mockData = {
        id: 'hair-123',
        clerk_user_id: 'user-1',
        hair_type: 'wavy',
        overall_score: 85,
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      // When: 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      // Then: DB 조회 및 결과 표시
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('hair_analyses');
        expect(screen.getByText('웨이브')).toBeInTheDocument();
      });
    });

    it('탭 전환 동작', async () => {
      // Given: 결과 페이지 로드 완료
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('기본 분석')).toBeInTheDocument();
      });

      // When: 상세 탭 클릭
      const detailTab = screen.getByText('상세 분석');
      fireEvent.click(detailTab);

      // Then: 상세 탭 활성화
      expect(detailTab).toHaveAttribute('aria-selected', 'true');
    });

    it('공유 버튼 클릭', async () => {
      // Given: 결과 페이지 로드 완료
      const mockShare = vi.fn();
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} onShare={mockShare} />);

      await waitFor(() => {
        expect(screen.getByText('공유하기')).toBeInTheDocument();
      });

      // When: 공유 버튼 클릭
      const shareButton = screen.getByText('공유하기');
      fireEvent.click(shareButton);

      // Then: 공유 함수 호출
      expect(mockShare).toHaveBeenCalled();
    });

    it('제품 추천 버튼 클릭', async () => {
      // Given: 결과 페이지 로드 완료
      const mockRouter = { push: vi.fn() };
      vi.mock('next/navigation', () => ({
        useRouter: () => mockRouter,
      }));

      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('헤어 맞춤 제품 보기')).toBeInTheDocument();
      });

      // When: 제품 추천 버튼 클릭
      const productButton = screen.getByText('헤어 맞춤 제품 보기');
      fireEvent.click(productButton);

      // Then: 제품 페이지로 이동
      expect(mockRouter.push).toHaveBeenCalledWith('/products?hairType=wavy&category=hair');
    });

    it('축하 효과 표시 (새 분석)', async () => {
      // Given: sessionStorage에 표시 이력 없음
      sessionStorage.clear();

      // When: 결과 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      // Then: 축하 효과 표시
      await waitFor(() => {
        expect(screen.getByText(/헤어 분석 완료!/)).toBeInTheDocument();
      });
    });

    it('축하 효과 미표시 (이전 분석)', async () => {
      // Given: sessionStorage에 표시 이력 있음
      sessionStorage.setItem('celebration-hair-hair-123', 'shown');

      // When: 결과 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      // Then: 축하 효과 미표시
      await waitFor(() => {
        expect(screen.queryByText(/헤어 분석 완료!/)).not.toBeInTheDocument();
      });
    });
  });

  describe('에러 케이스', () => {
    it('분석 결과 없을 때', async () => {
      // Given: DB에 해당 ID 없음
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      // When: 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'invalid-id' }} />);

      // Then: 에러 메시지 표시
      await waitFor(() => {
        expect(screen.getByText(/분석 결과를 찾을 수 없습니다/)).toBeInTheDocument();
      });
    });

    it('DB 조회 실패 시', async () => {
      // Given: Supabase 에러
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Network error'),
            }),
          }),
        }),
      });

      // When: 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      // Then: 에러 메시지 표시
      await waitFor(() => {
        expect(screen.getByText(/결과를 불러올 수 없습니다/)).toBeInTheDocument();
      });
    });

    it('비로그인 상태', async () => {
      // Given: 로그인 안 됨
      vi.mock('@clerk/nextjs', () => ({
        useAuth: () => ({ isSignedIn: false, isLoaded: true }),
      }));

      // When: 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      // Then: 로그인 안내 표시
      await waitFor(() => {
        expect(screen.getByText(/로그인이 필요합니다/)).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중 표시', () => {
      // Given: isLoaded=false
      vi.mock('@clerk/nextjs', () => ({
        useAuth: () => ({ isSignedIn: true, isLoaded: false }),
      }));

      // When: 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      // Then: 로딩 인디케이터 표시
      expect(screen.getByText(/결과를 불러오는 중/)).toBeInTheDocument();
    });

    it('로딩 스피너 표시', () => {
      // Given: isLoaded=false
      vi.mock('@clerk/nextjs', () => ({
        useAuth: () => ({ isSignedIn: true, isLoaded: false }),
      }));

      // When: 페이지 렌더링
      render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);

      // Then: 스피너 애니메이션
      expect(screen.getByRole('status')).toHaveClass('animate-spin');
    });
  });
});
```

---

## 3. Mock 데이터 정의

### 3.1 HairAnalysisResult 타입

```typescript
// lib/mock/hair-analysis.ts
export interface HairAnalysisResult {
  id: string;
  clerk_user_id: string;
  image_url: string;
  hair_type: 'straight' | 'wavy' | 'curly' | 'coily';
  scalp_health: number; // 0-100
  hair_density: number; // 0-100
  hair_thickness: number; // 0-100
  damage_level: number; // 0-100 (낮을수록 좋음)
  overall_score: number; // 0-100
  recommendations: string[];
  product_recommendations?: {
    shampoo: string[];
    conditioner: string[];
    treatment: string[];
    scalp_care: string[];
  };
  created_at: string;
}

export const mockHairAnalysisResult: HairAnalysisResult = {
  id: 'hair-123',
  clerk_user_id: 'user-1',
  image_url: 'https://example.com/hair.jpg',
  hair_type: 'wavy',
  scalp_health: 70,
  hair_density: 80,
  hair_thickness: 75,
  damage_level: 40,
  overall_score: 85,
  recommendations: ['보습 샴푸 사용', '주 2회 두피 케어', '열 보호 제품 사용'],
  product_recommendations: {
    shampoo: ['모이스처라이징 샴푸', '약산성 샴푸'],
    conditioner: ['실크 단백질 컨디셔너'],
    treatment: ['헤어 오일', '딥 트리트먼트 팩'],
    scalp_care: ['두피 스케일러', '두피 토닉'],
  },
  created_at: new Date().toISOString(),
};
```

---

## 4. 테스트 실행 계획

### 4.1 단계별 실행

```bash
# Phase 1: 컴포넌트 단위 테스트 (1일차)
npm run test -- tests/components/analysis/hair/HairResultCard.test.tsx
npm run test -- tests/components/analysis/hair/HairProductRecommendations.test.tsx

# Phase 2: 결과 페이지 통합 테스트 (2일차)
npm run test -- tests/pages/analysis/hair/result.test.tsx

# Phase 3: 전체 테스트 + 커버리지 (3일차)
npm run test:coverage -- tests/components/analysis/hair
npm run test:coverage -- tests/pages/analysis/hair
```

### 4.2 커버리지 목표

```yaml
HairResultCard: 85% 이상
HairProductRecommendations: 80% 이상
page.tsx: 75% 이상
전체: 70% 이상
```

---

## 5. 추가 테스트 항목

### 5.1 성능 테스트

```typescript
describe('성능', () => {
  it('1000개 제품 렌더링 시 3초 이내', async () => {
    const start = performance.now();
    render(<HairProductRecommendations products={largeProductList} />);
    const end = performance.now();
    expect(end - start).toBeLessThan(3000);
  });
});
```

### 5.2 접근성 테스트

```typescript
describe('접근성', () => {
  it('스크린 리더 호환', () => {
    render(<HairResultCard result={mockResult} />);
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', '헤어 분석 결과');
  });

  it('키보드 네비게이션', () => {
    render(<HairAnalysisResultPage params={{ id: 'hair-123' }} />);
    const tabList = screen.getByRole('tablist');
    expect(tabList).toBeInTheDocument();
  });
});
```

---

## 6. 체크리스트

```yaml
[x] 테스트 계획 수립
[ ] Mock 데이터 작성 (lib/mock/hair-analysis.ts)
[ ] HairResultCard 컴포넌트 테스트 작성
[ ] HairProductRecommendations 컴포넌트 테스트 작성
[ ] 결과 페이지 통합 테스트 작성
[ ] 전체 테스트 실행 및 커버리지 확인
[ ] 테스트 문서 업데이트
```

---

## 7. 참고 파일

| 파일                                                     | 역할            |
| -------------------------------------------------------- | --------------- |
| `tests/components/feed/FeedCard.test.tsx`                | 컴포넌트 참조   |
| `apps/web/app/(main)/analysis/skin/result/[id]/page.tsx` | 페이지 패턴     |
| `tests/CLAUDE.md`                                        | 테스트 규칙     |
| `.claude/agents/yiroom-test-writer.md`                   | 테스트 에이전트 |
| `docs/DATABASE-SCHEMA.md`                                | DB 스키마 참조  |

---

**Version**: 1.0
**Updated**: 2026-01-07
