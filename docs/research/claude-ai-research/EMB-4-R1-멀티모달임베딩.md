# 멀티모달 임베딩

> **ID**: EMB-4
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/rag/

---

## 1. 멀티모달 임베딩 개요

### 1.1 핵심 개념

멀티모달 임베딩은 **텍스트, 이미지, 오디오 등 다양한 모달리티를 동일한 벡터 공간에 매핑**하는 기술이다.

```
┌────────────────────────────────────────────────┐
│          Shared Embedding Space                │
├────────────────────────────────────────────────┤
│                                                │
│    "보습 세럼"  ──►  [0.12, 0.45, ...]         │
│                           │                    │
│                     근접 거리                   │
│                           │                    │
│    [세럼 이미지] ──►  [0.14, 0.43, ...]        │
│                                                │
│    Text-to-Image / Image-to-Text 검색 가능     │
│                                                │
└────────────────────────────────────────────────┘
```

### 1.2 주요 모델

| 모델 | 제공자 | 차원 | 모달리티 | 특징 |
|------|--------|------|---------|------|
| **CLIP** | OpenAI | 512 | 텍스트, 이미지 | 기준 모델 |
| **JinaCLIP v1** | Jina AI | 768 | 텍스트, 이미지 | CLIP 대비 165% 향상 |
| **voyage-multimodal-3** | Voyage AI | 1024 | 텍스트, 이미지 | 32K 토큰 |
| **SigLIP 2** | Google | 768+ | 텍스트, 이미지 | 최신 모델 |
| **EVA-CLIP** | BAAI | 768 | 텍스트, 이미지 | 오픈소스 |

---

## 2. CLIP 아키텍처

### 2.1 구조

```
┌─────────────────────────────────────────────────────┐
│                      CLIP                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐     ┌─────────────────┐       │
│  │  Text Encoder   │     │  Image Encoder  │       │
│  │  (Transformer)  │     │   (ViT/ResNet)  │       │
│  └────────┬────────┘     └────────┬────────┘       │
│           │                       │                 │
│           ▼                       ▼                 │
│      Text Embedding          Image Embedding       │
│        [512-dim]               [512-dim]           │
│           │                       │                 │
│           └───────────┬───────────┘                 │
│                       │                             │
│                 Cosine Similarity                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.2 OpenAI CLIP 사용

```typescript
// lib/embeddings/clip.ts
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

// 텍스트 임베딩
export async function getClipTextEmbedding(
  text: string
): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: 'openai/clip-vit-large-patch14',
    inputs: text,
  });

  return response as number[];
}

// 이미지 임베딩
export async function getClipImageEmbedding(
  imageBase64: string
): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: 'openai/clip-vit-large-patch14',
    inputs: {
      image: imageBase64,
    },
  });

  return response as number[];
}
```

---

## 3. JinaCLIP v1

### 3.1 성능 향상

```
CLIP 대비 JinaCLIP 개선:
- 텍스트 전용 검색: +165%
- 이미지 전용 검색: +12%
- 텍스트→이미지: 동등
- 이미지→텍스트: 동등
```

### 3.2 구현

```typescript
// lib/embeddings/jina-clip.ts

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';

interface JinaEmbeddingRequest {
  model: string;
  input: Array<{
    text?: string;
    image?: string; // base64
  }>;
}

