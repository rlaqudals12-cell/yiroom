# 체형×패션 조합 분석

> **ID**: COMBO-7
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/analysis/

---

## 1. 개요

### 1.1 체형별 스타일링 원리

```
목표: 시각적 균형 창출

┌─────────────────────────────────────────────────┐
│  체형 특성 → 강조/보완 전략 → 의류 선택         │
├─────────────────────────────────────────────────┤
│  좁은 어깨  →  어깨 강조   →  퍼프 슬리브       │
│  넓은 힙    →  상체 강조   →  V넥, 밝은 상의    │
│  직선 실루엣 → 곡선 추가   →  벨트, 페플럼      │
│  긴 상체    →  하체 강조   →  하이웨스트        │
└─────────────────────────────────────────────────┘
```

### 1.2 2025 트렌드와 체형 스타일링

```
2025 주요 트렌드:
- 와이드 팬츠 (편안함 선호)
- 플루이드 실루엣 (흐르는 라인)
- 하이웨스트 (허리 강조)
- 오버사이즈 블레이저 (구조적)
- A라인 드레스 (범용적)

특징: 타이트한 실루엣에서 편안한 실루엣으로 전환
```

---

## 2. 체형별 패션 매핑

### 2.1 상세 스타일링 가이드

```typescript
// lib/analysis/body-fashion-mapping.ts
export interface BodyTypeFashion {
  bodyType: BodyType;
  characteristics: string[];
  goals: string[];
  tops: ClothingRecommendation;
  bottoms: ClothingRecommendation;
  dresses: ClothingRecommendation;
  outerwear: ClothingRecommendation;
  accessories: string[];
  avoid: AvoidItem[];
  celebrities: string[]; // 참고 스타일
}

export const BODY_TYPE_FASHION_MAP: Record<BodyType, BodyTypeFashion> = {
  hourglass: {
    bodyType: 'hourglass',
    characteristics: ['균형 잡힌 어깨와 엉덩이', '잘록한 허리', '자연스러운 곡선'],
    goals: ['자연스러운 비율 유지', '허리 라인 강조'],
    tops: {
      recommended: [
        { item: '랩 탑', reason: '허리 강조' },
        { item: '핏티드 셔츠', reason: '곡선 따라감' },
        { item: 'V넥', reason: '비율 유지' },
        { item: '크롭 탑', reason: '허리 드러냄' },
      ],
      bestNecklines: ['V넥', '스쿱넥', '스위트하트'],
      bestSleeves: ['캡슬리브', '3/4 슬리브', '벨슬리브'],
    },
    bottoms: {
      recommended: [
        { item: '하이웨스트 팬츠', reason: '허리 강조' },
        { item: '펜슬 스커트', reason: '곡선 따라감' },
        { item: '플레어 팬츠', reason: '균형 유지' },
        { item: '미디 스커트', reason: '비율 좋음' },
      ],
      bestFits: ['하이라이즈', '미드라이즈'],
      bestLength: ['앵클', '미디', '맥시'],
    },
    dresses: {
      recommended: [
        { item: '랩 드레스', reason: '허리 강조, 범용적' },
        { item: '핏앤플레어', reason: '곡선 따라감' },
        { item: '바디콘', reason: '실루엣 강조' },
        { item: '벨티드 드레스', reason: '허리 포인트' },
      ],
    },
    outerwear: {
      recommended: [
        { item: '벨티드 코트', reason: '허리 강조' },
        { item: '핏티드 블레이저', reason: '곡선 따라감' },
        { item: '트렌치 코트', reason: '클래식' },
      ],
    },
    accessories: ['허리 강조하는 벨트', '중간 크기 핸드백', '적당한 굽 구두'],
    avoid: [
      { item: '박시한 옷', reason: '허리 라인 숨김' },
      { item: '너무 루즈한 실루엣', reason: '곡선 가림' },
    ],
    celebrities: ['김태희', '소피아 베르가라', '블레이크 라이블리'],
  },

  rectangle: {
    bodyType: 'rectangle',
    characteristics: ['어깨와 엉덩이 비슷', '허리 정의 적음', '직선적 라인'],
    goals: ['곡선 생성', '허리 정의 추가'],
    tops: {
      recommended: [
        { item: '페플럼 탑', reason: '허리 아래 볼륨으로 곡선 생성' },
        { item: '오프숄더', reason: '어깨 강조' },
        { item: '드레이프 탑', reason: '곡선 효과' },
        { item: '레이어드 탑', reason: '입체감 추가' },
      ],
      bestNecklines: ['스쿱넥', '스위트하트', '오프숄더'],
      bestSleeves: ['퍼프슬리브', '플러터슬리브'],
    },
    bottoms: {
      recommended: [
        { item: '부트컷', reason: '하체 곡선 추가' },
        { item: 'A라인 스커트', reason: '힙 볼륨 생성' },
        { item: '플리츠 스커트', reason: '하체 볼륨' },
        { item: '와이드 팬츠', reason: '곡선 효과' },
      ],
      bestFits: ['미드라이즈', '로우라이즈'],
      bestLength: ['미디', '풀렝스'],
    },
    dresses: {
      recommended: [
        { item: '벨티드 드레스', reason: '허리 정의' },
        { item: 'A라인 드레스', reason: '곡선 생성' },
        { item: '페플럼 드레스', reason: '허리 포인트' },
        { item: '티어드 드레스', reason: '볼륨 추가' },
      ],
    },
    outerwear: {
      recommended: [
        { item: '벨티드 코트', reason: '허리 정의' },
        { item: '크롭 재킷', reason: '허리 드러냄' },
        { item: '페플럼 블레이저', reason: '곡선 추가' },
      ],
    },
    accessories: ['스테이트먼트 벨트', '레이어드 목걸이', '볼륨감 있는 백'],
    avoid: [
      { item: '직선 실루엣 원피스', reason: '직선 강조' },
      { item: '박시한 옷 단독', reason: '형태 없어 보임' },
    ],
    celebrities: ['제시카', '니콜 키드먼', '킴벌리 가넷'],
  },

  pear: {
    bodyType: 'pear',
    characteristics: ['어깨보다 넓은 엉덩이', '잘록한 허리', '풍성한 하체'],
    goals: ['상하체 균형', '상체 강조', '하체 심플하게'],
    tops: {
      recommended: [
        { item: '보트넥', reason: '어깨 넓어 보이게' },
        { item: '스트라이프 탑', reason: '상체 확장 효과' },
        { item: '밝은 색상 탑', reason: '시선 상체로' },
        { item: '디테일 있는 상의', reason: '상체 강조' },
      ],
      bestNecklines: ['보트넥', '스퀘어넥', '오프숄더'],
      bestSleeves: ['퍼프슬리브', '볼륨슬리브', '플러터'],
    },
    bottoms: {
      recommended: [
        { item: '다크 컬러 팬츠', reason: '하체 축소 효과' },
        { item: 'A라인 스커트', reason: '힙 자연스럽게 커버' },
        { item: '부트컷', reason: '시선 분산' },
        { item: '와이드 레그', reason: '균형감' },
      ],
      bestFits: ['하이라이즈'],
      bestLength: ['풀렝스', '앵클'],
    },
    dresses: {
      recommended: [
        { item: '피트앤플레어', reason: '허리 강조, 하체 커버' },
        { item: 'A라인 드레스', reason: '범용적' },
        { item: '엠파이어 라인', reason: '허리 위 강조' },
      ],
    },
    outerwear: {
      recommended: [
        { item: '크롭 재킷', reason: '상체 비율 좋게' },
        { item: '숄더 패드 블레이저', reason: '어깨 확장' },
        { item: '힙 길이 코트', reason: '하체 커버' },
      ],
    },
    accessories: ['스테이트먼트 이어링', '스카프', '숄더 포인트 백'],
    avoid: [
      { item: '스키니진', reason: '하체 강조' },
      { item: '밝은 하의', reason: '시선 하체로' },
      { item: '힙 포켓 디테일', reason: '엉덩이 강조' },
    ],
    celebrities: ['제니퍼 로페즈', '비욘세', '샤키라'],
  },

  invertedTriangle: {
    bodyType: 'invertedTriangle',
    characteristics: ['넓은 어깨', '좁은 엉덩이', '탄탄한 상체'],
    goals: ['상하체 균형', '하체 강조', '어깨 부드럽게'],
    tops: {
      recommended: [
        { item: '심플한 V넥', reason: '어깨 좁아 보이게' },
        { item: '다크 컬러 탑', reason: '상체 축소' },
        { item: '소프트 소재', reason: '어깨 부드럽게' },
        { item: '랩 스타일', reason: '대각선 효과' },
      ],
      bestNecklines: ['V넥', '딥V넥', '홀터'],
      bestSleeves: ['레글런', '돌먼', '킴모노'],
    },
    bottoms: {
      recommended: [
        { item: '와이드 팬츠', reason: '하체 볼륨' },
        { item: '밝은 색상 팬츠', reason: '하체 강조' },
        { item: '플레어 스커트', reason: '힙 볼륨' },
        { item: '패턴 팬츠', reason: '시선 하체로' },
      ],
      bestFits: ['미드라이즈', '로우라이즈'],
      bestLength: ['풀렝스', '와이드'],
    },
    dresses: {
      recommended: [
        { item: 'A라인 드레스', reason: '하체 볼륨' },
        { item: '드롭 웨이스트', reason: '힙 강조' },
        { item: '스트레이트 실루엣', reason: '균형감' },
      ],
    },
    outerwear: {
      recommended: [
        { item: '롱 코트', reason: '세로 라인 강조' },
        { item: '심플한 블레이저', reason: '어깨 과장 방지' },
        { item: '카디건', reason: '부드러운 라인' },
      ],
    },
    accessories: ['스테이트먼트 벨트 (하체)', '힙 백', '볼드한 브레이슬릿'],
    avoid: [
      { item: '숄더패드', reason: '어깨 더 강조' },
      { item: '보트넥', reason: '어깨 확장 효과' },
      { item: '스키니 팬츠', reason: '상하 불균형' },
    ],
    celebrities: ['앤젤리나 졸리', '나오미 캠벨', '르네 젤위거'],
  },

  apple: {
    bodyType: 'apple',
    characteristics: ['넓은 중간 부분', '가는 팔다리', '풍만한 상체'],
    goals: ['중앙 슬림하게', '다리 강조', '세로 라인 생성'],
    tops: {
      recommended: [
        { item: '튜닉', reason: '배 부분 커버' },
        { item: 'V넥', reason: '세로 라인' },
        { item: '엠파이어 라인', reason: '가슴 아래 강조' },
        { item: '어두운 상의', reason: '중앙 축소' },
      ],
      bestNecklines: ['V넥', '스쿱넥', '딥V'],
      bestSleeves: ['3/4 슬리브', '롱슬리브'],
    },
    bottoms: {
      recommended: [
        { item: '스트레이트 팬츠', reason: '세로 라인' },
        { item: '부트컷', reason: '균형감' },
        { item: 'A라인 스커트', reason: '하체 강조' },
        { item: '하이웨스트', reason: '허리 정의' },
      ],
      bestFits: ['하이라이즈', '미드라이즈 컴포트'],
      bestLength: ['풀렝스', '미디'],
    },
    dresses: {
      recommended: [
        { item: '엠파이어 드레스', reason: '가슴 아래 강조' },
        { item: '랩 드레스', reason: '허리 정의' },
        { item: 'A라인 드레스', reason: '하체 볼륨' },
        { item: '시프트 드레스', reason: '편안함' },
      ],
    },
    outerwear: {
      recommended: [
        { item: '롱라인 카디건', reason: '세로 라인' },
        { item: '오픈 프론트 재킷', reason: '레이어링' },
        { item: '구조적 블레이저', reason: '형태 잡기' },
      ],
    },
    accessories: ['롱 목걸이', '숄 스카프', '핀힐'],
    avoid: [
      { item: '타이트한 옷', reason: '배 강조' },
      { item: '벨트 허리에', reason: '중간 강조' },
      { item: '크롭 탑', reason: '배 드러남' },
    ],
    celebrities: ['오프라 윈프리', '드류 배리모어', '퀸 라티파'],
  },
};
```

