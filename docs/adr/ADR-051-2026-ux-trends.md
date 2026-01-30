# ADR-051: 2026 UX 트렌드 적용 전략

## 상태

`accepted`

## 날짜

2026-01-23

## 맥락 (Context)

### 배경

2026년 웰니스/AI 앱 시장에서 경쟁력을 유지하고 사용자 경험을 향상시키기 위해 최신 UX 트렌드 적용이 필요합니다.

### 2026년 핵심 UX 트렌드

| 트렌드 | 설명 | 이룸 적용 필요성 |
|--------|------|-----------------|
| **AI 네이티브 UX** | AI가 UX의 핵심 요소로 통합, 사용자와 AI의 협업 인터페이스 | P0 - 모든 분석 모듈에 필수 |
| **공간 인터페이스** | 3D 요소, 깊이감, 레이어 기반 UI | P1 - 분석 결과 시각화에 적용 |
| **감정 인식** | 사용자 상태에 반응하는 적응형 UI | P2 - 향후 검토 |

### 주요 환경 변화

| 변화 | 영향 | 긴급도 |
|------|------|--------|
| **AI 기본법 시행 (2026.1.22)** | AI 생성 콘텐츠 표시 의무화 | P0 (법적 필수) |
| **접근성 인식 강화** | WCAG 2.1 AA 준수 요구 증가 | P0 (시장 요구) |
| **AI 네이티브 기대** | 투명한 AI 의사결정 과정 요구 | P0 (신뢰 구축) |
| **사용자 기대치 상승** | 세련된 마이크로 인터랙션 기대 | P1 |
| **개인화 트렌드** | 사용 패턴 기반 적응형 UI 기대 | P1 |
| **멀티모달 인터랙션** | 음성/제스처 UI 관심 증가 | P2 |

### 이룸 현황

```
현재 구현됨:
✅ 다크 모드 (next-themes)
✅ AIBadge 컴포넌트 (기초)
🔄 접근성 (일부)

미구현:
📋 신뢰도 시각화 (ConfidenceMeter)
📋 AI 근거 설명 (XAI - Explainable AI)
📋 적응형 인터페이스
📋 마이크로 인터랙션
📋 스켈레톤 로딩 (체계적)
📋 개인화 대시보드
```

## P1: 궁극의 형태 (Ultimate Form)

### 이상적 최종 상태

```
2026 UX 트렌드의 완전한 실현:

1. AI 투명성 (완전한 설명가능성)
   - 모든 AI 결과에 신뢰도 100% 시각화
   - 판단 근거의 자연어 설명 (XAI)
   - 반론 시뮬레이션 (Alternative 결과 표시)
   - 사용자가 AI 결정 과정을 완전히 이해

2. 적응형 인터페이스 (완전 개인화)
   - 사용자별 완전 맞춤 UI 레이아웃
   - 실시간 사용 패턴 학습 및 적응
   - 예측적 UI (다음 액션 예측)
   - 감정 상태 인식 및 UI 적응

3. 마이크로 인터랙션 (60fps 완벽 피드백)
   - 모든 사용자 액션에 즉각적 피드백
   - 물리 기반 자연스러운 애니메이션
   - 햅틱 피드백 연동 (모바일)
   - 사운드 피드백 옵션

4. 접근성 (완전 포용)
   - WCAG 2.2 AAA 완전 준수
   - 모든 장애 유형 지원 (시각, 청각, 운동, 인지)
   - 음성 UI 완전 지원
   - 제스처 UI 대안 제공

5. 공간 인터페이스 (3D 경험)
   - AR/VR 분석 결과 시각화
   - 3D 인터랙티브 차트
   - 공간 내비게이션

핵심 원칙: "모든 사용자가 AI를 완전히 이해하고 신뢰하며,
          자신만의 최적화된 경험을 받는다"
```

### 물리적 한계