export async function getJinaClipEmbedding(
  input: { text?: string; image?: string }
): Promise<number[]> {
  const response = await fetch(JINA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'jina-clip-v1',
      input: [input],
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

// 멀티모달 검색
export async function multimodalSearch(
  query: { text?: string; image?: string },
  documents: Array<{ text: string; image?: string }>
): Promise<Array<{ doc: any; score: number }>> {
  // 쿼리 임베딩
  const queryEmbedding = await getJinaClipEmbedding(query);

  // 문서 임베딩
  const docEmbeddings = await Promise.all(
    documents.map(doc => getJinaClipEmbedding(doc))
  );

  // 유사도 계산
  return documents
    .map((doc, i) => ({
      doc,
      score: cosineSimilarity(queryEmbedding, docEmbeddings[i]),
    }))
    .sort((a, b) => b.score - a.score);
}
```

---

## 4. Multimodal RAG 구현

### 4.1 아키텍처

```typescript
// lib/rag/multimodal-rag.ts

interface MultimodalDocument {
  id: string;
  text: string;
  imageUrl?: string;
  textEmbedding?: number[];
  imageEmbedding?: number[];
}

export class MultimodalRAG {
  private embedder: MultimodalEmbedder;
  private vectorStore: VectorStore;

  async indexDocument(doc: MultimodalDocument): Promise<void> {
    // 텍스트 임베딩
    if (doc.text) {
      doc.textEmbedding = await this.embedder.embedText(doc.text);
    }

    // 이미지 임베딩
    if (doc.imageUrl) {
      const imageBase64 = await fetchImageAsBase64(doc.imageUrl);
      doc.imageEmbedding = await this.embedder.embedImage(imageBase64);
    }

    // 저장
    await this.vectorStore.upsert(doc);
  }

  async search(
    query: { text?: string; image?: string },
    options: { topK?: number; modality?: 'text' | 'image' | 'both' } = {}
  ): Promise<MultimodalDocument[]> {
    const { topK = 10, modality = 'both' } = options;

    const queryEmbedding = query.text
      ? await this.embedder.embedText(query.text)
      : await this.embedder.embedImage(query.image!);

    // 모달리티별 검색
    if (modality === 'text') {
      return this.vectorStore.searchByTextEmbedding(queryEmbedding, topK);
    }

    if (modality === 'image') {
      return this.vectorStore.searchByImageEmbedding(queryEmbedding, topK);
    }

    // 둘 다 검색 후 융합
    const [textResults, imageResults] = await Promise.all([
      this.vectorStore.searchByTextEmbedding(queryEmbedding, topK),
      this.vectorStore.searchByImageEmbedding(queryEmbedding, topK),
    ]);

    return this.fuseResults(textResults, imageResults);
  }

  private fuseResults(
    textResults: MultimodalDocument[],
    imageResults: MultimodalDocument[]
  ): MultimodalDocument[] {
    // RRF 융합
    return reciprocalRankFusion([textResults, imageResults]);
  }
}
```

### 4.2 이룸 제품 검색 적용

```typescript
// lib/rag/product-multimodal.ts

// 제품 이미지로 유사 제품 검색
export async function searchByProductImage(
  imageBase64: string
): Promise<Product[]> {
  const rag = new MultimodalRAG();

  const results = await rag.search(
    { image: imageBase64 },
    { topK: 10, modality: 'image' }
  );

  return results.map(r => r as Product);
}

// 텍스트 + 이미지 복합 검색
export async function searchProductsMultimodal(
  query: string,
  referenceImage?: string
): Promise<Product[]> {
  const rag = new MultimodalRAG();

  if (referenceImage) {
    // 텍스트와 이미지 임베딩 결합
    const textEmb = await rag.embedder.embedText(query);
    const imageEmb = await rag.embedder.embedImage(referenceImage);

    // 가중 평균
    const combinedEmb = weightedAverage(textEmb, imageEmb, 0.7, 0.3);

    return rag.searchByEmbedding(combinedEmb, 10);
  }

  return rag.search({ text: query });
}
```

---

## 5. Modality Gap 문제

### 5.1 문제점

```
Modality Gap:
- 같은 객체를 설명하는 텍스트와 이미지 임베딩이
  벡터 공간에서 멀리 떨어져 있는 현상

예시:
  "빨간 립스틱" 텍스트 임베딩
    ↓
  [실제 빨간 립스틱 이미지] 임베딩
    → 예상보다 거리가 멂
```

### 5.2 해결 방법

```typescript
// 1. Contrastive Learning 기반 파인튜닝
// 2. 프로젝션 레이어 추가
// 3. 앙상블 접근

// 프로젝션 레이어 예시
function alignModalities(
  textEmbedding: number[],
  imageEmbedding: number[],
  projectionMatrix: number[][]
): { alignedText: number[]; alignedImage: number[] } {
  // 선형 변환으로 공간 정렬
  const alignedText = matrixMultiply(textEmbedding, projectionMatrix);
  const alignedImage = imageEmbedding; // 이미지는 기준

  return { alignedText, alignedImage };
}
```

---

## 6. 이룸 활용 사례

### 6.1 피부 분석 + 제품 추천

```typescript
// 피부 사진으로 제품 추천
async function recommendProductsFromSkinImage(
  skinImageBase64: string,
  analysisResult: SkinAnalysisResult
): Promise<Product[]> {
  // 1. 이미지 임베딩
  const imageEmb = await getClipImageEmbedding(skinImageBase64);

  // 2. 분석 결과 텍스트 임베딩
  const textQuery = `${analysisResult.skinType} 피부 ${analysisResult.concerns.join(' ')} 개선 제품`;
  const textEmb = await getClipTextEmbedding(textQuery);

  // 3. 복합 검색
  const products = await searchProductsMultimodal(
    textQuery,
    skinImageBase64
  );

  return products;
}
```

### 6.2 제품 유사도 검색

```typescript
// 비슷한 제품 찾기 (이미지 기반)
async function findSimilarProducts(
  productId: string
): Promise<Product[]> {
  const product = await getProduct(productId);

  if (!product.imageUrl) {
    // 텍스트 기반 검색
    return searchProducts(product.name);
  }

  // 이미지 기반 유사 제품
  const imageBase64 = await fetchImageAsBase64(product.imageUrl);
  return searchByProductImage(imageBase64);
}
```

---

## 7. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] CLIP 기본 통합
- [ ] 이미지 임베딩 API
- [ ] 텍스트-이미지 검색

### 단기 적용 (P1)

- [ ] JinaCLIP 평가
- [ ] 제품 이미지 인덱싱
- [ ] 멀티모달 RAG 파이프라인

### 장기 적용 (P2)

- [ ] Modality Gap 해결
- [ ] 피부 분석 연동
- [ ] 실시간 추천 시스템

---

## 8. 참고 자료

- [OpenAI CLIP Cookbook](https://cookbook.openai.com/examples/custom_image_embedding_search)
- [JinaCLIP Announcement](https://jina.ai/news/jina-clip-v1-a-truly-multimodal-embeddings-model-for-text-and-image/)
- [NVIDIA Multimodal RAG Guide](https://developer.nvidia.com/blog/an-easy-introduction-to-multimodal-retrieval-augmented-generation/)
- [Zilliz CLIP to JinaCLIP](https://zilliz.com/blog/clip-to-jinaclip-general-text-image-search-multimodal-rag)

---

**Version**: 1.0 | **Priority**: P1 High
