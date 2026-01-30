# AI 분석 결과를 위한 점진적 공개 UX 패턴 가이드

**핵심 결론**: 복잡한 AI 분석 결과를 효과적으로 전달하려면 **3단계 정보 계층**(요약→기본→심화)과 **사용자 제어 기반 점진적 공개**가 필수입니다. 이룸(Yiroom)의 퍼스널컬러, 피부, 체형 분석은 각각 평균 **7-10개 지표**를 포함하므로, Miller's Law(4±1)와 인지 부하 이론에 따라 초기 화면에서 **3-4개 핵심 지표만** 노출하고 나머지는 사용자 요청 시 공개해야 합니다. Fitbit은 메인 대시보드를 3가지 지표로 단순화하여 일일 참여율 **30% 증가**를 달성했으며, 이는 이룸에도 직접 적용 가능한 전략입니다.

---

## 1. 점진적 공개의 심리학적 기반

Jakob Nielsen이 1995년 정립한 점진적 공개(Progressive Disclosure)는 **"고급 기능을 2차 화면으로 미루어 학습 용이성을 높이고 오류를 줄이는 기법"**입니다. 이 패턴이 효과적인 이유는 세 가지 인지심리학 원칙에 기반합니다.

### 인지 부하 이론과 작업 기억의 한계

John Sweller의 인지 부하 이론에 따르면, 인간의 작업 기억은 **제한된 용량**을 가지며 정보 과부하 시 학습과 이해가 방해됩니다. UI 설계에서 통제 가능한 **외재적 인지 부하**(정보 제시 방식으로 인한 부하)를 최소화하는 것이 핵심입니다. 혼란스러운 레이아웃, 산만한 애니메이션, 불필요한 시각 요소가 모두 외재적 부하를 증가시킵니다.

Miller's Law는 원래 **7±2개 항목**을 작업 기억 용량으로 제시했으나, Nelson Cowan의 2001년 연구는 이를 **4±1개**로 수정했습니다. 순수 저장 용량은 Miller가 제시한 것보다 제한적이며, 7개라는 숫자는 리허설과 청킹 전략이 허용될 때의 결과입니다. 따라서 UI 설계 시 **4개 이하의 핵심 옵션**을 권장하며, 복잡한 정보는 3-4개 그룹으로 분할해야 합니다.

Hick's Law는 선택지와 결정 시간의 관계를 설명합니다: **RT = a + b × log₂(n + 1)**. 선택지가 많을수록 결정에 더 오랜 시간이 소요되며, 특히 **10개 이상**의 선택지에서 결정 피로와 선택 과부하가 발생합니다. 점진적 공개는 초기 선택지 수를 제한하여 이 문제를 해결합니다.

### 점진적 공개가 효과적인 상황과 주의점

| 효과적인 상황 | 비효과적인 상황 |
|--------------|----------------|
| 기능이 풍부한 복잡한 애플리케이션 | 발견성이 중요한 경우 (숨기면 존재를 모름) |
| 다양한 숙련도의 사용자 | 전문 사용자의 생산성이 핵심인 경우 |
| 모바일 환경 (화면 공간 제약) | 사용자가 여러 단계를 오가며 작업해야 할 때 |
| 단계적 작업 흐름 (결제, 회원가입) | 가격 정보를 의도적으로 숨기는 경우 |

**발견성 확보 전략**: 화살표, 버튼, 생략 부호 등 명확한 시그니파이어 사용, 온보딩 튜토리얼로 숨겨진 기능 설명, 툴팁과 팝업으로 맥락적 도움 제공이 필요합니다.

---

## 2. 3단계 정보 계층 설계 프레임워크

AI 분석 결과의 정보 계층은 **요약(Summary) → 기본(Basic) → 심화(Deep)** 3단계로 구성합니다. 이 구조는 파레토 원칙(80/20 법칙)에 기반하며, **핵심 20% 정보**가 사용자 목표 달성의 **80%**를 차지합니다.

### Level 1: 요약 (Summary)

**목적**: 3초 내 즉각적 이해와 의사결정 지원

**포함 요소**:
- 핵심 인사이트 1-3개
- 종합 점수 또는 상태 표시기 (정상/주의/이상)
- 주요 추천 액션 1개
- 이모티콘/아이콘으로 상태 직관 전달

