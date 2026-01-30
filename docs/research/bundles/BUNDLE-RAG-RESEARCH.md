# RAG 시스템 심화 리서치 번들

> **작성일**: 2026-01-19
> **버전**: 1.0
> **목적**: 이룸 RAG 시스템 품질 개선을 위한 원자적 리서치 항목
> **사용 방법**: 각 원자 단위별로 claude.ai에 프롬프트 복사하여 리서치 실행

---

## 개요

### 현재 이룸 RAG 아키텍처

```
사용자 질문
    ↓
[임베딩 생성] → OpenAI ada-002 (1536차원)
    ↓
[벡터 검색] → Supabase pgvector (cosine similarity)
    ↓
[문서 추출] → Top-K (k=3~5)
    ↓
[LLM 답변] → Gemini 3 Flash
    ↓
출처 포함 응답
```

### 현재 한계점

| 문제 | 현상 | 영향 |
|------|------|------|
| 검색 품질 | 단순 벡터 유사도만 사용 | 관련 없는 문서 검색 |
| 임베딩 모델 | ada-002 (2022년 모델) | 최신 모델 대비 성능 저하 |
| 스케일링 | pgvector 단일 노드 | 100만+ 문서 시 성능 저하 |
| 쿼리 이해 | 직접 임베딩만 사용 | 복잡한 질문 처리 미흡 |

---

## 원자 분해 (P3 원칙 적용)

### 전체 구조

```
RAG 심화 리서치 (3개 대주제, 12개 원자)
├── RAG-OPT: 검색 품질 최적화 (4개 원자)
│   ├── RAG-OPT-1: HyDE (가설 문서 임베딩)
│   ├── RAG-OPT-2: Re-ranking (교차 인코더)
│   ├── RAG-OPT-3: Query Expansion (쿼리 확장)
│   └── RAG-OPT-4: Hybrid Search (키워드+벡터)
│
├── EMB: 임베딩 모델 비교 (4개 원자)
│   ├── EMB-1: OpenAI ada-003 vs ada-002
│   ├── EMB-2: Gemini Embedding API
│   ├── EMB-3: 오픈소스 (BGE, E5, Instructor)
│   └── EMB-4: 다국어/한국어 특화 모델
│
└── VDB: 벡터 DB 스케일링 (4개 원자)
    ├── VDB-1: pgvector 한계 및 최적화
    ├── VDB-2: Pinecone 평가
    ├── VDB-3: Weaviate 평가
    └── VDB-4: Qdrant/Milvus 평가
```

---

## 1. RAG-OPT: 검색 품질 최적화

### RAG-OPT-1: HyDE (Hypothetical Document Embeddings)

**소요시간**: 1.5시간
**의존성**: 없음

#### 개념
- 질문을 가상의 답변 문서로 변환 후 임베딩
- 질문 ↔ 문서 간의 "의미적 거리" 감소

#### 리서치 프롬프트

```
# 요청: HyDE (Hypothetical Document Embeddings) 기술 리서치

## 배경
이룸 앱의 RAG 시스템에서 사용자 질문과 연구 문서 간의 검색 정확도를 높이고자 합니다.
현재는 질문을 직접 임베딩하여 검색하지만, 질문과 문서의 언어 스타일이 달라 관련 없는 결과가 나오는 문제가 있습니다.

## 목표
1. HyDE의 작동 원리와 수학적 기반
2. 기존 직접 임베딩 대비 성능 향상 수치 (논문/벤치마크 기반)
3. 이룸 적용 시 구현 방법 (TypeScript + Gemini)
4. 비용 및 지연시간 증가 분석
5. HyDE가 효과적인 경우 vs 비효과적인 경우

## 필수 포함 내용
- 원본 논문: "Precise Zero-Shot Dense Retrieval without Relevance Labels" (Gao et al., 2022)
- 실제 구현 코드 예시 (TypeScript)
- 이룸 도메인(피부/영양/운동)에 맞는 가상 문서 생성 프롬프트

## 출력 형식
파일명: RAG-OPT-1-R1-HyDE.md
구조: 요약 → 상세 → 구현 코드 → 적용 조건 → 참고자료
```

#### 성공 기준
- [ ] HyDE 원리 이해 및 문서화
- [ ] 성능 향상 수치 확인 (논문 기반)
- [ ] TypeScript 구현 코드 작성
- [ ] 이룸 적용 가능성 평가

---

### RAG-OPT-2: Re-ranking (Cross-Encoder)

**소요시간**: 1.5시간
**의존성**: 없음

