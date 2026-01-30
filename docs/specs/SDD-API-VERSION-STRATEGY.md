# API 버전 전략 (SDD-API-VERSION-STRATEGY)

> **Version**: 1.0 | **Created**: 2026-01-30
> **Status**: Accepted | **Priority**: P3

---

## 1. 개요

### 1.1 목적

이룸 프로젝트의 API 버전 관리 전략을 명확히 정의하고, 레거시(v1) API와 현재(v2) API의 관계를 문서화합니다.

### 1.2 현재 상태

현재 API는 두 가지 버전 패턴이 혼재:

| 패턴 | 예시 | 상태 |
|------|------|------|
| **접미사 방식 (현재)** | `/api/analyze/skin-v2` | 실제 구현 |
| **폴더 방식 (권장)** | `/api/v2/analyze/skin` | 미적용 |

### 1.3 결정

**접미사 방식 유지**
- 이미 안정적으로 운영 중인 구조 변경은 ROI가 낮음
- 클라이언트 코드 수정 최소화
- 향후 v3 도입 시 폴더 방식으로 전환 검토

---

## 2. API 버전 매핑

### 2.1 분석 API (Core)

| 모듈 | v1 (레거시) | v2 (현재) | 상태 |
|------|-------------|-----------|------|
| **피부** | `/api/analyze/skin` | `/api/analyze/skin-v2` | v2 권장 |
| **퍼스널컬러** | `/api/analyze/personal-color` | `/api/analyze/personal-color-v2` | v2 권장 |
| **체형** | `/api/analyze/body` | `/api/analyze/body-v2` | v2 권장 |
| **헤어** | `/api/analyze/hair` | `/api/analyze/hair-v2` | v2 권장 |

### 2.2 단일 버전 API

| 모듈 | 경로 | 버전 | 비고 |
|------|------|------|------|
| **자세** | `/api/analyze/posture` | v1 | C-1 범주 |
| **메이크업** | `/api/analyze/makeup` | v1 | - |
| **성분** | `/api/analyze/ingredients` | v1 | 스캔 기능 |
| **구강건강** | `/api/analyze/oral-health` | v1 | OH-1 (신규) |
| **피부상담** | `/api/analyze/skin/consultation` | v1 | Phase D |

### 2.3 버전별 기능 차이

#### 피부 분석 (S-1 → S-2)

| 기능 | v1 (S-1) | v2 (S-2) |
|------|----------|----------|
| 분석 방식 | 전체 피부 | **6존 기반 고도화** |
| AI 모델 | Gemini 기본 | Gemini Vision + 프롬프트 최적화 |
| 점수 체계 | 4항목 | **6존 개별 + 종합** |
| Vitality Grade | ❌ | ✅ A-F 등급 |

#### 퍼스널컬러 (PC-1 → PC-2)

| 기능 | v1 (PC-1) | v2 (PC-2) |
|------|-----------|-----------|
| 색 추출 | 기본 RGB | **Lab 색공간 + 자동분류** |
| 시즌 분류 | 4계절 | **16타입 (4계절 × 4서브)** |
| 근거 제시 | 기본 | **상세 증거 리포트** |

#### 체형 분석 (C-1 → C-2)

| 기능 | v1 (C-1) | v2 (C-2) |
|------|----------|----------|
| 랜드마크 | MediaPipe 기본 | **MediaPipe + Gemini Vision** |
| 자세 분석 | 기본 | **posture-advisor 통합** |
| 시뮬레이션 | ❌ | ✅ 교정 시뮬레이션 |

#### 헤어 분석 (H-1 → H-2)

| 기능 | v1 (H-1) | v2 (H-2) |
|------|----------|----------|
| 얼굴형 분석 | 기본 | **7가지 분류 + 신뢰도** |
| 스타일 추천 | 카테고리 | **개인화 + 피해야 할 스타일** |
| 컬러 추천 | 기본 | **퍼스널컬러 연동** |