**설계 원칙**: 화면 상단 또는 가장 눈에 띄는 위치에 배치, 큰 타이포그래피와 명확한 색상 코딩 사용. Nielsen Norman Group에 따르면 사용자는 평균적으로 웹 페이지 내용의 **28% 정도만** 읽으며 실제로는 20%에 가깝습니다.

### Level 2: 기본 (Basic)

**목적**: 분석 결과 이해와 행동 계획 수립

**포함 요소**:
- 주요 분석 카테고리별 결과
- 구체적 권장사항 3-5개
- 비교 데이터 (이전 vs 현재, 평균 vs 본인)
- 간단한 트렌드 차트

**설계 원칙**: 카드 기반 레이아웃으로 정보 그룹화, 접이식(Accordion) 섹션으로 점진적 공개, 한 스크롤 내 핵심 정보 배치.

### Level 3: 심화 (Deep)

**목적**: 전문가 수준 이해, 신뢰성 검증, 깊이 있는 탐색

**포함 요소**:
- 상세 원시 데이터
- 분석 방법론 설명
- AI 신뢰도, 참조 데이터
- 히스토리 및 장기 트렌드
- 내보내기/공유 기능

**설계 원칙**: "더 알아보기" 링크로 접근, 별도 화면 또는 모달로 분리, 데이터 테이블과 상세 차트 허용.

```
┌─────────────────────────────────────────────────────────┐
│                 Level 1: 요약 (Summary)                  │
│     • 핵심 점수/상태 (3초 내 이해)                       │
│     • 주요 결론 1-2개                                    │
│     • 즉시 실행 가능한 CTA                               │
├─────────────────────────────────────────────────────────┤
│                 Level 2: 기본 (Basic)                    │
│     • 카테고리별 분석 결과                               │
│     • 구체적 권장사항 3-5개                              │
│     • 비교 데이터 및 트렌드                              │
├─────────────────────────────────────────────────────────┤
│                 Level 3: 심화 (Deep)                     │
│     • 원시 데이터 및 상세 분석                           │
│     • 방법론, AI 신뢰도, 근거                            │
│     • 장기 히스토리, 전문가용 정보                       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 요약에서 상세로 드릴다운하는 핵심 패턴

### TL;DR 패턴과 Executive Summary

가장 중요한 정보를 화면 상단에 배치하고, 상세 정보는 아래로 스크롤하거나 클릭하여 접근합니다. F-패턴과 Z-패턴에 따라 사용자 시선이 좌상단에서 시작하여 수평으로 스캔하므로, **KPI와 핵심 지표는 좌상단에 배치**합니다.

**대시보드 와이어프레임**:
```
┌──────────────────────────────────────────────────────────┐
│  [Header / Global Navigation]                             │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │  KPI Card #1  │ │  KPI Card #2  │ │  KPI Card #3  │      │
│  │   ▲ +12.5%   │ │   ▼ -3.2%    │ │   ● 98.7%    │      │
│  │   핵심 숫자   │ │   핵심 숫자   │ │   핵심 숫자   │      │
│  └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                           │
│  ┌────────────────────────┐ ┌────────────────────────┐   │
│  │  차트/그래프 요약       │ │  상세 테이블 요약       │   │
│  │  (클릭 시 드릴다운)     │ │  (클릭 시 드릴다운)     │   │
│  └────────────────────────┘ └────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

최상의 대시보드는 초기 화면에 **5-6개 이상의 카드를 포함하지 않습니다**. 가장 시급한 항목은 상단에, 덜 중요한 통계는 하단에 배치하며, 기본 상태에서는 전역(global) 정보만 표시합니다.

### 인라인 확장 vs 새 화면 전환 선택 기준

| 전환 방식 | 적합한 상황 | 장점 | 단점 |
|----------|------------|------|------|
| **Expand in Place** | FAQ, 짧은 설명, 선택적 필드 | 컨텍스트 유지, 빠른 접근 | 화면 복잡해질 수 있음 |
| **New Page** | 다단계 프로세스, 긴 콘텐츠 | 충분한 공간, 집중도 향상 | 뒤로가기 필요 |
| **Modal/Overlay** | 확인 대화상자, 간단한 입력 | 빠른 확인, 임시 작업 | 과도한 사용 시 불편 |

