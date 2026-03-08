'use client';

import { BookOpen, Palette, Shirt, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SeasonType } from '@/lib/mock/personal-color';

// 시즌별 교육 콘텐츠 — 색채학 원리 기반 (docs/principles/color-science.md)
const SEASON_EDUCATION: Record<
  SeasonType,
  {
    title: string;
    emoji: string;
    colorTheory: string;
    undertoneExplanation: string;
    whyItSuits: string;
    dailyApplication: string;
    commonMistakes: string;
    representativeColors: Array<{ hex: string; name: string }>;
  }
> = {
  spring: {
    title: '봄 웜톤',
    emoji: '🌸',
    colorTheory:
      '봄 타입은 "밝고 맑은 웜톤"이에요. 색채학에서 높은 명도(Value)와 높은 채도(Chroma)가 특징이며, 노란 기반의 따뜻한 색상이 조화를 이뤄요.',
    undertoneExplanation:
      '피부 아래 혈관이 녹색 또는 올리브빛을 띠고, 피부에 노란빛 또는 복숭아빛이 감돌아요. 금색 액세서리가 은색보다 잘 어울려요.',
    whyItSuits:
      '밝고 따뜻한 색상이 피부의 노란 언더톤과 자연스럽게 조화되어, 얼굴에 생기와 화사함을 더해줘요. 어둡거나 탁한 색은 오히려 피부를 칙칙하게 만들 수 있어요.',
    dailyApplication:
      '상의에 코랄, 살몬, 밝은 베이지 같은 색을 활용하면 얼굴이 한결 화사해져요. 메이크업은 피치·코랄 계열이 자연스러워요.',
    commonMistakes:
      '블랙이나 네이비 같은 짙은 색을 얼굴 가까이에 두면 얼굴이 칙칙해 보일 수 있어요. 대신 아이보리나 밝은 카키를 활용해보세요.',
    representativeColors: [
      { hex: '#FFB6C1', name: '라이트 핑크' },
      { hex: '#FFA07A', name: '살몬' },
      { hex: '#FFD700', name: '골드' },
      { hex: '#98FB98', name: '페일 그린' },
    ],
  },
  summer: {
    title: '여름 쿨톤',
    emoji: '🌊',
    colorTheory:
      '여름 타입은 "부드럽고 차가운 쿨톤"이에요. 색채학에서 중~높은 명도와 낮은 채도(Muted)가 특징이며, 파란 기반의 시원한 파스텔이 조화를 이뤄요.',
    undertoneExplanation:
      '피부 아래 혈관이 파란색 또는 보라색을 띠고, 피부에 핑크빛 또는 장밋빛이 감돌아요. 은색 액세서리가 금색보다 잘 어울려요.',
    whyItSuits:
      '부드럽고 시원한 파스텔 계열이 피부의 핑크 언더톤과 자연스럽게 어울려, 맑고 우아한 인상을 줘요. 비비드하거나 따뜻한 색은 피부와 충돌할 수 있어요.',
    dailyApplication:
      '라벤더, 로즈, 스카이블루 톤의 옷이 피부를 투명하고 우아하게 보이게 해줘요. 메이크업은 로즈·핑크 계열이 잘 어울려요.',
    commonMistakes:
      '오렌지나 카키 같은 따뜻한 색은 피부를 노랗게 보이게 할 수 있어요. 대신 라벤더나 소프트 핑크를 활용해보세요.',
    representativeColors: [
      { hex: '#B0C4DE', name: '라이트 스틸 블루' },
      { hex: '#DDA0DD', name: '플럼' },
      { hex: '#87CEEB', name: '스카이 블루' },
      { hex: '#E6E6FA', name: '라벤더' },
    ],
  },
  autumn: {
    title: '가을 웜톤',
    emoji: '🍂',
    colorTheory:
      '가을 타입은 "깊고 차분한 웜톤"이에요. 색채학에서 낮~중간 명도와 중간 채도가 특징이며, 노란 기반의 따뜻하고 깊은 어스 톤이 조화를 이뤄요.',
    undertoneExplanation:
      '피부 아래 혈관이 녹색 또는 올리브빛을 띠고, 피부에 황금빛 또는 따뜻한 베이지가 감돌아요. 금색 액세서리가 잘 어울려요.',
    whyItSuits:
      '깊고 따뜻한 어스 톤이 피부의 황금빛 언더톤과 조화를 이루어, 풍성하고 고급스러운 인상을 줘요. 파스텔이나 맑은 색은 피부와 동떨어져 보일 수 있어요.',
    dailyApplication:
      '올리브 그린, 캐멀, 와인 같은 깊은 톤을 메인 컬러로 활용하면 고급스러운 분위기가 나요. 메이크업은 테라코타·브릭 계열이 잘 어울려요.',
    commonMistakes:
      '파스텔이나 네온 같은 밝고 선명한 색은 피부와 어울리지 않을 수 있어요. 대신 머스타드나 올리브를 활용해보세요.',
    representativeColors: [
      { hex: '#D2691E', name: '초콜릿' },
      { hex: '#DAA520', name: '골든로드' },
      { hex: '#8B4513', name: '새들 브라운' },
      { hex: '#CD853F', name: '페루' },
    ],
  },
  winter: {
    title: '겨울 쿨톤',
    emoji: '❄️',
    colorTheory:
      '겨울 타입은 "선명하고 강렬한 쿨톤"이에요. 색채학에서 높은 대비(High Contrast)와 높은 채도가 특징이며, 파란 기반의 시원하고 선명한 색이 조화를 이뤄요.',
    undertoneExplanation:
      '피부 아래 혈관이 파란색 또는 보라색을 띠고, 피부에 차갑고 깨끗한 느낌이 있어요. 은색 액세서리와 블랙이 잘 어울려요.',
    whyItSuits:
      '선명하고 대비가 강한 색이 피부의 푸른 언더톤과 어우러져, 생동감 있고 세련된 인상을 줘요. 뮤트하거나 따뜻한 색은 존재감을 약하게 만들 수 있어요.',
    dailyApplication:
      '블랙·화이트 대비에 레드나 로열블루를 포인트로 넣으면 세련된 인상을 줄 수 있어요. 메이크업은 와인·베리·레드 계열이 잘 어울려요.',
    commonMistakes:
      '베이지나 카키 같은 뮤트한 색은 얼굴을 밋밋하게 보이게 할 수 있어요. 대신 순백색이나 채도 높은 블루를 활용해보세요.',
    representativeColors: [
      { hex: '#000080', name: '네이비' },
      { hex: '#8B0000', name: '다크 레드' },
      { hex: '#4B0082', name: '인디고' },
      { hex: '#FFFFFF', name: '퓨어 화이트' },
    ],
  },
};

