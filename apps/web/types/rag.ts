/**
 * RAG 시스템 타입 정의
 * 연구 문서 및 벡터 검색 관련 타입
 */

// ================================================
// 문서 카테고리
// ================================================
export type DocumentCategory =
  | 'skincare'       // 피부과학
  | 'nutrition'      // 영양학
  | 'fitness'        // 운동생리학
  | 'personal_color' // 퍼스널 컬러/색채학
  | 'cosmetics'      // 화장품 과학
  | 'wellness';      // 종합 웰니스

export type DocumentLanguage = 'ko' | 'en' | 'ja';

// ================================================
// research_documents 테이블 타입
// ================================================
export interface ResearchDocument {
  id: string;
  title: string;
  source: string;
  source_url: string | null;
  published_date: string | null; // ISO date string
  authors: string[] | null;
  category: DocumentCategory;
  tags: string[] | null;
  content: string;
  summary: string | null;
  key_findings: string[] | null;
  embedding: number[] | null; // 1536 dimensions
  relevance_score: number;
  citation_count: number;
  language: DocumentLanguage;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 문서 생성 입력 타입
export interface CreateResearchDocumentInput {
  title: string;
  source: string;
  source_url?: string;
  published_date?: string;
  authors?: string[];
  category: DocumentCategory;
  tags?: string[];
  content: string;
  summary?: string;
  key_findings?: string[];
  language?: DocumentLanguage;
  relevance_score?: number;
}

// 문서 업데이트 입력 타입
export interface UpdateResearchDocumentInput {
  title?: string;
  source?: string;
  source_url?: string;
  published_date?: string;
  authors?: string[];
  category?: DocumentCategory;
  tags?: string[];
  content?: string;
  summary?: string;
  key_findings?: string[];
  embedding?: number[];
  language?: DocumentLanguage;
  relevance_score?: number;
  is_active?: boolean;
}

// ================================================
// document_chunks 테이블 타입
// ================================================
export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  embedding: number[] | null;
  created_at: string;
}

export interface CreateDocumentChunkInput {
  document_id: string;
  chunk_index: number;
  content: string;
  token_count?: number;
}

// ================================================
// 벡터 검색 결과 타입
// ================================================
export interface DocumentSearchResult {
  id: string;
  title: string;
  source: string;
  source_url: string | null;
  category: DocumentCategory;
  summary: string | null;
  key_findings: string[] | null;
  similarity: number;
}

export interface ChunkSearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  source: string;
  chunk_content: string;
  chunk_index: number;
  similarity: number;
}

// ================================================
// 검색 옵션 타입
// ================================================
export interface VectorSearchOptions {
  query_embedding: number[];
  match_count?: number;
  filter_category?: DocumentCategory;
  filter_language?: DocumentLanguage;
  similarity_threshold?: number;
}

export interface HybridSearchOptions extends VectorSearchOptions {
  query_text: string;
  vector_weight?: number;
  text_weight?: number;
}

// ================================================
// 임베딩 관련 타입
// ================================================
export interface EmbeddingRequest {
  text: string;
  model?: 'text-embedding-ada-002' | 'text-embedding-3-small' | 'text-embedding-3-large';
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// ================================================
// RAG 컨텍스트 타입
// ================================================
export interface RAGContext {
  documents: DocumentSearchResult[];
  total_tokens: number;
  sources: Array<{
    title: string;
    source: string;
    url: string | null;
  }>;
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  confidence: number; // 0.0 ~ 1.0
}

// ================================================
// 문서 상태 및 메타데이터
// ================================================
export interface DocumentStats {
  total_documents: number;
  by_category: Record<DocumentCategory, number>;
  by_language: Record<DocumentLanguage, number>;
  with_embeddings: number;
  total_chunks: number;
}

// ================================================
// 카테고리 메타데이터
// ================================================
export const DOCUMENT_CATEGORIES: Record<DocumentCategory, {
  label: string;
  description: string;
  icon: string;
}> = {
  skincare: {
    label: '피부과학',
    description: '피부 건강, 피부 질환, 스킨케어 연구',
    icon: '🧴',
  },
  nutrition: {
    label: '영양학',
    description: '영양소, 식이요법, 건강식품 연구',
    icon: '🥗',
  },
  fitness: {
    label: '운동생리학',
    description: '운동, 체력, 신체 활동 연구',
    icon: '🏋️',
  },
  personal_color: {
    label: '퍼스널 컬러',
    description: '색채학, 퍼스널 컬러 이론',
    icon: '🎨',
  },
  cosmetics: {
    label: '화장품 과학',
    description: '화장품 성분, 제형, 효능 연구',
    icon: '💄',
  },
  wellness: {
    label: '종합 웰니스',
    description: '전반적인 건강, 웰빙 연구',
    icon: '🌿',
  },
};

export const DOCUMENT_LANGUAGES: Record<DocumentLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};