아코디언 아이콘 연구(Nielsen Norman Group)에 따르면 **Caret(▼) 아이콘**이 가장 효과적으로 "제자리 확장"을 암시하며, 화살표(→) 아이콘은 "새 페이지 이동"으로 오인될 가능성이 높습니다.

### Skeleton UI와 점진적 로딩

콘텐츠가 로딩되는 동안 페이지 레이아웃의 와이어프레임과 유사한 시각적 요소를 표시합니다. 사용자에게 **"20-30% 더 빠르게 느껴지는"** 효과가 있습니다.

| 로딩 시간 | 권장 표시 방식 |
|----------|---------------|
| 2초 미만 | 로딩 표시 불필요 |
| 2-10초 | Skeleton Screen |
| 10초 초과 | Progress Bar |

```
[Stage 1: Skeleton]
┌─────────────────────────────────────┐
│  ████████████████                   │ ← 헤더 placeholder
│  ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ ░░░░░ │ │ ░░░░░ │ │ ░░░░░ │    │ ← shimmer 애니메이션
│  └───────┘ └───────┘ └───────┘    │
└─────────────────────────────────────┘

[Stage 2: 요약 로드]
┌─────────────────────────────────────┐
│  피부 분석 결과                     │
│  ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ 78점  │ │ 80%   │ │ ░░░░░ │    │
│  └───────┘ └───────┘ └───────┘    │
└─────────────────────────────────────┘

[Stage 3: 전체 로드]
┌─────────────────────────────────────┐
│  피부 분석 결과                     │
│  ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ 78점  │ │ 80%   │ │ 65%   │    │
│  │ 종합  │ │ 수분  │ │ 탄력  │    │
│  └───────┘ └───────┘ └───────┘    │
└─────────────────────────────────────┘
```

---

## 4. UI 컴포넌트 패턴별 사용 가이드

### 탭 (Tabs)

**적합한 상황**: 동등한 중요도의 병렬 콘텐츠, 카테고리별 명확한 분류

| 항목 | 권장사항 |
|------|----------|
| 최대 탭 수 | 5-7개 (Material Design: 5개 후 "More" 드롭다운) |
| 레이블 | 1-2 단어로 짧고 명확하게 |
| 모바일 처리 | 스크롤 가능 탭 또는 드롭다운 변환 |

### 아코디언 (Accordion)

**적합한 상황**: FAQ, 순차적/계층적 콘텐츠, 모바일 환경

**단일 확장 vs 다중 확장**: FAQ에는 단일 확장(한 번에 하나만 열림)이 깔끔하고, 비교가 필요한 콘텐츠에는 다중 확장이 유연합니다. 6개 이상 패널이 동시 확장될 수 있는 경우 다른 패턴을 검토해야 합니다.

### 모달 (Modal)

**적합한 사용 시점**: 중요 결정 확인(삭제, 결제), 집중이 필요한 짧은 작업, 긴급 정보 전달

**남용 금지 사례**: 비필수 정보(뉴스레터 가입), 복잡한 다단계 프로세스, 자주 접근하는 콘텐츠, 중첩 모달

### 드로어/사이드 패널

| 방향 | 적합한 용도 |
|------|------------|
| 왼쪽 | 네비게이션 메뉴 (모바일) |
| 오른쪽 | 상세 정보, 속성 패널 (데스크톱) |
| 하단 | 액션 시트, 빠른 옵션 (모바일) |

### 컴포넌트 비교 매트릭스

| 패턴 | 정보량 | 컨텍스트 유지 | 모바일 적합성 | 주요 용도 |
|------|--------|--------------|--------------|----------|
| 탭 | 중-대 | ★★★★☆ | ★★★☆☆ | 병렬 콘텐츠 분류 |
| 아코디언 | 소-중 | ★★★★★ | ★★★★★ | FAQ, 순차적 정보 |
| 모달 | 소-중 | ★☆☆☆☆ | ★★★☆☆ | 중요 결정, 집중 작업 |
| 드로어 | 중-대 | ★★★★☆ | ★★★★☆ | 네비게이션, 상세정보 |
| 툴팁 | 매우 소 | ★★★★★ | ★★☆☆☆ | 보조 설명 |

