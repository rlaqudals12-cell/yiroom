/**
 * 모바일은 존재하지 않는 테이블을 직접 조회·저장하지 않는다.
 * 되돌림 시 실제 호출 전에 소스 계약 단계에서 실패하도록 고정한다.
 */
import fs from 'node:fs';
import path from 'node:path';

import { DELETION_TABLES } from '@/types/gdpr';

const MOBILE_ROOT = path.resolve(__dirname, '../..');
const SCAN_DIRS = ['app', 'components', 'hooks', 'lib'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

const GHOST_TABLES = [
  'fasting_logs',
  'user_activities',
  'skin_assessments',
  'body_assessments',
  'posture_assessments',
  'feedbacks',
  'product_wishlist',
  'weight_logs',
  'weight_goals',
  'user_messages',
  'wishlist',
  'user_analyses',
  'workout_sessions',
  'feed_items',
  'feed_likes',
  'scan_history',
  'user_milestones',
] as const;

function collectSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(fullPath, files);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

describe('유령 테이블 회귀 방지', () => {
  it('프로덕션 모바일 소스에 유령 .from() 호출이 없다', () => {
    const files = SCAN_DIRS.flatMap((dir) => collectSourceFiles(path.join(MOBILE_ROOT, dir)));
    expect(files.length).toBeGreaterThan(100);

    const offenders = files.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return GHOST_TABLES.filter((table) =>
        source.includes(`.from('${table}')`)
      ).map((table) => `${path.relative(MOBILE_ROOT, file)} -> ${table}`);
    });

    expect(offenders).toEqual([]);
  });

  it('API가 없는 체중·제품 찜 화면은 저장 성공을 가장하지 않는다', () => {
    const weightSource = fs.readFileSync(
      path.join(MOBILE_ROOT, 'app', '(reports)', 'weight-goal.tsx'),
      'utf8'
    );
    const productSource = fs.readFileSync(
      path.join(MOBILE_ROOT, 'app', 'products', '[id].tsx'),
      'utf8'
    );

    expect(weightSource).toContain('체중 기록 저장은 현재 지원하지 않아요.');
    expect(weightSource).not.toContain('아직 체중 기록이 없어요');
    expect(weightSource.match(/editable=\{false\}/g)).toHaveLength(2);
    expect(weightSource).not.toContain('체중이 기록되었어요!');
    expect(productSource).toContain('제품 찜하기 저장은 현재 지원하지 않아요.');
    expect(productSource).not.toContain('DB 저장 실패 시 로컬 상태만 유지');
  });

  it('분석 횟수를 조회할 계약이 없으면 0회로 위장하지 않는다', () => {
    const profileSource = fs.readFileSync(
      path.join(MOBILE_ROOT, 'app', '(social)', 'leaderboard', 'profile.tsx'),
      'utf8'
    );

    expect(profileSource).toContain('totalAnalyses: null');
    expect(profileSource).toContain("{stat.value ?? '—'}");
    expect(profileSource).not.toContain('totalAnalyses: 0');
  });

  it('계정 삭제 테이블 목록도 스키마 정본 이름을 사용한다', () => {
    expect(DELETION_TABLES).toContain('posture_analyses');
    expect(DELETION_TABLES).toContain('user_wishlists');
    expect(DELETION_TABLES).not.toContain('posture_assessments' as never);
    expect(DELETION_TABLES).not.toContain('wishlist' as never);
  });
});
