'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserProfileProps {
  name: string;
  imageUrl?: string;
  hasPersonalColor: boolean;
}

export default function UserProfile({
  name,
  imageUrl,
  hasPersonalColor,
}: UserProfileProps) {
  return (
    <section className="bg-module-personal-color-light/50 rounded-2xl p-6 border border-module-personal-color/20">
      <div className="flex items-center gap-4">
        {/* 프로필 이미지 */}
        <div className="relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={64}
              height={64}
              className="rounded-full border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-personal-color flex items-center justify-center text-2xl font-bold text-white">
              {name.charAt(0)}
            </div>
          )}
          {hasPersonalColor && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-status-success rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            안녕하세요, {name}님!
          </h1>
          {hasPersonalColor ? (
            <p className="text-sm text-gray-600 mt-1">
              퍼스널 컬러 진단이 완료되었어요
            </p>
          ) : (
            <p className="text-sm text-gray-600 mt-1">
              퍼스널 컬러를 진단하고 맞춤 추천을 받아보세요
            </p>
          )}
        </div>

        {/* PC 진단 버튼 (미완료 시에만 표시) */}
        {!hasPersonalColor && (
          <Link href="/analysis/personal-color">
            <Button className="gap-2 bg-gradient-brand hover:opacity-90">
              <Sparkles className="w-4 h-4" />
              진단 시작
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
