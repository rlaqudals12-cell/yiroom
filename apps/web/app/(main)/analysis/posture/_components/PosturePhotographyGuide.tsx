'use client';

import { Camera, User, ArrowRight, Sun, Shirt, Ruler, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PosturePhotographyGuideProps {
  onContinue: () => void;
}

// 촬영 가이드 팁
const GUIDE_TIPS = [
  {
    icon: Sun,
    title: '밝은 조명',
    description: '전신이 잘 보이는 밝은 곳에서 촬영해주세요',
  },
  {
    icon: Shirt,
    title: '몸에 붙는 옷',
    description: '체형이 잘 드러나는 옷을 입어주세요',
  },
  {
    icon: User,
    title: '바른 자세',
    description: '평소 자세로 자연스럽게 서주세요',
  },
  {
    icon: Ruler,
    title: '전신 포함',
    description: '머리부터 발끝까지 모두 포함되게 해주세요',
  },
  {
    icon: Eye,
    title: '정면 + 측면',
    description: '정면(필수)과 측면(선택) 사진을 촬영해주세요',
  },
];

export default function PosturePhotographyGuide({ onContinue }: PosturePhotographyGuideProps) {
  return (
    <div className="space-y-6" data-testid="posture-photography-guide">
      {/* 가이드 헤더 */}
      <div className="bg-card rounded-xl border p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">자세 분석 촬영 가이드</h2>
        <p className="text-sm text-muted-foreground">정확한 분석을 위해 아래 가이드를 따라주세요</p>
      </div>

      {/* 촬영 팁 목록 */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">촬영 팁</h3>
        <div className="space-y-4">
          {GUIDE_TIPS.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <tip.icon className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 분석 내용 미리보기 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <p className="text-sm font-medium text-blue-800 mb-2">분석 내용</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <span>- 어깨/골반 대칭</span>
          <span>- 무릎 정렬</span>
          <span>- 거북목 여부</span>
          <span>- 등 굽음 정도</span>
          <span>- 허리 만곡</span>
          <span>- 스트레칭 추천</span>
        </div>
      </div>

      {/* 시작 버튼 */}
      <Button
        onClick={onContinue}
        className="w-full h-12 text-base gap-2"
        data-testid="posture-guide-continue"
      >
        사진 촬영하기
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
