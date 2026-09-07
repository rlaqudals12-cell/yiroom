import { readFile } from 'node:fs/promises';
import path from 'node:path';

// 새 원리 문서가 검토 없이 공개되지 않도록 파일명을 명시한다.
const PUBLISHED_DOCUMENTS = [{ slug: 'personal-contrast', title: '퍼스널 대비 원리' }] as const;
const MEDICAL_TERMS = ['치료', '진단', '질환', '시술', '의료', '병원', '의원', '여드름', '아토피'];
const MEDICAL_ENGLISH = /\b(?:diagnos|treat|disease|medical|clinic|acne|eczema|therap|cure)\w*\b/i;

export interface MethodologyDocument {
  slug: string;
  title: string;
  markdown: string;
}

/** 공개 검토 후에도 원문 변경으로 의료 표현이 유입되면 문서 전체를 제외한다. */
export function passesMedicalExpressionScan(markdown: string): boolean {
  const normalized = markdown.normalize('NFKC');
  return (
    normalized.trim().length > 0 &&
    !MEDICAL_TERMS.some((term) => normalized.includes(term)) &&
    !/개선\s*효과/.test(normalized) &&
    !MEDICAL_ENGLISH.test(normalized)
  );
}

/** 고정 허용 목록의 원문만 읽고 공개 가능한 문서를 반환한다. */
export async function getMethodologyDocuments(): Promise<MethodologyDocument[]> {
  const documents = await Promise.all(
    PUBLISHED_DOCUMENTS.map(async ({ slug, title }): Promise<MethodologyDocument | null> => {
      try {
        const markdown = await readFile(
          path.join(process.cwd(), '../../docs/principles', `${slug}.md`),
          'utf8'
        );
        return passesMedicalExpressionScan(markdown) ? { slug, title, markdown } : null;
      } catch {
        // 원문이 없는 환경에서는 내용을 만들어내지 않고 공개 목록에서 제외한다.
        return null;
      }
    })
  );
  return documents.filter((document): document is MethodologyDocument => document !== null);
}
