# ConnectionAwareness 기술 스펙

> 상위 철학: [yiroom-philosophy.md](./yiroom-philosophy.md) Section 3 (연결과 내재화)
> "A라서 B" — 자기 이해의 원자 단위를 추적하는 시스템

---

## 1. 개요

ConnectionAwareness는 사용자가 분석 모듈 간 연결("A라서 B")을 이해하고 내재화하는 과정을 추적하는 데이터 모델이다.

### 1.1 핵심 목적

```
목적 ≠ 사용자 데이터 수집
목적 = 사용자의 내재화 진행도 파악 → 적절한 수준의 설명 제공

- 1회 노출: 상세 설명 ("봄 웜톤이시니까 코랄 계열이 잘 어울려요. 이유는...")
- 5회+ 내재화: 간결 표시 ("코랄 립 추천")
- 7회+ 자립: 설명 생략, 사용자가 직접 판단
```

---

## 2. 데이터 모델

### 2.1 TypeScript 인터페이스

```typescript
// lib/connection-awareness/types.ts

/**
 * 연결 상태 (내재화 곡선)
 */
export type ConnectionStatus = 'exposed' | 'recognized' | 'internalized' | 'independent';

/**
 * 분석 모듈 식별자
 */
export type AnalysisModule =
  | 'personal-color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'oral-health'
  | 'workout'
  | 'nutrition'
  | 'fashion';

/**
 * ConnectionAwareness 핵심 인터페이스
 */
export interface ConnectionAwareness {
  /** 고유 ID (UUID) */
  id: string;
  /** 사용자 ID (Clerk) */
  clerkUserId: string;
  /** 연결 식별자 — "pc-warm-coral-lip" 형태 */
  connectionId: string;
  /** 출발 분석 모듈 */
  sourceModule: AnalysisModule;
  /** 도착 도메인 */
  targetDomain: string;
  /** 연결 규칙 — "A라서 B" 형태의 자연어 */
  connectionRule: string;
  /** 노출 횟수 */
  exposureCount: number;
  /** 사용자 확인/수용 횟수 */
  confirmedCount: number;
  /** 현재 상태 */
  status: ConnectionStatus;
  /** 마지막 노출 시각 */
  lastExposedAt: string;
  /** 생성 시각 */
  createdAt: string;
  /** 수정 시각 */
  updatedAt: string;
}
```

### 2.2 connectionId 네이밍 규칙

```
형식: {sourceModule}-{key-attribute}-{target-action}

예시:
- pc-warm-coral-lip          (퍼스널컬러 → 메이크업)
- pc-cool-silver-accessory    (퍼스널컬러 → 패션)
- skin-dry-moisture-serum     (피부 → 스킨케어)
- skin-sensitive-gentle-clean (피부 → 루틴)
- body-inverted-aline-skirt   (체형 → 패션)
- hair-damaged-protein-care   (헤어 → 헤어케어)
```

### 2.3 상태 전이 규칙

```
exposed → recognized → internalized → independent

전이 조건:
┌────────────┬────────────────────────────────────────┐
│ 전이        │ 조건                                    │
├────────────┼────────────────────────────────────────┤
│ → exposed  │ 첫 노출 (exposureCount = 1)            │
│ → recognized│ exposureCount ≥ 3 AND confirmedCount ≥ 1│
│ → internalized│ exposureCount ≥ 5 AND confirmedCount ≥ 3│
│ → independent│ exposureCount ≥ 7 AND confirmedCount ≥ 5│
└────────────┴────────────────────────────────────────┘

전이는 단방향. 역행 없음.
```

---

## 3. 데이터베이스 스키마

### 3.1 테이블

```sql
CREATE TABLE IF NOT EXISTS connection_awareness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  source_module TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  connection_rule TEXT NOT NULL,
  exposure_count INTEGER DEFAULT 0,
  confirmed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'exposed'
    CHECK (status IN ('exposed', 'recognized', 'internalized', 'independent')),
  last_exposed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (clerk_user_id, connection_id)
);

-- RLS
ALTER TABLE connection_awareness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_connections_select"
  ON connection_awareness FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_connections_insert"
  ON connection_awareness FOR INSERT
  WITH CHECK (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_connections_update"
  ON connection_awareness FOR UPDATE
  USING (clerk_user_id = auth.get_user_id());

-- 인덱스
CREATE INDEX idx_connection_awareness_user
  ON connection_awareness(clerk_user_id);

CREATE INDEX idx_connection_awareness_status
  ON connection_awareness(clerk_user_id, status);

CREATE INDEX idx_connection_awareness_module
  ON connection_awareness(clerk_user_id, source_module);
```

---

## 4. API 엔드포인트

### 4.1 노출 기록 (POST /api/connections/expose)