| 한계 | 설명 | 현실적 제약 |
|------|------|------------|
| **AI 완전 설명** | AI 판단 과정의 완전한 설명 불가 | Black-box 특성, 복잡한 내부 구조 |
| **감정 인식** | 실시간 감정 상태 정확히 인식 | 프라이버시 우려, 기술 성숙도 |
| **60fps 보장** | 저사양 디바이스에서 성능 | 디바이스 다양성, 번들 크기 |
| **완전 개인화** | 신규 사용자 Cold Start 문제 | 데이터 축적 필요 |
| **음성 UI** | 다국어/방언 완벽 지원 | 언어 모델 한계 |
| **AR/VR** | 기기 보급률 한계 | 2026년 기준 보급률 20% 미만 |

### 100점 기준

| 항목 | 100점 기준 | 가중치 |
|------|-----------|--------|
| **AI 투명성** | 모든 AI 결과 신뢰도 표시 + XAI 근거 | 25% |
| **접근성** | WCAG 2.1 AA 100% 준수, Lighthouse 95+ | 25% |
| **마이크로 인터랙션** | 분석 진행 표시 + 점수 애니메이션 + 스켈레톤 | 20% |
| **적응형 UI** | 대시보드 위젯 커스터마이징 + 사용 패턴 학습 | 15% |
| **성능 유지** | 모든 애니메이션에서 LCP < 2.5s, FPS > 30 | 15% |

### 현재 목표: 70%

```
구현 범위 (70%):
✅ AI 투명성 Phase 2 (ConfidenceMeter + EvidenceReport)
✅ 접근성 WCAG 2.1 AA 준수
✅ 마이크로 인터랙션 (진행 표시, 점수 애니메이션)
✅ 스켈레톤 로딩 체계화
✅ 적응형 대시보드 기초 (위젯 재배치)
✅ 다크 모드 색상 대비 검증

미구현 (30%):
📋 XAI 고급 근거 설명 (반론 시뮬레이션)
📋 완전 개인화 (예측적 UI)
📋 음성/제스처 UI
📋 3D/공간 인터페이스
📋 감정 인식 적응
```

### 의도적 제외

| 항목 | 제외 코드 | 사유 |
|------|----------|------|
| 감정 인식 UI | `PRIVACY_CONCERN` | 얼굴/생체 데이터 수집 시 프라이버시 이슈 심각 |
| 음성 UI | `SCOPE_EXCEED` | 전용 음성 모델 개발 필요, 현재 우선순위 아님 |
| 제스처 UI | `SCOPE_EXCEED` | 모바일 앱 출시 후 평가 필요 |
| 3D 공간 인터페이스 | `PERFORMANCE` | 번들 50KB+ 증가, 저사양 디바이스 지원 불가 |
| WCAG 2.1 AAA | `FINANCIAL_HOLD` | AA 대비 ROI 낮음, AA 완료 후 점진적 검토 |
| 완전 개인화 (예측적 UI) | `DATA_DEPENDENCY` | 충분한 사용 데이터 축적 필요 (6개월+) |

## 결정 (Decision)

### 핵심 결정 사항

#### 1. AI 투명성 UI (신뢰도 표시, 근거 설명)

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 투명성 UI 전략                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [신뢰도 표시]                                               │
│  ├── ConfidenceMeter: 0-100% 시각적 게이지                  │
│  ├── 레벨 분류: 높음(80+), 중간(60-79), 낮음(<60)           │
│  └── 신뢰도 영향 요인 설명                                   │
│                                                              │
│  [근거 설명 (XAI)]                                           │
│  ├── EvidenceReport: AI 판단 근거 카드                      │
│  ├── 분석 요소별 기여도 시각화                               │
│  └── "왜 이런 결과가 나왔나요?" 인터랙션                     │
│                                                              │
│  [투명성 계층]                                               │
│  Level 1: AIBadge (AI 생성 표시) - ✅ 구현됨                │
│  Level 2: ConfidenceMeter (신뢰도) - 📋 계획                │
│  Level 3: EvidenceReport (근거) - 📋 계획                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2. 적응형 인터페이스 (사용 패턴 기반)

