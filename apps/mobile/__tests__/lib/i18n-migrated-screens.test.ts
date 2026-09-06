import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const HANGUL = /[가-힣]/;

function findUiKoreanLiterals(relativePath: string): string[] {
  const absolutePath = path.join(process.cwd(), relativePath);
  const sourceText = fs.readFileSync(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const violations: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isStringLiteralLike(node) || ts.isJsxText(node)) &&
      HANGUL.test(node.getText(sourceFile))
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      violations.push(`${relativePath}:${line + 1}:${node.getText(sourceFile)}`);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

describe('화면 단위 i18n 이관 경계', () => {
  it.each([
    'app/(auth)/sign-in.tsx',
    'app/(auth)/sign-up.tsx',
    'app/(auth)/forgot-password.tsx',
    'app/(auth)/complete-profile.tsx',
    'app/(auth)/age-restricted.tsx',
    'app/(auth)/_layout.tsx',
  ])('%s의 가시 문자열이 한국어 literal로 회귀하지 않는다', (relativePath) => {
    expect(findUiKoreanLiterals(relativePath)).toEqual([]);
  });
});
