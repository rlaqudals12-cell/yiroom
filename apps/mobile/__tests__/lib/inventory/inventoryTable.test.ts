/**
 * 인벤토리 테이블명 정본 회귀 방지
 *
 * 회귀 방지 대상 (2026-08 수리):
 *   모바일이 실재하지 않는 옛 테이블명을 조회해 옷장·코디가 항상 빈 상태였다.
 *   정본은 마이그레이션(supabase/migrations/20260711_user_inventory_closet.sql)과
 *   웹 전 경로가 쓰는 user_inventory.
 */

import fs from 'fs';
import path from 'path';

import { INVENTORY_TABLE, SAVED_OUTFITS_TABLE } from '../../../lib/inventory/types';

/**
 * 실재하지 않는 옛 테이블명.
 * 리터럴로 적지 않고 런타임 조립하는 이유: 이 테스트 파일 자체가 소스 스캔·저장소 grep에
 * 걸려 "잔존 0" 검증을 오염시키는 것을 막기 위함.
 */
const LEGACY_TABLE = ['inventory', 'items'].join('_');

const MOBILE_ROOT = path.resolve(__dirname, '../../..');
const SCAN_DIRS = ['app', 'lib', 'components', 'hooks', 'types'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, acc);
    } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      acc.push(fullPath);
    }
  }
  return acc;
}

describe('인벤토리 테이블 상수', () => {
  it('정본 테이블명을 가리킨다', () => {
    expect(INVENTORY_TABLE).toBe('user_inventory');
    expect(SAVED_OUTFITS_TABLE).toBe('saved_outfits');
  });
});

describe('옛 테이블명 잔존 0', () => {
  it('모바일 소스 어디에도 실재하지 않는 테이블명이 남아있지 않다', () => {
    const files = SCAN_DIRS.map((dir) => path.join(MOBILE_ROOT, dir))
      .filter((dir) => fs.existsSync(dir))
      .flatMap((dir) => collectSourceFiles(dir));

    // 스캔 자체가 헛돌지 않았음을 보장 (경로가 틀리면 빈 배열이라 항상 통과했을 것)
    expect(files.length).toBeGreaterThan(100);

    const offenders = files.filter((file) => fs.readFileSync(file, 'utf8').includes(LEGACY_TABLE));

    expect(offenders.map((file) => path.relative(MOBILE_ROOT, file))).toEqual([]);
  });
});
