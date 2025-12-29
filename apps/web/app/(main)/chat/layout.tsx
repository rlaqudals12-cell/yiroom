import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 코치',
  description: 'AI 웰니스 코치와 대화하며 건강, 운동, 영양에 대한 맞춤 조언을 받으세요',
  keywords: ['AI코치', '웰니스코치', '건강상담', '운동조언', '영양상담'],
  openGraph: {
    title: 'AI 코치 | 이룸',
    description: 'AI 웰니스 코치와 대화하기',
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
