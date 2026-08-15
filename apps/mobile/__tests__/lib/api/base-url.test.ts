/**
 * 웹 API base URL 해석 정본 테스트 (lib/api/base-url)
 *
 * 계약 고정 (2026-08 출시 블로커 수리):
 * - 해석 우선순위: 명시 인자 → EXPO_PUBLIC_YIROOM_API_URL → EXPO_PUBLIC_API_URL → 프로덕션 웹
 * - **설정 누락은 에러가 아니다.** 이전에는 lib/api/* 전체가 CONFIG_ERROR로 죽었고,
 *   두 env 어느 것도 실제 빌드에 설정된 적이 없어 EAS 빌드에서 분석이 전멸했다.
 * - 하드코딩 잔존 0: 프로덕션 호스트·env 이름은 이 정본 파일에만 존재한다.
 */
import fs from 'fs';
import path from 'path';

import { getApiBaseUrl, getWebHostLabel, DEFAULT_API_BASE_URL } from '@/lib/api/base-url';

/**
 * env 이름·호스트를 리터럴로 적지 않고 런타임 조립한다.
 * 이 테스트 파일 자체가 소스 스캔에 걸려 "잔존 0" 검증을 오염시키는 것을 막기 위함
 * (inventoryTable.test.ts와 동일 패턴).
 */
const ENV_YIROOM = ['EXPO', 'PUBLIC', 'YIROOM', 'API', 'URL'].join('_');
const ENV_GENERIC = ['EXPO', 'PUBLIC', 'API', 'URL'].join('_');
const PROD_HOST = ['yiroom', 'vercel', 'app'].join('.');

const ENV_KEYS = [ENV_YIROOM, ENV_GENERIC];

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('DEFAULT_API_BASE_URL', () => {
  it('프로덕션 웹을 가리킨다', () => {
    expect(DEFAULT_API_BASE_URL).toBe(`https://${PROD_HOST}`);
  });
});

describe('getApiBaseUrl 해석 우선순위', () => {
  it('명시 인자가 두 env보다 우선한다', () => {
    process.env[ENV_YIROOM] = 'https://env-yiroom.test';
    process.env[ENV_GENERIC] = 'https://env-generic.test';

    expect(getApiBaseUrl('https://explicit.test')).toBe('https://explicit.test');
  });

  it('인자가 없으면 YIROOM 전용 env가 범용 env보다 우선한다', () => {
    process.env[ENV_YIROOM] = 'https://env-yiroom.test';
    process.env[ENV_GENERIC] = 'https://env-generic.test';

    expect(getApiBaseUrl()).toBe('https://env-yiroom.test');
  });

  it('YIROOM 전용 env가 없으면 범용 env를 쓴다', () => {
    process.env[ENV_GENERIC] = 'https://env-generic.test';

    expect(getApiBaseUrl()).toBe('https://env-generic.test');
  });

  it('둘 다 없으면 프로덕션 웹으로 폴백한다 (CONFIG_ERROR 없음)', () => {
    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });
});

describe('getApiBaseUrl 정규화', () => {
  it('빈 문자열·공백만 있는 env는 미설정으로 취급한다', () => {
    process.env[ENV_YIROOM] = '';
    process.env[ENV_GENERIC] = '   ';

    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it('빈 문자열 인자도 미설정으로 취급해 env로 내려간다', () => {
    process.env[ENV_YIROOM] = 'https://env-yiroom.test';

    expect(getApiBaseUrl('')).toBe('https://env-yiroom.test');
  });

  it('끝의 슬래시를 제거한다 (호출부가 `${url}/api/...`로 조립하므로)', () => {
    process.env[ENV_YIROOM] = 'https://env-yiroom.test///';

    expect(getApiBaseUrl()).toBe('https://env-yiroom.test');
    expect(getApiBaseUrl('http://localhost:3000/')).toBe('http://localhost:3000');
  });

  it('앞뒤 공백을 잘라낸다', () => {
    process.env[ENV_YIROOM] = '  https://env-yiroom.test  ';

    expect(getApiBaseUrl()).toBe('https://env-yiroom.test');
  });
});

describe('getWebHostLabel', () => {
  it('사용자 안내 문구용으로 스킴을 제거한 호스트를 준다', () => {
    expect(getWebHostLabel()).toBe(PROD_HOST);
    expect(getWebHostLabel('https://yiroom.example')).toBe('yiroom.example');
    expect(getWebHostLabel('http://localhost:3000')).toBe('localhost:3000');
  });
});

// ============================================
// 하드코딩 잔존 0 가드
// ============================================

const MOBILE_ROOT = path.resolve(__dirname, '../../..');
const SCAN_DIRS = ['app', 'lib', 'components', 'hooks', 'types'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];
const CANON = path.join('lib', 'api', 'base-url.ts');

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

function offendersFor(needle: string): string[] {
  const files = SCAN_DIRS.map((dir) => path.join(MOBILE_ROOT, dir))
    .filter((dir) => fs.existsSync(dir))
    .flatMap((dir) => collectSourceFiles(dir));

  // 스캔이 헛돌지 않았음을 보장 (경로가 틀리면 빈 배열이라 항상 통과했을 것)
  expect(files.length).toBeGreaterThan(100);

  return files
    .filter((file) => fs.readFileSync(file, 'utf8').includes(needle))
    .map((file) => path.relative(MOBILE_ROOT, file));
}

describe('base URL 하드코딩 잔존 0', () => {
  it('프로덕션 호스트 리터럴은 정본 모듈에만 있다', () => {
    expect(offendersFor(PROD_HOST)).toEqual([CANON]);
  });

  it('YIROOM 전용 env 직접 참조는 정본 모듈에만 있다', () => {
    expect(offendersFor(ENV_YIROOM)).toEqual([CANON]);
  });

  it('범용 env 직접 참조는 정본 모듈에만 있다', () => {
    expect(offendersFor(ENV_GENERIC)).toEqual([CANON]);
  });
});
