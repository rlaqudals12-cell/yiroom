import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '뷰티',
  description: '퍼스널 컬러와 피부 타입에 맞는 화장품, 스킨케어 제품을 추천받으세요',
  keywords: ['화장품추천', '스킨케어', '퍼스널컬러화장품', '피부타입'],
  openGraph: {
    title: '뷰티 | 이룸',
    description: '나에게 맞는 화장품과 스킨케어 제품 추천',
  },
};

export default function BeautyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
