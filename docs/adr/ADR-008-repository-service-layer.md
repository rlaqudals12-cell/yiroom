# ADR-008: Repository-Service 계층 분리

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 비즈니스 로직이 Service 계층에, DB 접근이 Repository 계층에 완벽 분리"

- API Route: 요청/응답 처리만
- Service: 비즈니스 로직, 트랜잭션
- Repository: DB CRUD, 캐싱
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 계층 분리 | 모든 도메인 3계층 적용 |
| 테스트 격리 | Repository mock으로 Service 테스트 |
| 코드 중복 | Repository 간 CRUD 중복 0% |

### 현재 달성률

**40%** - products만 완전 적용, 나머지 혼재

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

lib/ 폴더가 56개 모듈로 확산되어 다음 문제 발생:

1. **책임 모호**: Repository vs Service 경계 불명확
2. **일관성 부재**: 도메인마다 다른 패턴 사용
3. **테스트 어려움**: 비즈니스 로직이 API 라우트에 혼재

**현황 분석**:
- `lib/products/repositories/`: 5개 파일 (Repository 패턴 적용)
- `lib/api/`: 8개 파일 (ad-hoc 패턴)
- `lib/analysis/`, `lib/coach/`: 혼재된 패턴

## 결정 (Decision)

**3계층 아키텍처** 표준 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                    계층 분리 아키텍처                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API Route Layer (app/api/)                                  │
│    └── 요청/응답 처리, 인증, 에러 포맷팅                     │
│                      ↓                                       │
│  Service Layer (lib/[domain]/services/)                      │
│    └── 비즈니스 로직, 트랜잭션, validation                   │
│                      ↓                                       │
│  Repository Layer (lib/[domain]/repositories/)               │
│    └── DB CRUD, 캐싱, 쿼리 최적화                           │
│                      ↓                                       │
│  Supabase (DIP 적용)                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 각 계층 책임

| 계층 | 책임 | 금지 사항 |
|------|------|----------|
| **API Route** | 인증, 응답 포맷팅 | 비즈니스 로직 금지 |
| **Service** | 비즈니스 로직, 트랜잭션 | 직접 DB 접근 금지 |
| **Repository** | CRUD, 캐싱 | 비즈니스 로직 금지 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 2계층 (API+Repo) | 단순함 | 비즈니스 로직 위치 모호 | `LOW_ROI` |
| DDD Full | 명확한 구조 | 오버엔지니어링 | `HIGH_COMPLEXITY` |

## 결과 (Consequences)

### 긍정적 결과

- **테스트 용이**: Service만 mock하면 API 테스트 가능
- **재사용성**: 여러 API에서 동일 Service 호출
- **유지보수**: 책임 분리로 변경 영향 최소화

### 부정적 결과

- **파일 수 증가**: 도메인당 3개 폴더
- **초기 리팩토링 비용**: 기존 코드 정리 필요

## 구현 가이드

### 폴더 구조

```
lib/[domain]/
├── entities/           # DB Row 타입
│   └── product.entity.ts
├── dtos/              # API Response 타입
│   └── product.dto.ts
├── repositories/      # CRUD 전용
│   └── product.repository.ts
├── services/          # 비즈니스 로직
│   └── product.service.ts
├── mappers/           # Entity ↔ DTO 변환
│   └── product.mapper.ts
└── index.ts           # 통합 export
```

### 코드 예시

```typescript
// lib/products/repositories/product.repository.ts
export async function findById(id: string): Promise<ProductEntity | null> {
  const { data } = await supabase.from('products').select('*').eq('id', id).single();
  return data;
}

// lib/products/services/product.service.ts
export async function getProductWithMatching(id: string, userId: string): Promise<ProductDTO> {
  const entity = await productRepository.findById(id);
  const matchRate = await calculateMatching(entity, userId);
  return productMapper.toDTO(entity, matchRate);
}

// app/api/products/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await auth.protect();
  const product = await productService.getProductWithMatching(params.id, user.id);
  return Response.json(product);
}
```

## 적용 우선순위

| 도메인 | 현재 상태 | 리팩토링 우선도 |
|--------|----------|----------------|
| products | 부분 적용 | P1 (완성) |
| analysis | 혼재 | P0 (급함) |
| coach | 고결합도 | P0 (급함) |
| workout | 혼재 | P1 |
| nutrition | 혼재 | P1 |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 보안 패턴](../principles/security-patterns.md) - DAL 패턴, 다층 방어

### 관련 ADR/스펙
- [ADR-004: 인증 전략](./ADR-004-auth-strategy.md) - Supabase 클라이언트 선택
- [ADR-009: 라이브러리 계층화](./ADR-009-library-layering.md) - 의존성 방향

---

**Author**: Claude Code
**Reviewed by**: -