---

## 5. 사용자 숙련도별 UI 적응 전략

### Multi-Layer Interface 개념

Shneiderman의 Universal Usability 개념에 기반하여, 초보자와 전문가 모두를 만족시키는 다층 인터페이스를 구현합니다.

| 사용자 유형 | 특성 | 설계 포인트 |
|------------|------|------------|
| 초보자 | "이 프로그램은 무엇을 하나요?" | 학습 용이성, 오류 방지 |
| 중급자 | "기능에 빠르게 접근하고 싶어요" | 효율성, 도구 접근성 |
| 전문가 | "키보드 단축키로 빠르게 작업" | 속도, 커스터마이징 |

**구현 방식**: 기본 모드에서 핵심 20% 기능으로 80% 작업 완료 가능하게 하고, "고급 옵션" 버튼으로 전문 기능 진입.

### 온보딩과 점진적 공개의 조합

**Push vs Pull Revelation**: Push(앱 시작 시 튜토리얼)보다 **Pull(사용자 행동 기반 적시 정보 제공)**이 더 효과적입니다. Figma는 텍스트 박스 추가 시에만 관련 팁을 표시하여 자연스러운 학습 흐름을 구현합니다.

코치마크의 전략적 구현 시 **기능 채택률 40-60% 향상**이 가능합니다(Plotline 연구). 단, 연속 팁은 **5개 이하**로 제한하고 "건너뛰기" 옵션을 항상 제공해야 합니다.

---

## 6. 모바일 우선 정보 구조

### 썸존(Thumb Zone)과 터치 최적화

Steven Hoober와 Josh Clark의 연구에 따르면 **49%**의 사용자가 한 손으로 스마트폰을 조작하며, **75%**의 상호작용이 엄지손가락으로 수행됩니다.

| 영역 | 위치 | 용도 |
|------|------|------|
| Easy (자연 영역) | 화면 하단 25-40% | 기본 액션, 주요 내비게이션 |
| OK (편안한 영역) | 화면 중간 | 보조 기능 |
| Hard (스트레치 영역) | 화면 상단 | 드물게 사용하는 기능 |

**성과 데이터**(Nielsen Norman Group): 자연 영역 탭 정확도 **96%** vs 스트레치 영역 **61%**, 자연 영역 상호작용 속도 **267% 빠름**.

### 터치 타겟 가이드라인

| 플랫폼 | 최소 크기 |
|--------|----------|
| Apple iOS | 44×44 pt |
| Google Material | 48×48 dp |
| MIT 연구 | 45-57 px |

**핵심 수치**: 최소 터치 타겟 **44-48px**, 요소 간 간격 **최소 8px**, 피드백 응답 시간 **100ms 이내**.

### 반응형 점진적 공개

| 측면 | 모바일 | 데스크톱 |
|------|--------|----------|
| 공간 | 제한적 → 최대한 단순화 | 여유 → 더 많은 정보 동시 표시 |
| 상호작용 | 터치 (호버 불가) | 마우스 호버 활용 가능 |
| 사용 맥락 | 짧은 버스트 (15-30초) | 집중 작업 가능 |

---

## 7. 이룸(Yiroom) 분석 결과 페이지 정보 구조 제안

### 7.1 퍼스널컬러 분석 결과

```
┌─────────────────────────────────────────┐
│  🎨 당신의 퍼스널컬러                   │
│  ┌───────────────────────────────────┐  │
│  │     [계절 유형 일러스트]          │  │
│  │          "쿨톤 여름"              │  │
│  │     Light Summer / 밝고 부드러운  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📊 분석 요약                           │
│  ├─ 피부 언더톤: 쿨(핑크 베이스)       │
│  ├─ 눈동자 색상: 연한 브라운           │
│  └─ 모발 색상: 애쉬 브라운             │
│                                         │
│  [▼ 자세히 보기]                       │
├─────────────────────────────────────────┤
│  🎯 추천 팔레트                [탭 전환] │
│  ┌────┬────┬────┬────┬────┐           │
│  │색1 │색2 │색3 │색4 │색5 │ ...       │
│  └────┴────┴────┴────┴────┘           │
│                                         │
│  [의류] [메이크업] [헤어] [액세서리]    │
├─────────────────────────────────────────┤
│  ✨ 오늘의 스타일 추천       [더보기 >] │
│  "출근룩" "데이트룩" "캐주얼"          │
└─────────────────────────────────────────┘
```