```
┌─────────────────────────────────────────────────────────────┐
│                   적응형 인터페이스 전략                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [사용 패턴 학습]                                            │
│  ├── 자주 사용하는 기능 추적                                 │
│  ├── 선호 분석 유형 파악                                     │
│  └── 사용 시간대/빈도 분석                                   │
│                                                              │
│  [적응형 대시보드]                                           │
│  ├── WidgetGrid: 드래그앤드롭 재배치                        │
│  ├── 자주 사용하는 위젯 상단 배치                            │
│  └── AI 추천 위젯 표시                                       │
│                                                              │
│  [콘텐츠 개인화]                                             │
│  ├── 사용자 관심사 기반 인사이트 우선 표시                   │
│  ├── 시간대별 최적 알림                                      │
│  └── 이전 분석 결과 기반 맞춤 추천                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 3. 마이크로 인터랙션 강화

```
┌─────────────────────────────────────────────────────────────┐
│                  마이크로 인터랙션 전략                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [분석 진행 피드백]                                          │
│  ├── AnalysisProgress: 단계별 진행 표시                     │
│  │   (업로드 → 품질검증 → AI분석 → 결과생성)                │
│  ├── 각 단계 완료 시 체크 애니메이션                         │
│  └── 의도적 지연 (신뢰감 형성)                               │
│                                                              │
│  [데이터 표시]                                               │
│  ├── AnimatedNumber: 점수 카운트업 애니메이션               │
│  ├── 스태거드 카드 등장                                      │
│  └── 차트 그리기 애니메이션                                  │
│                                                              │
│  [피드백 시스템]                                             │
│  ├── useFeedback 훅: 성공/실패 햅틱+시각 피드백             │
│  ├── 버튼 프레스 상태                                        │
│  └── 토스트/스낵바 애니메이션                                │
│                                                              │
│  [타이밍 표준]                                               │
│  ├── 마이크로 인터랙션: 100-200ms                           │
│  ├── 페이지 전환: 200-300ms                                 │
│  └── 데이터 로딩 완료: 300-500ms                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 우선순위 및 채택 결정

#### P0: 필수 (법적/시장 요구)

| 트렌드 | 결정 | 이유 |
|--------|------|------|
| **AI 투명성 Phase 2** | ✅ 채택 | AI 기본법(2026.1.22) 대응, 신뢰 구축 |
| **접근성 강화** | ✅ 채택 | WCAG 2.1 AA 준수, 시장 경쟁력 |

#### P1: 권장 (사용자 경험 향상)

| 트렌드 | 결정 | 이유 |
|--------|------|------|
| **마이크로 인터랙션** | ✅ 채택 | 분석 진행 피드백, 신뢰감 형성 |
| **스켈레톤 로딩** | ✅ 채택 | 지각 성능 개선, 이탈률 감소 |
| **적응형 대시보드** | ✅ 채택 | 사용자 맞춤 경험, 차별화 |
| **다크 모드 고도화** | ✅ 채택 | 색상 대비 검증, 시스템 연동 완성 |

#### P2: 보류 (향후 검토)

| 트렌드 | 결정 | 이유 |
|--------|------|------|
| **감정 인식 UI** | ⏸️ 보류 | 기술 성숙도 부족, 프라이버시 우려 |
| **음성 UI** | ⏸️ 보류 | 구현 복잡도 높음, 사용률 예상 낮음 |
| **제스처 UI** | ⏸️ 보류 | 모바일 우선 구현 후 평가 필요 |
| **공간 인터페이스 (3D)** | ⏸️ 보류 | 성능 영향, 접근성 우려 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **기존 UX 유지** | 개발 리소스 절약, 안정성 | 법적 위반 (AI 투명성), 경쟁력 저하, 사용자 기대 미충족 | `LEGAL_ISSUE` - AI 기본법 미준수 |
| **점진적 적용** | 리스크 분산, 품질 유지, 피드백 반영 가능 | 완료까지 시간 소요 | **✅ 채택** |
| **전체 트렌드 동시 적용** | 빠른 최신화 | 리소스 분산, 품질 저하 위험, 복잡도 폭발 | `NOT_NEEDED` - 점진적 적용이 안정적 |
| **외부 솔루션 전면 도입** | 빠른 구현 | 커스터마이징 제한, 의존성 증가, 비용 | `LOW_ROI` - 이룸 특화 UX 구현 어려움 |