interface SeasonEducationModalProps {
  seasonType: SeasonType;
  isOpen: boolean;
  onClose: () => void;
}

export function SeasonEducationModal({ seasonType, isOpen, onClose }: SeasonEducationModalProps) {
  if (!isOpen) return null;

  const edu = SEASON_EDUCATION[seasonType];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="season-education-modal"
    >
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-card rounded-t-2xl border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              왜 {edu.title}인가요? {edu.emoji}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-muted transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 색채학 원리 */}
          <section>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Palette className="w-4 h-4 text-primary" />
              색채학 원리
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{edu.colorTheory}</p>
          </section>

          {/* 언더톤 설명 */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">내 피부의 언더톤</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {edu.undertoneExplanation}
            </p>
          </section>

          {/* 왜 어울리는지 */}
          <section>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />이 색이 어울리는 이유
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{edu.whyItSuits}</p>
          </section>

          {/* 대표 색상 */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">대표 색상</h3>
            <div className="flex gap-3">
              {edu.representativeColors.map((color) => (
                <div key={color.hex} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-[10px] text-muted-foreground">{color.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 일상 활용 */}
          <section>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
              <Shirt className="w-4 h-4 text-blue-500" />
              일상에서 이렇게 활용해보세요
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{edu.dailyApplication}</p>
          </section>

          {/* 흔한 실수 */}
          <section className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">주의할 점</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{edu.commonMistakes}</p>
          </section>
        </div>

        {/* 하단 닫기 */}
        <div className="p-4 border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full">
            확인했어요
          </Button>
        </div>
      </div>
    </div>
  );
}
