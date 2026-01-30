# ADR-020: API 버전 관리 전략

## 상태

`accepted` (아키텍처 결정), `deferred` (구현)

## 날짜

2026-01-15 (결정) | 2026-01-19 (구현 상태 업데이트)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 API 변경이 하위 호환성을 유지하며 클라이언트에게 투명하게 전파되는 상태"

- **완벽한 하위 호환**: 구버전 클라이언트가 영원히 작동
- **자동 마이그레이션**: 클라이언트가 자동으로 신버전으로 업그레이드
- **무중단 배포**: API 버전 전환 시 서비스 중단 없음
- **자동 문서화**: API 변경 시 자동으로 문서와 SDK 업데이트

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 무한 지원 | 구버전 영구 지원 시 유지보수 비용 증가 |
| 브레이킹 체인지 | 일부 변경은 필연적으로 하위 호환 불가 |
| 모바일 앱 업데이트 | 스토어 심사 시간으로 즉시 배포 불가 |
| 리소스 비용 | 다중 버전 동시 운영 시 서버 비용 증가 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 버전 관리 체계 | 완전 구현 | 0% | 단일 버전 운영 |
| 폐기 예정 알림 | 3개월 사전 고지 | N/A | 미구현 |
| 클라이언트 호환성 | 99.9% | 100% | 단일 버전 |
| 마이그레이션 자동화 | 100% | 0% | 수동 전환 |

### 현재 목표: 30% (Deferred 상태, 필요 시 도입)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 즉시 버전 관리 도입 | MVP 단계 불필요 (NOT_NEEDED) | 모바일 앱 출시 시 |
| GraphQL 전환 | REST로 충분 (ALT_SUFFICIENT) | API 복잡도 증가 시 |
| Accept 헤더 버전 | 구현 복잡도 (HIGH_COMPLEXITY) | 외부 API 오픈 시 |
| 무한 구버전 지원 | 유지보수 비용 | N/A (영구 제외) |

---

## 구현 현황 (2026-01-19)

> **현재 상태**: 버전 관리 **미적용** (단일 버전 운영)

### 현재 API 구조

| 항목 | 현황 |
|------|------|
| URL 경로 | `/api/*` (버전 없음) |
| 버전 헤더 | 미사용 |
| v1/v2 폴더 | 미생성 |

### 미적용 사유

1. **MVP 단계**: 웹 클라이언트만 운영 중, 모바일 미출시
2. **브레이킹 체인지 없음**: 현재까지 API 응답 스키마 변경 없음
3. **복잡도 회피**: 단일 버전으로 유지보수 단순화

### 적용 시점

버전 관리는 다음 상황에서 도입 예정:

| 트리거 | 조치 |
|--------|------|
| 모바일 앱 v1.0 출시 | `/api/v1/*` 폴더 구조로 전환 |
| 브레이킹 체인지 발생 | `/api/v2/*` 신규 생성, v1 유지 |
| 외부 파트너 API 오픈 | 버전 헤더 + URL 전략 적용 |

### 현재 API 경로 (버전 미적용)

```
/api/analyze/*        # 분석 API
/api/coach/*          # AI 코치
/api/feed/*           # 소셜 피드
/api/affiliate/*      # 어필리에이트
/api/nutrition/*      # 영양
/api/workout/*        # 운동
```

---

## 맥락 (Context)

이룸은 웹과 모바일 두 클라이언트를 지원합니다. API 변경 시 **하위 호환성 유지가 어렵습니다**:

1. **브레이킹 체인지**: 응답 필드 변경 시 구버전 앱 장애
2. **강제 업데이트**: 모바일 앱 업데이트 강제 필요
3. **점진적 마이그레이션**: 구/신 버전 공존 불가
4. **문서화 부재**: API 변경 이력 추적 어려움

## 결정 (Decision)

**URL 기반 버전 관리 + 헤더 버전** 하이브리드 전략 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   API Versioning Strategy                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. URL 기반 버전 (Major)                                    │
│     /api/v1/analyze/skin                                     │
│     /api/v2/analyze/skin                                     │
│     └── 브레이킹 체인지 시 새 버전                          │
│                                                              │
│  2. 헤더 기반 버전 (Minor)                                   │
│     X-API-Version: 2.1                                       │
│     └── 하위 호환 변경 시 마이너 버전                       │
│                                                              │
│  3. 버전 지원 정책                                           │
│     └── 현재 버전 + 이전 1개 버전 지원 (n-1)               │
│     └── 폐기 예정 헤더: X-Deprecated-At                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 버전 지원 정책

| 버전 | 상태 | 지원 종료 예정 |
|------|------|--------------|
| v1 | 지원 중 (레거시) | v3 출시 시 |
| **v2** | **현재 버전** | - |
| v3 | 계획 중 | - |