### 대안 상세 분석

#### 대안 1: 기존 UX 유지

```
문제점:
- AI 기본법 제31조 위반 → 법적 제재 위험
- 경쟁사 대비 UX 열위 (토스, 무신사 등 이미 적용)
- AI 투명성 부재 → 사용자 신뢰 저하
- 접근성 미비 → 잠재 사용자 이탈

결론: 최소 P0 (AI 투명성, 접근성)는 필수
```

#### 대안 2: 점진적 적용 (채택)

```
장점:
- Phase별 품질 검증 가능
- 사용자 피드백 반영
- 리소스 효율적 배분
- 롤백 용이

적용 방식:
Phase 1 (2주): AI 투명성 완료, 접근성 기초
Phase 2 (3주): 마이크로 인터랙션, 스켈레톤, 대시보드
Phase 3 (TBD): 음성/제스처 UI (평가 후 결정)
```

#### 대안 3: 전체 트렌드 동시 적용

```
문제점:
- 8개+ 트렌드 동시 구현 = 예상 공수 200시간+
- 테스트 복잡도 기하급수적 증가
- 사용자 혼란 가능 (급격한 변화)
- QA 리소스 부족

결론: 우선순위 기반 점진적 적용이 합리적
```

## 결과 (Consequences)

### 긍정적 결과

| 영역 | 기대 효과 |
|------|----------|
| **차별화된 사용자 경험** | AI 투명성 + 적응형 UI로 경쟁사 대비 차별화 |
| **법적 준수** | AI 기본법 제31조 완전 준수 |
| **신뢰도 향상** | 신뢰도 시각화 + 근거 설명으로 AI 결과 신뢰 확보 |
| **접근성** | WCAG 2.1 AA 기준 충족, 장애인 차별 금지법 대응 |
| **사용자 경험** | 마이크로 인터랙션으로 체감 품질 향상 |
| **지각 성능** | 스켈레톤 로딩으로 체감 로딩 시간 50% 감소 |
| **리텐션 향상** | 적응형 대시보드로 개인화된 경험 제공 |
| **유지보수성** | 컴포넌트 기반 설계로 확장성 확보 |

### 부정적 결과

| 영역 | 영향 | 완화 방안 |
|------|------|----------|
| **개발 복잡도 증가** | 새 컴포넌트 15개+ 추가, 상태 관리 복잡 | 체계적 테스트, 컴포넌트 문서화 |
| **개발 리소스** | Phase 1-2 약 5주 소요 | 원자 분해로 병렬 작업 |
| **번들 크기** | Framer Motion 추가 (~50KB) | Tree-shaking, 지연 로딩 |
| **학습 비용** | 새 패턴 습득 필요 | 가이드 문서 작성, 예제 코드 |
| **성능 우려** | 애니메이션 과다 시 성능 저하 | `prefers-reduced-motion` 존중, FPS 모니터링 |

### 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| AI 기본법 시행령 변경 | 중 | 높 | 유연한 컴포넌트 설계, 법률 모니터링 |
| 애니메이션 성능 이슈 | 중 | 중 | `prefers-reduced-motion` 존중, FPS 모니터링 |
| 위젯 시스템 복잡도 | 중 | 중 | MVP 먼저 출시, 점진적 기능 추가 |
| 접근성 테스트 누락 | 저 | 높 | 자동화 테스트 (axe-core), 수동 검증 병행 |
| 사용자 혼란 (급변) | 저 | 중 | 점진적 출시, 온보딩 가이드 |

## 구현 가이드

### AI 투명성 UI

#### ConfidenceMeter (신뢰도 시각화)