---

## 3. 지원 정책

### 3.1 지원 타임라인

```
┌─────────────────────────────────────────────────────────────────┐
│                        API 버전 지원 타임라인                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  v1 (레거시)                                                    │
│  ├── 현재: 지원 중 (유지보수 모드)                              │
│  ├── 2026 Q2: Deprecated 헤더 추가                             │
│  ├── 2026 Q3: 경고 로그 활성화                                  │
│  └── 2026 Q4: v3 출시 시 Sunset 검토                           │
│                                                                 │
│  v2 (현재)                                                      │
│  ├── 현재: Active (모든 신규 기능)                              │
│  └── 향후: v3 전환 시 레거시로 전환                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Deprecation 헤더

v1 API 호출 시 응답에 추가할 헤더:

```http
HTTP/1.1 200 OK
X-API-Version: 1.0
X-Deprecated: true
X-Deprecated-At: 2026-06-01
X-Sunset: 2026-12-01
X-Upgrade-To: /api/analyze/skin-v2
Link: </docs/api-migration>; rel="deprecation"
```

### 3.3 버전별 지원 범위

| 항목 | v1 | v2 |
|------|----|----|
| 버그 수정 | ✅ | ✅ |
| 보안 패치 | ✅ | ✅ |
| 새 기능 | ❌ | ✅ |
| 성능 최적화 | ❌ | ✅ |
| 문서 업데이트 | 최소 | ✅ |

---

## 4. 클라이언트 마이그레이션 가이드

### 4.1 웹 클라이언트

```typescript
// Before (v1)
const response = await fetch('/api/analyze/skin', {
  method: 'POST',
  body: JSON.stringify({ imageBase64 }),
});

// After (v2)
const response = await fetch('/api/analyze/skin-v2', {
  method: 'POST',
  body: JSON.stringify({ imageBase64 }),
});

// 응답 타입도 확장됨
interface SkinV2Response {
  // v1 필드 (하위 호환)
  skinType: string;
  scores: { hydration: number; oiliness: number; /* ... */ };

  // v2 신규 필드
  zoneScores: Record<string, ZoneScore>;  // 6존 개별 점수
  vitalityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  analysisVersion: '2.0';
}
```

### 4.2 모바일 클라이언트

```typescript
// apps/mobile/lib/api/endpoints.ts

// v1 → v2 마이그레이션 맵
export const API_ENDPOINTS = {
  // 분석 API (v2 사용)
  analyzeSkin: '/api/analyze/skin-v2',       // Changed
  analyzePersonalColor: '/api/analyze/personal-color-v2',  // Changed
  analyzeBody: '/api/analyze/body-v2',       // Changed
  analyzeHair: '/api/analyze/hair-v2',       // Changed

  // 단일 버전 API
  analyzePosture: '/api/analyze/posture',
  analyzeOralHealth: '/api/analyze/oral-health',
};
```

### 4.3 응답 타입 마이그레이션

```typescript
// types/api-responses.ts

// v1 응답 (deprecated)
interface SkinAnalysisV1Response {
  skinType: string;
  scores: {
    hydration: number;
    oiliness: number;
    sensitivity: number;
    wrinkles: number;
  };
  recommendations: string[];
}

// v2 응답 (권장)
interface SkinAnalysisV2Response extends SkinAnalysisV1Response {
  // 하위 호환: v1 필드 모두 포함

