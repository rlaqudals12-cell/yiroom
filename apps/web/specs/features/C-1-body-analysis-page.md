# C-1 체형 분석 페이지 설계

> **Version**: 1.0
> **Status**: Draft
> **Date**: 2025-11-26

---

## 1. 개요

### 목표
사진 업로드 → 로딩 → 결과 Flow를 가진 C-1 체형 분석 페이지 구현

### 요구사항
- [x] `app/(main)/analysis/body/page.tsx` 생성
- [x] 기본 정보 입력 → 전신 사진 업로드 → 로딩 → 결과 Flow
- [x] Mock 데이터 사용 + Real AI 연동 (Week 5)
- [x] Hook Model 적용 (간단한 Action, 가변 Reward)
- [x] 한국어 UI

---

## 2. 파일 구조

```
app/
└── (main)/
    └── analysis/
        └── body/
            ├── page.tsx              # 메인 페이지 (Client Component)
            └── _components/          # 페이지 전용 컴포넌트
                ├── PhotoUpload.tsx   # Step 1: 전신 사진 업로드
                ├── AnalysisLoading.tsx  # Step 2: 분석 로딩
                └── AnalysisResult.tsx   # Step 3: 결과 표시

lib/
└── mock/
    └── body-analysis.ts          # Mock 데이터 및 타입 정의
```

---

## 3. Flow 설계

### Step 0: 기본 정보 입력 (InputForm) - Week 5 추가

```
┌─────────────────────────────────────┐
│  기본 정보 입력                      │
├─────────────────────────────────────┤
│                                     │
│   키: [___] cm                      │
│   체중: [___] kg                    │
│   목표 체중: [___] kg (선택)        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         [다음 단계로]               │
│                                     │
└─────────────────────────────────────┘
```

**추가 이유**: BMI 계산 및 맞춤 분석을 위해 키/체중 입력 단계 추가

### Step 1: 전신 사진 업로드 (PhotoUpload)

```
┌─────────────────────────────────────┐
│                                     │
│         🧍 전신 가이드              │
│         (사각형 오버레이)           │
│                                     │
├─────────────────────────────────────┤
│  💡 밝은 곳에서 전신이 보이게       │
│     촬영해주세요                    │
├─────────────────────────────────────┤
│                                     │
│   [📷 사진 촬영]    [🖼️ 갤러리]     │
│                                     │
└─────────────────────────────────────┘
```

**Hook Model - Action (간단한 행동)**:
- 전신 사진 1장만 업로드
- 촬영 또는 갤러리 선택
- 30초 내 분석 완료

### Step 2: 분석 로딩 (AnalysisLoading)

```
┌─────────────────────────────────────┐
│                                     │
│         ⏳ 분석 중...               │
│         [████████░░] 80%            │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  💡 "체형 비율을 분석합니다"        │
│                                     │
└─────────────────────────────────────┘
```

**로딩 팁 순환 (3초 간격)**:
1. "체형 비율을 분석합니다"
2. "어깨, 허리, 골반 라인을 측정 중"
3. "AI가 맞춤 스타일을 준비하고 있어요"
4. "거의 완료되었어요!"

### Step 3: 결과 화면 (AnalysisResult)

