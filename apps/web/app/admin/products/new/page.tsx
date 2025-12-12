'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// 제품 타입 옵션
const PRODUCT_TYPES = [
  { value: 'cosmetic', label: '화장품' },
  { value: 'supplement', label: '영양제' },
  { value: 'workout_equipment', label: '운동기구' },
  { value: 'health_food', label: '건강식품' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState('cosmetic');
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    imageUrl: '',
    purchaseUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 실제 구현: API 호출
      // const response = await fetch('/api/admin/products', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type: productType, ...formData }),
      // });

      // 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('제품이 등록되었습니다');
      router.push('/admin/products');
    } catch {
      toast.error('제품 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">새 제품 추가</h2>
          <p className="text-gray-500 mt-1">새로운 제품을 등록하세요.</p>
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">제품 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 제품 타입 */}
            <div className="space-y-2">
              <Label htmlFor="type">제품 타입</Label>
              <select
                id="type"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 제품명 */}
            <div className="space-y-2">
              <Label htmlFor="name">제품명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="제품명을 입력하세요"
              />
            </div>

            {/* 브랜드 */}
            <div className="space-y-2">
              <Label htmlFor="brand">브랜드 *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                required
                placeholder="브랜드명을 입력하세요"
              />
            </div>

            {/* 가격 */}
            <div className="space-y-2">
              <Label htmlFor="price">가격 (원) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                placeholder="가격을 입력하세요"
                min="0"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                placeholder="제품 설명을 입력하세요"
              />
            </div>

            {/* 이미지 URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">이미지 URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* 구매 URL */}
            <div className="space-y-2">
              <Label htmlFor="purchaseUrl">구매 링크</Label>
              <Input
                id="purchaseUrl"
                type="url"
                value={formData.purchaseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseUrl: e.target.value })
                }
                placeholder="https://example.com/product"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/products">취소</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
