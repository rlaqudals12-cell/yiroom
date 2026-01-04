# SDD: Beauty UX 개선 - 경쟁사 분석 기반

**버전**: 1.0
**작성일**: 2026-01-04
**상태**: 구현 완료

---

## 개요

경쟁사(화해, 올리브영, 무신사 뷰티, 글로우픽, 언니의파우치) 분석을 통해 도출된 5가지 핵심 UX 개선사항 구현.

### 경쟁사 분석 요약

| 경쟁사       | 강점                          | 이룸 적용 |
| ------------ | ----------------------------- | --------- |
| 화해         | AI 리뷰 키워드 요약, 타임딜   | #1, #3    |
| 글로우픽     | 긍정/부정 리뷰 필터           | #2        |
| 올리브영     | 셔터(SNS) 피드, 특가 섹션     | #3, #5    |
| 언니의파우치 | 리뷰 작성 포인트 시스템       | #4        |
| 무신사 뷰티  | 빠른 배송 표시, 브랜드 컬렉션 | 향후 적용 |

---

## 구현 항목

### #1 리뷰 AI 요약 키워드 (화해 스타일)

**파일**: `components/products/reviews/ReviewAIKeywords.tsx`

**기능**:

- 긍정/부정 키워드 TOP 5 추출
- AI 요약 문장 (1-2문장)
- 추천/주의 포인트 리스트
- 키워드 클릭 시 해당 감성 필터로 이동

**인터페이스**:

```typescript
interface ReviewAISummary {
  positiveKeywords: AIKeyword[]; // 긍정 키워드 (촉촉함, 흡수력 등)
  negativeKeywords: AIKeyword[]; // 부정 키워드 (끈적임, 향이 강함 등)
  summary: string; // AI 요약 문장
  recommendPoints: string[]; // 추천 포인트
  cautionPoints: string[]; // 주의 포인트
  analyzedCount: number; // 분석된 리뷰 수
}
```

**조건**: 리뷰 5개 이상일 때만 표시

---

### #2 긍정/부정 리뷰 필터 (글로우픽 스타일)

**파일**: `components/products/reviews/ReviewSentimentFilter.tsx`

**기능**:

- 전체/긍정/부정/포토 리뷰 필터링
- 각 필터별 리뷰 수 표시
- 색상 구분 (긍정: 초록, 부정: 빨강, 포토: 주황)

**타입**:

```typescript
type SentimentFilterType = 'all' | 'positive' | 'negative' | 'with_photo';
```

**감성 판단 기준**:

- 긍정: 별점 4-5점
- 부정: 별점 1-2점
- 중립: 별점 3점

---

### #3 타임딜/특가 섹션 (화해/올리브영 스타일)

**파일**: `components/beauty/TimeDealSection.tsx`

**기능**:

- 실시간 카운트다운 타이머 (오늘 자정까지)
- 할인율 배지 표시
- 재고 소진율 프로그레스 바
- "거의 소진!" 긴급 표시 (80% 이상 판매)
- 제품 슬라이더

**데이터 구조**:

```typescript
interface TimeDealProduct {
  id: string;
  name: string;
  brand: string;
  originalPrice: number;
  salePrice: number;
  discountRate: number; // 할인율 (40% 등)
  stock: number; // 총 재고
  soldCount: number; // 판매 수량
  // ...
}
```

**배치**: 피부타입 랭킹 섹션 아래, 제품 목록 위

---

### #4 리뷰 작성 포인트 시스템 (언니의파우치 스타일)

**파일**: `components/products/reviews/ReviewPointsBadge.tsx`

**기능**:

- 리뷰 작성 시 포인트 적립 안내
- 포인트 정책 상세 표시
- 첫 리뷰 보너스 배너
- 예상 포인트 계산

**포인트 정책**:

```typescript
interface ReviewPointPolicy {
  basePoints: number; // 기본 50P
  textBonus: number; // 50자 이상 +30P
  photoBonus: number; // 사진 첨부 +100P
  firstReviewBonus: number; // 첫 리뷰 +200P
  detailedBonus: number; // 200자 이상 +50P
}
```

**최대 적립**: 430P (첫 리뷰 + 상세 리뷰 + 사진)

---

### #5 SNS형 피드 강화 (올리브영 셔터 스타일)

**파일**: `components/beauty/BeautyFeed.tsx`

**기능**:

