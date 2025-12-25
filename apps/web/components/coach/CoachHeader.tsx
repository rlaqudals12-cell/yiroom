'use client';

import { useState } from 'react';
import { Sparkles, Info, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CoachHeaderProps {
  contextSummary?: string;
}

export function CoachHeader({ contextSummary }: CoachHeaderProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
        {/* 코치 아바타 */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {/* 코치 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">이룸 웰니스 코치</h2>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
              AI
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            운동, 영양, 피부 관리 맞춤 조언
          </p>
        </div>

        {/* 컨텍스트 정보 버튼 */}
        {contextSummary && (
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* 컨텍스트 정보 패널 */}
      {showInfo && contextSummary && (
        <div className="absolute right-4 top-full mt-2 z-10 bg-popover border rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs">
              <span className="font-medium">분석 데이터 활용 중:</span>
              <br />
              {contextSummary}
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 rounded-full hover:bg-muted/50"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