  // v2 확장
  zoneAnalysis: {
    forehead: ZoneScore;
    nose: ZoneScore;
    leftCheek: ZoneScore;
    rightCheek: ZoneScore;
    chin: ZoneScore;
    jawline: ZoneScore;
  };
  vitalityGrade: VitalityGrade;
  skinAge: number;
  analysisVersion: '2.0';
}
```

---

## 5. 라우트 구조 현황

### 5.1 현재 폴더 구조

```
apps/web/app/api/
├── analyze/
│   ├── body/
│   │   └── route.ts              # C-1 (v1)
│   ├── body-v2/
│   │   └── route.ts              # C-2 (v2)
│   ├── hair/
│   │   └── route.ts              # H-1 (v1)
│   ├── hair-v2/
│   │   └── route.ts              # H-2 (v2)
│   ├── personal-color/
│   │   ├── route.ts              # PC-1 (v1)
│   │   └── [id]/route.ts         # 결과 조회
│   ├── personal-color-v2/
│   │   └── route.ts              # PC-2 (v2)
│   ├── skin/
│   │   ├── route.ts              # S-1 (v1)
│   │   └── consultation/
│   │       └── route.ts          # Phase D
│   ├── skin-v2/
│   │   └── route.ts              # S-2 (v2)
│   ├── posture/
│   │   └── route.ts              # 자세 분석
│   ├── makeup/
│   │   └── route.ts              # 메이크업
│   ├── ingredients/
│   │   └── route.ts              # 성분 분석
│   └── oral-health/
│       └── route.ts              # OH-1 (신규)
├── admin/
├── cron/
├── scan/
├── user/
└── webhooks/
```

### 5.2 향후 구조 (v3 도입 시 검토)

```
apps/web/app/api/
├── v2/                           # 현재 버전 폴더로 이동
│   └── analyze/
│       ├── skin/route.ts
│       ├── body/route.ts
│       └── ...
├── v3/                           # 신규 버전
│   └── analyze/
│       └── skin/route.ts
└── analyze/                      # 최신 버전으로 리다이렉트
    └── skin/route.ts → /api/v3/analyze/skin
```

---

## 6. 모니터링 및 분석

### 6.1 버전별 사용량 추적

```typescript
// lib/analytics/api-version.ts

export function trackApiVersion(
  endpoint: string,
  version: 'v1' | 'v2',
  userId?: string
) {
  // Vercel Analytics 또는 Sentry로 전송
  analytics.track('api_call', {
    endpoint,
    version,
    userId,
    timestamp: new Date().toISOString(),
  });
}

// 사용 예시 (v1 라우트에서)
export async function POST(req: NextRequest) {
  trackApiVersion('/api/analyze/skin', 'v1', userId);
  // ...
}
```

### 6.2 Sunset 대시보드 지표

| 지표 | 설명 | 목표 |
|------|------|------|
| v1 일일 호출 수 | v1 API 총 호출 | 0 (sunset 시점) |
| v1/v2 비율 | v1 호출 / 전체 호출 | < 5% |
| 마이그레이션 완료 사용자 | v2만 사용하는 사용자 비율 | > 95% |
| v1 에러율 | v1 API 에러 비율 | 모니터링 |

---

## 7. 관련 문서

- [api-design.md](../../.claude/rules/api-design.md) - API 설계 규칙
- [error-handling-patterns.md](../../.claude/rules/error-handling-patterns.md) - 에러 처리
- [ADR-020](../adr/ADR-020-api-design.md) - API 설계 결정

---

## 8. 체크리스트

### 신규 API 추가 시

- [ ] 버전 접미사 필요 여부 결정
- [ ] 기존 v1 존재 시 v2 접미사 사용
- [ ] 완전 신규 기능은 접미사 없이 시작
- [ ] 타입 정의에 `analysisVersion` 필드 포함

### v1 → v2 마이그레이션 시

- [ ] v2 응답에 v1 필드 하위 호환 포함
- [ ] 클라이언트 엔드포인트 변경
- [ ] 응답 타입 확장 처리
- [ ] 테스트 케이스 업데이트

### Sunset 준비 시

- [ ] Deprecation 헤더 추가
- [ ] 사용량 모니터링 대시보드 설정
- [ ] 클라이언트 공지
- [ ] 문서 업데이트

---

**Version**: 1.0 | **Author**: Claude Code