```typescript
// 인사이트 표시 시 자동 호출
Request: {
  connectionId: string;
  sourceModule: AnalysisModule;
  targetDomain: string;
  connectionRule: string;
}

Response: {
  success: boolean;
  data: {
    status: ConnectionStatus;
    exposureCount: number;
    statusChanged: boolean;
  }
}
```

로직:

1. UPSERT — 없으면 생성, 있으면 exposureCount++
2. 상태 전이 조건 확인 → 필요 시 status 업데이트
3. lastExposedAt 갱신

### 4.2 확인 기록 (POST /api/connections/confirm)

```typescript
// 사용자가 인사이트를 클릭/수용 시 호출
Request: {
  connectionId: string;
}

Response: {
  success: boolean;
  data: {
    status: ConnectionStatus;
    confirmedCount: number;
    statusChanged: boolean;
  }
}
```

### 4.3 사용자 연결 조회 (GET /api/connections)

```typescript
Query: {
  status?: ConnectionStatus;
  sourceModule?: AnalysisModule;
}

Response: {
  success: boolean;
  data: ConnectionAwareness[];
  summary: {
    total: number;
    byStatus: Record<ConnectionStatus, number>;
  }
}
```

### 4.4 내재화 통계 (GET /api/connections/stats)

```typescript
Response: {
  success: boolean;
  data: {
    totalConnections: number;
    internalizationRate: number; // (internalized + independent) / total
    independentCount: number; // 자립 도달 수
    recentProgress: {
      lastWeek: number; // 지난 주 새 인식
      lastMonth: number; // 지난 달 새 내재화
    }
  }
}
```

---

## 5. 이해 엔진 통합

### 5.1 기존 insights 엔진과의 연결

```
lib/insights/ (Rule Engine)
    │
    │ 인사이트 생성 시
    ▼
lib/connection-awareness/
    │
    │ 1. connectionId 생성
    │ 2. expose() 호출
    │ 3. status에 따른 설명 깊이 조절
    ▼
UI 컴포넌트
    │
    │ 사용자 클릭/수용 시
    ▼
    confirm() 호출
```

### 5.2 설명 깊이 조절

```typescript
function getExplanationDepth(status: ConnectionStatus): 'full' | 'brief' | 'minimal' | 'none' {
  switch (status) {
    case 'exposed':
      return 'full'; // 상세 설명 + "왜" 이유
    case 'recognized':
      return 'brief'; // 핵심만 간결하게
    case 'internalized':
      return 'minimal'; // 한 줄 리마인더
    case 'independent':
      return 'none'; // 설명 생략
  }
}
```

---

## 6. Rule Engine 연결 규칙

### 6.1 규칙 생성 패턴

```typescript
// 교차 인사이트 → ConnectionAwareness 매핑
interface ConnectionRule {
  connectionId: string; // 유니크 키
  sourceModule: AnalysisModule;
  targetDomain: string;
  template: string; // "A라서 B" 템플릿
  conditions: Record<string, unknown>; // 매칭 조건
}

// 예시 규칙
const rules: ConnectionRule[] = [
  {
    connectionId: 'pc-warm-coral-lip',
    sourceModule: 'personal-color',
    targetDomain: 'makeup',
    template: '봄 웜톤이라서 코랄 계열 립이 잘 어울려요',
    conditions: { season: 'spring', undertone: 'warm' },
  },
  {
    connectionId: 'skin-dry-moisture-serum',
    sourceModule: 'skin',
    targetDomain: 'skincare',
    template: '건성 피부라서 보습 세럼이 특히 중요해요',
    conditions: { skinType: 'dry' },
  },
];
```

---

## 7. 프라이버시 고려사항

```
1. 모든 데이터는 clerk_user_id 기반 RLS로 격리
2. 내재화 데이터는 해당 사용자의 경험 개선에만 사용
3. 통계는 익명 집계만 허용 (개별 사용자 식별 불가)
4. 사용자 삭제 요청 시 connection_awareness 행 전체 삭제
5. 타 사용자의 내재화 데이터를 비교/노출하지 않음
```

---

## 8. Phase별 구현 계획

| Phase        | 내용                                       | 시점      |
| ------------ | ------------------------------------------ | --------- |
| **B (현재)** | DB 테이블 + expose/confirm API + 기본 타입 | 출시 직후 |
| **C**        | Progression Tracker UI + 내재화 시각화     | MAU 100+  |
| **D**        | Gemini "왜" 설명 통합 + 개인화             | MAU 1K+   |

---

**Version**: 1.0 | **Created**: 2026-03-07
**Related**: [yiroom-philosophy.md](./yiroom-philosophy.md), [capsule-principle.md](./capsule-principle.md)