#### 개념
- 1차 검색(Bi-encoder) 후 2차 정렬(Cross-encoder)
- 질문-문서 쌍을 직접 비교하여 정확도 향상

#### 리서치 프롬프트

```
# 요청: RAG Re-ranking 기술 리서치 (Cross-Encoder)

## 배경
이룸 RAG 시스템에서 벡터 검색 후 Top-K 결과 중 실제로 관련 없는 문서가 포함되는 문제가 있습니다.
2단계 Re-ranking을 통해 검색 정밀도를 높이고자 합니다.

## 목표
1. Bi-encoder vs Cross-encoder 차이점 및 trade-off
2. Re-ranking 모델 비교:
   - Cohere Rerank API
   - cross-encoder/ms-marco-MiniLM-L-6-v2
   - BAAI/bge-reranker-large
3. Re-ranking 적용 시 지연시간 증가량
4. 이룸에 적합한 Re-ranking 전략

## 필수 포함 내용
- 성능 비교표 (정확도, 지연시간, 비용)
- TypeScript 구현 코드 (Cohere API 또는 로컬 모델)
- Top-K를 몇 개로 설정해야 최적인지 (k=10 → rerank → k=3)

## 출력 형식
파일명: RAG-OPT-2-R1-Reranking.md
구조: 요약 → 모델 비교 → 구현 코드 → 최적 설정 → 참고자료
```

#### 성공 기준
- [ ] Bi-encoder vs Cross-encoder 차이 문서화
- [ ] 3개 이상 Re-ranking 모델 비교표
- [ ] 비용/지연시간 분석
- [ ] 구현 코드 작성

---

### RAG-OPT-3: Query Expansion (쿼리 확장)

**소요시간**: 1시간
**의존성**: 없음

#### 개념
- 원본 질문에서 동의어, 관련 용어 추가
- 검색 범위 확대로 recall 향상

#### 리서치 프롬프트

```
# 요청: Query Expansion 기술 리서치

## 배경
이룸 사용자가 "피부가 건조해요"라고 질문할 때,
"건성 피부", "수분 부족", "피부 장벽"과 같은 관련 용어로도 검색해야 정확한 결과를 얻을 수 있습니다.

## 목표
1. Query Expansion 기법 종류:
   - LLM 기반 동의어 생성
   - WordNet/시소러스 기반
   - 사용자 검색 로그 기반
2. 이룸 도메인에 맞는 확장 전략
3. 확장 시 검색 노이즈 증가 방지법
4. Multi-query RAG vs Query Rewriting 비교

## 필수 포함 내용
- 한국어 뷰티/건강 도메인 동의어 사전 구축 방법
- LLM 프롬프트로 쿼리 확장하는 코드
- 확장된 쿼리를 병렬 검색 후 결합하는 방법

## 출력 형식
파일명: RAG-OPT-3-R1-QueryExpansion.md
구조: 요약 → 기법 비교 → 도메인 사전 → 구현 코드 → 참고자료
```

#### 성공 기준
- [ ] 3가지 이상 확장 기법 비교
- [ ] 한국어 뷰티 도메인 사전 구조 정의
- [ ] 노이즈 방지 전략 문서화

---

### RAG-OPT-4: Hybrid Search (키워드 + 벡터)

**소요시간**: 1.5시간
**의존성**: 없음

#### 개념
- BM25 (키워드) + Vector (의미) 결합
- 정확한 용어 매칭 + 의미적 유사성 모두 활용

#### 리서치 프롬프트

```
# 요청: Hybrid Search (BM25 + Vector) 기술 리서치

## 배경
이룸에서 "나이아신아마이드 5%" 같은 구체적 성분 질문 시,
벡터 검색만으로는 정확한 수치 매칭이 어렵습니다.
키워드 검색과 벡터 검색을 결합한 하이브리드 검색이 필요합니다.

## 목표
1. BM25 + Vector 결합 방식:
   - Linear combination (α * BM25 + β * Vector)
   - RRF (Reciprocal Rank Fusion)
   - Learned combination
2. Supabase에서 하이브리드 검색 구현 방법
3. 최적의 가중치(α, β) 결정 방법
4. 이룸 도메인별 최적 설정 (피부 vs 영양 vs 운동)

## 필수 포함 내용
- pgvector + Full-text search 결합 SQL
- RRF 알고리즘 구현 코드 (TypeScript)
- 가중치 튜닝 실험 설계

## 출력 형식
파일명: RAG-OPT-4-R1-HybridSearch.md
구조: 요약 → 결합 방식 → Supabase 구현 → 가중치 튜닝 → 참고자료
```

