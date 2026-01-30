# 한국어 임베딩 모델

> **ID**: EMB-3
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. 한국어 임베딩 현황

### 1.1 주요 모델 비교

| 모델 | 차원 | 특징 | 한국어 성능 |
|------|------|------|------------|
| **BGE-M3-Korean** | 1024 | 한국어 파인튜닝 | ⭐⭐⭐⭐⭐ |
| **KoBERT** | 768 | 한국어 전용 | ⭐⭐⭐⭐ |
| **KR-BERT** | 768 | 한국어 특화 | ⭐⭐⭐⭐ |
| **mBERT** | 768 | 다국어 | ⭐⭐⭐ |
| **XLM-RoBERTa** | 768 | 다국어 | ⭐⭐⭐⭐ |
| **Gemini Embedding** | 3072 | API 기반 | ⭐⭐⭐⭐⭐ |

### 1.2 한국어 특수성

```
한국어 언어 특성:
1. 교착어 (조사, 어미 변화)
   - "가다" → 가, 가는, 가서, 가면, 갔다...

2. 띄어쓰기 불규칙
   - "건성피부" vs "건성 피부"

3. 존댓말/반말 구분
   - "추천해주세요" vs "추천해줘"

4. 외래어/영어 혼용
   - "세럼", "serum", "에센스"
```

---

## 2. KoBERT 계열

### 2.1 KoBERT

```typescript
// Hugging Face 모델 사용
import { pipeline } from '@xenova/transformers';

const extractor = await pipeline(
  'feature-extraction',
  'skt/kobert-base-v1'
);

async function getKoBertEmbedding(text: string): Promise<number[]> {
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
}
```

### 2.2 KR-BERT

KR-BERT는 **서브캐릭터 표현**을 사용하여 한국어 형태소 변화를 더 잘 처리한다.

```
예시: "갔다" 분해
- KoBERT:   ["갔", "다"]
- KR-BERT:  ["ㄱ", "ㅏ", "ㅆ", "ㄷ", "ㅏ"] (자모 분리)

장점: 미등록 단어(OOV) 문제 완화
```

### 2.3 KRongBERT (2025)

```
KRongBERT 특징:
- 형태소 기반 팩토라이제이션
- OOV 문제 해결
- 한국어 특화 임베딩 레이어
```

---

## 3. BGE-M3-Korean

### 3.1 모델 소개

BGE-M3-Korean은 BAAI/bge-m3를 한국어에 파인튜닝한 모델로, 2026년 현재 **한국어 문장 임베딩에서 최고 성능**을 보인다.

```typescript
// Hugging Face 모델 사용
const model = 'upskyy/bge-m3-korean';

// 특징
- 1024 차원
- 문장/문단 임베딩 최적화
- 의미적 유사도, 검색, 클러스터링 지원
```

### 3.2 구현

```typescript
// lib/embeddings/bge-korean.ts
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

export async function getBgeKoreanEmbedding(
  text: string
): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: 'upskyy/bge-m3-korean',
    inputs: text,
  });

  return response as number[];
}

// 배치 처리
export async function getBgeKoreanBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const responses = await Promise.all(
    texts.map(text =>
      hf.featureExtraction({
        model: 'upskyy/bge-m3-korean',
        inputs: text,
      })
    )
  );

  return responses as number[][];
}
```

---

## 4. 다국어 모델 vs 한국어 전용

### 4.1 성능 비교

| 태스크 | KoBERT | mBERT | XLM-R | BGE-M3-KR |
|--------|--------|-------|-------|-----------|
| 감성 분석 | 89% | 85% | 87% | 91% |
| 문장 유사도 | 82% | 78% | 81% | 88% |
| QA | 78% | 75% | 80% | 85% |
| NER | 85% | 82% | 84% | 87% |

### 4.2 선택 가이드

```typescript
// 모델 선택 로직
function selectKoreanModel(
  useCase: 'search' | 'similarity' | 'classification',
  constraints: {
    latency?: 'low' | 'medium' | 'high';
    cost?: 'free' | 'paid';
    offline?: boolean;
  }
): string {
  const { latency, cost, offline } = constraints;

  // 오프라인 필요
  if (offline) {
    return latency === 'low' ? 'kobert' : 'bge-m3-korean';
  }

  // 유료 가능
  if (cost === 'paid') {
    return 'gemini-embedding-001'; // 최고 성능
  }

  // 기본 권장
  return 'bge-m3-korean';
}
```