### 2.2 실루엣별 추천

```typescript
// lib/analysis/silhouette-recommendation.ts
export interface SilhouetteRecommendation {
  silhouette: string;
  description: string;
  bestFor: BodyType[];
  items: string[];
  stylingTip: string;
}

export const SILHOUETTE_RECOMMENDATIONS: SilhouetteRecommendation[] = [
  {
    silhouette: 'A-Line',
    description: '어깨에서 허리를 지나 밑단으로 갈수록 넓어지는 형태',
    bestFor: ['pear', 'rectangle', 'apple'],
    items: ['A라인 드레스', 'A라인 스커트', '플레어 코트'],
    stylingTip: '허리에서 자연스럽게 퍼지는 라인으로 하체 커버 및 곡선 생성',
  },
  {
    silhouette: 'Straight',
    description: '어깨부터 밑단까지 일직선으로 떨어지는 형태',
    bestFor: ['invertedTriangle', 'hourglass'],
    items: ['시프트 드레스', '스트레이트 팬츠', '컬럼 드레스'],
    stylingTip: '세로 라인 강조로 키가 커 보이고 슬림한 효과',
  },
  {
    silhouette: 'Fit and Flare',
    description: '상체에 피트되고 허리에서 퍼지는 형태',
    bestFor: ['hourglass', 'pear', 'rectangle'],
    items: ['핏앤플레어 드레스', '스케이터 스커트', '페플럼 탑'],
    stylingTip: '허리 강조와 하체 볼륨으로 여성스러운 실루엣',
  },
  {
    silhouette: 'Wide Leg',
    description: '힙에서부터 넓게 퍼지는 팬츠 실루엣',
    bestFor: ['invertedTriangle', 'rectangle', 'pear'],
    items: ['와이드 레그 팬츠', '팔라조 팬츠', '와이드 점프수트'],
    stylingTip: '하체 볼륨으로 상체와 균형, 편안하면서 시크한 룩',
  },
];
```

