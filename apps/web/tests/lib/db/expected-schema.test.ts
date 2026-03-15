import { describe, it, expect } from 'vitest';
import { POST_CREATION_COLUMNS, type SchemaExpectation } from '@/lib/db/expected-schema';

describe('expected-schema', () => {
  it('POST_CREATION_COLUMNS가 배열이다', () => {
    expect(Array.isArray(POST_CREATION_COLUMNS)).toBe(true);
    expect(POST_CREATION_COLUMNS.length).toBeGreaterThan(0);
  });

  it('각 항목이 SchemaExpectation 구조를 가진다', () => {
    for (const col of POST_CREATION_COLUMNS) {
      expect(typeof col.table).toBe('string');
      expect(typeof col.column).toBe('string');
      expect(typeof col.migration).toBe('string');
      expect(typeof col.addedDate).toBe('string');
      expect(col.table.length).toBeGreaterThan(0);
      expect(col.column.length).toBeGreaterThan(0);
    }
  });

  it('addedDate가 유효한 날짜 형식이다', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const col of POST_CREATION_COLUMNS) {
      expect(col.addedDate).toMatch(dateRegex);
    }
  });

  it('migration 파일명이 .sql로 끝난다', () => {
    for (const col of POST_CREATION_COLUMNS) {
      expect(col.migration).toMatch(/\.sql$/);
    }
  });

  it('중복 항목이 없다', () => {
    const keys = POST_CREATION_COLUMNS.map(
      (col: SchemaExpectation) => `${col.table}.${col.column}`
    );
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('users 테이블 컬럼이 포함되어 있다', () => {
    const usersCols = POST_CREATION_COLUMNS.filter(
      (col: SchemaExpectation) => col.table === 'users'
    );
    expect(usersCols.length).toBeGreaterThan(0);
  });
});
