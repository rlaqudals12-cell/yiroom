# S-1 피부 분석 페이지 설계

> **Version**: 1.0
> **Status**: Draft
> **Date**: 2025-11-26

---

## 1. 개요

### 목표
사진 업로드 → 로딩 → 결과 Flow를 가진 S-1 피부 분석 페이지 구현

### 요구사항
- [x] `app/(main)/analysis/skin/page.tsx` 생성
- [x] 사진 업로드 → 로딩 → 결과 Flow
- [x] Mock 데이터 사용
- [x] Hook Model 적용 (간단한 Action, 가변 Reward)
- [x] 한국어 UI

---

## 2. 파일 구조

```
app/
└── (main)/
    └── analysis/
        └── skin/
            ├── page.tsx              # 메인 페이지 (Client Component)
            └── _components/          # 페이지 전용 컴포넌트
                ├── PhotoUpload.tsx   # Step 1: 사진 업로드
                ├── AnalysisLoading.tsx  # Step 2: 분석 로딩
                └── AnalysisResult.tsx   # Step 3: 결과 표시

lib/
└── mock/
    └── skin-analysis.ts          # Mock 데이터 및 타입 정의
```

---

## 3. Flow 설계

### Step 1: 사진 업로드 (PhotoUpload)

```
┌─────────────────────────────────────┐
│                                     │
│         📷 얼굴 가이드              │
│         (타원형 오버레이)           │
│                                     │
├─────────────────────────────────────┤
│  💡 자연광에서 정면 사진을 찍어주세요  │
├─────────────────────────────────────┤
│                                     │
│   [📷 사진 촬영]    [🖼️ 갤러리]     │
│                                     │
└─────────────────────────────────────┘
```

**Hook Model - Action (간단한 행동)**:
- 사진 1장만 업로드
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
│  💡 "7가지 피부 지표를 분석합니다"   │
│                                     │
└─────────────────────────────────────┘
```

**로딩 팁 순환 (3초 간격)**:
1. "7가지 피부 지표를 분석합니다"
2. "수분도, 유분도, 모공 상태를 측정 중"
3. "AI가 맞춤 솔루션을 준비하고 있어요"
4. "거의 완료되었어요!"

### Step 3: 결과 화면 (AnalysisResult)

```
┌─────────────────────────────────────┐
│  피부 분석 결과                      │
├─────────────────────────────────────┤
│                                     │
│   전체 점수: 78/100 🟢              │
│                                     │
├─────────────────────────────────────┤
│  📊 7가지 지표                       │
│  ─────────────────────────           │
│  수분도     [████████░░] 65         │
│  유분도     [████░░░░░░] 45         │
│  모공       [███████░░░] 72         │
│  주름       [████████░░] 80         │
│  탄력       [███████░░░] 75         │
│  색소침착   [██████░░░░] 68         │
│  트러블     [█████░░░░░] 55         │
├─────────────────────────────────────┤
│  💡 AI 인사이트 (가변 Reward)        │
│  "수분 보충이 필요해요!              │
│   히알루론산 성분을 추천드려요"       │
├─────────────────────────────────────┤
│  ✅ 추천 성분                        │
│  • 히알루론산 (수분 보충)            │
│  • 나이아신아마이드 (모공 개선)       │
├─────────────────────────────────────┤
│                                     │
│       [다시 분석하기]                │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Hook Model 적용

### Trigger (계기)
- 페이지 진입 시 "오늘 피부 상태가 궁금하신가요?" 메시지
- CTA 버튼으로 즉시 행동 유도

### Action (간단한 행동)
- **사진 1장**만 업로드
- 촬영 또는 갤러리 2가지 선택지
- 30초 이내 빠른 분석

### Reward (가변 보상)

**고정 보상**:
- 전체 점수 (0-100)
- 7가지 지표 시각화

