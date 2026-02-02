/**
 * Products 모듈 Barrel Export 통합 테스트
 *
 * @module tests/lib/products/index
 * @description index.ts에서 모든 API가 올바르게 export되는지 검증
 */

import { describe, it, expect } from 'vitest';

// 모든 export를 가져와서 검증
import * as ProductsModule from '@/lib/products';

describe('lib/products barrel exports', () => {
  // =========================================
  // Cosmetic Repository Exports
  // =========================================

  describe('Cosmetic Repository', () => {
    it('getCosmeticProducts가 export된다', () => {
      expect(ProductsModule.getCosmeticProducts).toBeDefined();
      expect(typeof ProductsModule.getCosmeticProducts).toBe('function');
    });

    it('getCosmeticProductById가 export된다', () => {
      expect(ProductsModule.getCosmeticProductById).toBeDefined();
      expect(typeof ProductsModule.getCosmeticProductById).toBe('function');
    });

    it('getRecommendedCosmetics가 export된다', () => {
      expect(ProductsModule.getRecommendedCosmetics).toBeDefined();
      expect(typeof ProductsModule.getRecommendedCosmetics).toBe('function');
    });

    it('getCosmeticBrands가 export된다', () => {
      expect(ProductsModule.getCosmeticBrands).toBeDefined();
      expect(typeof ProductsModule.getCosmeticBrands).toBe('function');
    });
  });

  // =========================================
  // Supplement Repository Exports
  // =========================================

  describe('Supplement Repository', () => {
    it('getSupplementProducts가 export된다', () => {
      expect(ProductsModule.getSupplementProducts).toBeDefined();
      expect(typeof ProductsModule.getSupplementProducts).toBe('function');
    });

    it('getSupplementProductById가 export된다', () => {
      expect(ProductsModule.getSupplementProductById).toBeDefined();
      expect(typeof ProductsModule.getSupplementProductById).toBe('function');
    });

    it('getRecommendedSupplements가 export된다', () => {
      expect(ProductsModule.getRecommendedSupplements).toBeDefined();
      expect(typeof ProductsModule.getRecommendedSupplements).toBe('function');
    });

    it('getSupplementBrands가 export된다', () => {
      expect(ProductsModule.getSupplementBrands).toBeDefined();
      expect(typeof ProductsModule.getSupplementBrands).toBe('function');
    });
  });

  // =========================================
  // Equipment Repository Exports
  // =========================================

  describe('Equipment Repository', () => {
    it('getWorkoutEquipment가 export된다', () => {
      expect(ProductsModule.getWorkoutEquipment).toBeDefined();
      expect(typeof ProductsModule.getWorkoutEquipment).toBe('function');
    });

    it('getWorkoutEquipmentById가 export된다', () => {
      expect(ProductsModule.getWorkoutEquipmentById).toBeDefined();
      expect(typeof ProductsModule.getWorkoutEquipmentById).toBe('function');
    });

    it('getRecommendedEquipment가 export된다', () => {
      expect(ProductsModule.getRecommendedEquipment).toBeDefined();
      expect(typeof ProductsModule.getRecommendedEquipment).toBe('function');
    });

    it('getWorkoutEquipmentBrands가 export된다', () => {
      expect(ProductsModule.getWorkoutEquipmentBrands).toBeDefined();
      expect(typeof ProductsModule.getWorkoutEquipmentBrands).toBe('function');
    });
  });

  // =========================================
  // Health Food Repository Exports
  // =========================================

  describe('Health Food Repository', () => {
    it('getHealthFoods가 export된다', () => {
      expect(ProductsModule.getHealthFoods).toBeDefined();
      expect(typeof ProductsModule.getHealthFoods).toBe('function');
    });

    it('getHealthFoodById가 export된다', () => {
      expect(ProductsModule.getHealthFoodById).toBeDefined();
      expect(typeof ProductsModule.getHealthFoodById).toBe('function');
    });

    it('getRecommendedHealthFoods가 export된다', () => {
      expect(ProductsModule.getRecommendedHealthFoods).toBeDefined();
      expect(typeof ProductsModule.getRecommendedHealthFoods).toBe('function');
    });

    it('getHighProteinFoods가 export된다', () => {
      expect(ProductsModule.getHighProteinFoods).toBeDefined();
      expect(typeof ProductsModule.getHighProteinFoods).toBe('function');
    });

    it('getHealthFoodBrands가 export된다', () => {
      expect(ProductsModule.getHealthFoodBrands).toBeDefined();
      expect(typeof ProductsModule.getHealthFoodBrands).toBe('function');
    });
  });

  // =========================================
  // Price History Repository Exports
  // =========================================

  describe('Price History Repository', () => {
    it('recordPriceHistory가 export된다', () => {
      expect(ProductsModule.recordPriceHistory).toBeDefined();
      expect(typeof ProductsModule.recordPriceHistory).toBe('function');
    });

    it('getPriceHistory가 export된다', () => {
      expect(ProductsModule.getPriceHistory).toBeDefined();
      expect(typeof ProductsModule.getPriceHistory).toBe('function');
    });

    it('getLowestPrice가 export된다', () => {
      expect(ProductsModule.getLowestPrice).toBeDefined();
      expect(typeof ProductsModule.getLowestPrice).toBe('function');
    });

    it('getPriceDropProducts가 export된다', () => {
      expect(ProductsModule.getPriceDropProducts).toBeDefined();
      expect(typeof ProductsModule.getPriceDropProducts).toBe('function');
    });
  });

  // =========================================
  // Search Service Exports
  // =========================================

  describe('Search Service', () => {
    it('PRODUCT_CATEGORIES가 export된다', () => {
      expect(ProductsModule.PRODUCT_CATEGORIES).toBeDefined();
      expect(Array.isArray(ProductsModule.PRODUCT_CATEGORIES)).toBe(true);
    });

    it('getProductsByCategory가 export된다', () => {
      expect(ProductsModule.getProductsByCategory).toBeDefined();
      expect(typeof ProductsModule.getProductsByCategory).toBe('function');
    });

    it('searchProducts가 export된다', () => {
      expect(ProductsModule.searchProducts).toBeDefined();
      expect(typeof ProductsModule.searchProducts).toBe('function');
    });

    it('getProductType가 export된다', () => {
      expect(ProductsModule.getProductType).toBeDefined();
      expect(typeof ProductsModule.getProductType).toBe('function');
    });

    it('getProductById가 export된다', () => {
      expect(ProductsModule.getProductById).toBeDefined();
      expect(typeof ProductsModule.getProductById).toBe('function');
    });

    it('productTypeToPath가 export된다', () => {
      expect(ProductsModule.productTypeToPath).toBeDefined();
      expect(typeof ProductsModule.productTypeToPath).toBe('function');
    });

    it('pathToProductType가 export된다', () => {
      expect(ProductsModule.pathToProductType).toBeDefined();
      expect(typeof ProductsModule.pathToProductType).toBe('function');
    });
  });

  // =========================================
  // Reviews Service Exports
  // =========================================

  describe('Reviews Service', () => {
    it('getProductReviews가 export된다', () => {
      expect(ProductsModule.getProductReviews).toBeDefined();
      expect(typeof ProductsModule.getProductReviews).toBe('function');
    });

    it('getReviewSummary가 export된다', () => {
      expect(ProductsModule.getReviewSummary).toBeDefined();
      expect(typeof ProductsModule.getReviewSummary).toBe('function');
    });

    it('hasUserReviewed가 export된다', () => {
      expect(ProductsModule.hasUserReviewed).toBeDefined();
      expect(typeof ProductsModule.hasUserReviewed).toBe('function');
    });

    it('getUserReviews가 export된다', () => {
      expect(ProductsModule.getUserReviews).toBeDefined();
      expect(typeof ProductsModule.getUserReviews).toBe('function');
    });

    it('createReview가 export된다', () => {
      expect(ProductsModule.createReview).toBeDefined();
      expect(typeof ProductsModule.createReview).toBe('function');
    });

    it('updateReview가 export된다', () => {
      expect(ProductsModule.updateReview).toBeDefined();
      expect(typeof ProductsModule.updateReview).toBe('function');
    });

    it('deleteReview가 export된다', () => {
      expect(ProductsModule.deleteReview).toBeDefined();
      expect(typeof ProductsModule.deleteReview).toBe('function');
    });

    it('toggleReviewHelpful가 export된다', () => {
      expect(ProductsModule.toggleReviewHelpful).toBeDefined();
      expect(typeof ProductsModule.toggleReviewHelpful).toBe('function');
    });

    it('getRatingText가 export된다', () => {
      expect(ProductsModule.getRatingText).toBeDefined();
      expect(typeof ProductsModule.getRatingText).toBe('function');
    });

    it('getRatingColor가 export된다', () => {
      expect(ProductsModule.getRatingColor).toBeDefined();
      expect(typeof ProductsModule.getRatingColor).toBe('function');
    });
  });

  // =========================================
  // Interactions Service Exports
  // =========================================

  describe('Interactions Service', () => {
    it('getInteractionBetween가 export된다', () => {
      expect(ProductsModule.getInteractionBetween).toBeDefined();
      expect(typeof ProductsModule.getInteractionBetween).toBe('function');
    });

    it('getIngredientInteractions가 export된다', () => {
      expect(ProductsModule.getIngredientInteractions).toBeDefined();
      expect(typeof ProductsModule.getIngredientInteractions).toBe('function');
    });

    it('getInteractionsByType가 export된다', () => {
      expect(ProductsModule.getInteractionsByType).toBeDefined();
      expect(typeof ProductsModule.getInteractionsByType).toBe('function');
    });

    it('checkProductInteractions가 export된다', () => {
      expect(ProductsModule.checkProductInteractions).toBeDefined();
      expect(typeof ProductsModule.checkProductInteractions).toBe('function');
    });

    it('checkWishlistInteractions가 export된다', () => {
      expect(ProductsModule.checkWishlistInteractions).toBeDefined();
      expect(typeof ProductsModule.checkWishlistInteractions).toBe('function');
    });

    it('summarizeInteractions가 export된다', () => {
      expect(ProductsModule.summarizeInteractions).toBeDefined();
      expect(typeof ProductsModule.summarizeInteractions).toBe('function');
    });

    it('filterWarningsOnly가 export된다', () => {
      expect(ProductsModule.filterWarningsOnly).toBeDefined();
      expect(typeof ProductsModule.filterWarningsOnly).toBe('function');
    });

    it('filterSynergiesOnly가 export된다', () => {
      expect(ProductsModule.filterSynergiesOnly).toBeDefined();
      expect(typeof ProductsModule.filterSynergiesOnly).toBe('function');
    });
  });

  // =========================================
  // Matching Service Exports
  // =========================================

  describe('Matching Service', () => {
    it('calculateMatchScore가 export된다', () => {
      expect(ProductsModule.calculateMatchScore).toBeDefined();
      expect(typeof ProductsModule.calculateMatchScore).toBe('function');
    });

    it('addMatchInfo가 export된다', () => {
      expect(ProductsModule.addMatchInfo).toBeDefined();
      expect(typeof ProductsModule.addMatchInfo).toBe('function');
    });

    it('addMatchInfoToProducts가 export된다', () => {
      expect(ProductsModule.addMatchInfoToProducts).toBeDefined();
      expect(typeof ProductsModule.addMatchInfoToProducts).toBe('function');
    });
  });

  // =========================================
  // Affiliate Service Exports
  // =========================================

  describe('Affiliate Service', () => {
    it('trackAffiliateClick가 export된다', () => {
      expect(ProductsModule.trackAffiliateClick).toBeDefined();
      expect(typeof ProductsModule.trackAffiliateClick).toBe('function');
    });

    it('openAffiliateLink가 export된다', () => {
      expect(ProductsModule.openAffiliateLink).toBeDefined();
      expect(typeof ProductsModule.openAffiliateLink).toBe('function');
    });

    it('getAffiliateStats가 export된다', () => {
      expect(ProductsModule.getAffiliateStats).toBeDefined();
      expect(typeof ProductsModule.getAffiliateStats).toBe('function');
    });

    it('getProductClickCount가 export된다', () => {
      expect(ProductsModule.getProductClickCount).toBeDefined();
      expect(typeof ProductsModule.getProductClickCount).toBe('function');
    });

    it('getTodayClickCount가 export된다', () => {
      expect(ProductsModule.getTodayClickCount).toBeDefined();
      expect(typeof ProductsModule.getTodayClickCount).toBe('function');
    });
  });

  // =========================================
  // Ingredients Repository Exports
  // =========================================

  describe('Ingredients Repository', () => {
    it('getIngredientById가 export된다', () => {
      expect(ProductsModule.getIngredientById).toBeDefined();
      expect(typeof ProductsModule.getIngredientById).toBe('function');
    });

    it('searchIngredients가 export된다', () => {
      expect(ProductsModule.searchIngredients).toBeDefined();
      expect(typeof ProductsModule.searchIngredients).toBe('function');
    });

    it('getProductIngredients가 export된다', () => {
      expect(ProductsModule.getProductIngredients).toBeDefined();
      expect(typeof ProductsModule.getProductIngredients).toBe('function');
    });

    it('getCaution20Ingredients가 export된다', () => {
      expect(ProductsModule.getCaution20Ingredients).toBeDefined();
      expect(typeof ProductsModule.getCaution20Ingredients).toBe('function');
    });

    it('getAllergenIngredients가 export된다', () => {
      expect(ProductsModule.getAllergenIngredients).toBeDefined();
      expect(typeof ProductsModule.getAllergenIngredients).toBe('function');
    });

    it('getIngredientsByCategory가 export된다', () => {
      expect(ProductsModule.getIngredientsByCategory).toBeDefined();
      expect(typeof ProductsModule.getIngredientsByCategory).toBe('function');
    });

    it('analyzeProductIngredients가 export된다', () => {
      expect(ProductsModule.analyzeProductIngredients).toBeDefined();
      expect(typeof ProductsModule.analyzeProductIngredients).toBe('function');
    });

    it('ingredientExists가 export된다', () => {
      expect(ProductsModule.ingredientExists).toBeDefined();
      expect(typeof ProductsModule.ingredientExists).toBe('function');
    });

    it('getFunctionCounts가 export된다', () => {
      expect(ProductsModule.getFunctionCounts).toBeDefined();
      expect(typeof ProductsModule.getFunctionCounts).toBe('function');
    });
  });

  // =========================================
  // Ingredient Analysis Service Exports
  // =========================================

  describe('Ingredient Analysis Service', () => {
    it('analyzeIngredientsWithAI가 export된다', () => {
      expect(ProductsModule.analyzeIngredientsWithAI).toBeDefined();
      expect(typeof ProductsModule.analyzeIngredientsWithAI).toBe('function');
    });

    it('generateMockIngredientSummary가 export된다', () => {
      expect(ProductsModule.generateMockIngredientSummary).toBeDefined();
      expect(typeof ProductsModule.generateMockIngredientSummary).toBe('function');
    });
  });

  // =========================================
  // Export Count Summary
  // =========================================

  describe('Export Count Summary', () => {
    it('총 export 개수가 예상과 일치한다', () => {
      // 모든 export (함수 + 타입 + 상수)
      const exportKeys = Object.keys(ProductsModule);

      // 예상되는 export 개수 (타입 제외, 런타임 export만)
      // Cosmetic: 4, Supplement: 4, Equipment: 4, HealthFood: 5, PriceHistory: 4
      // Search: 7, Reviews: 10, Interactions: 8, Matching: 3
      // Affiliate: 5, Ingredients: 9, IngredientAnalysis: 2
      const expectedMinCount = 65;

      expect(exportKeys.length).toBeGreaterThanOrEqual(expectedMinCount);
    });
  });
});