---

## 5. 하이브리드 접근

### 5.1 모노링구얼 + 멀티링구얼 앙상블

```typescript
// lib/embeddings/hybrid-korean.ts

// 한국어 쿼리는 KoBERT, 영어 쿼리는 mBERT
async function getHybridEmbedding(
  text: string
): Promise<number[]> {
  const isKorean = detectLanguage(text) === 'ko';

  if (isKorean) {
    return getBgeKoreanEmbedding(text);
  }

  return getMultilingualEmbedding(text);
}

function detectLanguage(text: string): 'ko' | 'en' | 'other' {
  const koreanRatio = (text.match(/[가-힣]/g) || []).length / text.length;

  if (koreanRatio > 0.3) return 'ko';
  if (/^[a-zA-Z\s]+$/.test(text)) return 'en';
  return 'other';
}
```

### 5.2 앙상블 투표

```typescript
// 여러 모델 결과 앙상블
interface EnsembleResult {
  embedding: number[];
  confidence: number;
}

async function ensembleKoreanEmbeddings(
  text: string,
  models: string[]
): Promise<EnsembleResult> {
  const embeddings = await Promise.all(
    models.map(model => getModelEmbedding(model, text))
  );

  // 평균 임베딩
  const avgEmbedding = averageVectors(embeddings);

  // 일관성 기반 신뢰도
  const confidence = calculateConsistency(embeddings);

  return { embedding: avgEmbedding, confidence };
}
```

---

## 6. K-뷰티 도메인 최적화

### 6.1 도메인 특화 파인튜닝

```python
# 학습 데이터 예시
training_data = [
    ("건성 피부용 세럼", "드라이 스킨 에센스", 1.0),  # 유사
    ("지성 피부 토너", "오일리 스킨 스킨", 1.0),     # 유사
    ("건성 피부용 세럼", "지성 피부 토너", 0.2),     # 비유사
]

# 파인튜닝 (Sentence Transformers)
from sentence_transformers import SentenceTransformer, losses

model = SentenceTransformer('upskyy/bge-m3-korean')
train_loss = losses.CosineSimilarityLoss(model)

# 학습...
```

### 6.2 도메인 용어 매핑

```typescript
// K-뷰티 도메인 동의어 처리
const K_BEAUTY_SYNONYMS = {
  '세럼': ['에센스', '앰플', 'serum', 'essence'],
  '건성': ['드라이', 'dry', '건조한'],
  '지성': ['오일리', 'oily', '기름진'],
  '히알루론산': ['HA', 'hyaluronic acid', '히아루론산'],
};

function normalizeKBeautyQuery(query: string): string {
  let normalized = query;

  for (const [standard, variants] of Object.entries(K_BEAUTY_SYNONYMS)) {
    for (const variant of variants) {
      normalized = normalized.replace(
        new RegExp(variant, 'gi'),
        standard
      );
    }
  }

  return normalized;
}
```

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Gemini Embedding 한국어 테스트
- [ ] 언어 감지 로직 구현
- [ ] 기본 한국어 정규화

### 단기 적용 (P1)

- [ ] BGE-M3-Korean 평가
- [ ] 도메인 동의어 사전
- [ ] 하이브리드 접근 구현

### 장기 적용 (P2)

- [ ] K-뷰티 파인튜닝 검토
- [ ] 앙상블 시스템
- [ ] 성능 벤치마크

---

## 8. 참고 자료

- [KR-BERT Paper](https://arxiv.org/abs/2008.03979)
- [BGE-M3-Korean on Hugging Face](https://huggingface.co/upskyy/bge-m3-korean)
- [Korean Embedding Models Survey](https://www.nature.com/articles/s41598-025-88960-y)
- [Multilingual BERT Korean Performance](https://pmc.ncbi.nlm.nih.gov/articles/PMC11539635/)

---

**Version**: 1.0 | **Priority**: P1 High
