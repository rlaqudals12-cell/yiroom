import { createElement, type ReactElement, type ReactNode } from 'react';

// 원문 HTML과 내부 문서 링크를 실행하지 않고 검토된 문서의 서식만 표현한다.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return <span key={index}>{link[1]}</span>;
    return part.replace(/\\([*])/g, '$1');
  });
}

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function PrincipleDocument({ markdown }: { markdown: string }): ReactElement {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('```')) {
      const code: string[] = [];
      while (++i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i]);
      blocks.push(
        <pre key={i} className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{code.join('\n')}</code>
        </pre>
      );
    } else if (/^#{1,6}\s/.test(line)) {
      const heading = /^(#{1,6})\s+(.+)$/.exec(line)!;
      blocks.push(
        createElement(
          `h${Math.min(heading[1].length + 1, 6)}`,
          { key: i, className: 'mt-6 font-semibold text-lg' },
          inline(heading[2])
        )
      );
    } else if (line.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[i + 1]?.trim() ?? '')) {
      const headers = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      i--;
      blocks.push(
        <div key={i} className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((header, j) => (
                  <th key={j} scope="col" className="border p-3 text-left">
                    {inline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} className="border p-3 align-top">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (/^(?:- |\d+\. )/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const pattern = ordered ? /^\d+\.\s+/ : /^-\s+/;
      const items: ReactNode[] = [];
      while (i < lines.length && pattern.test(lines[i].trim())) {
        items.push(<li key={i}>{inline(lines[i].trim().replace(pattern, ''))}</li>);
        i++;
      }
      i--;
      blocks.push(
        createElement(
          ordered ? 'ol' : 'ul',
          { key: i, className: `${ordered ? 'list-decimal' : 'list-disc'} space-y-2 pl-6` },
          items
        )
      );
    } else if (/^---+$/.test(line)) {
      blocks.push(<hr key={i} />);
    } else if (line.startsWith('>')) {
      blocks.push(
        <blockquote key={i} className="border-l-2 pl-4 text-muted-foreground">
          {inline(line.replace(/^>\s?/, ''))}
        </blockquote>
      );
    } else {
      blocks.push(
        <p key={i} className="leading-7">
          {inline(line)}
        </p>
      );
    }
  }
  return (
    <div data-testid="principle-document" className="space-y-4 break-words">
      {blocks}
    </div>
  );
}
