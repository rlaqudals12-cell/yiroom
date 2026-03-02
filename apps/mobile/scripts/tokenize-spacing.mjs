import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const DIRS = [join(process.cwd(), 'components'), join(process.cwd(), 'app')];

const SPACING_MAP = {
  2: 'spacing.xxs',
  4: 'spacing.xs',
  8: 'spacing.sm',
  10: 'spacing.smd',
  12: 'spacing.smx',
  16: 'spacing.md',
  20: 'spacing.mlg',
  24: 'spacing.lg',
  32: 'spacing.xl',
  48: 'spacing.xxl',
};

const SPACING_PROPS = [
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'paddingHorizontal', 'paddingVertical',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical',
  'gap', 'rowGap', 'columnGap',
];

function getAllFiles(dir) {
  const results = [];
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...getAllFiles(fullPath));
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          results.push(fullPath);
        }
      } catch {}
    }
  } catch {}
  return results;
}

let totalReplacements = 0;
let totalFiles = 0;

for (const dir of DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    const original = content;
    let count = 0;

    for (const prop of SPACING_PROPS) {
      for (const [num, token] of Object.entries(SPACING_MAP)) {
        const regex = new RegExp(`(${prop}:\\s*)${num}\\b(?!\\.)`, 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, `$1${token}`);
          count += matches.length;
        }
      }
    }

    if (content !== original) {
      writeFileSync(file, content, 'utf-8');
      const relPath = relative(process.cwd(), file);
      console.log(`  ${relPath}: ${count} replacements`);
      totalReplacements += count;
      totalFiles++;
    }
  }
}

console.log(`\nTotal: ${totalReplacements} replacements in ${totalFiles} files`);