```
┌─────────────────────────────────────┐
│  체형 분석 결과                      │
├─────────────────────────────────────┤
│                                     │
│   체형 타입: X자형 🎯               │
│   "균형 잡힌 실루엣"                │
│                                     │
├─────────────────────────────────────┤
│  📊 비율 분석                        │
│  ─────────────────────────           │
│  어깨     [████████░░] 82           │
│  허리     [██████░░░░] 65           │
│  골반     [████████░░] 80           │
├─────────────────────────────────────┤
│  💪 강점                             │
│  • 상하체 균형이 좋아요              │
│  • 허리 라인이 잘 잡혀있어요         │
├─────────────────────────────────────┤
│  👗 추천 스타일 (가변 Reward)        │
│  "허리를 강조하는 벨트 코디가        │
│   당신의 체형을 더 돋보이게 해요"    │
├─────────────────────────────────────┤
│  ✅ 추천 아이템                      │
│  • 핏한 상의 + 하이웨이스트          │
│  • A라인 스커트                      │
│  • 와이드 팬츠                       │
├─────────────────────────────────────┤
│                                     │
│       [다시 분석하기]                │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Hook Model 적용

### Trigger (계기)
- 페이지 진입 시 "나에게 어울리는 스타일이 궁금하신가요?" 메시지
- CTA 버튼으로 즉시 행동 유도

### Action (간단한 행동)
- **전신 사진 1장**만 업로드
- 촬영 또는 갤러리 2가지 선택지
- 30초 이내 빠른 분석

### Reward (가변 보상)

**고정 보상**:
- 체형 타입 (8가지: X자, A자, V자, H자, O자, I자, Y자, 8자)
- 어깨/허리/골반 비율 시각화

**가변 보상** (핵심!):
1. **AI 스타일 인사이트**: 매번 다른 맞춤 조언
2. **추천 아이템**: 체형에 따라 달라지는 패션 가이드
3. **강점 분석**: 체형별 장점 강조

### Investment (투자)
- "다시 분석하기" 버튼으로 재방문 유도
- 분석 히스토리 저장 (향후 확장)

---

## 5. Mock 데이터 구조

```typescript
// lib/mock/body-analysis.ts

export type BodyType = 'X' | 'A' | 'V' | 'H' | 'O' | 'I' | 'Y' | '8';

export interface BodyMeasurement {
  name: string;           // 부위명 (한국어)
  value: number;          // 0-100
  description: string;    // 설명
}

export interface StyleRecommendation {
  item: string;           // 아이템명
  reason: string;         // 추천 이유
}

export interface BodyAnalysisResult {
  bodyType: BodyType;              // 체형 타입
  bodyTypeLabel: string;           // 한국어 라벨 (예: "X자형")
  bodyTypeDescription: string;     // 체형 설명
  measurements: BodyMeasurement[]; // 어깨/허리/골반
  strengths: string[];             // 강점 리스트
  insight: string;                 // AI 스타일 인사이트 (가변)
  styleRecommendations: StyleRecommendation[];
  analyzedAt: Date;
}

// 체형별 정보 (8가지)
export const BODY_TYPES = {
  X: {
    label: 'X자형',
    description: '균형 잡힌 실루엣',
    characteristics: '어깨와 골반이 비슷하고 허리가 잘록한 체형',
  },
  A: {
    label: 'A자형',
    description: '하체 볼륨형',
    characteristics: '골반이 어깨보다 넓고 하체가 발달한 체형',
  },
  V: {
    label: 'V자형',
    description: '상체 볼륨형',
    characteristics: '어깨가 넓고 상체가 발달한 체형',
  },
  H: {
    label: 'H자형',
    description: '일자형 실루엣',
    characteristics: '어깨, 허리, 골반이 비슷한 직선형 체형',
  },
  O: {
    label: 'O자형',
    description: '풍만한 실루엣',
    characteristics: '전체적으로 둥근 곡선의 체형',
  },
  I: {
    label: 'I자형',
    description: '슬림 직선형',
    characteristics: '전체적으로 가늘고 긴 직선형 체형',
  },
  Y: {
    label: 'Y자형',
    description: '어깨 강조형',
    characteristics: '어깨가 넓고 하체가 가는 역삼각형 체형',
  },
  '8': {
    label: '8자형',
    description: '글래머러스 곡선형',
    characteristics: '가슴과 골반이 풍만하고 허리가 매우 잘록한 체형',
  },
};

// 가변 보상을 위한 랜덤 인사이트 목록
export const STYLE_INSIGHTS = [
  "허리를 강조하는 벨트 코디가 당신의 체형을 더 돋보이게 해요",
  "V넥 상의로 시선을 위로 모아보세요",
  "하이웨이스트 팬츠가 다리를 길어 보이게 해줘요",
  "어깨 라인을 살린 재킷이 잘 어울려요",
  "A라인 스커트로 균형 잡힌 실루엣을 연출해보세요",
  "레이어드 스타일링으로 입체감을 더해보세요",
  "핏한 니트와 와이드 팬츠 조합을 추천해요",
];
```

---

## 6. 컴포넌트 상세 설계

### 6.1 page.tsx (메인 페이지)

```typescript
'use client';

