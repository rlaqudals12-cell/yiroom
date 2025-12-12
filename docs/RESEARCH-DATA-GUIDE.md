# 연구 문서 데이터 가이드

> RAG 시스템을 위한 연구 문서 수집 및 입력 가이드

## 목차

1. [개요](#개요)
2. [문서 카테고리](#문서-카테고리)
3. [데이터 구조](#데이터-구조)
4. [시드 스크립트 사용법](#시드-스크립트-사용법)
5. [문서 수집 소스](#문서-수집-소스)
6. [문서 작성 가이드라인](#문서-작성-가이드라인)
7. [임베딩 관리](#임베딩-관리)

---

## 개요

이룸의 RAG(Retrieval-Augmented Generation) 시스템은 연구 문서를 기반으로 신뢰성 있는 AI 응답을 제공합니다. 이 가이드는 연구 문서를 수집하고 시스템에 입력하는 방법을 설명합니다.

### 목표 문서 수량

| 카테고리 | 목표 | 현재 | 상태 |
|----------|------|------|------|
| 피부과학 (skincare) | 100+ | 15 | 🟡 |
| 영양학 (nutrition) | 50+ | 15 | 🟡 |
| 운동생리학 (fitness) | 50+ | 15 | 🟡 |
| 퍼스널 컬러 (personal_color) | 20+ | 15 | 🟡 |
| 화장품 과학 (cosmetics) | 30+ | 15 | 🟡 |
| 종합 웰니스 (wellness) | 20+ | 15 | 🟡 |
| **총계** | **270+** | **90** | - |

---

## 문서 카테고리

### skincare (피부과학)

- 피부 장벽, 수분, 유분 관련 연구
- 피부 노화, 주름, 탄력 연구
- 여드름, 색소침착, 민감성 피부 연구
- 스킨케어 성분 효능 연구 (레티놀, 비타민 C, 나이아신아마이드 등)
- 자외선 차단, 피부암 예방 연구

### nutrition (영양학)

- 영양소별 효능 및 권장량 연구
- 체중 관리, 대사 관련 연구
- 피부-영양 관계 연구
- 장 건강, 프로바이오틱스 연구
- 간헐적 단식, 식이 패턴 연구

### fitness (운동생리학)

- 근비대, 근력 향상 연구
- 유산소 운동, 심폐 건강 연구
- 유연성, 부상 예방 연구
- 운동-정신 건강 관계 연구
- 회복, 수면, 과훈련 연구

### personal_color (퍼스널 컬러)

- 색채 심리학 연구
- 4계절/16톤 컬러 시스템 이론
- 피부톤과 색상 조화 연구
- 의상, 메이크업 색상 선택 가이드

### cosmetics (화장품 과학)

- 화장품 제형, 제조 연구
- 성분 안전성, 효능 검증 연구
- 클린 뷰티, 지속가능성 연구

### wellness (종합 웰니스)

- 수면과 건강 연구
- 스트레스 관리 연구
- 통합 건강 관리 연구

---

## 데이터 구조

### JSON 시드 파일 형식

```json
{
  "category": "skincare",
  "description": "피부과학 연구 문서 시드 데이터",
  "documents": [
    {
      "title": "문서 제목",
      "source": "저널명 또는 출처",
      "source_url": "https://doi.org/...",
      "published_date": "2023-01-15",
      "authors": ["저자1", "저자2"],
      "tags": ["태그1", "태그2", "태그3"],
      "summary": "문서 요약 (2-3문장)",
      "key_findings": [
        "핵심 발견 1",
        "핵심 발견 2",
        "핵심 발견 3"
      ],
      "content": "전체 본문 내용...",
      "language": "ko",
      "relevance_score": 0.95
    }
  ]
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | ✅ | 문서 제목 |
| source | string | ✅ | 저널명, 웹사이트 등 출처 |
| source_url | string | - | DOI 또는 URL |
| published_date | string | - | 발행일 (YYYY-MM-DD) |
| authors | string[] | - | 저자 목록 |
| tags | string[] | - | 검색용 태그 |
| summary | string | 권장 | 2-3문장 요약 |
| key_findings | string[] | 권장 | 핵심 발견/결론 4-5개 |
| content | string | ✅ | 전체 본문 (1000자 이상 권장) |
| language | string | - | 언어 코드 (ko, en, ja) |
| relevance_score | number | - | 품질 점수 (0.0-1.0) |

---

## 시드 스크립트 사용법

### 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...  # 임베딩 생성용 (선택)
```

### 전체 시드 실행

```bash
cd apps/web
npx tsx scripts/seed-research-documents.ts
```

### 임베딩만 생성 (기존 문서에 대해)

```bash
npx tsx scripts/seed-research-documents.ts --embeddings-only
```

### 출력 예시

```
🚀 연구 문서 시드 시작
📍 Supabase URL: https://xxx.supabase.co
🔑 OpenAI API: 설정됨

📚 skincare 카테고리 (8개 문서)
  ✅ 피부 장벽 기능과 세라마이드의 역할 (임베딩: ✓)
  ✅ 레티놀의 항노화 효과와 적정 농도에 관한 연구 (임베딩: ✓)
  ...

📚 nutrition 카테고리 (7개 문서)
  ✅ 단백질 섭취량과 근육 합성의 관계 (임베딩: ✓)
  ...

✨ 시드 완료: 총 22개 문서 입력됨

📊 카테고리별 통계:
   skincare: 8개
   nutrition: 7개
   fitness: 7개
   임베딩 생성됨: 22/22개
```

---

## 문서 수집 소스

### 학술 데이터베이스

| 소스 | URL | 카테고리 |
|------|-----|----------|
| PubMed | pubmed.ncbi.nlm.nih.gov | 피부과학, 영양학 |
| Google Scholar | scholar.google.com | 전 분야 |
| RISS (한국) | riss.kr | 한국어 논문 |
| KCI (한국) | kci.go.kr | 한국학술지 |

### 전문 저널

| 저널 | 분야 |
|------|------|
| Journal of Cosmetic Dermatology | 피부과학 |
| International Journal of Dermatology | 피부과학 |
| Journal of the International Society of Sports Nutrition | 영양학 |
| American Journal of Clinical Nutrition | 영양학 |
| Journal of Strength and Conditioning Research | 운동생리학 |
| British Journal of Sports Medicine | 운동생리학 |

### 신뢰할 수 있는 웹 소스

- 대한피부과학회 (derma.or.kr)
- 한국영양학회 (kns.or.kr)
- 대한스포츠의학회 (kssm.or.kr)
- Harvard Health Publishing
- Mayo Clinic
- WebMD (의학 검토 완료 기사만)

---

## 문서 작성 가이드라인

### 좋은 문서의 특성

1. **과학적 근거**: 피어리뷰된 연구 또는 공인 기관 자료
2. **구체적 수치**: 정량적 결과 포함 (예: "30% 감소")
3. **실용적 정보**: 사용자가 적용할 수 있는 조언
4. **최신성**: 가급적 최근 5년 이내 연구
5. **한국어**: 한국 사용자를 위한 한국어 콘텐츠

### content 작성 팁

```
1. 연구 배경/목적으로 시작
2. 연구 방법 간략히 설명
3. 주요 결과를 구체적 수치와 함께 제시
4. 실용적 적용 방법 또는 권장사항
5. 주의사항이나 한계점 (있는 경우)
```

### key_findings 작성 팁

- 가장 중요한 발견 4-5개
- 구체적 수치 포함
- 짧고 명확한 문장 (한 문장당 20-30자)

### relevance_score 기준

| 점수 | 기준 |
|------|------|
| 0.95-1.0 | 핵심 주제, 고품질 연구 |
| 0.90-0.94 | 관련성 높음, 신뢰할 수 있는 소스 |
| 0.85-0.89 | 관련성 있음, 보조적 정보 |
| 0.80-0.84 | 일반적 정보, 간접적 관련 |

---

## 임베딩 관리

### 임베딩이란?

임베딩은 텍스트를 1536차원 벡터로 변환한 것으로, 의미적 유사성을 기반으로 문서를 검색하는 데 사용됩니다.

### 임베딩 생성 비용

| 모델 | 비용 | 문서당 예상 비용 |
|------|------|-----------------|
| text-embedding-ada-002 | $0.0001/1K tokens | ~$0.0005/문서 |
| text-embedding-3-small | $0.00002/1K tokens | ~$0.0001/문서 |

### 임베딩 없이 시작하기

OpenAI API 키 없이도 문서를 입력할 수 있습니다. 나중에 `--embeddings-only` 옵션으로 임베딩을 생성하세요.

### 임베딩 재생성

문서 내용이 변경되면 임베딩도 재생성해야 합니다:

```bash
# 특정 문서의 임베딩 수동 업데이트는
# lib/rag.ts의 updateResearchDocument 함수 사용
```

---

## 다음 단계

1. 각 카테고리별 목표 수량까지 문서 추가
2. PubMed, KCI 등에서 관련 논문 수집
3. 영문 논문의 경우 한국어 요약 작성
4. 주기적인 최신 연구 업데이트

---

**Version**: 2.0 | **Updated**: 2025-12-05

### 시드 파일 목록

| 파일 | 카테고리 | 문서 수 |
|------|----------|---------|
| `data/seeds/research-skincare.json` | 피부과학 | 15 |
| `data/seeds/research-nutrition.json` | 영양학 | 15 |
| `data/seeds/research-fitness.json` | 운동생리학 | 15 |
| `data/seeds/research-personal-color.json` | 퍼스널 컬러 | 15 |
| `data/seeds/research-cosmetics.json` | 화장품 과학 | 15 |
| `data/seeds/research-wellness.json` | 종합 웰니스 | 15 |