### 버전별 URL 구조

```
/api/v1/*     # 레거시 (모바일 1.x 지원)
/api/v2/*     # 현재 (웹 + 모바일 2.x)
/api/*        # 버전 미지정 → v2로 리다이렉트
```

### 폐기 예정 헤더

```http
HTTP/1.1 200 OK
X-API-Version: 1.0
X-Deprecated-At: 2026-06-01
X-Sunset: 2026-09-01
X-Upgrade-To: /api/v2/analyze/skin
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 쿼리 파라미터 (?v=1) | 간단 | 캐싱 불리 | `LOW_ROI` |
| Accept 헤더 | REST 표준 | 구현 복잡 | `HIGH_COMPLEXITY` |
| 버전 관리 안 함 | 단순 | 브레이킹 체인지 시 장애 | `NOT_NEEDED` |

## 결과 (Consequences)

### 긍정적 결과

- **점진적 마이그레이션**: 구버전 클라이언트 지원하며 신버전 배포
- **명확한 폐기**: 헤더로 폐기 일정 명시
- **캐싱 효율**: URL 기반으로 CDN 캐싱 용이

### 부정적 결과

- **코드 중복**: 여러 버전 유지보수 필요
- **라우팅 복잡도**: 버전별 분기 처리

## 구현 가이드

### 라우트 구조

```
app/api/
├── v1/
│   └── analyze/
│       └── skin/
│           └── route.ts    # 레거시 API
├── v2/
│   └── analyze/
│       └── skin/
│           └── route.ts    # 현재 API
└── analyze/                # 버전 없는 요청 → v2 리다이렉트
    └── skin/
        └── route.ts
```

### 버전 미들웨어

```typescript
// lib/api/version-middleware.ts
export function withVersioning(
  handlers: Record<string, NextApiHandler>
): NextApiHandler {
  return async (req, res) => {
    const version = extractVersion(req);

    // 지원 버전 확인
    if (!handlers[version]) {
      return res.status(400).json({
        error: 'Unsupported API version',
        supportedVersions: Object.keys(handlers),
      });
    }

    // 폐기 예정 경고 헤더 추가
    if (version === 'v1') {
      res.setHeader('X-Deprecated-At', '2026-06-01');
      res.setHeader('X-Sunset', '2026-09-01');
      res.setHeader('X-Upgrade-To', req.url?.replace('/v1/', '/v2/') ?? '');
    }

    return handlers[version](req, res);
  };
}

function extractVersion(req: NextApiRequest): string {
  // URL에서 버전 추출
  const urlMatch = req.url?.match(/\/api\/(v\d+)\//);
  if (urlMatch) return urlMatch[1];

  // 헤더에서 버전 추출
  const headerVersion = req.headers['x-api-version'];
  if (headerVersion) return `v${headerVersion}`;

  return 'v2'; // 기본 버전
}
```

### 버전별 응답 타입

```typescript
// types/api/v1.ts
export interface SkinAnalysisResponseV1 {
  skinType: string;
  score: number;
  concerns: string[];
}

// types/api/v2.ts
export interface SkinAnalysisResponseV2 {
  skinType: string;
  scores: {
    hydration: number;
    oiliness: number;
    sensitivity: number;
  };
  concerns: {
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
}
```

### 변환 어댑터

```typescript
// lib/api/adapters/skin-analysis.ts
export function toV1Response(v2Response: SkinAnalysisResponseV2): SkinAnalysisResponseV1 {
  return {
    skinType: v2Response.skinType,
    score: Math.round(
      (v2Response.scores.hydration + v2Response.scores.oiliness + v2Response.scores.sensitivity) / 3
    ),
    concerns: v2Response.concerns.map((c) => c.name),
  };
}
```

## API 변경 체크리스트

새 API 버전 배포 전:

- [ ] 이전 버전과의 차이점 문서화
- [ ] 마이그레이션 가이드 작성
- [ ] 폐기 예정 헤더 추가
- [ ] 모바일 팀에 변경 사항 공유
- [ ] E2E 테스트로 하위 호환성 검증

## 리서치 티켓

```
[ADR-020-R1] API 버전 관리 자동화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. API 응답 스키마 변경 자동 감지 (Breaking Change Detector)
2. GraphQL vs REST 버전 관리 전략 비교
3. API Gateway에서 버전 라우팅 자동화 패턴 (Traefik, Kong 등)

→ 결과를 Claude Code에서 lib/api/version-middleware 개선에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 보안 패턴](../principles/security-patterns.md) - API 보안, Rate Limiting

### 관련 ADR/스펙
- [ADR-016: Web-Mobile Sync](./ADR-016-web-mobile-sync.md)
- [ADR-013: Error Handling](./ADR-013-error-handling.md)

---

**Author**: Claude Code
**Reviewed by**: -