#### 성공 기준
- [ ] 3가지 결합 방식 비교
- [ ] Supabase SQL 구현 완료
- [ ] RRF 알고리즘 TypeScript 코드

---

## 2. EMB: 임베딩 모델 비교

### EMB-1: OpenAI ada-003 vs ada-002

**소요시간**: 1시간
**의존성**: 없음

#### 리서치 프롬프트

```
# 요청: OpenAI text-embedding-3 시리즈 상세 비교

## 배경
이룸은 현재 text-embedding-ada-002 (2022년)를 사용 중입니다.
OpenAI의 새로운 text-embedding-3-small/large로 업그레이드할지 결정해야 합니다.

## 목표
1. 모델 상세 비교:
   - text-embedding-ada-002 (1536차원)
   - text-embedding-3-small (1536차원, 가변)
   - text-embedding-3-large (3072차원, 가변)
2. 성능 벤치마크 (MTEB 기준)
3. 비용 비교 (토큰당 가격)
4. 차원 축소(Matryoshka) 활용법
5. 마이그레이션 전략 (기존 임베딩 재생성 필요 여부)

## 필수 포함 내용
- MTEB 벤치마크 점수 비교표
- 한국어 성능 별도 평가 (있다면)
- 차원 축소 시 성능 저하 그래프
- 이룸 마이그레이션 비용 추정

## 출력 형식
파일명: EMB-1-R1-OpenAI-Embedding-v3.md
구조: 요약 → 모델 비교표 → 벤치마크 → 비용 분석 → 마이그레이션 → 참고자료
```

---

### EMB-2: Gemini Embedding API

**소요시간**: 1시간
**의존성**: 없음

#### 리서치 프롬프트

```
# 요청: Google Gemini Embedding API 상세 리서치

## 배경
이룸은 LLM으로 Gemini를 사용 중이므로, 임베딩도 Gemini로 통일하면
비용 절감 및 API 단순화가 가능합니다.

## 목표
1. Gemini Embedding 모델 스펙:
   - embedding-001
   - text-embedding-004 (최신)
   - 차원 수, 최대 토큰, task_type
2. OpenAI ada-002/3 대비 성능 비교
3. 비용 비교 (Gemini API는 일부 무료)
4. 한국어 성능 평가
5. task_type 설정 가이드:
   - RETRIEVAL_QUERY
   - RETRIEVAL_DOCUMENT
   - SEMANTIC_SIMILARITY
   - CLASSIFICATION

## 필수 포함 내용
- 실제 API 호출 코드 (TypeScript)
- OpenAI vs Gemini 성능 비교 실험 설계
- 이룸 RAG에 적합한 task_type 권장

## 출력 형식
파일명: EMB-2-R1-Gemini-Embedding.md
구조: 요약 → 모델 스펙 → 성능 비교 → 비용 → 구현 코드 → 참고자료
```

---

### EMB-3: 오픈소스 임베딩 모델 (BGE, E5, Instructor)

**소요시간**: 1.5시간
**의존성**: 없음

#### 리서치 프롬프트

```
# 요청: 오픈소스 임베딩 모델 상세 비교

## 배경
API 비용 절감 및 데이터 프라이버시를 위해
로컬/셀프호스팅 가능한 오픈소스 임베딩 모델을 검토합니다.

## 목표
1. 주요 오픈소스 모델 비교:
   - BAAI/bge-large-en-v1.5
   - BAAI/bge-m3 (다국어)
   - intfloat/e5-large-v2
   - intfloat/multilingual-e5-large
   - hkunlp/instructor-xl
2. MTEB 벤치마크 성능
3. 한국어 성능 (특히 bge-m3, multilingual-e5)
4. 셀프호스팅 방법:
   - HuggingFace Inference Endpoints
   - Modal, Replicate
   - Vercel Edge (가능 여부)
5. OpenAI/Gemini 대비 비용/성능 trade-off

## 필수 포함 내용
- 모델별 상세 비교표 (차원, 크기, 성능, 비용)
- 한국어 뷰티 도메인 테스트 결과 (가능하다면)
- 셀프호스팅 비용 추정

## 출력 형식
파일명: EMB-3-R1-OpenSource-Embedding.md
구조: 요약 → 모델 비교표 → 한국어 성능 → 셀프호스팅 → 비용 분석 → 참고자료
```

---

### EMB-4: 한국어 특화 임베딩 모델

**소요시간**: 1시간
**의존성**: EMB-3

#### 리서치 프롬프트

