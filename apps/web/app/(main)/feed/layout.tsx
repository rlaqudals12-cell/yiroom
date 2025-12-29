import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '피드',
  description: '친구들의 활동과 소식을 확인하고 응원하세요',
  keywords: ['피드', '친구활동', '소셜', '응원'],
  openGraph: {
    title: '피드 | 이룸',
    description: '친구들의 활동 피드',
  },
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