**가변 보상** (핵심!):
1. **AI 인사이트**: 매번 다른 맞춤 조언
2. **추천 성분**: 피부 상태에 따라 달라지는 성분 가이드
3. **점수 변화**: 이전 분석 대비 변화량 (첫 분석시 제외)

### Investment (투자)
- "다시 분석하기" 버튼으로 재방문 유도
- 분석 히스토리 저장 (향후 확장)

---

## 5. Mock 데이터 구조

```typescript
// lib/mock/skin-analysis.ts

export interface SkinMetric {
  name: string;           // 지표명 (한국어)
  value: number;          // 0-100
  status: 'good' | 'normal' | 'warning';  // 상태
  description: string;    // 설명
}

export interface SkinAnalysisResult {
  overallScore: number;   // 전체 점수
  metrics: SkinMetric[];  // 7가지 지표
  insight: string;        // AI 인사이트 (가변)
  recommendedIngredients: {
    name: string;
    reason: string;
  }[];
  analyzedAt: Date;
}

// 가변 보상을 위한 랜덤 인사이트 목록
export const INSIGHTS = [
  "수분 보충이 필요해요! 히알루론산 성분을 추천드려요",
  "피부 장벽이 약해졌어요. 세라마이드로 보호해주세요",
  "모공 케어가 필요한 시점이에요. BHA 성분을 활용해보세요",
  "전반적으로 건강한 피부예요! 현재 루틴을 유지해주세요",
  "유분 조절이 필요해요. 가벼운 수분크림을 권장해요",
];
```

---

## 6. 컴포넌트 상세 설계

### 6.1 page.tsx (메인 페이지)

```typescript
'use client';

type AnalysisStep = 'upload' | 'loading' | 'result';

export default function SkinAnalysisPage() {
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);

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
- 얼굴 가이드 영역 (타원형 border)
- 촬영 팁 텍스트
- 촬영 버튼 (Camera 아이콘)
- 갤러리 버튼 (Image 아이콘)
- 숨겨진 file input (`accept="image/*"`)

### 6.3 AnalysisLoading.tsx

**Props**:
```typescript
interface AnalysisLoadingProps {
  onComplete: (result: SkinAnalysisResult) => void;
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
  result: SkinAnalysisResult;
  onRetry: () => void;
}
```

**UI 요소**:
- 전체 점수 (큰 숫자 + 컬러 인디케이터)
- 7가지 지표 Progress Bar
- AI 인사이트 카드 (하이라이트)
- 추천 성분 리스트
- "다시 분석하기" 버튼

---

## 7. 스타일 가이드

### 컬러 인디케이터
```typescript
const getScoreColor = (score: number) => {
  if (score >= 71) return 'text-green-500';   // 좋음
  if (score >= 41) return 'text-yellow-500';  // 보통
  return 'text-red-500';                       // 주의
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
1. [x] `app/(main)/analysis/skin/page.tsx` 생성
2. [x] `lib/mock/skin-analysis.ts` Mock 데이터 생성
3. [x] Step 전환 로직 구현

### Phase 2: 컴포넌트 구현 ✅
4. [x] `PhotoUpload.tsx` - 사진 업로드 UI
5. [x] `AnalysisLoading.tsx` - 로딩 화면 + 팁 순환
6. [x] `AnalysisResult.tsx` - 결과 화면

### Phase 3: 마무리 ✅
7. [x] 반응형 스타일 적용
8. [x] 접근성 (aria-label 등) 추가
9. [x] 타입 체크 및 린트

---

## 9. 확장 고려사항

**Week 5 구현 완료:**
- [x] Supabase Storage 연동 (실제 이미지 저장)
- [x] Gemini Vision API 연동 (실제 AI 분석 + Mock 폴백)
- [x] 분석 히스토리 저장 (skin_analyses 테이블)
- [x] PC 데이터 연동 (퍼스널 컬러 기반 추천)

**향후 확장:**
- [ ] Streak 시스템 (연속 기록 보상)
- [ ] 성분 분석 기능 (ingredient_warnings)

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
