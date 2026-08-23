import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const APP_ROOT = path.resolve(__dirname, '../../app');
const ROUTE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

function collectRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectRouteFiles(absolutePath);
      return ROUTE_EXTENSIONS.has(path.extname(entry.name)) ? [absolutePath] : [];
    })
    .sort();
}

function hasDefaultExport(sourceText: string, fileName = 'route.tsx'): boolean {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  return sourceFile.statements.some((statement) => {
    if (ts.isExportAssignment(statement)) return !statement.isExportEquals;

    if (
      ts.canHaveModifiers(statement) &&
      ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      return true;
    }

    return (
      ts.isExportDeclaration(statement) &&
      !!statement.exportClause &&
      ts.isNamedExports(statement.exportClause) &&
      statement.exportClause.elements.some((element) => element.name.text === 'default')
    );
  });
}

describe('Expo Router 파일 경계', () => {
  it('app 아래 모든 소스 파일이 라우트로 유효한 default export를 가진다', () => {
    const missingDefaultExport = collectRouteFiles(APP_ROOT)
      .filter((filePath) => !hasDefaultExport(readFileSync(filePath, 'utf8'), filePath))
      .map((filePath) => path.relative(APP_ROOT, filePath).replaceAll('\\', '/'));

    expect(missingDefaultExport).toEqual([]);
  });

  it.each([
    ['선언', 'export default function Route() { return null; }'],
    ['식', 'const Route = () => null; export default Route;'],
    ['재수출', "export { default } from './route-screen';"],
  ])('%s 형태의 default export를 인식한다', (_label, sourceText) => {
    expect(hasDefaultExport(sourceText)).toBe(true);
  });

  it('주석과 이름 있는 export를 default export로 오인하지 않는다', () => {
    expect(
      hasDefaultExport('// export default FakeRoute\nexport function helper() { return null; }')
    ).toBe(false);
  });
});
