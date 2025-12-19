# 이룸 디자인 토큰 시스템

> **버전**: 1.0.0  
> **작성일**: 2025-12-18  
> **적용**: Tailwind CSS + CSS Variables

---

## 📋 목차

1. [컬러 시스템](#1-컬러-시스템)
2. [타이포그래피](#2-타이포그래피)
3. [스페이싱](#3-스페이싱)
4. [보더 & 그림자](#4-보더--그림자)
5. [애니메이션](#5-애니메이션)
6. [Tailwind 설정](#6-tailwind-설정)
7. [CSS Variables](#7-css-variables)

---

## 1. 컬러 시스템

### 1.1 브랜드 컬러

| 이름 | HEX | 용도 |
|------|-----|------|
| **Primary** | `#7C3AED` | 메인 CTA, 강조 |
| **Primary Light** | `#A78BFA` | 호버, 비활성 |
| **Primary Dark** | `#5B21B6` | 클릭 상태 |
| **Secondary** | `#4CD4A1` | 성공, 영양 모듈 |
| **Secondary Light** | `#6EE7B7` | 호버 |
| **Secondary Dark** | `#10B981` | 클릭 상태 |

### 1.2 시맨틱 컬러

| 이름 | HEX | 용도 |
|------|-----|------|
| **Success** | `#10B981` | 완료, 달성 |
| **Warning** | `#F59E0B` | 주의, 중간 상태 |
| **Error** | `#EF4444` | 에러, 초과 |
| **Info** | `#3B82F6` | 정보, 팁 |

### 1.3 영양소 컬러 (매크로)

| 이름 | HEX | 용도 |
|------|-----|------|
| **Carbs** | `#4CD4A1` | 탄수화물 |
| **Protein** | `#FF6B9D` | 단백질 |
| **Fat** | `#FFB347` | 지방 |

### 1.4 Noom 스타일 컬러 코딩

| 이름 | HEX | 배경 | 용도 |
|------|-----|------|------|
| **Green** | `#10B981` | `#ECFDF5` | 저칼로리 밀도 음식 |
| **Yellow** | `#F59E0B` | `#FFFBEB` | 중간 칼로리 밀도 |
| **Orange** | `#F97316` | `#FFF7ED` | 고칼로리 밀도 |

### 1.5 그레이스케일

| 이름 | HEX | 용도 |
|------|-----|------|
| **Gray 50** | `#F9FAFB` | 배경 |
| **Gray 100** | `#F3F4F6` | 카드 배경, 구분선 |
| **Gray 200** | `#E5E7EB` | 보더, 비활성 |
| **Gray 300** | `#D1D5DB` | 플레이스홀더 |
| **Gray 400** | `#9CA3AF` | 보조 텍스트 |
| **Gray 500** | `#6B7280` | 비활성 텍스트 |
| **Gray 600** | `#4B5563` | 본문 텍스트 |
| **Gray 700** | `#374151` | 강조 텍스트 |
| **Gray 800** | `#1F2937` | 제목 |
| **Gray 900** | `#111827` | 최강조 |

### 1.6 그라디언트

```css
/* 운동 모듈 */
--gradient-workout: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%);

/* 영양 모듈 */
--gradient-nutrition: linear-gradient(135deg, #10B981 0%, #059669 100%);

/* 스트릭 */
--gradient-streak: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);

/* 포인트 */
--gradient-points: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);

/* 프로그레스 링 */
--gradient-progress: linear-gradient(90deg, #7C3AED 0%, #4CD4A1 100%);
```

---

## 2. 타이포그래피

### 2.1 폰트 패밀리

```css
/* 한글 */
--font-korean: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

/* 영문/숫자 강조 */
--font-display: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;

/* 모노스페이스 (숫자 정렬) */
--font-mono: 'SF Mono', 'Menlo', monospace;
```

### 2.2 폰트 사이즈

| 이름 | Size | Line Height | 용도 |
|------|------|-------------|------|
| **xs** | 12px | 16px | 캡션, 라벨 |
| **sm** | 14px | 20px | 보조 텍스트, 버튼 |
| **base** | 16px | 24px | 본문 |
| **lg** | 18px | 28px | 소제목, 강조 |
| **xl** | 20px | 28px | 섹션 제목 |
| **2xl** | 24px | 32px | 페이지 제목 |
| **3xl** | 30px | 36px | 대시보드 수치 |
| **4xl** | 36px | 40px | 히어로 숫자 |
| **5xl** | 48px | 1 | 초대형 숫자 |

### 2.3 폰트 웨이트

| 이름 | Weight | 용도 |
|------|--------|------|
| **Normal** | 400 | 본문 |
| **Medium** | 500 | 버튼, 강조 |
| **Semibold** | 600 | 소제목 |
| **Bold** | 700 | 제목, 수치 |

### 2.4 텍스트 스타일 조합

```tsx
// 페이지 제목
<h1 className="text-2xl font-bold text-gray-800">페이지 제목</h1>

// 섹션 제목
<h2 className="text-lg font-bold text-gray-800">섹션 제목</h2>

// 카드 제목
<h3 className="text-base font-semibold text-gray-800">카드 제목</h3>

// 본문
<p className="text-base text-gray-600">본문 텍스트</p>

// 보조 텍스트
<p className="text-sm text-gray-500">보조 텍스트</p>

// 캡션
<span className="text-xs text-gray-400">캡션</span>

// 대시보드 수치
<span className="text-4xl font-bold text-gray-800">1,250</span>
<span className="text-xl text-gray-500">kcal</span>
```

---

## 3. 스페이싱

### 3.1 기본 단위

| 이름 | 값 | Tailwind | 용도 |
|------|-----|----------|------|
| **0** | 0px | `p-0` | 없음 |
| **1** | 4px | `p-1` | 아이콘 내부 |
| **1.5** | 6px | `p-1.5` | 작은 간격 |
| **2** | 8px | `p-2` | 컴팩트 패딩 |
| **3** | 12px | `p-3` | 기본 간격 |
| **4** | 16px | `p-4` | 카드 패딩 |
| **5** | 20px | `p-5` | 페이지 좌우 패딩 |
| **6** | 24px | `p-6` | 섹션 간격 |
| **8** | 32px | `p-8` | 큰 섹션 간격 |
| **10** | 40px | `p-10` | 히어로 영역 |
| **12** | 48px | `p-12` | 모달 패딩 |
| **16** | 64px | `p-16` | 대형 여백 |
| **20** | 80px | `p-20` | 바텀 네비 높이 |

### 3.2 컴포넌트별 스페이싱

```tsx
// 페이지 컨테이너
<div className="px-5 py-6">

// 카드
<div className="p-4"> // 컴팩트
<div className="p-5"> // 기본
<div className="p-6"> // 여유

// 버튼
<button className="px-4 py-2"> // 작은
<button className="px-6 py-3"> // 기본
<button className="py-4"> // 풀 너비

// 리스트 아이템
<div className="py-3 px-4">

// 섹션 간격
<div className="space-y-4"> // 카드 사이
<div className="space-y-6"> // 섹션 사이
<div className="mb-4"> // 제목-콘텐츠
```

### 3.3 Gap 시스템

| 용도 | 값 | Tailwind |
|------|-----|----------|
| 인라인 아이콘-텍스트 | 8px | `gap-2` |
| 버튼 그룹 | 12px | `gap-3` |
| 카드 리스트 | 12px | `space-y-3` |
| 그리드 아이템 | 16px | `gap-4` |
| 섹션 | 24px | `space-y-6` |

---

## 4. 보더 & 그림자

### 4.1 보더 반경

| 이름 | 값 | Tailwind | 용도 |
|------|-----|----------|------|
| **none** | 0 | `rounded-none` | 없음 |
| **sm** | 4px | `rounded` | 태그, 작은 요소 |
| **md** | 8px | `rounded-lg` | 입력, 버튼 |
| **lg** | 12px | `rounded-xl` | 카드, 모달 |
| **xl** | 16px | `rounded-2xl` | 대형 카드 |
| **2xl** | 24px | `rounded-3xl` | 이미지 영역 |
| **full** | 9999px | `rounded-full` | 아바타, 배지 |

### 4.2 보더 색상 & 두께

```tsx
// 기본 보더
<div className="border border-gray-100">

// 강조 보더 (선택됨)
<div className="border-2 border-purple-500">

// 구분선
<div className="border-t border-gray-200">

// 점선 (업로드 영역)
<div className="border-2 border-dashed border-gray-300">
```

### 4.3 그림자

| 이름 | Tailwind | 용도 |
|------|----------|------|
| **none** | `shadow-none` | 플랫 |
| **sm** | `shadow-sm` | 카드 기본 |
| **md** | `shadow-md` | 호버, 팝업 |
| **lg** | `shadow-lg` | 모달 |
| **xl** | `shadow-xl` | 플로팅 버튼 |

```tsx
// 카드
<div className="shadow-sm">

// 플로팅 버튼
<button className="shadow-lg">

// 바텀시트
<div className="shadow-xl">
```

---

## 5. 애니메이션

### 5.1 트랜지션

```tsx
// 기본 트랜지션 (색상, 배경)
className="transition-colors"

// 전체 트랜지션
className="transition-all"

// 변환 (스케일, 이동)
className="transition-transform"

// 지속 시간
className="duration-150" // 빠름
className="duration-200" // 기본
className="duration-300" // 느림

// 이징
className="ease-in-out" // 기본
className="ease-out"    // 나타남
className="ease-in"     // 사라짐
```

### 5.2 애니메이션 키프레임

```css
/* 로딩 스피너 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 펄스 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 바운스 */
@keyframes bounce {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(0); }
}

/* 페이드 인 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 슬라이드 업 */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 컨페티 */
@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* 프로그레스 링 채우기 */
@keyframes progressFill {
  from { stroke-dashoffset: var(--circumference); }
  to { stroke-dashoffset: var(--target-offset); }
}
```

### 5.3 마이크로인터랙션

```tsx
// 버튼 호버
<button className="hover:opacity-90 transition-opacity">

// 버튼 클릭
<button className="active:scale-95 transition-transform">

// 카드 호버
<div className="hover:shadow-md hover:-translate-y-1 transition-all">

// 아이콘 호버
<button className="hover:scale-110 transition-transform">

// 체크박스 선택
<div className="data-[selected=true]:scale-105 transition-transform">
```

### 5.4 Tailwind 애니메이션 클래스

```tsx
// 로딩 스피너
<div className="animate-spin">

// 스켈레톤
<div className="animate-pulse">

// 바운스 (알림)
<div className="animate-bounce">

// 핑 (알림 점)
<div className="animate-ping">
```

---

## 6. Tailwind 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // 브랜드
        primary: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#5B21B6',
        },
        secondary: {
          DEFAULT: '#4CD4A1',
          light: '#6EE7B7',
          dark: '#10B981',
        },
        
        // 영양소
        carbs: '#4CD4A1',
        protein: '#FF6B9D',
        fat: '#FFB347',
        
        // Noom 컬러
        food: {
          green: '#10B981',
          yellow: '#F59E0B',
          orange: '#F97316',
        },
      },
      
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['SF Pro Display', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'monospace'],
      },
      
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'bounce-subtle': 'bounce 1s ease-in-out 2',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'progress-fill': 'progressFill 1s ease-out forwards',
      },
      
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        progressFill: {
          from: { 'stroke-dashoffset': 'var(--circumference)' },
          to: { 'stroke-dashoffset': 'var(--target-offset)' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 7. CSS Variables

```css
/* globals.css */
:root {
  /* 브랜드 컬러 */
  --color-primary: #7C3AED;
  --color-primary-light: #A78BFA;
  --color-primary-dark: #5B21B6;
  --color-secondary: #4CD4A1;
  --color-secondary-light: #6EE7B7;
  --color-secondary-dark: #10B981;
  
  /* 시맨틱 */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* 영양소 */
  --color-carbs: #4CD4A1;
  --color-protein: #FF6B9D;
  --color-fat: #FFB347;
  
  /* 그라디언트 */
  --gradient-workout: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%);
  --gradient-nutrition: linear-gradient(135deg, #10B981 0%, #059669 100%);
  --gradient-streak: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
  --gradient-progress: linear-gradient(90deg, #7C3AED 0%, #4CD4A1 100%);
  
  /* 스페이싱 */
  --space-page-x: 20px;
  --space-page-y: 24px;
  --space-card: 16px;
  --space-section: 24px;
  
  /* 보더 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* 그림자 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* 트랜지션 */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* Z-인덱스 */
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-toast: 60;
}

/* 다크모드 (옵션) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #111827;
    --color-surface: #1F2937;
    --color-text-primary: #F9FAFB;
    --color-text-secondary: #9CA3AF;
  }
}
```

---

## 📎 빠른 참조 카드

### 자주 쓰는 조합

```tsx
// 페이지 컨테이너
<div className="min-h-screen bg-gray-50 pb-20">

// 카드
<div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">

// 그라디언트 버튼
<button className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">

// 프로그레스 바 컨테이너
<div className="h-2 bg-gray-100 rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: '75%' }} />
</div>

// 배지
<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">

// 아이콘 버튼
<button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
```

---

**디자인 토큰 사용 문의:**
```
[컬러/타이포/스페이싱] 관련 [상황 설명]에 맞는 토큰 추천해줘.
```
