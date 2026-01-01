# AI 분석 → 맞춤 추천 연결 구현 계획

> **Spec Reference**: `docs/SPEC-ANALYSIS-RECOMMENDATION-FLOW.md`
> **Created**: 2026-01-01

## 구현 순서

### Step 1: 제품 목록 쿼리 파라미터 지원 (선행 작업)

**파일**: `apps/mobile/app/products/index.tsx`

**변경 사항**:

```typescript
// 1. useLocalSearchParams 추가
import { useLocalSearchParams, router } from 'expo-router';

// 2. 쿼리 파라미터 파싱
const {
  skinType,
  concerns,
  season,
  category: initialCategory,
} = useLocalSearchParams<{
  skinType?: string;
  concerns?: string;
  season?: string;
  category?: string;
}>();

// 3. 초기 카테고리 설정
useEffect(() => {
  if (initialCategory) {
    setSelectedCategory(initialCategory);
  }
}, [initialCategory]);

// 4. 필터링 로직에 쿼리 파라미터 반영
const fetchProducts = useCallback(async () => {
  let filtered = MOCK_PRODUCTS;

  // 카테고리 필터
  if (selectedCategory !== 'all') {
    filtered = filtered.filter((p) => p.category === selectedCategory);
  }

  // 피부 타입 필터 (태그 기반)
  if (skinType) {
    filtered = filtered.filter((p) =>
      p.tags.some((tag) => tag.toLowerCase().includes(skinType.toLowerCase()))
    );
  }

  // 시즌 필터 (태그 기반)
  if (season) {
    const seasonMap = {
      Spring: '봄웜톤',
      Summer: '여름쿨톤',
      Autumn: '가을웜톤',
      Winter: '겨울쿨톤',
    };
    filtered = filtered.filter((p) =>
      p.tags.some((tag) => tag.includes(seasonMap[season] || season))
    );
  }

  // 매칭 점수순 정렬
  filtered = [...filtered].sort((a, b) => b.matchScore - a.matchScore);

  setProducts(filtered);
}, [selectedCategory, skinType, season]);
```

---

### Step 2: 체형 분석 결과 화면 수정

**파일**: `apps/mobile/app/(analysis)/body/result.tsx`

**변경 위치**: 결과 화면 하단 버튼 영역 (약 line 254-263)

**추가 코드**:

```tsx
// Primary 버튼: 운동 추천
<TouchableOpacity
  style={styles.primaryButton}
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(workout)/onboarding',
      params: {
        bodyType: result?.bodyType || '',
        bmi: result?.bmi?.toString() || '',
        fromAnalysis: 'body',
      },
    });
  }}
>
  <Text style={styles.primaryButtonText}>🏃 나에게 맞는 운동 추천</Text>
</TouchableOpacity>

// Secondary 버튼: 홈으로
<TouchableOpacity
  style={styles.secondaryButton}
  onPress={() => router.replace('/(tabs)')}
>
  <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
</TouchableOpacity>

// 텍스트 링크: 다시 분석
<TouchableOpacity onPress={() => router.replace('/(analysis)/body')}>
  <Text style={styles.retryLink}>다시 분석하기</Text>
</TouchableOpacity>
```

---

### Step 3: 피부 분석 결과 화면 수정

**파일**: `apps/mobile/app/(analysis)/skin/result.tsx`

**변경 위치**: 결과 화면 하단 버튼 영역 (약 line 246-256)

**추가 코드**:

```tsx
// Primary 버튼: 제품 추천
<TouchableOpacity
  style={styles.primaryButton}
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: {
        skinType: result?.skinType || '',
        concerns: result?.concerns?.join(',') || '',
        category: 'skincare',
      },
    });
  }}
>
  <Text style={styles.primaryButtonText}>🧴 피부 맞춤 제품 보기</Text>
</TouchableOpacity>

// Secondary 버튼: 홈으로
<TouchableOpacity
  style={styles.secondaryButton}
  onPress={() => router.replace('/(tabs)')}
>
  <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
</TouchableOpacity>

// 텍스트 링크: 다시 분석
<TouchableOpacity onPress={() => router.replace('/(analysis)/skin')}>
  <Text style={styles.retryLink}>다시 분석하기</Text>
</TouchableOpacity>
```

