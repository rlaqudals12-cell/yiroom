/**
 * RAG 시스템 API 유틸리티
 * @description 연구 문서 벡터 검색 및 RAG 응답 생성
 * @version 1.0
 * @date 2025-12-04
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { supabase } from '@/lib/supabase/client';
import type {
  ResearchDocument,
  DocumentChunk,
  DocumentSearchResult,
  ChunkSearchResult,
  DocumentCategory,
  DocumentLanguage,
  CreateResearchDocumentInput,
  UpdateResearchDocumentInput,
  CreateDocumentChunkInput,
  VectorSearchOptions,
  HybridSearchOptions,
  RAGContext,
  RAGResponse,
  DocumentStats,
} from '@/types/rag';

// ================================================
// 임베딩 생성 (OpenAI API)
// ================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-ada-002';

/**
 * 텍스트를 벡터 임베딩으로 변환
 * @param text 임베딩할 텍스트
 * @returns 1536차원 벡터
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`임베딩 생성 실패: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * 여러 텍스트를 벡터 임베딩으로 변환 (배치)
 * @param texts 임베딩할 텍스트 배열
 * @returns 임베딩 벡터 배열
 */
export async function createEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`임베딩 생성 실패: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

// ================================================
// 문서 CRUD
// ================================================

/**
 * 연구 문서 생성 (임베딩 자동 생성)
 * @param input 문서 입력
 * @returns 생성된 문서
 */
export async function createResearchDocument(
  input: CreateResearchDocumentInput
): Promise<ResearchDocument | null> {
  const serviceClient = createServiceRoleClient();

  // 임베딩 생성 (제목 + 요약 + 내용 일부)
  const textForEmbedding = [
    input.title,
    input.summary || '',
    input.content.slice(0, 2000), // 처음 2000자만 사용
  ].join('\n');

  let embedding: number[] | null = null;
  try {
    embedding = await createEmbedding(textForEmbedding);
  } catch (error) {
    console.warn('임베딩 생성 실패, 나중에 재시도:', error);
  }

  const { data, error } = await serviceClient
    .from('research_documents')
    .insert({
      title: input.title,
      source: input.source,
      source_url: input.source_url,
      published_date: input.published_date,
      authors: input.authors,
      category: input.category,
      tags: input.tags,
      content: input.content,
      summary: input.summary,
      key_findings: input.key_findings,
      embedding,
      language: input.language || 'ko',
      relevance_score: input.relevance_score || 1.0,
    })
    .select()
    .single();

  if (error) {
    console.error('문서 생성 실패:', error);
    return null;
  }

  return data as ResearchDocument;
}

/**
 * 문서 업데이트
 */
export async function updateResearchDocument(
  id: string,
  input: UpdateResearchDocumentInput
): Promise<ResearchDocument | null> {
  const serviceClient = createServiceRoleClient();

  // 내용이 변경되면 임베딩 재생성
  if (input.content || input.title || input.summary) {
    const { data: existing } = await serviceClient
      .from('research_documents')
      .select('title, summary, content')
      .eq('id', id)
      .single();

    if (existing) {
      const textForEmbedding = [
        input.title || existing.title,
        input.summary || existing.summary || '',
        (input.content || existing.content).slice(0, 2000),
      ].join('\n');

      try {
        input.embedding = await createEmbedding(textForEmbedding);
      } catch (error) {
        console.warn('임베딩 재생성 실패:', error);
      }
    }
  }

  const { data, error } = await serviceClient
    .from('research_documents')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('문서 업데이트 실패:', error);
    return null;
  }

  return data as ResearchDocument;
}

/**
 * 문서 삭제 (soft delete)
 */
export async function deleteResearchDocument(id: string): Promise<boolean> {
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient
    .from('research_documents')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('문서 삭제 실패:', error);
    return false;
  }

  return true;
}

/**
 * 문서 조회
 */
export async function getResearchDocument(id: string): Promise<ResearchDocument | null> {
  const { data, error } = await supabase
    .from('research_documents')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('문서 조회 실패:', error);
    return null;
  }

  return data as ResearchDocument;
}

/**
 * 카테고리별 문서 목록 조회
 */
export async function getDocumentsByCategory(
  category: DocumentCategory,
  limit = 50
): Promise<ResearchDocument[]> {
  const { data, error } = await supabase
    .from('research_documents')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('relevance_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('문서 목록 조회 실패:', error);
    return [];
  }

  return data as ResearchDocument[];
}

// ================================================
// 벡터 검색
// ================================================

/**
 * 벡터 유사도 기반 문서 검색
 * @param options 검색 옵션
 * @returns 유사한 문서 목록
 */
export async function searchDocuments(
  options: VectorSearchOptions
): Promise<DocumentSearchResult[]> {
  const { data, error } = await supabase.rpc('search_documents', {
    query_embedding: options.query_embedding,
    match_count: options.match_count || 5,
    filter_category: options.filter_category || null,
    filter_language: options.filter_language || 'ko',
    similarity_threshold: options.similarity_threshold || 0.7,
  });

  if (error) {
    console.error('문서 검색 실패:', error);
    return [];
  }

  return data as DocumentSearchResult[];
}

/**
 * 하이브리드 검색 (벡터 + 텍스트)
 */
export async function hybridSearchDocuments(
  options: HybridSearchOptions
): Promise<DocumentSearchResult[]> {
  const { data, error } = await supabase.rpc('hybrid_search_documents', {
    query_embedding: options.query_embedding,
    query_text: options.query_text,
    match_count: options.match_count || 5,
    filter_category: options.filter_category || null,
    filter_language: options.filter_language || 'ko',
    vector_weight: options.vector_weight || 0.7,
    text_weight: options.text_weight || 0.3,
  });

  if (error) {
    console.error('하이브리드 검색 실패:', error);
    return [];
  }

  return data as DocumentSearchResult[];
}

/**
 * 텍스트 쿼리로 문서 검색 (임베딩 자동 생성)
 * @param query 검색 쿼리
 * @param category 카테고리 필터
 * @param limit 결과 수
 */
export async function searchDocumentsByQuery(
  query: string,
  category?: DocumentCategory,
  limit = 5
): Promise<DocumentSearchResult[]> {
  const embedding = await createEmbedding(query);

  return searchDocuments({
    query_embedding: embedding,
    match_count: limit,
    filter_category: category,
    similarity_threshold: 0.6, // 쿼리 검색은 임계값 낮춤
  });
}

// ================================================
// 청크 관리
// ================================================

/**
 * 문서 청크 생성
 */
export async function createDocumentChunk(
  input: CreateDocumentChunkInput
): Promise<DocumentChunk | null> {
  const serviceClient = createServiceRoleClient();

  // 청크 임베딩 생성
  let embedding: number[] | null = null;
  try {
    embedding = await createEmbedding(input.content);
  } catch (error) {
    console.warn('청크 임베딩 생성 실패:', error);
  }

  const { data, error } = await serviceClient
    .from('document_chunks')
    .insert({
      document_id: input.document_id,
      chunk_index: input.chunk_index,
      content: input.content,
      token_count: input.token_count,
      embedding,
    })
    .select()
    .single();

  if (error) {
    console.error('청크 생성 실패:', error);
    return null;
  }

  return data as DocumentChunk;
}

/**
 * 문서를 청크로 분할하여 저장
 * @param documentId 문서 ID
 * @param content 전체 내용
 * @param chunkSize 청크 크기 (문자 수, 기본 1000)
 * @param overlap 오버랩 (문자 수, 기본 100)
 */
export async function splitAndSaveChunks(
  documentId: string,
  content: string,
  chunkSize = 1000,
  overlap = 100
): Promise<number> {
  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    chunks.push(content.slice(start, end));
    start = end - overlap;
  }

  let savedCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = await createDocumentChunk({
      document_id: documentId,
      chunk_index: i,
      content: chunks[i],
      token_count: Math.ceil(chunks[i].length / 4), // 대략적인 토큰 수
    });

    if (chunk) savedCount++;
  }

  return savedCount;
}

/**
 * 청크 검색
 */
export async function searchChunks(
  queryEmbedding: number[],
  category?: DocumentCategory,
  limit = 10
): Promise<ChunkSearchResult[]> {
  const { data, error } = await supabase.rpc('search_document_chunks', {
    query_embedding: queryEmbedding,
    match_count: limit,
    filter_category: category || null,
    similarity_threshold: 0.6,
  });

  if (error) {
    console.error('청크 검색 실패:', error);
    return [];
  }

  return data as ChunkSearchResult[];
}

// ================================================
// RAG 응답 생성
// ================================================

/**
 * RAG 컨텍스트 생성
 * @param query 사용자 질문
 * @param category 카테고리 필터
 */
export async function buildRAGContext(
  query: string,
  category?: DocumentCategory
): Promise<RAGContext> {
  const documents = await searchDocumentsByQuery(query, category, 5);

  // 토큰 수 대략 계산 (한글 기준)
  const totalTokens = documents.reduce((sum, doc) => {
    const text = [doc.title, doc.summary, doc.key_findings?.join(' ')].join(' ');
    return sum + Math.ceil(text.length / 2); // 한글은 약 2자당 1토큰
  }, 0);

  const sources = documents.map((doc) => ({
    title: doc.title,
    source: doc.source,
    url: doc.source_url,
  }));

  return {
    documents,
    total_tokens: totalTokens,
    sources,
  };
}

/**
 * RAG 기반 응답 생성 (Gemini 사용)
 * @param query 사용자 질문
 * @param category 카테고리 필터
 */
export async function generateRAGResponse(
  query: string,
  category?: DocumentCategory
): Promise<RAGResponse> {
  const context = await buildRAGContext(query, category);

  // 컨텍스트가 비어있으면 일반 응답
  if (context.documents.length === 0) {
    return {
      answer: '관련 연구 자료를 찾지 못했습니다. 일반적인 정보로 답변드리겠습니다.',
      context,
      confidence: 0.3,
    };
  }

  // 컨텍스트 문자열 생성
  const contextText = context.documents
    .map((doc, i) => {
      return `[${i + 1}] ${doc.title} (${doc.source})
