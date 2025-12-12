/**
 * Research Documents 시드 스크립트
 * @description 연구 문서 데이터를 Supabase에 입력하고 임베딩 생성
 * @usage npx tsx scripts/seed-research-documents.ts
 * @note OPENAI_API_KEY 환경 변수 필요 (임베딩 생성용)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('필요한 환경 변수:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Service Role 클라이언트 (RLS 우회)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 시드 데이터 인터페이스
interface ResearchDocumentSeed {
  title: string;
  source: string;
  source_url: string | null;
  published_date: string | null;
  authors: string[] | null;
  tags: string[] | null;
  summary: string | null;
  key_findings: string[] | null;
  content: string;
  language: string;
  relevance_score: number;
}

interface SeedFile {
  category: string;
  description: string;
  documents: ResearchDocumentSeed[];
}

/**
 * OpenAI API를 사용하여 임베딩 생성
 */
async function createEmbedding(text: string): Promise<number[] | null> {
  if (!openaiApiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 8000), // 토큰 제한 고려
        model: 'text-embedding-ada-002',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn(`  ⚠️ 임베딩 생성 실패: ${error.error?.message}`);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.warn(`  ⚠️ 임베딩 생성 오류: ${error}`);
    return null;
  }
}

/**
 * 단일 카테고리 시드 파일 처리
 */
async function seedCategory(
  filename: string,
  generateEmbeddings: boolean
): Promise<number> {
  const seedPath = path.join(__dirname, '../data/seeds', filename);

  if (!fs.existsSync(seedPath)) {
    console.warn(`  ⚠️ 파일 없음: ${filename}`);
    return 0;
  }

  const seedData: SeedFile = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  const { category, documents } = seedData;

  console.log(`\n📚 ${category} 카테고리 (${documents.length}개 문서)`);

  let successCount = 0;

  for (const doc of documents) {
    // 임베딩 생성 (옵션)
    let embedding: number[] | null = null;
    if (generateEmbeddings) {
      const textForEmbedding = [
        doc.title,
        doc.summary || '',
        doc.content.slice(0, 2000),
      ].join('\n');

      embedding = await createEmbedding(textForEmbedding);

      // API 레이트 제한 방지 (0.5초 대기)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 데이터 삽입
    const { error } = await supabase.from('research_documents').upsert(
      {
        title: doc.title,
        source: doc.source,
        source_url: doc.source_url,
        published_date: doc.published_date,
        authors: doc.authors,
        category,
        tags: doc.tags,
        summary: doc.summary,
        key_findings: doc.key_findings,
        content: doc.content,
        embedding,
        language: doc.language || 'ko',
        relevance_score: doc.relevance_score || 1.0,
        is_active: true,
      },
      {
        onConflict: 'title',
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error(`  ❌ ${doc.title}: ${error.message}`);
    } else {
      const embeddingStatus = embedding ? '✓' : '✗';
      console.log(`  ✅ ${doc.title} (임베딩: ${embeddingStatus})`);
      successCount++;
    }
  }

  return successCount;
}

/**
 * 모든 연구 문서 시드 실행
 */
async function seedAllDocuments() {
  console.log('🚀 연구 문서 시드 시작');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 OpenAI API: ${openaiApiKey ? '설정됨' : '미설정 (임베딩 생략)'}`);

  // 임베딩 생성 여부 확인
  const generateEmbeddings = !!openaiApiKey;

  if (!generateEmbeddings) {
    console.log('\n⚠️ OPENAI_API_KEY가 없어 임베딩 생성을 건너뜁니다.');
    console.log('   나중에 별도로 임베딩을 생성할 수 있습니다.\n');
  }

  // 시드 파일 목록
  const seedFiles = [
    'research-skincare.json',
    'research-nutrition.json',
    'research-fitness.json',
  ];

  let totalSuccess = 0;

  for (const file of seedFiles) {
    const count = await seedCategory(file, generateEmbeddings);
    totalSuccess += count;
  }

  console.log(`\n✨ 시드 완료: 총 ${totalSuccess}개 문서 입력됨`);

  // 통계 출력
  const { data: stats } = await supabase
    .from('research_documents')
    .select('category, embedding')
    .eq('is_active', true);

  if (stats) {
    const byCategory: Record<string, number> = {};
    let withEmbeddings = 0;

    stats.forEach((doc) => {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
      if (doc.embedding) withEmbeddings++;
    });

    console.log('\n📊 카테고리별 통계:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}개`);
    });
    console.log(`   임베딩 생성됨: ${withEmbeddings}/${stats.length}개`);
  }
}

/**
 * 임베딩만 별도 생성 (이미 입력된 문서에 대해)
 */
async function generateMissingEmbeddings() {
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY가 필요합니다.');
    process.exit(1);
  }

  console.log('🔄 누락된 임베딩 생성 시작...');

  // 임베딩이 없는 문서 조회
  const { data: docs, error } = await supabase
    .from('research_documents')
    .select('id, title, summary, content')
    .is('embedding', null)
    .eq('is_active', true);

  if (error) {
    console.error('❌ 문서 조회 실패:', error.message);
    process.exit(1);
  }

  if (!docs || docs.length === 0) {
    console.log('✅ 모든 문서에 임베딩이 있습니다.');
    return;
  }

  console.log(`📝 임베딩 생성 필요: ${docs.length}개 문서`);

  let successCount = 0;

  for (const doc of docs) {
    const textForEmbedding = [
      doc.title,
      doc.summary || '',
      doc.content.slice(0, 2000),
    ].join('\n');

    const embedding = await createEmbedding(textForEmbedding);

    if (embedding) {
      const { error: updateError } = await supabase
        .from('research_documents')
        .update({ embedding })
        .eq('id', doc.id);

      if (updateError) {
        console.error(`  ❌ ${doc.title}: ${updateError.message}`);
      } else {
        console.log(`  ✅ ${doc.title}`);
        successCount++;
      }
    }

    // API 레이트 제한 방지
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n✨ 임베딩 생성 완료: ${successCount}/${docs.length}개`);
}

// CLI 실행
const args = process.argv.slice(2);

if (args.includes('--embeddings-only')) {
  generateMissingEmbeddings().catch(console.error);
} else {
  seedAllDocuments().catch(console.error);
}