```
# 요청: 한국어 특화 임베딩 모델 리서치

## 배경
이룸의 주 사용자는 한국인이며, 연구 문서도 한국어가 많습니다.
한국어에 특화된 임베딩 모델이 더 나은 성능을 보일 수 있습니다.

## 목표
1. 한국어 특화 모델 조사:
   - KoSimCSE (카카오)
   - KR-SBERT (KLUE 기반)
   - ko-sentence-transformers
   - 네이버/카카오 내부 모델 공개 여부
2. 다국어 모델의 한국어 성능:
   - bge-m3 한국어 성능
   - multilingual-e5 한국어 성능
3. 한국어 + 영어 혼합 문서 처리 전략
4. 한국어 RAG 벤치마크 데이터셋 존재 여부

## 필수 포함 내용
- 한국어 임베딩 모델 성능 비교표
- 이룸 도메인(피부/영양) 테스트 계획
- 권장 모델 및 근거

## 출력 형식
파일명: EMB-4-R1-Korean-Embedding.md
구조: 요약 → 모델 조사 → 성능 비교 → 테스트 계획 → 권장안 → 참고자료
```

---

## 3. VDB: 벡터 DB 스케일링

### VDB-1: pgvector 한계 및 최적화

**소요시간**: 1.5시간
**의존성**: 없음

#### 리서치 프롬프트

```
# 요청: Supabase pgvector 한계 및 최적화 리서치

## 배경
이룸은 현재 Supabase pgvector를 사용 중입니다.
문서 수가 10만+ 개로 증가할 경우를 대비해 한계점과 최적화 방법을 파악해야 합니다.

## 목표
1. pgvector 성능 특성:
   - IVFFlat vs HNSW 인덱스 비교
   - 문서 수별 검색 지연시간 벤치마크
   - 메모리 사용량
2. Supabase 환경에서의 제약:
   - 최대 인덱스 크기
   - Connection pool 한계
   - Serverless 함수에서의 콜드스타트
3. 최적화 전략:
   - 인덱스 파라미터 튜닝 (lists, probes)
   - 파티셔닝 전략
   - 캐싱 레이어 추가
4. 100만 문서 처리 가능 여부

## 필수 포함 내용
- 문서 수별 성능 그래프 (1K, 10K, 100K, 1M)
- Supabase Pro 플랜에서의 실제 한계
- 최적화 적용 전/후 비교

## 출력 형식
파일명: VDB-1-R1-pgvector-Optimization.md
구조: 요약 → 성능 특성 → Supabase 제약 → 최적화 전략 → 스케일 한계 → 참고자료
```

---

### VDB-2: Pinecone 평가

**소요시간**: 1.5시간
**의존성**: VDB-1

#### 리서치 프롬프트

```
# 요청: Pinecone 벡터 DB 상세 평가

## 배경
pgvector의 스케일 한계에 대비해 전문 벡터 DB인 Pinecone을 평가합니다.

## 목표
1. Pinecone 아키텍처 및 특징:
   - Serverless vs Pods
   - 네임스페이스, 메타데이터 필터링
   - Hybrid search 지원
2. 가격 정책 (2026년 기준):
   - Serverless 가격
   - Starter (무료) 한계
   - 이룸 예상 비용 (90개 문서 → 10만 문서)
3. 성능:
   - 검색 지연시간
   - 업서트 속도
   - 동시성 처리
4. Supabase 연동:
   - Supabase에서 Pinecone 호출 패턴
   - 데이터 동기화 전략
5. 장단점 vs pgvector

## 필수 포함 내용
- 가격 계산 예시 (월별)
- TypeScript SDK 사용 코드
- pgvector → Pinecone 마이그레이션 가이드

## 출력 형식
파일명: VDB-2-R1-Pinecone.md
구조: 요약 → 아키텍처 → 가격 → 성능 → Supabase 연동 → 마이그레이션 → 참고자료
```

---

### VDB-3: Weaviate 평가

**소요시간**: 1.5시간
**의존성**: VDB-1

#### 리서치 프롬프트

```
# 요청: Weaviate 벡터 DB 상세 평가

## 배경
오픈소스 벡터 DB 중 가장 기능이 풍부한 Weaviate를 평가합니다.
셀프호스팅 시 비용 절감이 가능할 수 있습니다.

## 목표
1. Weaviate 아키텍처 및 특징:
   - GraphQL API
   - 내장 벡터화 모듈 (OpenAI, Cohere, HuggingFace)
   - Hybrid search (BM25 + Vector)
   - 자동 스키마
2. 배포 옵션:
   - Weaviate Cloud Services (WCS)
   - Docker 셀프호스팅
   - Kubernetes
3. 가격 비교 (WCS vs 셀프호스팅)
4. 성능 벤치마크 (vs pgvector, Pinecone)
5. 이룸 적용 시 고려사항:
   - 운영 복잡도
   - 백업/복구
   - 모니터링

## 필수 포함 내용
- 배포 옵션별 비용 비교표
- TypeScript 클라이언트 코드
- pgvector vs Weaviate 기능 비교표

## 출력 형식
파일명: VDB-3-R1-Weaviate.md
구조: 요약 → 아키텍처 → 배포 옵션 → 가격 → 성능 → 이룸 적용 → 참고자료
```