**점진적 공개 레벨**:
- **Level 1**: 계절 유형 + 3줄 요약 + 대표 색상 5개
- **Level 2**: 전체 팔레트 + 카테고리별 추천 (탭 전환)
- **Level 3**: 개별 색상 드릴다운 (코디 예시, 제품 추천)

### 7.2 피부 분석 결과

```
┌─────────────────────────────────────────┐
│  🔬 피부 분석 결과                      │
│  ┌───────────────────────────────────┐  │
│  │      [얼굴 맵핑 시각화]           │  │
│  │      종합 점수: 78/100            │  │
│  │      피부 나이: 실제 -3세         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📈 주요 지표 (탭하여 상세 보기)        │
│  ┌─────────────────────────────────┐   │
│  │ 수분  ████████░░  80%           │   │
│  │ 탄력  ██████░░░░  65%           │   │
│  │ 모공  ███████░░░  72%           │   │
│  │ 색소  █████████░  85%           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [▼ 개선 필요 항목 보기]               │
├─────────────────────────────────────────┤
│  💡 맞춤 스킨케어 루틴                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│  │아침1│→│아침2│→│아침3│→│아침4│     │
│  └─────┘ └─────┘ └─────┘ └─────┘     │
│  [아침 루틴] [저녁 루틴] [주간 케어]   │
└─────────────────────────────────────────┘
```

**점진적 공개 전략**:
- **초기 표시**: 종합 점수 + 피부 나이 + 상위 4개 지표
- **확장 시**: 전체 7-8개 지표 + 트렌드 그래프
- **드릴다운**: 개별 항목 원인 분석 + 제품 추천 (화해 스타일)

### 7.3 체형 분석 결과

```
┌─────────────────────────────────────────┐
│  👗 체형 분석 결과                      │
│  ┌───────────────────────────────────┐  │
│  │     [체형 실루엣 일러스트]        │  │
│  │          "모래시계형"             │  │
│  │     어깨-허리-힙 비율 분석        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📏 신체 비율                           │
│  ├─ 어깨 너비: 보통                    │
│  ├─ 허리 라인: 뚜렷함                  │
│  └─ 힙 라인: 균형                      │
│                                         │
│  [▼ 상세 측정값 보기]                  │
├─────────────────────────────────────────┤
│  ✅ 강조하면 좋은 포인트                │
│  • 허리 라인                            │
│  • 균형 잡힌 상하체                     │
│                                         │
│  ⚠️ 주의할 스타일링                    │
│  • 박시한 상의 (체형 묻힘)              │
│                                         │
│  [스타일 가이드 보기 >]                │
└─────────────────────────────────────────┘
```

### 7.4 통합 대시보드

```
┌─────────────────────────────────────────┐
│  👤 [이름]님의 뷰티 프로필              │
│  마지막 분석: 2026.01.15                │
├─────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐     │
│  │  🎨 컬러      │ │  🔬 피부      │     │
│  │  쿨톤 여름    │ │    78점       │     │
│  │  [상세보기]   │ │  [상세보기]   │     │
│  └──────────────┘ └──────────────┘     │
│  ┌──────────────┐ ┌──────────────┐     │
│  │  👗 체형      │ │  🥗 웰니스    │     │
│  │  모래시계     │ │  추천 완료    │     │
│  │  [상세보기]   │ │  [상세보기]   │     │
│  └──────────────┘ └──────────────┘     │
├─────────────────────────────────────────┤
│  🔔 오늘의 추천                         │
│  ┌─────────────────────────────────┐   │
│  │  "오늘 날씨에 맞는 스타일링"    │   │
│  │  [추천 보기 >]                  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  📊 트렌드 & 인사이트       [더보기 >] │
│  • 피부 수분도 +5% 개선                 │
│  • 이번 주 인기 컬러: 라벤더           │
└─────────────────────────────────────────┘
```

---

## 8. React 컴포넌트 패턴 구현 예시

