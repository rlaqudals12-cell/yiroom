import { readFileSync, writeFileSync } from 'fs';

const files = [
  'components/analysis/PhotoOverlayMap.tsx',
  'components/analysis/ScientificTermTooltip.tsx',
  'components/analysis/SkinVitalityScore.tsx',
  'components/common/ProgressiveDisclosure.tsx',
  'components/common/TimelineChart.tsx',
  'components/inventory/CategoryFilter.tsx',
  'components/nutrition/MealSuggestionCard.tsx',
  'components/profile/LevelBadge.tsx',
  'components/records/MacroBreakdownBar.tsx',
  'components/skin/DiaryCalendar.tsx',
  'components/skin/MonthlyReportCard.tsx',
  'components/social/ActivityFeed.tsx',
  'components/social/FriendList.tsx',
  'components/style/TodayOutfitSuggestion.tsx',
  'components/ui/Badge.tsx',
  'components/ui/ChangeIndicator.tsx',
  'components/ui/SectionHeader.tsx',
];

let fixed = 0;
for (const file of files) {
  let content = readFileSync(file, 'utf-8');

  // Match theme import (various relative paths)
  const themeImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"](?:@\/lib\/theme|\.\.\/\.\.\/lib\/theme|\.\.\/lib\/theme)['"]/;
  const match = content.match(themeImportRegex);

  if (match) {
    const imports = match[1];
    if (!imports.includes('spacing')) {
      const trimmed = imports.replace(/\s*$/, '');
      const newImports = trimmed + ', spacing';
      content = content.replace(match[0], match[0].replace(imports, newImports));
      writeFileSync(file, content, 'utf-8');
      console.log(`  Fixed: ${file}`);
      fixed++;
    } else {
      console.log(`  Already has spacing: ${file}`);
    }
  } else {
    console.log(`  No theme import found: ${file}`);
  }
}
console.log(`\nFixed: ${fixed} files`);