---

### Step 4: 퍼스널 컬러 결과 화면 수정

**파일**: `apps/mobile/app/(analysis)/personal-color/result.tsx`

**변경 위치**: 결과 화면 하단 버튼 영역 (약 line 192-202)

**추가 코드**:

```tsx
// Primary 버튼: 메이크업 추천
<TouchableOpacity
  style={styles.primaryButton}
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/products',
      params: {
        season: result?.season || '',
        tone: result?.tone || '',
        category: 'makeup',
      },
    });
  }}
>
  <Text style={styles.primaryButtonText}>💄 내 색상에 맞는 제품</Text>
</TouchableOpacity>

// Secondary 버튼: 홈으로
<TouchableOpacity
  style={styles.secondaryButton}
  onPress={() => router.replace('/(tabs)')}
>
  <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
</TouchableOpacity>

// 텍스트 링크: 다시 분석
<TouchableOpacity onPress={() => router.replace('/(analysis)/personal-color')}>
  <Text style={styles.retryLink}>다시 진단하기</Text>
</TouchableOpacity>
```

---

### Step 5: 스타일 추가 (공통)

각 결과 화면에 추가할 스타일:

```typescript
primaryButton: {
  backgroundColor: '#2e5afa',
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 24,
  alignItems: 'center',
  marginBottom: 12,
},
primaryButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
secondaryButton: {
  backgroundColor: '#f5f5f5',
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  alignItems: 'center',
  marginBottom: 16,
},
secondaryButtonText: {
  color: '#333',
  fontSize: 15,
},
retryLink: {
  color: '#666',
  fontSize: 14,
  textDecorationLine: 'underline',
},
```

---

## 검증 체크리스트

### 기능 테스트

- [x] 체형 분석 완료 → 운동 추천 버튼 동작
- [x] 피부 분석 완료 → 제품 추천 버튼 동작
- [x] 퍼스널 컬러 완료 → 제품 추천 버튼 동작
- [x] 쿼리 파라미터 전달 확인
- [x] 제품 목록 필터링 동작

### UI/UX 테스트

- [x] 라이트 모드 표시
- [x] 다크 모드 표시
- [x] Haptic 피드백 동작 (모바일)

### 코드 품질

- [x] TypeScript 타입체크 통과 (모바일 + 웹)
- [x] ESLint 경고 없음 (모바일 + 웹)
- [ ] 기존 테스트 통과

---

## 구현 결과

> **완료일**: 2026-01-01

### 수정된 파일

**모바일 앱 (apps/mobile)**:
| 파일 | 변경 사항 |
|------|----------|
| `app/products/index.tsx` | skinType, season 쿼리 파라미터 필터링 |
| `app/(analysis)/body/result.tsx` | 운동 추천 버튼 추가 |
| `app/(analysis)/skin/result.tsx` | 제품 추천 버튼 추가 |
| `app/(analysis)/personal-color/result.tsx` | 제품 추천 버튼 추가 |

**웹 앱 (apps/web)**:
| 파일 | 변경 사항 |
|------|----------|
| `components/products/ProductsPageClient.tsx` | skinType, season 파라미터 지원 |
| `app/(main)/analysis/body/result/[id]/page.tsx` | 운동 추천 버튼 추가 |
| `app/(main)/analysis/skin/result/[id]/page.tsx` | 제품 추천 버튼 추가 |
| `app/(main)/analysis/personal-color/result/[id]/page.tsx` | 제품 추천 버튼 추가 |

**총 수정 파일**: 8개 (모바일 4개 + 웹 4개)
