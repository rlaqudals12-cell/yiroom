import { Package, Search, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/admin';
import { StatCard } from '../_components/StatCard';

// 제품 타입 정의
const PRODUCT_TYPES = [
  {
    key: 'cosmetics',
    label: '화장품',
    table: 'cosmetic_products',
    icon: '💄',
    color: 'pink',
  },
  {
    key: 'supplements',
    label: '영양제',
    table: 'supplement_products',
    icon: '💊',
    color: 'purple',
  },
  {
    key: 'equipment',
    label: '운동기구',
    table: 'workout_equipment',
    icon: '🏋️',
    color: 'indigo',
  },
  {
    key: 'healthFoods',
    label: '건강식품',
    table: 'health_foods',
    icon: '🥗',
    color: 'green',
  },
] as const;

export default async function AdminProductsPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">제품 관리</h2>
          <p className="text-gray-500 mt-1">등록된 제품을 관리하세요.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            새 제품 추가
          </Link>
        </Button>
      </div>

      {/* 제품 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="화장품"
          value={stats.products.cosmetics}
          icon="package"
        />
        <StatCard
          title="영양제"
          value={stats.products.supplements}
          icon="package"
        />
        <StatCard
          title="운동기구"
          value={stats.products.equipment}
          icon="package"
        />
        <StatCard
          title="건강식품"
          value={stats.products.healthFoods}
          icon="package"
        />
      </div>

      {/* 제품 타입별 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRODUCT_TYPES.map((type) => {
          const count = stats.products[type.key as keyof typeof stats.products];
          return (
            <Card key={type.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{type.icon}</span>
                  {type.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500">등록된 제품</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products?type=${type.key}`}>
                        <Search className="h-4 w-4 mr-1" />
                        목록
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products?category=${type.key}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        공개 페이지
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">제품 상세 관리</p>
            <p className="text-sm mt-2">
              개별 제품 수정 및 삭제는 각 제품 상세 페이지에서 가능합니다.
              <br />
              새 제품은 &quot;새 제품 추가&quot; 버튼을 통해 등록할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
