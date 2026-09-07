import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { getMethodologyDocuments } from './documents';
import { PrincipleDocument } from './PrincipleDocument';

export const metadata: Metadata = {
  title: '분석 방법론 | 이룸',
  description: '이룸이 색과 조화를 해석하는 원리와 한계를 살펴보세요.',
  robots: { index: false, follow: false },
};

export default async function MethodologyPage(): Promise<ReactElement> {
  const documents = await getMethodologyDocuments();
  return (
    <main data-testid="methodology-page" className="mx-auto max-w-4xl space-y-10 px-6 py-12">
      <header className="space-y-4">
        <Link href="/" className="text-sm underline">
          이룸 홈으로
        </Link>
        <h1 className="font-serif text-3xl">분석 방법론</h1>
        <p className="leading-7 text-muted-foreground">
          색과 조화를 해석할 때 참고하는 원리와 측정의 한계를 공개해요. 검토를 마친 문서부터 차례로
          소개해 드릴게요.
        </p>
      </header>
      {documents.length === 0 ? (
        <p data-testid="methodology-empty">
          공개할 문서를 준비하고 있어요. 잠시 후 다시 방문해 주세요.
        </p>
      ) : (
        <>
          <nav aria-label="방법론 목차">
            <ul className="space-y-2">
              {documents.map((document) => (
                <li key={document.slug}>
                  <a className="underline" href={`#${document.slug}`}>
                    {document.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {documents.map((document) => (
            <article
              key={document.slug}
              id={document.slug}
              aria-label={document.title}
              className="scroll-mt-8 border-t pt-8"
            >
              <PrincipleDocument markdown={document.markdown} />
            </article>
          ))}
        </>
      )}
    </main>
  );
}
