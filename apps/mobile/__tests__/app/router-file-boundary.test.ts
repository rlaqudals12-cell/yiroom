import { existsSync } from 'node:fs';
import path from 'node:path';

const MOBILE_ROOT = path.resolve(__dirname, '../..');

const NON_ROUTE_FILES = [
  'app/(closet)/RecommendOutfitSection.tsx',
  'app/(closet)/RecommendScreenParts.tsx',
  'app/(closet)/RecommendWeatherCard.tsx',
  'app/(closet)/recommend.styles.ts',
  'app/(closet)/recommend.utils.ts',
  'app/products/WishlistItemCard.tsx',
  'app/products/useWishlistScreen.ts',
  'app/products/wishlist-screen.constants.ts',
] as const;

describe('Expo Router 파일 경계', () => {
  it.each(NON_ROUTE_FILES)('%s가 app 디렉터리에 다시 생기지 않는다', (relativePath) => {
    expect(existsSync(path.join(MOBILE_ROOT, relativePath))).toBe(false);
  });
});
