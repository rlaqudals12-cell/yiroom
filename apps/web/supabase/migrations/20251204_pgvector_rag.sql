-- RAG 시스템: pgvector 확장 + research_documents 테이블
-- 버전: 1.0
-- 작성일: 2025-12-04
-- 목적: 논문/연구 기반 AI 추천을 위한 벡터 검색 인프라

-- ================================================
-- 1. pgvector 확장 활성화
-- ================================================
-- Supabase에서 pgvector는 기본 제공됨
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================
-- 2. research_documents (연구 문서 테이블)
-- ================================================
CREATE TABLE IF NOT EXISTS research_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 문서 메타데이터
  title TEXT NOT NULL,
  source TEXT NOT NULL, -- journal name, website, etc.
  source_url TEXT,
  published_date DATE,
  authors TEXT[], -- 저자 목록

  -- 카테고리 및 태그
  category TEXT NOT NULL CHECK (category IN (
    'skincare',      -- 피부과학
    'nutrition',     -- 영양학
    'fitness',       -- 운동생리학
    'personal_color', -- 퍼스널 컬러/색채학
    'cosmetics',     -- 화장품 과학
    'wellness'       -- 종합 웰니스
  )),
  tags TEXT[], -- 세부 태그

  -- 컨텐츠
  content TEXT NOT NULL, -- 전체 본문
  summary TEXT, -- AI 생성 요약
  key_findings TEXT[], -- 핵심 발견/결론

  -- 벡터 임베딩 (OpenAI ada-002: 1536차원)
  embedding vector(1536),

  -- 관련성 점수 및 메타
  relevance_score DECIMAL(3,2) DEFAULT 1.0, -- 품질 점수 (0.00~1.00)
  citation_count INTEGER DEFAULT 0,

  -- 언어
  language TEXT DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'ja')),

  -- 활성화 상태
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유니크 제약 (시드 upsert용)
  UNIQUE(title)
);

-- ================================================
-- 3. 벡터 인덱스 (IVFFlat)
-- ================================================
-- IVFFlat 인덱스: 대규모 벡터 검색에 최적화
-- lists = 100: 약 10,000개 문서까지 효율적
-- 문서가 많아지면 lists 값 조정 필요 (sqrt(n) 권장)
CREATE INDEX IF NOT EXISTS idx_research_documents_embedding
  ON research_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 일반 인덱스
CREATE INDEX IF NOT EXISTS idx_research_documents_category
  ON research_documents(category);
CREATE INDEX IF NOT EXISTS idx_research_documents_tags
  ON research_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_documents_language
  ON research_documents(language);
