# ADR-024: AI 투명성 고지 (AIBadge)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 AI 생성 콘텐츠에 일관된 투명성 표시 + 상세 설명 제공"

- AIBadge: 모든 AI 생성 콘텐츠에 표시
- 면책 고지: 의료/재정 조언 아님 명시
- 상세 설명: 클릭 시 AI 작동 원리 안내
- 피드백 수집: AI 정확도 개선용
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 배지 적용 | AI 콘텐츠 100% 표시 |
| 면책 고지 | 분석 결과 100% 포함 |
| 법적 준수 | AI 기본법 제31조 100% |

### 현재 달성률

**90%** - AIBadge 컴포넌트 구현, 일부 페이지 적용 대기

---

## 상태

`accepted`

## 날짜

2026-01-16

## 맥락 (Context)

2026년 1월 22일 시행 예정인 **AI 기본법 제31조**에 따르면, AI 생성 콘텐츠에는 AI 사용 사실을 표시해야 합니다:

```
AI 기본법 제31조 (AI 생성물 표시 의무)
① AI를 이용하여 생성한 텍스트, 이미지, 음성 등의 콘텐츠를
   유통하는 자는 해당 콘텐츠가 AI에 의해 생성되었음을 표시하여야 한다.
```

### 이룸에서 AI가 생성하는 콘텐츠

| 콘텐츠 | AI 역할 | 표시 필요 |
|--------|--------|----------|
| 퍼스널컬러 분석 결과 | Gemini | ✅ 필수 |
| 피부 분석 결과 | Gemini | ✅ 필수 |
| 체형 분석 결과 | Gemini | ✅ 필수 |
| 제품 추천 텍스트 | Gemini | ✅ 필수 |
| 운동/영양 조언 | Gemini | ✅ 필수 |
| UI 레이블 | 정적 텍스트 | ❌ 불필요 |

## 결정 (Decision)

**AIBadge 컴포넌트 + 면책 고지** 방식을 채택합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 투명성 표시 전략                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AI 생성 콘텐츠                                              │
│       ↓                                                      │
│  ┌────────────────────────────────────┐                     │
│  │  [🤖 AI 분석] 당신의 퍼스널컬러는... │                     │
│  │                                    │                     │
│  │  분석 결과 내용...                 │                     │
│  │                                    │                     │
│  │  ────────────────────────────────  │                     │
│  │  ⚠️ AI 면책 고지                   │                     │
│  │  이 결과는 AI가 생성한 것으로,     │                     │
│  │  참고 용도로만 사용해주세요.       │                     │
│  │  정확한 진단은 전문가와 상담하세요. │                     │
│  └────────────────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 표시 요소

| 요소 | 위치 | 내용 |
|------|------|------|
| **AIBadge** | 결과 카드 상단 | "AI 분석" 뱃지 |
| **면책 고지** | 결과 카드 하단 | 참고 용도, 전문가 상담 권장 |
| **모델 정보** | 상세 정보 (선택) | "Gemini 3 Flash 사용" |

### Mock Fallback 시 표시

```
AI 서비스 불가 시:
- AIBadge: "AI 분석 (임시 데이터)"
- 추가 안내: "현재 AI 서비스를 이용할 수 없어 샘플 결과를 표시합니다."
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 표시 없음 | UX 깔끔 | 법적 위반 | `LEGAL_ISSUE` - AI 기본법 위반 |
| 페이지 하단에만 표시 | 방해 최소화 | 인지도 낮음 | `LOW_ROI` - 법적 요건 미충족 가능 |
| 팝업 경고 | 확실한 인지 | UX 방해 | `NOT_NEEDED` - 과도한 경고 |

## 결과 (Consequences)

### 긍정적 결과

- **법적 준수**: AI 기본법 제31조 준수
- **신뢰 구축**: 투명한 AI 사용으로 사용자 신뢰
- **책임 제한**: 면책 고지로 법적 분쟁 위험 감소

### 부정적 결과

- **UX 복잡**: 뱃지/고지가 화면 차지
- **신뢰 감소 가능**: "AI라서 정확하지 않을 수 있다" 인식

### 리스크

- AI 기본법 세부 시행령 변경 → **법률 모니터링 + 유연한 컴포넌트 설계**
- Mock 데이터 사용 시 혼란 → **명확한 임시 데이터 표시**

## 구현 가이드

### AIBadge 컴포넌트

```tsx
// components/common/AIBadge.tsx
interface AIBadgeProps {
  variant?: 'default' | 'mock';
  showDetails?: boolean;
}