```tsx
// components/analysis/ConfidenceMeter.tsx
interface ConfidenceMeterProps {
  value: number;  // 0-100
  factors?: Array<{ name: string; impact: number }>;
  showExplanation?: boolean;
}

export function ConfidenceMeter({
  value,
  factors,
  showExplanation
}: ConfidenceMeterProps) {
  const level = value >= 80 ? 'high' : value >= 60 ? 'medium' : 'low';
  const levelLabel = { high: '높음', medium: '보통', low: '낮음' }[level];

  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`AI 분석 신뢰도 ${value}% (${levelLabel})`}
    >
      {/* 시각적 게이지 */}
      <div className="confidence-gauge" data-level={level}>
        <div className="fill" style={{ width: `${value}%` }} />
      </div>

      {/* 신뢰도 레벨 */}
      <span className="confidence-label">{levelLabel} ({value}%)</span>

      {/* 영향 요인 설명 */}
      {showExplanation && factors && (
        <ul className="confidence-factors">
          {factors.map(f => (
            <li key={f.name}>{f.name}: {f.impact > 0 ? '+' : ''}{f.impact}%</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

#### EvidenceReport (XAI 근거 설명)

```tsx
// components/analysis/EvidenceReport.tsx
interface EvidenceReportProps {
  analysisType: 'skin' | 'color' | 'body';
  evidences: Array<{
    factor: string;
    observation: string;
    contribution: number;  // 0-100
  }>;
}

