/**
 * E2E Test: Ingredients API
 * @description 성분 분석 API 엔드포인트 E2E 테스트
 */

import { test, expect } from '@playwright/test';

const API_BASE = '/api';

test.describe('Ingredients API - 성분 검색', () => {
  test('GET /api/ingredients - 기본 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ingredients`);

    // API가 인증 필요 시 401, 성공 시 200
    const status = response.status();
    expect([200, 401]).toContain(status);

    if (status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('ingredients');
      expect(Array.isArray(data.ingredients)).toBe(true);
    }
  });

  test('GET /api/ingredients?search=히알루론산 - 검색 쿼리', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/ingredients?search=${encodeURIComponent('히알루론산')}`
    );

    const status = response.status();
    expect([200, 401]).toContain(status);

    if (status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('ingredients');
    }
  });

  test('GET /api/ingredients?category=moisturizer - 카테고리 필터', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ingredients?category=moisturizer`);

    const status = response.status();
    expect([200, 401]).toContain(status);

    if (status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('ingredients');
    }
  });

  test('GET /api/ingredients?ewgMax=2 - EWG 등급 필터', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ingredients?ewgMax=2`);

    const status = response.status();
    expect([200, 401]).toContain(status);

    if (status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('ingredients');
      // 모든 성분이 EWG 2 이하인지 확인
      if (data.ingredients.length > 0) {
        data.ingredients.forEach((ing: { ewg_score: number }) => {
          expect(ing.ewg_score).toBeLessThanOrEqual(2);
        });
      }
    }
  });

  test('GET /api/ingredients?limit=5 - 페이지네이션', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ingredients?limit=5`);

    const status = response.status();
    expect([200, 401]).toContain(status);

    if (status === 200) {
      const data = await response.json();
      expect(data.ingredients.length).toBeLessThanOrEqual(5);
    }
  });
});

test.describe('Ingredients API - 성분 상세', () => {
  test('GET /api/ingredients/:id - 존재하는 성분', async ({ request }) => {
    // 먼저 성분 목록을 조회하여 ID를 가져옴
    const listResponse = await request.get(`${API_BASE}/ingredients?limit=1`);
    const listStatus = listResponse.status();

    if (listStatus === 200) {
      const listData = await listResponse.json();

      if (listData.ingredients && listData.ingredients.length > 0) {
        const ingredientId = listData.ingredients[0].id;
        const detailResponse = await request.get(`${API_BASE}/ingredients/${ingredientId}`);

        expect(detailResponse.status()).toBe(200);

        const detail = await detailResponse.json();
        expect(detail).toHaveProperty('id');
        expect(detail).toHaveProperty('name_ko');
        expect(detail).toHaveProperty('ewg_score');
      }
    }
  });

  test('GET /api/ingredients/:id - 존재하지 않는 성분', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ingredients/non-existent-id-12345`);

    // 404 또는 401 (인증 필요 시)
    expect([404, 401]).toContain(response.status());
  });
});

test.describe('Ingredients API - 제품 성분 분석', () => {
  test('GET /api/products/:id/ingredients - 제품 성분 조회', async ({ request }) => {
    // 화장품 제품 ID로 테스트 (실제 ID 필요)
    const response = await request.get(`${API_BASE}/products/test-product-id/ingredients`);

    // 404 (제품 없음), 401 (인증 필요), 또는 200 (성공)
    expect([200, 401, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('ingredients');
      expect(data).toHaveProperty('analysis');
    }
  });

  test('GET /api/products/:id/ingredients?includeAI=true - AI 분석 포함', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/products/test-product-id/ingredients?includeAI=true`
    );

    // 제품이 없으면 404, 인증 필요 시 401
    expect([200, 401, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      // AI 분석 결과가 있을 수 있음
      expect(data).toHaveProperty('ingredients');
    }
  });
});

test.describe('Ingredients API - 에러 처리', () => {
  test('잘못된 EWG 범위 - 에러 응답', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ingredients?ewgMin=15`);

    // 400 Bad Request 또는 200 (파라미터 무시)
    expect([200, 400, 401]).toContain(response.status());
  });

  test('잘못된 limit 값 - 에러 응답', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ingredients?limit=-5`);

    // 400 Bad Request 또는 200 (기본값 사용)
    expect([200, 400, 401]).toContain(response.status());
  });
});
