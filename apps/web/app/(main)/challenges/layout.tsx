import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '챌린지',
  description: '다양한 웰니스 챌린지에 참여하고 친구들과 함께 목표를 달성하세요',
  keywords: ['챌린지', '운동챌린지', '다이어트챌린지', '팀챌린지'],
  openGraph: {
    title: '챌린지 | 이룸',
    description: '웰니스 챌린지 참여하기',
  },
};

export default function ChallengesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
