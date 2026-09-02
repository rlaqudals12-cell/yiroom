import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const AXES = [
  ['personal-color', 'analyzePersonalColor'],
  ['skin', 'analyzeSkin'],
  ['body', 'analyzeBody'],
  ['hair', 'analyzeHair'],
  ['makeup', 'analyzeMakeup'],
] as const;

describe('analysis verdict cache route wiring', () => {
  it.each(AXES)('%s returns a stored verdict before invoking Gemini', (axis, analyzeCall) => {
    const source = readFileSync(
      join(process.cwd(), 'app', 'api', 'analyze', axis, 'route.ts'),
      'utf8'
    );
    const cacheLookup = source.indexOf('findCachedVerdictForUser');
    const cacheReturn = source.indexOf('cacheHit: true');
    const aiInvocation = source.indexOf(`await ${analyzeCall}`);

    expect(source).toContain('createAnalysisImageFingerprint');
    expect(source).toContain('createVerdictCacheEntry');
    expect(cacheLookup).toBeGreaterThan(-1);
    expect(cacheReturn).toBeGreaterThan(cacheLookup);
    expect(aiInvocation).toBeGreaterThan(cacheReturn);
  });
});