### 8.1 점진적 공개 카드 컴포넌트

```tsx
// ProgressiveDisclosureCard.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProgressiveDisclosureCardProps {
  title: string;
  summary: React.ReactNode;
  details: React.ReactNode;
  deepContent?: React.ReactNode;
  onDeepDive?: () => void;
}

export const ProgressiveDisclosureCard = ({
  title,
  summary,
  details,
  deepContent,
  onDeepDive
}: ProgressiveDisclosureCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Level 1: 요약 - 항상 표시 */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-gray-700">{summary}</div>
      </div>

      {/* Level 2: 기본 - 확장 시 표시 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 
                   border-t bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="details-panel"
      >
        <span className="text-sm font-medium text-gray-600">
          {isExpanded ? '접기' : '자세히 보기'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div 
          id="details-panel"
          className="p-4 border-t animate-slideDown"
        >
          {details}
          
          {/* Level 3: 심화 - 드릴다운 */}
          {deepContent && (
            <button
              onClick={onDeepDive}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 
                         font-medium flex items-center gap-1"
            >
              더 알아보기 →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

### 8.2 분석 결과 대시보드 컴포넌트

```tsx
// AnalysisDashboard.tsx
import { useState } from 'react';

interface AnalysisMetric {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  status: 'good' | 'normal' | 'warning';
  detail?: string;
}

interface AnalysisDashboardProps {
  title: string;
  overallScore: number;
  subtitle: string;
  metrics: AnalysisMetric[];
  maxVisibleMetrics?: number;
}