---

## 3. UI/UX 컴포넌트

### 3.1 체형별 스타일 가이드

```tsx
// components/analysis/BodyTypeFashionGuide.tsx
export function BodyTypeFashionGuide({
  bodyType,
}: {
  bodyType: BodyType;
}) {
  const guide = BODY_TYPE_FASHION_MAP[bodyType];

  return (
    <div data-testid="body-type-fashion-guide" className="space-y-6">
      <div className="flex items-center gap-4">
        <BodyTypeIcon type={bodyType} className="w-16 h-16" />
        <div>
          <h2 className="text-xl font-bold">
            {getBodyTypeKoreanName(bodyType)} 체형
          </h2>
          <p className="text-muted-foreground">
            {guide.characteristics.join(' · ')}
          </p>
        </div>
      </div>

      {/* 스타일링 목표 */}
      <Card>
        <CardHeader>
          <CardTitle>스타일링 목표</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {guide.goals.map((goal, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                {goal}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 추천 아이템 */}
      <Tabs defaultValue="tops">
        <TabsList className="w-full">
          <TabsTrigger value="tops">상의</TabsTrigger>
          <TabsTrigger value="bottoms">하의</TabsTrigger>
          <TabsTrigger value="dresses">원피스</TabsTrigger>
          <TabsTrigger value="outerwear">아우터</TabsTrigger>
        </TabsList>

        <TabsContent value="tops">
          <RecommendationList items={guide.tops.recommended} />
        </TabsContent>
        <TabsContent value="bottoms">
          <RecommendationList items={guide.bottoms.recommended} />
        </TabsContent>
        <TabsContent value="dresses">
          <RecommendationList items={guide.dresses.recommended} />
        </TabsContent>
        <TabsContent value="outerwear">
          <RecommendationList items={guide.outerwear.recommended} />
        </TabsContent>
      </Tabs>

      {/* 피해야 할 것 */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">피해야 할 것</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {guide.avoid.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-destructive">✗</span>
                <div>
                  <span className="font-medium">{item.item}</span>
                  <span className="text-muted-foreground"> - {item.reason}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 4. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] 체형별 패션 매핑 데이터
- [ ] 기본 스타일 가이드 UI
- [ ] 실루엣 추천

### 단기 적용 (P1)

- [ ] 트렌드 통합
- [ ] 쇼핑 링크 연동
- [ ] 룩북 생성

### 장기 적용 (P2)

- [ ] AI 스타일링 추천
- [ ] 가상 피팅
- [ ] 퍼스널컬러 통합

---

## 5. 참고 자료

- [AI Styling Guide (Glance)](https://glance.com/blogs/glanceai/fashion/how-to-dress-for-your-body-type-ai-guide)
- [Fashion Silhouette Types (TheVou)](https://thevou.com/blog/fashion-silhouette-types/)
- [Body Type Trends 2025 (Accio)](https://www.accio.com/business/new_body_type_trend)
- [Dressing for Body Types Spring 2025 (Medium)](https://shirleyjonesluke.medium.com/dressing-for-different-body-types-spring-2025-fashion-trends-0ccf3ae350ff)

---

**Version**: 1.0 | **Priority**: P1 High
