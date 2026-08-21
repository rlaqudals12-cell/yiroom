import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useRef, useState } from 'react';

import { addProductShelfItem } from './product-shelf';

export interface BarcodeShelfProduct {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  barcode: string;
}

export function useBarcodeShelfAdd(): {
  addBarcodeProduct: (product: BarcodeShelfProduct) => Promise<boolean>;
  isAdding: boolean;
} {
  const { getToken } = useAuth();
  const inFlight = useRef(false);
  const [isAdding, setIsAdding] = useState(false);

  const addBarcodeProduct = useCallback(
    async (product: BarcodeShelfProduct): Promise<boolean> => {
      // 왜: 제품함 테이블에는 중복 제약이 없으므로 연속 탭을 요청 경계에서 차단한다.
      if (inFlight.current) return false;
      inFlight.current = true;
      setIsAdding(true);
      try {
        const token = await getToken();
        if (!token) throw new Error('로그인이 필요합니다.');
        await addProductShelfItem(
          {
            productId: product.id,
            productName: product.name,
            productBrand: product.brand ?? undefined,
            productBarcode: product.barcode,
            productImageUrl: product.imageUrl ?? undefined,
            scanMethod: 'barcode',
            status: 'owned',
          },
          token
        );
        return true;
      } finally {
        inFlight.current = false;
        setIsAdding(false);
      }
    },
    [getToken]
  );

  return { addBarcodeProduct, isAdding };
}