요약: ${doc.summary || '없음'}
주요 발견: ${doc.key_findings?.join(', ') || '없음'}`;
    })
    .join('\n\n');

  // Gemini API 호출 (기존 gemini.ts 활용 가능)
  // 여기서는 간단한 형태로 구현
  const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return {
      answer: 'AI 서비스가 설정되지 않았습니다.',
      context,
      confidence: 0,
    };
  }

  const prompt = `당신은 이룸(Yiroom) 웰니스 플랫폼의 AI 어시스턴트입니다.
아래 연구 자료를 참고하여 사용자의 질문에 답변하세요.
답변은 한국어로, 친절하고 이해하기 쉽게 작성하세요.
답변에 출처를 인용하세요 (예: [1] 참조).

## 연구 자료
${contextText}

## 사용자 질문
${query}

## 답변`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API 호출 실패');
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답 생성 실패';

    // 신뢰도 계산 (상위 문서의 유사도 평균)
    const avgSimilarity =
      context.documents.reduce((sum, doc) => sum + doc.similarity, 0) /
      context.documents.length;

    return {
      answer,
      context,
      confidence: Math.min(avgSimilarity + 0.1, 1.0), // 약간 보정
    };
  } catch (error) {
    console.error('RAG 응답 생성 실패:', error);
    return {
      answer: '응답 생성 중 오류가 발생했습니다.',
      context,
      confidence: 0,
    };
  }
}

// ================================================
// 통계
// ================================================

/**
 * 문서 통계 조회
 */
export async function getDocumentStats(): Promise<DocumentStats> {
  const serviceClient = createServiceRoleClient();

  const { data: docs } = await serviceClient
    .from('research_documents')
    .select('category, language, embedding')
    .eq('is_active', true);

  const { count: chunkCount } = await serviceClient
    .from('document_chunks')
    .select('id', { count: 'exact', head: true });

  const byCategory: Record<DocumentCategory, number> = {
    skincare: 0,
    nutrition: 0,
    fitness: 0,
    personal_color: 0,
    cosmetics: 0,
    wellness: 0,
  };

  const byLanguage: Record<DocumentLanguage, number> = {
    ko: 0,
    en: 0,
    ja: 0,
  };

  let withEmbeddings = 0;

  docs?.forEach((doc) => {
    byCategory[doc.category as DocumentCategory]++;
    byLanguage[doc.language as DocumentLanguage]++;
    if (doc.embedding) withEmbeddings++;
  });

  return {
    total_documents: docs?.length || 0,
    by_category: byCategory,
    by_language: byLanguage,
    with_embeddings: withEmbeddings,
    total_chunks: chunkCount || 0,
  };
}
