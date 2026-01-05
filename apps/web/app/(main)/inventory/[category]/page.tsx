import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InventoryCategoryClient } from './client';
import type { InventoryCategory } from '@/types/inventory';

// 카테고리별 메타데이터
const categoryMeta: Record<InventoryCategory, { title: string; description: string }> = {
  closet: {
    title: '내 옷장',
    description: '의류, 신발, 액세서리를 관리하세요',
  },
  beauty: {
    title: '내 화장대',
    description: '스킨케어, 메이크업 제품을 관리하세요',
  },
  equipment: {
    title: '내 운동장비',
    description: '덤벨, 요가매트 등 운동 장비를 관리하세요',
  },
  supplement: {
    title: '내 영양제',
    description: '비타민, 프로틴, 건강식품을 관리하세요',
  },
  pantry: {
    title: '내 냉장고',
    description: '식재료와 유통기한을 관리하세요',
  },
};

const validCategories = Object.keys(categoryMeta) as InventoryCategory[];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;

  if (!validCategories.includes(category as InventoryCategory)) {
    return { title: '페이지를 찾을 수 없음' };
  }

  const meta = categoryMeta[category as InventoryCategory];
  return {
    title: `${meta.title} | 이룸`,
    description: meta.description,
  };
}

export default async function InventoryCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!validCategories.includes(category as InventoryCategory)) {
    notFound();
  }

  const meta = categoryMeta[category as InventoryCategory];

  return (
    <InventoryCategoryClient
      category={category as InventoryCategory}
      title={meta.title}
      description={meta.description}
    />
  );
}