type AnalysisStep = 'upload' | 'loading' | 'result';

export default function BodyAnalysisPage() {
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);

  // Step 전환 로직
  // 1. upload → 사진 선택 시 → loading
  // 2. loading → 3초 후 → result
  // 3. result → "다시 분석" 클릭 → upload
}
```

### 6.2 PhotoUpload.tsx

**Props**:
```typescript
interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
}
```

**UI 요소**:
- 전신 가이드 영역 (사각형 border)
- 촬영 팁 텍스트
- 촬영 버튼 (Camera 아이콘)
- 갤러리 버튼 (Image 아이콘)
- 숨겨진 file input (`accept="image/*"`)

### 6.3 AnalysisLoading.tsx

**Props**:
```typescript
interface AnalysisLoadingProps {
  onComplete: (result: BodyAnalysisResult) => void;
}
```

**동작**:
- 3초 타이머 후 Mock 결과 생성
- 프로그레스 바 애니메이션
- 3초 간격 팁 순환

### 6.4 AnalysisResult.tsx

**Props**:
```typescript
interface AnalysisResultProps {
  result: BodyAnalysisResult;
  onRetry: () => void;
}
```

**UI 요소**:
- 체형 타입 + 설명
- 어깨/허리/골반 비율 Progress Bar
- 강점 리스트
- AI 스타일 인사이트 카드 (하이라이트)
- 추천 아이템 리스트
- "다시 분석하기" 버튼

---

## 7. 스타일 가이드

### 체형별 컬러 인디케이터
```typescript
const getBodyTypeColor = (type: BodyType) => {
  const colors = {
    X: 'text-purple-500',   // 균형형
    A: 'text-pink-500',     // 하체형
    V: 'text-blue-500',     // 상체형
    H: 'text-green-500',    // 일자형
    O: 'text-orange-500',   // 풍만형
    I: 'text-cyan-500',     // 슬림형
    Y: 'text-indigo-500',   // 어깨형
    '8': 'text-rose-500',   // 곡선형
  };
  return colors[type];
};
```

### Tailwind 클래스 패턴
- 카드: `p-6 bg-white rounded-xl shadow-sm border`
- 섹션 간격: `space-y-6`
- 프로그레스 바: `h-2 bg-gray-200 rounded-full overflow-hidden`
- 버튼: shadcn/ui Button 컴포넌트 사용

---

## 8. 구현 순서

### Phase 1: 기본 구조 (필수) ✅
1. [x] `app/(main)/analysis/body/page.tsx` 생성
2. [x] `lib/mock/body-analysis.ts` Mock 데이터 생성
3. [x] Step 전환 로직 구현 (input → upload → loading → result)

### Phase 2: 컴포넌트 구현 ✅
4. [x] `InputForm.tsx` - 키/체중 입력 (Week 5 추가)
5. [x] `PhotoUpload.tsx` - 전신 사진 업로드 UI
6. [x] `AnalysisLoading.tsx` - 로딩 화면 + 팁 순환
7. [x] `AnalysisResult.tsx` - 결과 화면

### Phase 3: 마무리 ✅
8. [x] 반응형 스타일 적용
9. [x] 접근성 (aria-label 등) 추가
10. [x] 타입 체크 및 린트

---

## 9. 확장 고려사항

**Week 5 구현 완료:**
- [x] Supabase Storage 연동 (실제 이미지 저장)
- [x] Gemini Vision API 연동 (실제 AI 분석 + Mock 폴백)
- [x] 분석 히스토리 저장 (body_analyses 테이블)
- [x] PC 데이터 연동 (퍼스널 컬러 기반 색상 추천)
- [x] BMI 계산 기능

**향후 확장:**
- [ ] 베스트 제품 추천 기능
- [ ] 체형 변화 추적 기능

---

## 10. 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS v4 |
| 아이콘 | Lucide React |
| 상태관리 | React useState |
| 타입 | TypeScript |

---

**작성자**: Claude
**승인 대기**: 사용자
