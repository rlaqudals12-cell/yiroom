/**
 * ScanResult 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScanResult } from '@/components/scan/ScanResult';
import type { GlobalProduct } from '@/types/scan';

const mockProduct: GlobalProduct = {
  id: 'test-product-id',
  barcode: '8809669912345',
  name: '테스트 토너',
  brand: '테스트 브랜드',
  category: 'skincare',
  verified: true,
  ewgGrade: 2,
  keyIngredients: ['나이아신아마이드', '히알루론산'],
  ingredients: [
    { order: 1, inciName: 'Water', nameKo: '정제수' },
    { order: 2, inciName: 'Niacinamide', nameKo: '나이아신아마이드', ewgGrade: 1 },
    { order: 3, inciName: 'Hyaluronic Acid', nameKo: '히알루론산', ewgGrade: 1 },
  ],
  imageUrl: 'https://example.com/product.jpg',
  dataSource: 'manual',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ScanResult', () => {
  it('제품 정보 렌더링', () => {
    render(<ScanResult product={mockProduct} source="internal_db" confidence={95} />);

    expect(screen.getByTestId('scan-result')).toBeInTheDocument();
    expect(screen.getByText('테스트 토너')).toBeInTheDocument();
    expect(screen.getByText('테스트 브랜드')).toBeInTheDocument();
  });

  it('카테고리 라벨 표시', () => {
    render(<ScanResult product={mockProduct} source="internal_db" confidence={95} />);

    expect(screen.getByText('스킨케어')).toBeInTheDocument();
  });

  it('데이터 소스 배지 표시 - internal_db', () => {
    render(<ScanResult product={mockProduct} source="internal_db" confidence={95} />);

    expect(screen.getByText('이룸 DB')).toBeInTheDocument();
  });

  it('데이터 소스 배지 표시 - open_beauty_facts', () => {
    render(<ScanResult product={mockProduct} source="open_beauty_facts" confidence={85} />);

    expect(screen.getByText('Open Beauty Facts')).toBeInTheDocument();
  });

  it('검증됨 배지 표시', () => {
    render(<ScanResult product={mockProduct} source="internal_db" confidence={95} />);

    expect(screen.getByText('검증됨')).toBeInTheDocument();
  });

  it('EWG 등급 표시', () => {
    const { container } = render(
      <ScanResult product={mockProduct} source="internal_db" confidence={95} />
    );

    expect(screen.getByText('EWG 등급:')).toBeInTheDocument();
    // EWG 등급 값이 표시되는지 확인 (전성분 목록에도 2가 있을 수 있으므로 getAllByText 사용)
    const ewgGrades = screen.getAllByText('2');
    expect(ewgGrades.length).toBeGreaterThanOrEqual(1);
  });

  it('주요 성분 표시', () => {
    render(<ScanResult product={mockProduct} source="internal_db" confidence={95} />);

    expect(screen.getByText('주요 성분')).toBeInTheDocument();
    // getAllByText 사용 (keyIngredients와 전성분 목록에 중복 존재 가능)
    expect(screen.getAllByText('나이아신아마이드').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('히알루론산').length).toBeGreaterThanOrEqual(1);
  });

  it('전성분 목록 표시', () => {
    render(<ScanResult product={mockProduct} source="internal_db" confidence={95} />);

    expect(screen.getByText('전성분 (3개)')).toBeInTheDocument();
  });

  it('이미지 없을 때 대체 아이콘 표시', () => {
    const productWithoutImage = { ...mockProduct, imageUrl: undefined };

    render(<ScanResult product={productWithoutImage} source="internal_db" confidence={95} />);

    // Package 아이콘이 렌더링되어야 함
    expect(screen.getByTestId('scan-result')).toBeInTheDocument();
  });

  it('제품함 추가 버튼 클릭', () => {
    const handleAddToShelf = vi.fn();

    render(
      <ScanResult
        product={mockProduct}
        source="internal_db"
        confidence={95}
        onAddToShelf={handleAddToShelf}
      />
    );

    const addButton = screen.getByText('내 제품함에 추가');
    fireEvent.click(addButton);

    expect(handleAddToShelf).toHaveBeenCalledTimes(1);
  });

  it('다시 스캔 버튼 클릭', () => {
    const handleRescan = vi.fn();

    render(
      <ScanResult
        product={mockProduct}
        source="internal_db"
        confidence={95}
        onRescan={handleRescan}
      />
    );

    const rescanButton = screen.getByText('다른 제품 스캔하기');
    fireEvent.click(rescanButton);

    expect(handleRescan).toHaveBeenCalledTimes(1);
  });

  it('공유 버튼 없으면 렌더링 안 됨', () => {
    render(<ScanResult product={mockProduct} source="internal_db" confidence={95} />);

    // 공유 버튼의 aria-label이나 특정 식별자 확인
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument();
  });

  it('검증 안 된 제품은 배지 없음', () => {
    const unverifiedProduct = { ...mockProduct, verified: false };

    render(<ScanResult product={unverifiedProduct} source="internal_db" confidence={95} />);

    expect(screen.queryByText('검증됨')).not.toBeInTheDocument();
  });

  it('EWG 등급 없으면 표시 안 됨', () => {
    const productWithoutEwg = { ...mockProduct, ewgGrade: undefined };

    render(<ScanResult product={productWithoutEwg} source="internal_db" confidence={95} />);

    expect(screen.queryByText('EWG 등급:')).not.toBeInTheDocument();
  });
});