---

### VDB-4: Qdrant/Milvus 평가

**소요시간**: 1.5시간
**의존성**: VDB-1

#### 리서치 프롬프트

```
# 요청: Qdrant 및 Milvus 벡터 DB 평가

## 배경
Pinecone, Weaviate 외에 Qdrant(Rust 기반)와 Milvus(고성능)도 검토합니다.

## 목표
1. Qdrant 상세:
   - Rust 기반 고성능
   - Qdrant Cloud vs 셀프호스팅
   - 필터링 성능
   - 가격 정책
2. Milvus 상세:
   - 분산 아키텍처
   - Zilliz Cloud (관리형)
   - GPU 가속
   - 대규모 데이터 처리
3. 비교표 (4개 벡터 DB):
   - Pinecone vs Weaviate vs Qdrant vs Milvus
   - 성능, 가격, 기능, 운영 복잡도
4. 이룸 권장안 (규모별):
   - MVP (1만 문서 이하): ?
   - 성장기 (10만 문서): ?
   - 스케일 (100만 문서+): ?

## 필수 포함 내용
- 4개 DB 비교 매트릭스
- 규모별 권장 DB 및 근거
- 마이그레이션 복잡도

## 출력 형식
파일명: VDB-4-R1-Qdrant-Milvus.md
구조: 요약 → Qdrant 상세 → Milvus 상세 → 4개 DB 비교 → 권장안 → 참고자료
```

---

## 원자 의존성 그래프

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RAG 리서치 의존성 그래프                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [독립 실행 가능]                                                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │RAG-OPT-1 │  │RAG-OPT-2 │  │RAG-OPT-3 │  │RAG-OPT-4 │       │
│  │  HyDE    │  │Reranking │  │Query Exp │  │ Hybrid   │       │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                       │
│  │  EMB-1   │  │  EMB-2   │  │  VDB-1   │                       │
│  │OpenAI v3 │  │ Gemini   │  │ pgvector │                       │
│  └───────────┘  └───────────┘  └─────┬─────┘                       │
│                                      │                             │
│  [의존성 있음]                        ↓                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │  EMB-3   │→ │  EMB-4   │  │  VDB-2   │  │  VDB-3   │       │
│  │ OpenSrc  │  │ Korean   │  │Pinecone  │  │Weaviate  │       │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │
│                                                                     │
│                              ┌───────────┐                         │
│                              │  VDB-4   │                         │
│                              │Qdrant/Mil│                         │
│                              └───────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 우선순위 및 실행 계획

### P0 (즉시 - 이번 주)

| 원자 | 주제 | 이유 |
|------|------|------|
| RAG-OPT-4 | Hybrid Search | 현재 pgvector에 즉시 적용 가능 |
| EMB-2 | Gemini Embedding | Gemini 통일로 비용 절감 검증 |
| VDB-1 | pgvector 최적화 | 현재 시스템 개선 |

### P1 (단기 - 2주)

| 원자 | 주제 | 이유 |
|------|------|------|
| RAG-OPT-2 | Re-ranking | 검색 정밀도 향상 |
| EMB-1 | OpenAI v3 | 최신 모델 평가 |
| EMB-4 | 한국어 특화 | 주 사용자 한국인 |

### P2 (중기 - 1개월)

| 원자 | 주제 | 이유 |
|------|------|------|
| RAG-OPT-1 | HyDE | 고급 최적화 |
| RAG-OPT-3 | Query Expansion | 도메인 사전 필요 |
| VDB-2~4 | 벡터 DB 평가 | 스케일 대비 |
| EMB-3 | 오픈소스 | 비용 절감 옵션 |

---

## 총 리서치 소요 시간 추정

| 카테고리 | 원자 수 | 총 시간 |
|----------|---------|---------|
| RAG-OPT | 4개 | 5.5시간 |
| EMB | 4개 | 4.5시간 |
| VDB | 4개 | 6시간 |
| **총계** | **12개** | **16시간** |

---

**Version**: 1.0 | **Updated**: 2026-01-19
**Status**: 리서치 프롬프트 준비 완료
