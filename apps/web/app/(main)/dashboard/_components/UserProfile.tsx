'use client';

import Image from 'next/image';

interface UserProfileProps {
  name: string;
  imageUrl?: string;
}

/**
 * 사용자 프로필 (축소 버전)
 * - 작은 아바타 + 인사말만 표시
 * - PC 상태 배지는 AnalysisSection으로 이동
 */
export default function UserProfile({
  name,
  imageUrl,
}: UserProfileProps) {
  return (
    <div className="flex items-center gap-3" data-testid="user-profile">
      {/* 프로필 이미지 (48px) */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={48}
          height={48}
          className="rounded-full border-2 border-white shadow-sm"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-personal-color flex items-center justify-center text-lg font-bold text-white">
          {name.charAt(0)}
        </div>
      )}

      {/* 인사말 */}
      <h1 className="text-2xl font-bold text-foreground">
        안녕하세요, {name}님
      </h1>
    </div>
  );
}