export const AnalysisDashboard = ({
  title,
  overallScore,
  subtitle,
  metrics,
  maxVisibleMetrics = 4 // Miller's Law: 4±1
}: AnalysisDashboardProps) => {
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const visibleMetrics = showAllMetrics 
    ? metrics 
    : metrics.slice(0, maxVisibleMetrics);

  const getStatusColor = (status: AnalysisMetric['status']) => {
    const colors = {
      good: 'bg-green-500',
      normal: 'bg-blue-500',
      warning: 'bg-amber-500'
    };
    return colors[status];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Level 1: 종합 점수 요약 */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-700 
                      text-white p-6 text-center">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <div className="text-5xl font-bold mb-1">{overallScore}</div>
        <div className="text-purple-200">{subtitle}</div>
      </div>

      {/* Level 2: 주요 지표 */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">
          주요 지표
        </h3>
        
        <div className="space-y-3">
          {visibleMetrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(
                selectedMetric === metric.id ? null : metric.id
              )}
              className="w-full text-left"
              aria-expanded={selectedMetric === metric.id}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{metric.label}</span>
                <span className="text-sm text-gray-600">
                  {metric.value}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all 
                              ${getStatusColor(metric.status)}`}
                  style={{ width: `${(metric.value / metric.maxValue) * 100}%` }}
                />
              </div>
              
              {/* 선택 시 상세 정보 표시 */}
              {selectedMetric === metric.id && metric.detail && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm 
                                text-gray-600 animate-fadeIn">
                  {metric.detail}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 더 보기 버튼 */}
        {metrics.length > maxVisibleMetrics && (
          <button
            onClick={() => setShowAllMetrics(!showAllMetrics)}
            className="w-full mt-4 py-2 text-sm font-medium text-purple-600 
                       hover:text-purple-800 transition-colors"
          >
            {showAllMetrics 
              ? '접기' 
              : `${metrics.length - maxVisibleMetrics}개 항목 더 보기`}
          </button>
        )}
      </div>
    </div>
  );
};
```

### 8.3 탭 기반 카테고리 컴포넌트

```tsx
// CategoryTabs.tsx
import { useState } from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface CategoryTabsProps {
  tabs: TabItem[];
  maxVisibleTabs?: number;
}

export const CategoryTabs = ({ 
  tabs, 
  maxVisibleTabs = 5 
}: CategoryTabsProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const [showMoreTabs, setShowMoreTabs] = useState(false);

  const visibleTabs = tabs.slice(0, maxVisibleTabs);
  const hiddenTabs = tabs.slice(maxVisibleTabs);

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div 
        role="tablist" 
        className="flex border-b overflow-x-auto scrollbar-hide"
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium 
                        whitespace-nowrap border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 
                             hover:text-gray-700'
                        }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        
        {/* 더 보기 드롭다운 */}
        {hiddenTabs.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMoreTabs(!showMoreTabs)}
              className="px-4 py-3 text-sm font-medium text-gray-500 
                         hover:text-gray-700"
            >
              더보기 ▼
            </button>
            {showMoreTabs && (
              <div className="absolute top-full right-0 mt-1 py-1 
                              bg-white rounded-lg shadow-lg border z-10">
                {hiddenTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMoreTabs(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm 
                               hover:bg-gray-100"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 탭 콘텐츠 */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          className="p-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};
```

### 8.4 Skeleton 로딩 컴포넌트

```tsx
// SkeletonLoader.tsx
interface SkeletonLoaderProps {
  variant: 'dashboard' | 'card' | 'list';
}

export const SkeletonLoader = ({ variant }: SkeletonLoaderProps) => {
  if (variant === 'dashboard') {
    return (
      <div className="animate-pulse">
        {/* 헤더 스켈레톤 */}
        <div className="bg-gray-200 rounded-t-2xl h-32 mb-4" />
        
        {/* 지표 스켈레톤 */}
        <div className="px-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-10" />
              </div>
              <div className="h-2 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="animate-pulse p-4 border rounded-xl">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-12 w-12 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 9. 사용자 테스트 시나리오

### 테스트 목표

점진적 공개 패턴이 정보 과부하를 줄이면서 필요한 정보 접근성을 유지하는지 검증합니다.

### 시나리오 1: 첫 분석 결과 확인 (초보자)

**태스크**: 퍼스널컬러 분석 결과를 확인하고 자신의 계절 유형을 파악하세요.

**측정 지표**:
- 계절 유형 파악까지 소요 시간 (목표: 5초 이내)
- 추가 정보 탐색 여부 및 패턴
- 정보 충분성 평가 (5점 척도)

**성공 기준**:
- 90% 이상이 5초 내 계절 유형 파악
- 70% 이상이 "정보가 충분하다"고 평가

### 시나리오 2: 상세 분석 탐색 (숙련 사용자)

**태스크**: 피부 분석 결과에서 가장 개선이 필요한 항목과 그 원인을 찾으세요.

**측정 지표**:
- 태스크 완료 시간
- 드릴다운 깊이 (Level 2, Level 3 접근 비율)
- 네비게이션 오류 횟수

**성공 기준**:
- 80% 이상이 30초 내 정보 도달
- 네비게이션 오류 0.5회 미만

### 시나리오 3: 크로스 분석 비교 (전문 사용자)

**태스크**: 퍼스널컬러와 체형 분석 결과를 함께 고려한 스타일 추천을 찾으세요.

**측정 지표**:
- 두 분석 결과 간 전환 용이성 평가
- 통합 추천까지 도달 시간
- 컨텍스트 손실 여부

**성공 기준**:
- 85% 이상이 "전환이 쉽다"고 평가
- 컨텍스트 손실 보고 10% 미만

### 테스트 방법론

**정량적 평가**:
- Task Success Rate (태스크 성공률)
- Time on Task (태스크 소요 시간)
- Error Rate (오류율)
- Click Depth (클릭 깊이)

**정성적 평가**:
- Think-Aloud Protocol (사고 구술)
- Post-Task Satisfaction (SUS 또는 SUPR-Q)
- 선호도 인터뷰

---

## 10. 컴포넌트 패턴 라이브러리 가이드

### 상황별 컴포넌트 선택 가이드

| 상황 | 권장 컴포넌트 | 이유 |
|------|--------------|------|
| 분석 결과 첫 화면 | **Summary Card + Score Badge** | 3초 내 핵심 파악 |
| 여러 카테고리 결과 | **탭** | 병렬 비교, 공간 효율 |
| FAQ/부가 설명 | **아코디언** | 필요 시에만 확장 |
| 지표 상세 설명 | **인라인 확장** | 컨텍스트 유지 |
| 제품 추천 상세 | **드로어/사이드 패널** | 메인 결과 유지하며 탐색 |
| 용어 설명 | **툴팁** (데스크톱) / **바텀시트** (모바일) | 최소 방해 |
| 중요 액션 확인 | **모달** | 집중 유도 |
| 전체 보고서 | **새 페이지** | 충분한 공간 |

### 정보 밀도 가이드라인

| 화면 | 최대 정보 항목 | 근거 |
|------|---------------|------|
| 대시보드 요약 | 4-6개 카드 | Cowan의 4±1 연구 |
| 지표 목록 | 4개 기본 표시 | 확장 버튼으로 나머지 |
| 탭 수 | 5개 기본, 7개 최대 | Material Design 가이드 |
| 액션 버튼 | 1 Primary + 2 Secondary | 선택 과부하 방지 |

---

## 결론: 이룸 적용을 위한 핵심 권장사항

이룸(Yiroom)의 AI 분석 결과 페이지는 **정보 과부하와 사용자 참여 사이의 균형**을 맞춰야 합니다. 본 연구를 통해 도출된 핵심 권장사항은 다음과 같습니다.

**정보 계층 설계**: 모든 분석 결과(퍼스널컬러, 피부, 체형)에 일관된 3단계 구조를 적용합니다. Level 1에서 **3초 내 핵심 파악**이 가능해야 하며, Level 2와 3은 사용자 제어 하에 접근합니다. Fitbit의 사례처럼 메인 대시보드를 3-4개 핵심 지표로 단순화하면 참여율이 크게 향상됩니다.

**컴포넌트 선택**: 카테고리별 결과에는 **탭**, 부가 설명에는 **아코디언**, 용어 설명에는 **툴팁**(모바일에서는 바텀시트)을 사용합니다. 모달은 중요 결정에만 제한적으로 사용하여 남용을 방지합니다.

**모바일 최적화**: 썸존을 고려하여 주요 CTA를 화면 하단 25-40%에 배치하고, 터치 타겟은 최소 44px을 유지합니다. 데스크톱에서는 호버 기반 상호작용을, 모바일에서는 탭과 스와이프 기반 탐색을 제공합니다.

**사용자 적응**: 초보자에게는 코치마크와 Pull 방식 온보딩을 제공하고, 숙련 사용자에게는 빠른 액세스와 커스터마이징 옵션을 제공합니다. 사용 패턴에 따라 정보 깊이를 자동 조절하는 적응형 UI도 고려할 수 있습니다.

**검증**: 제안된 정보 구조는 실제 사용자 테스트를 통해 검증해야 합니다. Task Success Rate, Time on Task, 정보 충분성 평가를 핵심 지표로 삼아 지속적으로 개선합니다.

점진적 공개는 단순히 정보를 숨기는 것이 아니라, **사용자가 원하는 깊이만큼 탐색할 수 있는 자유**를 제공하는 것입니다. 이룸이 이 원칙을 일관되게 적용한다면, 복잡한 AI 분석 결과를 직관적이고 가치 있는 사용자 경험으로 전환할 수 있을 것입니다.

---

## 참고 자료

**Progressive Disclosure & 인지심리학**
- Nielsen, J. (2006). "Progressive Disclosure." Nielsen Norman Group
- Sweller, J. (1988). "Cognitive Load During Problem Solving." Cognitive Science
- Miller, G.A. (1956). "The Magical Number Seven, Plus or Minus Two." Psychological Review
- Cowan, N. (2001). "The magical number 4 in short-term memory." Behavioral and Brain Sciences

**UX 패턴 & 컴포넌트**
- Material Design 3 (m3.material.io) - Tabs, Cards, Navigation
- Apple Human Interface Guidelines - Disclosure Controls, Navigation
- W3C WAI-ARIA Authoring Practices Guide - Accordion, Tabs, Modal
- Nielsen Norman Group - Accordion, Tab, Modal Best Practices

**모바일 UX**
- Hoober, S. - "Designing Mobile Interfaces"
- Clark, J. - "Designing for Touch"
- Luke Wroblewski - "Mobile First"
- MIT Touch Lab - 손가락 크기 연구

**뷰티/웰니스 앱 사례**
- Sephora Smart Skin Scan, L'Oréal Skin Genius
- Colorwise.me, Dressika
- Apple Health, Fitbit, Noom
- 화해(Hwahae), 글로우픽(Glowpick)