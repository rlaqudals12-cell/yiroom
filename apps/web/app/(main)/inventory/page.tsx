import { Metadata } from 'next';
import Link from 'next/link';
import { Shirt, Sparkles, Dumbbell, Pill, Refrigerator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '내 인벤토리 | 이룸',
  description: '옷장, 화장대, 운동장비, 영양제, 냉장고를 한눈에 관리하세요',
};

const inventoryCategories = [
  {
    id: 'closet',
    name: '내 옷장',
    description: '의류, 신발, 액세서리',
    icon: Shirt,
    href: '/inventory/closet',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'beauty',
    name: '내 화장대',
    description: '스킨케어, 메이크업',
    icon: Sparkles,
    href: '/inventory/beauty',
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  },
  {
    id: 'equipment',
    name: '내 운동장비',
    description: '덤벨, 요가매트, 밴드',
    icon: Dumbbell,
    href: '/inventory/equipment',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    id: 'supplement',
    name: '내 영양제',
    description: '비타민, 프로틴, 건강식품',
    icon: Pill,
    href: '/inventory/supplement',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    id: 'pantry',
    name: '내 냉장고',
    description: '식재료, 유통기한 관리',
    icon: Refrigerator,
    href: '/inventory/pantry',
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
];

export default function InventoryPage() {
  return (
    <div className="container max-w-4xl py-8" data-testid="inventory-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">내 인벤토리</h1>
        <p className="text-muted-foreground mt-1">
          보유한 아이템을 등록하고 AI가 최적의 조합을 추천해드려요
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventoryCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.id}
              href={category.href}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h2 className="font-semibold mb-2">인벤토리 활용 팁</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>사진을 찍으면 AI가 자동으로 카테고리와 색상을 분석해요</li>
          <li>퍼스널컬러와 체형 분석 결과를 기반으로 코디를 추천받을 수 있어요</li>
          <li>유통기한이 있는 제품은 알림을 받을 수 있어요</li>
        </ul>
      </div>
    </div>
  );
}