export function AIBadge({ variant = 'default', showDetails = false }: AIBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full text-sm">
      <svg className="w-4 h-4" /* AI 아이콘 */ />
      <span className="font-medium">
        {variant === 'mock' ? 'AI 분석 (임시 데이터)' : 'AI 분석'}
      </span>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          Gemini 3 Flash
        </span>
      )}
    </div>
  );
}
```

### AI 면책 고지 컴포넌트

```tsx
// components/common/AIDisclaimer.tsx
interface AIDisclaimerProps {
  type?: 'skin' | 'color' | 'body' | 'nutrition' | 'default';
}

const DISCLAIMERS: Record<string, string> = {
  skin: '피부 상태에 대한 정확한 진단은 피부과 전문의와 상담하세요.',
  color: '퍼스널컬러는 참고 용도로, 실제 착용 시 다를 수 있습니다.',
  body: '체형 분석은 참고 용도로, 정확한 측정은 전문가와 상담하세요.',
  nutrition: '영양 조언은 참고 용도로, 개인별 상담은 영양사와 진행하세요.',
  default: '이 결과는 참고 용도로만 사용해주세요.',
};

export function AIDisclaimer({ type = 'default' }: AIDisclaimerProps) {
  return (
    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 text-amber-600" /* 경고 아이콘 */ />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            AI 생성 콘텐츠 안내
          </p>
          <p className="text-amber-700 dark:text-amber-300">
            이 결과는 AI가 생성한 것입니다. {DISCLAIMERS[type]}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 분석 결과 카드 통합

```tsx
// components/analysis/AnalysisResultCard.tsx
interface AnalysisResultCardProps {
  result: AnalysisResult;
  usedMock: boolean;
}

export function AnalysisResultCard({ result, usedMock }: AnalysisResultCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
      {/* 상단: AIBadge */}
      <div className="mb-4">
        <AIBadge variant={usedMock ? 'mock' : 'default'} />
      </div>

      {/* Mock 사용 시 추가 안내 */}
      {usedMock && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
          <p>
            현재 AI 서비스를 이용할 수 없어 샘플 결과를 표시합니다.
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}

      {/* 분석 결과 내용 */}
      <div className="space-y-4">
        {/* 결과 표시 */}
      </div>

      {/* 하단: AI 면책 고지 */}
      <AIDisclaimer type={result.type} />
    </div>
  );
}
```

### 감사 로그 연동

```typescript
// AI 결과 표시 시 로그 기록
await logAudit(supabase, 'ai.result_displayed', {
  analysisType: result.type,
  usedMock: usedMock,
  model: usedMock ? 'mock' : 'gemini-3-flash',
});
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - AI 투명성 고지 의무

### 관련 ADR/스펙
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md)
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md)
- [ADR-025: 감사 로그](./ADR-025-audit-logging.md)

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-AI-TRANSPARENCY](../specs/SDD-AI-TRANSPARENCY.md) | ✅ 구현됨 | AIBadge 컴포넌트, 면책 고지, Mock 표시 |

### 핵심 구현 파일

```
components/common/
├── AIBadge.tsx           # AI 분석 뱃지
└── AIDisclaimer.tsx      # AI 면책 고지 (향후)

components/analysis/
└── AnalysisResultCard.tsx  # 통합 결과 카드
```

---

**Author**: Claude Code
**Reviewed by**: -