CREATE INDEX IF NOT EXISTS idx_research_documents_published_date
  ON research_documents(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_research_documents_is_active
  ON research_documents(is_active) WHERE is_active = true;

-- ================================================
-- 4. 벡터 검색 함수
-- ================================================
-- 코사인 유사도 기반 벡터 검색 함수
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_language TEXT DEFAULT 'ko',
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  source TEXT,
  source_url TEXT,
  category TEXT,
  summary TEXT,
  key_findings TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rd.id,
    rd.title,
    rd.source,
    rd.source_url,
    rd.category,
    rd.summary,
    rd.key_findings,
    1 - (rd.embedding <=> query_embedding) AS similarity
  FROM research_documents rd
  WHERE rd.is_active = true
    AND rd.embedding IS NOT NULL
    AND (filter_category IS NULL OR rd.category = filter_category)
    AND rd.language = filter_language
    AND 1 - (rd.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY rd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ================================================
-- 5. 하이브리드 검색 함수 (벡터 + 텍스트)
-- ================================================
-- 벡터 유사도 + 텍스트 매칭을 결합한 검색
CREATE OR REPLACE FUNCTION hybrid_search_documents(
  query_embedding vector(1536),
  query_text TEXT,
  match_count INTEGER DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_language TEXT DEFAULT 'ko',
  vector_weight FLOAT DEFAULT 0.7,
  text_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  source TEXT,
  source_url TEXT,
  category TEXT,
  summary TEXT,
  key_findings TEXT[],
  combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rd.id,
    rd.title,
    rd.source,
    rd.source_url,
    rd.category,
    rd.summary,
    rd.key_findings,
    (
      vector_weight * (1 - (rd.embedding <=> query_embedding)) +
      text_weight * COALESCE(
        ts_rank(
          to_tsvector('simple', rd.title || ' ' || COALESCE(rd.summary, '') || ' ' || rd.content),
          plainto_tsquery('simple', query_text)
        ),
        0
      )
    ) AS combined_score
  FROM research_documents rd
  WHERE rd.is_active = true
    AND rd.embedding IS NOT NULL
    AND (filter_category IS NULL OR rd.category = filter_category)
    AND rd.language = filter_language
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- ================================================
-- 6. 테이블 코멘트
-- ================================================
COMMENT ON TABLE research_documents IS 'RAG 시스템용 연구 문서 DB (논문, 연구자료)';
COMMENT ON COLUMN research_documents.embedding IS 'OpenAI ada-002 임베딩 벡터 (1536차원)';
COMMENT ON COLUMN research_documents.category IS '문서 카테고리: skincare, nutrition, fitness, personal_color, cosmetics, wellness';
COMMENT ON COLUMN research_documents.relevance_score IS '문서 품질/관련성 점수 (0.00~1.00)';
COMMENT ON FUNCTION search_documents IS '코사인 유사도 기반 벡터 검색';
COMMENT ON FUNCTION hybrid_search_documents IS '벡터 + 텍스트 하이브리드 검색';

-- ================================================
-- 7. updated_at 트리거
-- ================================================
DROP TRIGGER IF EXISTS update_research_documents_updated_at ON research_documents;
CREATE TRIGGER update_research_documents_updated_at
  BEFORE UPDATE ON research_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 8. RLS 정책
-- ================================================
ALTER TABLE research_documents ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (활성화된 문서만)
DROP POLICY IF EXISTS "Public read active research documents" ON research_documents;
CREATE POLICY "Public read active research documents"
  ON research_documents FOR SELECT
  USING (is_active = true);

-- Service Role만 쓰기 허용
DROP POLICY IF EXISTS "Service role full access research documents" ON research_documents;
CREATE POLICY "Service role full access research documents"
  ON research_documents FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================
-- 9. 문서 청크 테이블 (선택적 - 긴 문서 분할용)
-- ================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES research_documents(id) ON DELETE CASCADE,

  -- 청크 정보
  chunk_index INTEGER NOT NULL, -- 청크 순서
  content TEXT NOT NULL, -- 청크 내용
  token_count INTEGER, -- 토큰 수

  -- 벡터 임베딩
  embedding vector(1536),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 청크 인덱스
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
  ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 청크 테이블 코멘트
COMMENT ON TABLE document_chunks IS '긴 문서의 분할 청크 (옵션)';
COMMENT ON COLUMN document_chunks.chunk_index IS '문서 내 청크 순서 (0부터 시작)';

-- 청크 RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read document chunks" ON document_chunks;
CREATE POLICY "Public read document chunks"
  ON document_chunks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM research_documents rd
    WHERE rd.id = document_chunks.document_id AND rd.is_active = true
  ));

DROP POLICY IF EXISTS "Service role full access chunks" ON document_chunks;
CREATE POLICY "Service role full access chunks"
  ON document_chunks FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================
-- 10. 청크 검색 함수
-- ================================================
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 10,
  filter_category TEXT DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title TEXT,
  source TEXT,
  chunk_content TEXT,
  chunk_index INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    rd.title AS document_title,
    rd.source,
    dc.content AS chunk_content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN research_documents rd ON rd.id = dc.document_id
  WHERE rd.is_active = true
    AND dc.embedding IS NOT NULL
    AND (filter_category IS NULL OR rd.category = filter_category)
    AND 1 - (dc.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_document_chunks IS '문서 청크 단위 벡터 검색';
