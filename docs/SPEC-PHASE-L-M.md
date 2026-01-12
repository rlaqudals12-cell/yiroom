# Phase L/M 기술 스펙 문서

> 미구현/부분 구현 항목 종합 및 개발 계획

**작성일**: 2026-01-12
**버전**: 1.0

---

## 목차

1. [현황 요약](#1-현황-요약)
2. [Phase L: 사용자 온보딩 고도화](#2-phase-l-사용자-온보딩-고도화)
3. [Phase L-2: 자세 교정 시스템](#3-phase-l-2-자세-교정-시스템)
4. [Phase L-3: 패션 고도화](#4-phase-l-3-패션-고도화)
5. [Phase M: 영양 고도화](#5-phase-m-영양-고도화)
6. [DB 스키마 변경](#6-db-스키마-변경)
7. [구현 우선순위](#7-구현-우선순위)
8. [기술 의존성](#8-기술-의존성)

---

## 1. 현황 요약

### 1.1 미구현 항목

| 항목                     | 현재 상태      | 필요 작업                 | 우선순위  |
| ------------------------ | -------------- | ------------------------- | --------- |
| **성별 선택 온보딩**     | N-1에서만 수집 | 초기 온보딩에 성별 필수화 | 🔴 High   |
| **체지방률 입력**        | 타입만 정의됨  | 입력 필드 + DB 저장       | 🟡 Medium |
| **자세 교정 시뮬레이터** | Mock만 존재    | AI 분석 + 2D 오버레이     | 🟡 Medium |
| **베스트 운동 Top 5**    | 추천만 있음    | 목적별 랭킹 시스템        | 🟢 Low    |
| **힙합/스트릿 카테고리** | 없음           | 스타일 카테고리 확장      | 🟢 Low    |
| **냉장고 UI**            | DB만 존재      | 페이지 + 컴포넌트         | 🟡 Medium |
| **레시피 DB**            | 하드코딩 10개  | 테이블 + 100개 레시피     | 🟡 Medium |

### 1.2 부분 구현 항목

| 항목               | 현재 상태          | 필요 작업             |
| ------------------ | ------------------ | --------------------- |
| **옷 사이즈 추천** | BMI 기반 기초 로직 | 체형 + 상세 치수 연동 |
| **가상 피팅**      | 배경색 비교만      | 의류 오버레이 시뮬    |
| **자세 분석**      | Mock 데이터만      | Gemini AI 연동        |
| **레시피 매칭**    | 10개 고정          | 확장 + 세마틱 매칭    |

---

## 2. Phase L: 사용자 온보딩 고도화

### L-1: 성별 선택 온보딩 필수화

#### 2.1.1 현재 플로우

```
Clerk 회원가입 → /agreement (약관) → /dashboard → (선택) /nutrition/onboarding (성별 수집)
```

#### 2.1.2 변경 플로우

```
Clerk 회원가입 → /agreement (약관 + 성별) → /onboarding (분석 선택) → /dashboard
```

#### 2.1.3 구현 상세

**파일 수정**: `apps/web/app/agreement/page.tsx`

```typescript
// 약관 동의 페이지에 성별 선택 추가
interface AgreementFormData {
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  gender: 'male' | 'female'; // 새 필드 (필수)
}
```

**UI 컴포넌트**:

```tsx
<div className="space-y-3 mb-6">
  <label className="block text-sm font-medium">
    성별 <span className="text-red-500">*</span>
  </label>
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => setGender('male')}
      className={cn(
        'p-4 rounded-xl border-2 transition-all',
        gender === 'male' ? 'border-primary bg-primary/10' : 'border-border'
      )}
    >
      <span className="text-2xl">👨</span>
      <p className="mt-1 font-medium">남성</p>
    </button>
    <button
      onClick={() => setGender('female')}
      className={cn(
        'p-4 rounded-xl border-2 transition-all',
        gender === 'female' ? 'border-primary bg-primary/10' : 'border-border'
      )}
    >
      <span className="text-2xl">👩</span>
      <p className="mt-1 font-medium">여성</p>
    </button>
  </div>
</div>
```

**API 수정**: `apps/web/app/api/agreement/route.ts`

```typescript
// POST 요청에 gender 포함
const { termsAgreed, privacyAgreed, marketingAgreed, gender } = await req.json();

// users 테이블에도 gender 저장
await supabase.from('users').update({ gender }).eq('clerk_user_id', userId);
```

**타입 통일**: `apps/web/types/user.ts`

```typescript
// 기존 3가지 타입 통일
export type Gender = 'male' | 'female';

// DB 스키마 업데이트 (other 제거)
// ALTER TABLE users DROP CONSTRAINT users_gender_check;
// ALTER TABLE users ADD CONSTRAINT users_gender_check CHECK (gender IN ('male', 'female'));
```

---

### L-1-2: 키/몸무게/체지방 필수화

#### 2.2.1 입력 필드 구성

| 필드                     | 필수 여부 | 입력 위치        | 범위      |
| ------------------------ | --------- | ---------------- | --------- |
| 키 (height)              | ✅ 필수   | 패션/운동 온보딩 | 100-250cm |
| 몸무게 (weight)          | ✅ 필수   | 패션/운동 온보딩 | 20-200kg  |
| BMI                      | 자동 계산 | -                | 자동      |
| 체지방률 (bodyFat)       | 선택      | 패션/운동 온보딩 | 3-60%     |
| 목표 체중 (targetWeight) | 선택      | 운동 온보딩      | -         |

#### 2.2.2 입력 게이트 구현

**파일**: `apps/web/app/(main)/style/page.tsx` (수정)

```typescript
// 패션 페이지 진입 시 키/몸무게 체크
const { data: measurements } = await supabase
  .from('user_body_measurements')
  .select('height, weight')
  .eq('clerk_user_id', userId)
  .single();

if (!measurements?.height || !measurements?.weight) {
  redirect('/style/onboarding'); // 신체 정보 입력 페이지로 이동
}
```

**새 페이지**: `apps/web/app/(main)/style/onboarding/page.tsx`

```tsx
export default function StyleOnboardingPage() {
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);

  const bmi = height && weight ? Math.round((weight / (height / 100) ** 2) * 10) / 10 : null;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">맞춤 스타일링을 위해 알려주세요</h1>

      {/* 키 입력 */}
      <div className="mb-4">
        <label>키 (cm) *</label>
        <Input
          type="number"
          min={100}
          max={250}
          value={height || ''}
          onChange={(e) => setHeight(Number(e.target.value))}
        />
      </div>

      {/* 몸무게 입력 */}
      <div className="mb-4">
        <label>몸무게 (kg) *</label>
        <Input
          type="number"
          min={20}
          max={200}
          value={weight || ''}
          onChange={(e) => setWeight(Number(e.target.value))}
        />
      </div>

      {/* BMI 미리보기 */}
      {bmi && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p>
            BMI: <strong>{bmi}</strong> ({getBMICategory(bmi)})
          </p>
        </div>
      )}

      {/* 체지방률 (선택) */}
      <div className="mb-4">
        <label>체지방률 (%) - 선택</label>
        <Input
          type="number"
          min={3}
          max={60}
          value={bodyFat || ''}
          onChange={(e) => setBodyFat(Number(e.target.value))}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!height || !weight}>
        저장하고 시작하기
      </Button>
    </div>
  );
}
```

---

## 3. Phase L-2: 자세 교정 시스템

### 3.1 자세 분석 AI 통합

#### 3.1.1 현재 상태

- Mock 데이터만 존재 (`lib/mock/posture-analysis.ts`)
- 6가지 자세 타입 정의됨: ideal, forward_head, rounded_shoulders, swayback, flatback, lordosis
- UI 컴포넌트 존재: `PostureResultCard.tsx`, `StretchingRecommendation.tsx`

#### 3.1.2 구현 계획

**Gemini 프롬프트 추가**: `lib/gemini.ts`

```typescript
export async function analyzePosture(imageBase64: string): Promise<PostureAnalysisResult> {
  const prompt = `
당신은 전문 물리치료사 기반 AI 자세 분석가입니다.

📷 이미지 분석:
- 정면 또는 측면 전신 사진
- 배경에 수직 기준선 필요 시 가상으로 생성

📊 분석 항목:
1. 머리 전방 각도 (Head Forward Angle)
   - 정상: 0-15도
   - 거북목: 15도 이상

2. 어깨 대칭도 (Shoulder Symmetry)
   - 좌우 높이 차이 (cm)

3. 골반 기울기 (Pelvic Tilt)
   - 전방 경사: anterior
   - 후방 경사: posterior
   - 정상: neutral

4. 척추 곡률 (Spine Curvature)
   - 과전만: lordosis
   - 일자: flatback
   - 정상: normal

다음 JSON 형식으로 응답:
{
  "postureType": "ideal|forward_head|rounded_shoulders|swayback|flatback|lordosis",
  "overallScore": [0-100],
  "confidence": [0-100],
  "measurements": {
    "headForwardAngle": [도],
    "shoulderDifference": [cm],
    "pelvicTilt": "anterior|posterior|neutral",
    "spineCurvature": "lordosis|flatback|normal"
  },
  "issues": ["문제1", "문제2"],
  "recommendedStretches": ["운동ID1", "운동ID2"]
}
`;

  // Gemini API 호출
  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    { text: prompt },
  ]);

  return parsePostureResult(result);
}
```

#### 3.1.3 2D 오버레이 시뮬레이터

**새 컴포넌트**: `components/analysis/visual/PostureSimulator.tsx`

```tsx
interface PostureSimulatorProps {
  imageUrl: string;
  measurements: PostureMeasurements;
  showGuides: boolean;
}

export function PostureSimulator({ imageUrl, measurements, showGuides }: PostureSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (showGuides) {
        // 수직 기준선 (녹색)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        // 머리 전방 각도 표시 (빨간색)
        if (measurements.headForwardAngle > 15) {
          ctx.strokeStyle = '#ef4444';
          ctx.setLineDash([]);
          // 각도 호 그리기...
        }

        // 어깨 수평선 (파란색)
        ctx.strokeStyle = '#3b82f6';
        // ...
      }
    };
  }, [imageUrl, measurements, showGuides]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full" />
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button size="sm" variant="outline">
          교정 전
        </Button>
        <Button size="sm" variant="default">
          교정 후 예상
        </Button>
      </div>
    </div>
  );
}
```

### 3.2 목적별 운동 Best 5

#### 3.2.1 구현 상세

**새 파일**: `lib/workout/best5-generator.ts`

```typescript
export type ExerciseGoal =
  | 'posture_correction' // 자세 교정
  | 'weight_loss' // 체중 감량
  | 'muscle_gain' // 근육 증가
  | 'flexibility' // 유연성
  | 'endurance'; // 지구력

export interface Best5Result {
  goal: ExerciseGoal;
  exercises: ExerciseRecommendation[];
  totalDuration: number;
  estimatedCalories: number;
}

// 자세 문제별 교정 운동 매핑
const POSTURE_EXERCISES: Record<PostureType, string[]> = {
  forward_head: [
    'chin-tuck',
    'neck-stretch',
    'upper-trap-stretch',
    'wall-angel',
    'thoracic-extension',
  ],
  rounded_shoulders: [
    'chest-stretch',
    'band-pull-apart',
    'face-pull',
    'external-rotation',
    'prone-y-raise',
  ],
  swayback: ['dead-bug', 'hip-flexor-stretch', 'glute-bridge', 'plank', 'bird-dog'],
  flatback: ['cat-cow', 'lumbar-extension', 'superman', 'child-pose', 'cobra'],
  lordosis: ['pelvic-tilt', 'glute-bridge', 'plank', 'dead-bug', 'hamstring-stretch'],
  ideal: ['full-body-stretch', 'light-cardio', 'yoga-flow', 'foam-rolling', 'breathing'],
};

export function generateBest5(
  goal: ExerciseGoal,
  userProfile?: {
    postureType?: PostureType;
    bodyType?: BodyType;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  }
): Best5Result {
  // 목표별 운동 선택 로직
  let exerciseIds: string[];

  if (goal === 'posture_correction' && userProfile?.postureType) {
    exerciseIds = POSTURE_EXERCISES[userProfile.postureType];
  } else {
    exerciseIds = GOAL_EXERCISES[goal];
  }

  // 운동 상세 정보 조회
  const exercises = exerciseIds.map((id) => getExerciseById(id));

  return {
    goal,
    exercises,
    totalDuration: exercises.reduce((sum, e) => sum + e.duration, 0),
    estimatedCalories: exercises.reduce((sum, e) => sum + e.calories, 0),
  };
}
```

#### 3.2.2 UI 컴포넌트

**새 컴포넌트**: `components/workout/Best5Card.tsx`

```tsx
interface Best5CardProps {
  goal: ExerciseGoal;
  postureType?: PostureType;
}

export function Best5Card({ goal, postureType }: Best5CardProps) {
  const { exercises, totalDuration, estimatedCalories } = useMemo(
    () => generateBest5(goal, { postureType }),
    [goal, postureType]
  );

  const goalLabels: Record<ExerciseGoal, { icon: string; title: string }> = {
    posture_correction: { icon: '🧘', title: '자세 교정' },
    weight_loss: { icon: '🔥', title: '체중 감량' },
    muscle_gain: { icon: '💪', title: '근육 증가' },
    flexibility: { icon: '🤸', title: '유연성' },
    endurance: { icon: '🏃', title: '지구력' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{goalLabels[goal].icon}</span>
          {goalLabels[goal].title} Best 5
        </CardTitle>
        <CardDescription>
          총 {totalDuration}분 | 약 {estimatedCalories}kcal 소모
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {exercises.map((exercise, index) => (
            <li key={exercise.id} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-muted-foreground">
                  {exercise.duration}분 | {exercise.targetArea}
                </p>
              </div>
              <Button size="sm" variant="ghost">
                상세
              </Button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Phase L-3: 패션 고도화

### 4.1 스타일 카테고리 확장

#### 4.1.1 현재 카테고리 (7개)

- casual, formal, street, minimal, sporty, classic, preppy

#### 4.1.2 추가 카테고리 (3개)

```typescript
// lib/fashion/best10-generator.ts 수정
export type StyleCategory =
  | 'casual'
  | 'formal'
  | 'street'
  | 'minimal'
  | 'sporty'
  | 'classic'
  | 'preppy'
  | 'hiphop' // 힙합 (새로 추가)
  | 'romantic' // 로맨틱 (새로 추가)
  | 'workwear'; // 워크웨어 (새로 추가)

export const STYLE_CATEGORY_LABELS: Record<StyleCategory, string> = {
  // 기존...
  hiphop: '힙합',
  romantic: '로맨틱',
  workwear: '워크웨어',
};

// 카테고리 설명
export const STYLE_CATEGORY_DESCRIPTIONS: Record<StyleCategory, string> = {
  casual: '편안하면서도 스타일리시한 일상 코디',
  formal: '비즈니스와 공식 자리를 위한 격식있는 스타일',
  street: '트렌디하고 개성있는 스트릿 패션',
  minimal: '군더더기 없는 깔끔하고 세련된 스타일',
  sporty: '활동적이고 건강한 이미지의 스포티 룩',
  classic: '시대를 초월하는 클래식한 스타일',
  preppy: '단정하고 지적인 프레피 스타일',
  hiphop: '오버사이즈와 스트릿 감성의 힙합 스타일',
  romantic: '여성스럽고 우아한 로맨틱 스타일',
  workwear: '실용적이고 튼튼한 워크웨어 스타일',
};
```

#### 4.1.3 힙합 스타일 데이터

```typescript
// 힙합 Best 10 코디
const HIPHOP_OUTFITS: OutfitRecommendation[] = [
  {
    id: 'hiphop-1',
    name: '오버사이즈 후디 레이어드',
    description: '편안하면서 트렌디한 힙합 기본 룩',
    items: [
      { type: 'top', name: '오버사이즈 후디', color: 'black', brand: 'Supreme' },
      { type: 'inner', name: '롱 티셔츠', color: 'white' },
      { type: 'bottom', name: '와이드 카고팬츠', color: 'khaki' },
      { type: 'shoes', name: '에어포스1', color: 'white', brand: 'Nike' },
      { type: 'accessory', name: '체인 목걸이', material: 'silver' },
    ],
    occasions: ['casual', 'hangout'],
    seasons: ['spring', 'autumn'],
    personalColors: ['autumn', 'winter'],
  },
  // ... 9개 더
];
```

### 4.2 옷 사이즈 추천 고도화

#### 4.2.1 체형 + 치수 연동

**파일 수정**: `lib/smart-matching/size-recommend.ts`

```typescript
export interface EnhancedSizeRecommendation {
  size: ClothingSize;
  confidence: number;
  reasoning: string;
  adjustments?: {
    reason: string;
    fromSize: ClothingSize;
    toSize: ClothingSize;
  };
}

export function recommendSizeEnhanced(
  product: Product,
  userProfile: {
    height: number;
    weight: number;
    bodyType: BodyType;
    measurements?: UserBodyMeasurements;
    preferredFit: 'tight' | 'regular' | 'loose';
  }
): EnhancedSizeRecommendation {
  // 1. 기본 BMI 기반 추론
  const bmi = userProfile.weight / (userProfile.height / 100) ** 2;
  let baseSize = bmiToSize(bmi);

  // 2. 체형별 조정
  const bodyTypeAdjustment = BODY_TYPE_SIZE_ADJUSTMENTS[userProfile.bodyType];
  if (bodyTypeAdjustment[product.category]) {
    baseSize = adjustSize(baseSize, bodyTypeAdjustment[product.category]);
  }

  // 3. 상세 치수 기반 조정 (있는 경우)
  if (userProfile.measurements) {
    const measurementSize = measurementsToSize(
      userProfile.measurements,
      product.category,
      product.sizeChart
    );
    if (measurementSize !== baseSize) {
      // 더 정확한 치수 기반 사이즈 우선
      baseSize = measurementSize;
    }
  }

  // 4. 선호 핏 반영
  if (userProfile.preferredFit === 'tight') {
    baseSize = adjustSizeDown(baseSize);
  } else if (userProfile.preferredFit === 'loose') {
    baseSize = adjustSizeUp(baseSize);
  }

  return {
    size: baseSize,
    confidence: calculateConfidence(userProfile),
    reasoning: generateReasoning(userProfile, baseSize),
  };
}

// 체형별 사이즈 조정 규칙
const BODY_TYPE_SIZE_ADJUSTMENTS: Record<BodyType, Partial<Record<ClothingCategory, number>>> = {
  // S/W/N 체형 (새 체형 시스템)
  S: { top: 0, bottom: 0 }, // 스트레이트: 표준
  W: { top: 0, bottom: 1 }, // 웨이브: 하의 한 사이즈 업
  N: { top: 1, bottom: 0 }, // 내추럴: 상의 한 사이즈 업 (어깨 넓음)

  // 레거시 체형 (8타입)
  X: { top: 0, bottom: 0 }, // 모래시계: 표준
  A: { top: -1, bottom: 1 }, // 배(하체발달): 상의 다운, 하의 업
  V: { top: 1, bottom: -1 }, // 역삼각(상체발달): 상의 업, 하의 다운
  H: { top: 0, bottom: 0 }, // 직사각: 표준
  O: { top: 1, bottom: 1 }, // 원형: 전체 업
};
```

---

## 5. Phase M: 영양 고도화

### 5.1 냉장고 UI 구현

#### 5.1.1 페이지 구조

```
apps/web/app/(main)/inventory/pantry/
├── page.tsx              # 냉장고 목록
├── add/page.tsx          # 재료 추가
└── [id]/
    └── edit/page.tsx     # 재료 수정
```

#### 5.1.2 메인 페이지

**파일**: `apps/web/app/(main)/inventory/pantry/page.tsx`

```tsx
export default async function PantryPage() {
  const supabase = createClerkSupabaseClient();
  const { userId } = await auth();

  // 냉장고 재료 조회
  const { data: items } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('category', 'pantry')
    .order('expiry_date', { ascending: true });

  // 만료 임박 재료 (3일 이내)
  const expiringItems = items?.filter((item) => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(new Date(item.expiry_date), new Date());
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  });

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">내 냉장고</h1>
        <Button asChild>
          <Link href="/inventory/pantry/add">
            <Plus className="w-4 h-4 mr-2" />
            재료 추가
          </Link>
        </Button>
      </div>

      {/* 만료 임박 경고 */}
      {expiringItems && expiringItems.length > 0 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{expiringItems.length}개 재료가 곧 만료됩니다!</AlertDescription>
        </Alert>
      )}

      {/* 보관 위치별 탭 */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="refrigerator">냉장</TabsTrigger>
          <TabsTrigger value="freezer">냉동</TabsTrigger>
          <TabsTrigger value="room">상온</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PantryGrid items={items} />
        </TabsContent>
        {/* 다른 탭들... */}
      </Tabs>

      {/* 레시피 추천 CTA */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>이 재료로 뭘 만들까요?</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/nutrition/recipes">레시피 추천 받기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 5.1.3 재료 추가 페이지

**파일**: `apps/web/app/(main)/inventory/pantry/add/page.tsx`

```tsx
export default function AddPantryItemPage() {
  const [formData, setFormData] = useState<PantryItemForm>({
    name: '',
    brand: '',
    quantity: 1,
    unit: 'g',
    storageType: 'refrigerator',
    expiryDate: null,
    imageUrl: null,
  });

  return (
    <div className="container max-w-md py-6">
      <h1 className="text-2xl font-bold mb-6">재료 추가</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이미지 업로드 */}
        <ImageUpload
          value={formData.imageUrl}
          onChange={(url) => setFormData({ ...formData, imageUrl: url })}
        />

        {/* 재료명 */}
        <div>
          <Label>재료명 *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 닭가슴살"
          />
        </div>

        {/* 브랜드 (선택) */}
        <div>
          <Label>브랜드</Label>
          <Input
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="예: 하림"
          />
        </div>

        {/* 수량 + 단위 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>수량 *</Label>
            <Input
              type="number"
              min={0}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>단위 *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="개">개</SelectItem>
                <SelectItem value="팩">팩</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 보관 위치 */}
        <div>
          <Label>보관 위치 *</Label>
          <RadioGroup
            value={formData.storageType}
            onValueChange={(value) =>
              setFormData({ ...formData, storageType: value as StorageType })
            }
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="refrigerator" id="refrigerator" />
              <Label htmlFor="refrigerator">🧊 냉장</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="freezer" id="freezer" />
              <Label htmlFor="freezer">❄️ 냉동</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="room" id="room" />
              <Label htmlFor="room">🏠 상온</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 유통기한 */}
        <div>
          <Label>유통기한</Label>
          <Input
            type="date"
            value={formData.expiryDate || ''}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full">
          추가하기
        </Button>
      </form>
    </div>
  );
}
```

### 5.2 레시피 DB 확장

#### 5.2.1 마이그레이션

**파일**: `supabase/migrations/202601120100_recipes.sql`

```sql
-- 레시피 테이블
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,

  -- 영양 정보
  calories INTEGER,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fat DECIMAL(5,1),

  -- 메타데이터
  cook_time INTEGER,                    -- 분 단위
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  servings INTEGER DEFAULT 1,

  -- 목표 태그
  nutrition_goals TEXT[],               -- ['diet', 'bulk', 'lean', 'maintenance']
  tags TEXT[],                          -- 검색용 태그

  -- 조리법
  steps JSONB NOT NULL,                 -- ["1단계", "2단계", ...]
  tips TEXT[],                          -- 요리 팁

  image_url TEXT,
  source TEXT,                          -- 출처

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 레시피 재료 테이블
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                   -- 재료명
  amount DECIMAL(10,2),                 -- 양
  unit TEXT,                            -- 단위 (g, ml, 개, 큰술 등)

  is_optional BOOLEAN DEFAULT false,    -- 선택 재료 여부
  category TEXT,                        -- vegetable, meat, seafood, dairy, grain, seasoning

  notes TEXT,                           -- 추가 설명 (예: "다진 것")

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 즐겨찾기 레시피
CREATE TABLE public.user_favorite_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (clerk_user_id, recipe_id)
);

-- 인덱스
CREATE INDEX idx_recipes_nutrition_goals ON recipes USING GIN (nutrition_goals);
CREATE INDEX idx_recipes_tags ON recipes USING GIN (tags);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(name);
CREATE INDEX idx_user_favorite_recipes_user ON user_favorite_recipes(clerk_user_id);

-- RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_recipes ENABLE ROW LEVEL SECURITY;

-- 레시피/재료는 모두 읽기 가능
CREATE POLICY "recipes_read" ON recipes FOR SELECT USING (true);
CREATE POLICY "recipe_ingredients_read" ON recipe_ingredients FOR SELECT USING (true);

-- 즐겨찾기는 본인만
CREATE POLICY "user_favorite_recipes_own" ON user_favorite_recipes
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');
```

#### 5.2.2 시드 데이터 (100개 레시피)

```sql
-- supabase/seed/recipes.sql
INSERT INTO recipes (name, description, calories, protein, carbs, fat, cook_time, difficulty, nutrition_goals, steps) VALUES
('닭가슴살 샐러드', '단백질 가득 다이어트 샐러드', 280, 35, 10, 8, 15, 'easy', ARRAY['diet', 'lean'], '["닭가슴살 굽기", "채소 손질", "드레싱 뿌리기"]'),
('소고기 덮밥', '든든한 한 끼 벌크업 메뉴', 650, 35, 70, 20, 25, 'easy', ARRAY['bulk', 'maintenance'], '["소고기 볶기", "양념장 만들기", "밥 위에 올리기"]'),
-- ... 98개 더
```

---

## 6. DB 스키마 변경

### 6.1 users 테이블 수정

```sql
-- 성별 제약조건 수정 (other 제거)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE users ADD CONSTRAINT users_gender_check
  CHECK (gender IN ('male', 'female'));

-- 체지방률 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,1)
  CHECK (body_fat_percentage >= 3 AND body_fat_percentage <= 60);

COMMENT ON COLUMN users.body_fat_percentage IS '체지방률 (3-60%)';
```

### 6.2 자세 분석 테이블 추가

```sql
-- 자세 분석 결과
CREATE TABLE public.posture_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 분석 결과
  posture_type TEXT NOT NULL CHECK (posture_type IN (
    'ideal', 'forward_head', 'rounded_shoulders',
    'swayback', 'flatback', 'lordosis'
  )),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),

  -- 측정값
  measurements JSONB NOT NULL,
  -- {
  --   "headForwardAngle": 20,
  --   "shoulderDifference": 2.5,
  --   "pelvicTilt": "anterior",
  --   "spineCurvature": "normal"
  -- }

  -- 문제점 및 추천
  issues TEXT[],
  recommended_stretches TEXT[],            -- 운동 ID 배열

  -- 이미지
  front_image_url TEXT,
  side_image_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT fk_user FOREIGN KEY (clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_posture_assessments_user ON posture_assessments(clerk_user_id);
CREATE INDEX idx_posture_assessments_created ON posture_assessments(created_at DESC);

-- RLS
ALTER TABLE posture_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posture_own" ON posture_assessments
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');
```

---

## 7. 구현 우선순위

### 7.1 Phase L (1차)

| 순서  | 태스크                | 예상 작업량 | 의존성 |
| ----- | --------------------- | ----------- | ------ |
| L-1-1 | 성별 선택 온보딩      | 4시간       | -      |
| L-1-2 | 키/몸무게 필수 게이트 | 3시간       | L-1-1  |
| L-1-3 | 체지방률 입력 필드    | 2시간       | L-1-2  |
| L-2-1 | 자세 분석 AI 프롬프트 | 4시간       | -      |
| L-2-2 | 자세 시뮬레이터 UI    | 6시간       | L-2-1  |
| L-2-3 | 운동 Best 5 생성기    | 4시간       | L-2-1  |

### 7.2 Phase L (2차)

| 순서  | 태스크                        | 예상 작업량 | 의존성 |
| ----- | ----------------------------- | ----------- | ------ |
| L-3-1 | 힙합/로맨틱/워크웨어 카테고리 | 3시간       | -      |
| L-3-2 | 옷 사이즈 추천 고도화         | 5시간       | -      |
| L-3-3 | 가상 피팅 시뮬레이터          | 8시간       | -      |

### 7.3 Phase M

| 순서  | 태스크                     | 예상 작업량 | 의존성 |
| ----- | -------------------------- | ----------- | ------ |
| M-1-1 | 냉장고 목록 페이지         | 4시간       | -      |
| M-1-2 | 재료 추가/수정 페이지      | 4시간       | M-1-1  |
| M-1-3 | 만료 알림 기능             | 3시간       | M-1-1  |
| M-2-1 | 레시피 DB 마이그레이션     | 2시간       | -      |
| M-2-2 | 레시피 시드 데이터 (100개) | 6시간       | M-2-1  |
| M-2-3 | 레시피 매칭 고도화         | 4시간       | M-2-2  |

---

## 8. 기술 의존성

### 8.1 패키지

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0", // Gemini AI (기존)
    "date-fns": "^3.6.0" // 날짜 계산 (기존)
  }
}
```

### 8.2 환경변수

```bash
# 기존 (변경 없음)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

### 8.3 관련 문서

- `docs/DATABASE-SCHEMA.md` - 테이블 구조
- `docs/SDD-WORKFLOW.md` - 개발 워크플로우
- `.claude/rules/prompt-engineering.md` - AI 프롬프트 가이드

---

**Version**: 1.0
**Author**: Claude Code
**Last Updated**: 2026-01-12