- 리뷰/루틴/팁 게시물 타입 구분
- 좋아요/댓글/저장 인터랙션
- 이미지 슬라이더
- 연관 제품 태그
- 인증 배지 표시
- 해시태그 클릭

**피드 아이템 타입**:

```typescript
interface FeedItem {
  id: string;
  type: 'review' | 'routine' | 'tip';
  user: {
    name: string;
    avatar: string;
    skinType: string;
    verified: boolean;
  };
  content: {
    text: string;
    images: string[];
    products?: Product[];
  };
  stats: {
    likes: number;
    comments: number;
    saves: number;
  };
  tags: string[];
}
```

**배치**: 제품 목록 아래, 스킨케어 루틴 위

---

## 통합 지점

### ReviewSection 통합 (리뷰 관련)

```typescript
// ReviewSection.tsx 수정 내역
import { ReviewAIKeywords } from './ReviewAIKeywords';
import { ReviewSentimentFilter } from './ReviewSentimentFilter';
import { ReviewPointsBadge } from './ReviewPointsBadge';

// 추가된 상태
const [sentimentFilter, setSentimentFilter] = useState<SentimentFilterType>('all');
const aiSummary = useMemo(() => generateMockAISummary(summary.totalCount), [summary]);
const filteredReviews = useMemo(
  () => filterBySentiment(reviews, sentimentFilter),
  [reviews, sentimentFilter]
);
```

### Beauty 페이지 통합

```typescript
// beauty/page.tsx 수정 내역
import { TimeDealSection } from '@/components/beauty/TimeDealSection';
import { BeautyFeed } from '@/components/beauty/BeautyFeed';

// 배치 순서
1. 내 피부 프로필
2. 필터 섹션
3. 카테고리 탭
4. 피부타입 랭킹 (hasAnalysis 시)
5. 타임딜 섹션 ← NEW
6. 제품 목록
7. SNS형 피드 ← NEW
8. 스킨케어 루틴
9. 피부나이 계산기
```

---

## 테스트 체크리스트

### #1 AI 키워드

- [ ] 리뷰 5개 미만일 때 숨김 확인
- [ ] 키워드 클릭 시 감성 필터 연동
- [ ] 펼치기/접기 애니메이션

### #2 감성 필터

- [ ] 전체/긍정/부정/포토 필터링 동작
- [ ] 리뷰 수 카운트 정확성
- [ ] 필터 선택 시 UI 피드백

### #3 타임딜

- [ ] 카운트다운 실시간 업데이트
- [ ] 자정 넘어갈 때 리셋
- [ ] 재고 소진율 계산 정확성
- [ ] 거의 소진 애니메이션

### #4 포인트 시스템

- [ ] 포인트 정책 상세 펼치기
- [ ] 첫 리뷰 보너스 배너 조건부 표시
- [ ] 예상 포인트 계산 정확성

### #5 SNS 피드

- [ ] 좋아요/저장 토글 동작
- [ ] 이미지 슬라이더 스와이프
- [ ] 연관 제품 클릭 라우팅
- [ ] 해시태그 검색 연동

---

## 향후 과제

### 백엔드 연동 필요

1. **AI 키워드 분석 API**
   - Gemini를 활용한 실제 리뷰 키워드 추출
   - 리뷰 배치 분석 스케줄러

2. **포인트 시스템 DB**
   - `user_points` 테이블 생성
   - 포인트 적립/사용 트랜잭션

3. **SNS 피드 DB**
   - `beauty_feed_posts` 테이블
   - `feed_likes`, `feed_saves` 테이블

4. **타임딜 관리**
   - 어드민 타임딜 등록 기능
   - 재고 실시간 동기화

### 추가 개선 아이디어

- 무신사 스타일 빠른 배송 표시
- 브랜드 컬렉션 페이지
- 리뷰어 등급 시스템
- 피드 알고리즘 개인화

---

## 관련 파일

### 신규 생성

- `components/beauty/TimeDealSection.tsx`
- `components/beauty/BeautyFeed.tsx`
- `components/products/reviews/ReviewAIKeywords.tsx`
- `components/products/reviews/ReviewSentimentFilter.tsx`
- `components/products/reviews/ReviewPointsBadge.tsx`

### 수정

- `components/beauty/dynamic.tsx` - Dynamic import 추가
- `app/(main)/beauty/page.tsx` - 새 컴포넌트 통합
- `components/products/reviews/ReviewSection.tsx` - 리뷰 관련 기능 통합