export function EvidenceReport({ analysisType, evidences }: EvidenceReportProps) {
  return (
    <Card data-testid="evidence-report">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          왜 이런 결과가 나왔나요?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evidences.map((evidence, i) => (
          <div key={i} className="evidence-item">
            <span className="factor">{evidence.factor}</span>
            <span className="observation">{evidence.observation}</span>
            <Progress value={evidence.contribution} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### 마이크로 인터랙션

#### AnalysisProgress (분석 진행 표시)

```tsx
// components/analysis/AnalysisProgress.tsx
import { motion } from 'framer-motion';

const STEPS = [
  { id: 'upload', label: '이미지 업로드', icon: Upload },
  { id: 'quality', label: '품질 검증', icon: CheckCircle },
  { id: 'analyze', label: 'AI 분석', icon: Brain },
  { id: 'result', label: '결과 생성', icon: Sparkles },
];

export function AnalysisProgress({ currentStep }: { currentStep: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={0}
      aria-valuemax={STEPS.length}
      aria-label={`분석 진행 중: ${STEPS[currentStep]?.label}`}
    >
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const status = index < currentStep ? 'complete' :
                       index === currentStep ? 'current' : 'pending';

        return (
          <motion.div
            key={step.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            data-status={status}
          >
            <Icon className={`step-icon step-${status}`} />
            <span>{step.label}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
```

#### AnimatedNumber (점수 애니메이션)

```tsx
// components/ui/AnimatedNumber.tsx
import { useSpring, animated } from '@react-spring/web';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  suffix = ''
}: AnimatedNumberProps) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { duration },
  });

  return (
    <animated.span>
      {number.to(n => `${Math.floor(n)}${suffix}`)}
    </animated.span>
  );
}
```

### 적응형 인터페이스

```tsx
// hooks/useAdaptiveUI.ts
export function useAdaptiveUI() {
  const { userId } = useAuth();

  // 사용 패턴 조회
  const { data: patterns } = useQuery({
    queryKey: ['user-patterns', userId],
    queryFn: () => fetchUserPatterns(userId),
    staleTime: 1000 * 60 * 5,  // 5분
  });

  // 추천 위젯 순서
  const recommendedWidgets = useMemo(() => {
    if (!patterns) return DEFAULT_WIDGETS;

    return patterns.frequentFeatures
      .map(f => WIDGET_MAP[f])
      .filter(Boolean);
  }, [patterns]);

  return { recommendedWidgets, patterns };
}
```

### 스켈레톤 로딩

```tsx
// components/ui/skeletons.tsx
export function AnalysisResultSkeleton() {
  return (
    <div data-testid="analysis-result-skeleton" className="space-y-6">
      {/* 타이틀 */}
      <Skeleton className="h-8 w-1/3" />

      {/* 메인 결과 */}
      <Skeleton className="h-24 w-24 rounded-full mx-auto" />

      {/* 점수 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>

      {/* 추천 영역 */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
```

## 측정 지표

### 성공 기준

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| Lighthouse Accessibility | 75 | 90+ | CI 자동 측정 |
| Lighthouse Performance | 80 | 90+ | CI 자동 측정 |
| AI 투명성 표시율 | 60% | 100% | 모든 AI 결과에 ConfidenceMeter |
| XAI 근거 제공율 | 0% | 80% | EvidenceReport 적용 비율 |
| 스켈레톤 적용률 | 30% | 90% | 로딩 상태 컴포넌트 비율 |
| 사용자 만족도 (NPS) | +15 | +25 | 분기별 설문 |
| 대시보드 개인화 사용률 | 0% | 30% | 위젯 재배치 사용자 비율 |

## 타임라인

| Phase | 기간 | 주요 산출물 |
|-------|------|------------|
| **Phase 1** | Week 1-2 | AI 투명성 완료 (ConfidenceMeter, EvidenceReport), 접근성 기초, 다크모드 검증 |
| **Phase 2** | Week 3-5 | 마이크로 인터랙션 (AnalysisProgress, AnimatedNumber), 스켈레톤, 대시보드 기초 |
| **리뷰** | Week 6 | 사용자 피드백 수집, 지표 분석 |
| **Phase 3** | TBD | 적응형 UI 고도화, 음성/제스처 UI (평가 후 결정) |

## 관련 문서

### 리서치 문서

- [INF-2-R1: 온보딩 UX](../research/claude-ai-research/INF-2-R1-온보딩UX.md) - 온보딩 UX 최적화 가이드
- [MOD-5-2: Dashboard UX](../research/claude-ai-research/MOD-5-2-DashboardUX.md) - 대시보드 UX 트렌드 2025-2026
- [MOD-5-1: Ecommerce UX](../research/claude-ai-research/MOD-5-1-EcommerceUX.md) - 이커머스 UX 트렌드
- [MOD-5-3: Reports UX](../research/claude-ai-research/MOD-5-3-ReportsUX.md) - 리포트 UX 패턴
- [QA-2-R1: 접근성](../research/claude-ai-research/QA-2-R1-접근성.md) - WCAG 접근성 가이드
- [AI-7-R1: 설명가능성](../research/claude-ai-research/AI-7-R1-설명가능성.md) - XAI 설명가능성 연구

### 원리 문서

- [원리: 디자인 시스템](../principles/design-system.md) - 시각적 일관성
- [원리: 접근성](../principles/accessibility.md) - WCAG 가이드라인

### 관련 ADR

- [ADR-024: AI 투명성 고지](./ADR-024-ai-transparency.md) - AIBadge, 면책고지 (이 ADR의 기초)
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - fallback 시 표시
- [ADR-048: 접근성 전략](./ADR-048-accessibility-strategy.md) - WCAG 준수 전략

### 관련 스펙

- [SDD-AI-TRANSPARENCY](../specs/SDD-AI-TRANSPARENCY.md) - AI 투명성 스펙
- [SDD-S1-UX-IMPROVEMENT](../specs/SDD-S1-UX-IMPROVEMENT.md) - UX 개선 스펙

## 핵심 구현 파일

```
components/
├── common/
│   ├── AIBadge.tsx            # ✅ 구현됨
│   ├── MockDataNotice.tsx     # 📋 계획
│   └── SkipLink.tsx           # 🔄 개선 필요
├── analysis/
│   ├── ConfidenceMeter.tsx    # 📋 계획 - 신뢰도 시각화
│   ├── EvidenceReport.tsx     # 📋 계획 - XAI 근거 설명
│   └── AnalysisProgress.tsx   # 📋 계획 - 진행 표시
├── ui/
│   ├── skeleton.tsx           # 🔄 확장 필요
│   └── AnimatedNumber.tsx     # 📋 계획
└── dashboard/
    ├── WidgetGrid.tsx         # 📋 계획 - 적응형 대시보드
    └── widgets/               # 📋 계획

hooks/
├── useAdaptiveUI.ts           # 📋 계획 - 사용 패턴 기반 적응
└── useFeedback.ts             # 📋 계획 - 피드백 시스템
```

---

**Author**: Claude Code
**Reviewed by**: -
