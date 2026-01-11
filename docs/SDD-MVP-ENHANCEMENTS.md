# SDD-MVP-ENHANCEMENTS: MVP 후 기능 확장

> **Version**: 1.0
> **Status**: Draft
> **Created**: 2026-01-11
> **Phase**: Post-MVP

---

## 개요

MVP 출시 후 우선순위가 높은 4개 기능에 대한 통합 스펙 문서입니다.

| #   | 기능                        | 복잡도 | 우선순위        | 시지푸스 |
| --- | --------------------------- | ------ | --------------- | -------- |
| 1   | QR 코드 (앱/웹 접근)        | 낮음   | ✅ 즉시         | Quick    |
| 2   | 소셜 공유 확대 (X + 카카오) | 낮음   | ✅ 즉시         | Quick    |
| 3   | 운동 자세 분석 확대 뷰어    | 중간   | ✅ 다음 Phase   | Light    |
| 4   | 글로벌 제품 추천            | 높음   | ⚠️ 시장 검증 후 | Standard |

---

# Feature 1: QR 코드 (앱/웹 접근)

## 1.1 목적

- 마케팅 자료(명함, 포스터)에서 빠른 앱 접근
- 오프라인 이벤트에서 QR 스캔으로 가입 유도
- 친구 초대 시 개인 QR 코드로 쉬운 공유

## 1.2 사용 시나리오

```
┌────────────────────────────────────────────────────────────┐
│                    QR 코드 활용 시나리오                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [시나리오 1] 마케팅 QR                                     │
│  ├── 포스터/명함에 QR 인쇄                                  │
│  ├── 스캔 → 앱스토어 or 웹앱 랜딩                           │
│  └── UTM 파라미터로 채널 추적                               │
│                                                            │
│  [시나리오 2] 친구 초대 QR                                  │
│  ├── 프로필 > "내 QR 코드" 버튼                             │
│  ├── 친구가 스캔 → 가입 페이지 (referral 코드 포함)         │
│  └── 추천인 혜택 자동 적용                                  │
│                                                            │
│  [시나리오 3] 분석 결과 공유 QR                             │
│  ├── 분석 결과 > "QR로 공유"                                │
│  ├── 친구가 스캔 → 결과 미리보기 페이지                     │
│  └── 가입 유도 CTA                                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 1.3 기술 구현

### QR 생성

```typescript
// lib/qr/generator.ts
import QRCode from 'qrcode';

interface QROptions {
  type: 'app_download' | 'referral' | 'result_share';
  data: Record<string, string>;
  size?: number;
}

export async function generateQRCode(options: QROptions): Promise<string> {
  const { type, data, size = 256 } = options;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  const urls: Record<typeof type, string> = {
    app_download: `${baseUrl}/download?utm_source=qr&utm_medium=${data.medium}`,
    referral: `${baseUrl}/invite/${data.referralCode}`,
    result_share: `${baseUrl}/share/${data.resultType}/${data.resultId}`,
  };

  const url = urls[type];

  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}
```

### QR 표시 컴포넌트

```tsx
// components/common/QRCodeDisplay.tsx
'use client';

import { useState, useEffect } from 'react';
import { generateQRCode } from '@/lib/qr/generator';

interface QRCodeDisplayProps {
  type: 'app_download' | 'referral' | 'result_share';
  data: Record<string, string>;
  title?: string;
  description?: string;
}

export function QRCodeDisplay({ type, data, title, description }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode({ type, data }).then(setQrDataUrl);
  }, [type, data]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `yiroom-qr-${type}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div data-testid="qr-code-display" className="flex flex-col items-center gap-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
      ) : (
        <div className="w-48 h-48 bg-muted animate-pulse rounded-lg" />
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <button onClick={handleDownload} className="btn btn-secondary">
        QR 코드 저장
      </button>
    </div>
  );
}
```

## 1.4 파일 목록

```
신규 파일:
├── lib/qr/generator.ts              # QR 생성 유틸 (~30줄)
├── components/common/QRCodeDisplay.tsx  # QR 표시 컴포넌트 (~50줄)
└── tests/lib/qr/generator.test.ts   # 테스트 (~30줄)

수정 파일:
├── app/(main)/profile/page.tsx      # "내 QR 코드" 버튼 추가
└── package.json                     # qrcode 패키지 추가
```

## 1.5 복잡도 분석

```
파일 수: 3-4개 → 5점
아키텍처: 단순 유틸 → 5점
외부 연동: qrcode 패키지만 → 5점
테스트: 단위 테스트 → 5점
────────────────────────
총점: 20점 → Quick 트랙 (직접 실행)
```

---

# Feature 2: 소셜 공유 확대 (X + 카카오)

## 2.1 현재 상태

- Web Share API 사용 중 (지원 브라우저에서만)
- 카카오/X 직접 공유 미지원
- 이미지 공유 불가

## 2.2 목표

```
┌────────────────────────────────────────────────────────────┐
│                    소셜 공유 확장 목표                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  현재 (Web Share API)                                      │
│  └── 지원 브라우저 → 시스템 공유 시트                       │
│                                                            │
│  확장 후                                                    │
│  ├── [1] X (Twitter) 직접 공유                             │
│  │   └── 텍스트 + 링크 + 해시태그                           │
│  │                                                         │
│  ├── [2] 카카오톡 공유                                     │
│  │   └── 카카오 SDK → 메시지 템플릿                         │
│  │                                                         │
│  ├── [3] 링크 복사                                         │
│  │   └── Fallback (모든 환경)                              │
│  │                                                         │
│  └── [4] 이미지 저장 후 공유 안내                           │
│      └── Instagram 등 이미지 필수 플랫폼용                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 2.3 기술 구현

### 공유 유틸리티

```typescript
// lib/share/social.ts

interface ShareContent {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  hashtags?: string[];
}

// X (Twitter) 공유
export function shareToX(content: ShareContent): void {
  const { title, url, hashtags = [] } = content;
  const hashtagString = hashtags.map((h) => h.replace('#', '')).join(',');

  const shareUrl = new URL('https://twitter.com/intent/tweet');
  shareUrl.searchParams.set('text', title);
  shareUrl.searchParams.set('url', url);
  if (hashtagString) {
    shareUrl.searchParams.set('hashtags', hashtagString);
  }

  window.open(shareUrl.toString(), '_blank', 'width=550,height=420');
}

// 카카오톡 공유 (SDK 필요)
export async function shareToKakao(content: ShareContent): Promise<void> {
  const { Kakao } = window as any;

  if (!Kakao?.isInitialized()) {
    Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
  }

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: content.title,
      description: content.description,
      imageUrl: content.imageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
      link: {
        mobileWebUrl: content.url,
        webUrl: content.url,
      },
    },
    buttons: [
      {
        title: '자세히 보기',
        link: {
          mobileWebUrl: content.url,
          webUrl: content.url,
        },
      },
    ],
  });
}

// 링크 복사
export async function copyToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

// 이미지 저장 (Instagram용)
export async function downloadShareImage(imageUrl: string, filename: string): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
```

### 공유 버튼 컴포넌트

```tsx
// components/common/ShareButtons.tsx
'use client';

import { useState } from 'react';
import { shareToX, shareToKakao, copyToClipboard, downloadShareImage } from '@/lib/share/social';
import { toast } from 'sonner';

interface ShareButtonsProps {
  content: {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
  };
  showInstagram?: boolean;
}

export function ShareButtons({ content, showInstagram = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(content.url);
    if (success) {
      setCopied(true);
      toast.success('링크가 복사되었습니다');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstagram = async () => {
    if (content.imageUrl) {
      await downloadShareImage(content.imageUrl, 'yiroom-result.png');
      toast.success('이미지가 저장되었습니다. Instagram에서 공유해주세요!');
    }
  };

  return (
    <div data-testid="share-buttons" className="flex gap-2">
      <button onClick={() => shareToX(content)} className="btn btn-icon" aria-label="X에 공유">
        <XIcon className="w-5 h-5" />
      </button>

      <button
        onClick={() => shareToKakao(content)}
        className="btn btn-icon bg-[#FEE500] text-black"
        aria-label="카카오톡 공유"
      >
        <KakaoIcon className="w-5 h-5" />
      </button>

      <button onClick={handleCopy} className="btn btn-icon" aria-label="링크 복사">
        {copied ? <CheckIcon /> : <LinkIcon />}
      </button>

      {showInstagram && content.imageUrl && (
        <button
          onClick={handleInstagram}
          className="btn btn-icon bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          aria-label="Instagram용 이미지 저장"
        >
          <InstagramIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
```

## 2.4 카카오 SDK 설정

```typescript
// app/layout.tsx에 추가
<Script
  src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
  integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
  crossOrigin="anonymous"
  strategy="lazyOnload"
/>
```

## 2.5 파일 목록

```
신규 파일:
├── lib/share/social.ts              # 공유 유틸 (~80줄)
├── components/common/ShareButtons.tsx   # 공유 버튼 (~60줄)
└── tests/lib/share/social.test.ts   # 테스트 (~50줄)

수정 파일:
├── app/layout.tsx                   # 카카오 SDK 스크립트
├── .env.local                       # NEXT_PUBLIC_KAKAO_JS_KEY
└── 기존 결과 페이지들               # ShareButtons 적용 (5-6개)
```

## 2.6 복잡도 분석

```
파일 수: 4-5개 → 10점
아키텍처: 단순 유틸 → 5점
외부 연동: 카카오 SDK → 10점
테스트: 단위 테스트 → 5점
────────────────────────
총점: 30점 → Quick 트랙 (직접 실행)
```

---

# Feature 3: 운동 자세 분석 확대 뷰어

## 3.1 목적

Phase E에서 구현한 피부 분석 확대 뷰어(SkinZoomViewer)를 운동 자세 분석에도 적용합니다.

## 3.2 재사용 컴포넌트

```
┌────────────────────────────────────────────────────────────┐
│              Phase E 컴포넌트 재사용 계획                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  피부 분석 (완료)                  운동 분석 (예정)         │
│  ──────────────                   ──────────────           │
│  ZoomableImage.tsx      →         재사용 (공통 UI)         │
│  ProblemMarker.tsx      →         PostureMarker.tsx        │
│  SkinImageViewer.tsx    →         PostureImageViewer.tsx   │
│  SolutionPanel.tsx      →         PostureFeedbackPanel.tsx │
│  SkinZoomViewer.tsx     →         PostureZoomViewer.tsx    │
│                                                            │
│  타입                                                       │
│  ──────                                                     │
│  ProblemArea            →         PostureIssue             │
│  └── type: 'pores'                └── type: 'shoulder'     │
│  └── severity: 'mild'             └── severity: 'warning'  │
│  └── location: {x,y,r}            └── location: {x,y,r}    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 3.3 타입 정의

```typescript
// types/workout-posture.ts

export type PostureIssueType =
  | 'shoulder_alignment' // 어깨 정렬
  | 'hip_alignment' // 골반 정렬
  | 'knee_angle' // 무릎 각도
  | 'spine_curve' // 척추 곡률
  | 'head_position' // 머리 위치
  | 'foot_placement' // 발 위치
  | 'arm_angle' // 팔 각도
  | 'core_engagement'; // 코어 활성화

export type IssueSeverity = 'good' | 'warning' | 'critical';

export interface PostureIssue {
  id: string;
  type: PostureIssueType;
  severity: IssueSeverity;
  location: {
    x: number; // 0-100 (%)
    y: number; // 0-100 (%)
    radius: number;
  };
  currentAngle?: number; // 현재 각도
  idealAngle?: number; // 이상적 각도
  description: string; // "어깨가 앞으로 말려있어요"
  correction: string; // "가슴을 펴고 어깨를 뒤로 당겨주세요"
  relatedExercise?: string; // 교정 운동 ID
}
```

## 3.4 컴포넌트 구현

### PostureMarker

```tsx
// components/workout/analysis/PostureMarker.tsx
'use client';

import { PostureIssue } from '@/types/workout-posture';
import { cn } from '@/lib/utils';

interface PostureMarkerProps {
  issue: PostureIssue;
  onClick: () => void;
  isSelected?: boolean;
  showLabel?: boolean;
}

const SEVERITY_COLORS = {
  good: 'bg-green-500 border-green-400',
  warning: 'bg-yellow-500 border-yellow-400',
  critical: 'bg-red-500 border-red-400',
};

const TYPE_LABELS: Record<PostureIssue['type'], string> = {
  shoulder_alignment: '어깨',
  hip_alignment: '골반',
  knee_angle: '무릎',
  spine_curve: '척추',
  head_position: '머리',
  foot_placement: '발',
  arm_angle: '팔',
  core_engagement: '코어',
};

export function PostureMarker({ issue, onClick, isSelected, showLabel }: PostureMarkerProps) {
  const { location, type, severity } = issue;

  return (
    <button
      data-testid={`posture-marker-${issue.id}`}
      onClick={onClick}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2',
        'rounded-full border-2 transition-all duration-200',
        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
        SEVERITY_COLORS[severity],
        isSelected && 'ring-2 ring-white scale-125 z-20'
      )}
      style={{
        left: `${location.x}%`,
        top: `${location.y}%`,
        width: `${location.radius * 2}px`,
        height: `${location.radius * 2}px`,
        zIndex: isSelected ? 20 : 10,
      }}
      aria-label={`${TYPE_LABELS[type]} 문제 영역`}
    >
      {showLabel && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap bg-black/70 text-white px-2 py-0.5 rounded">
          {TYPE_LABELS[type]}
        </span>
      )}
    </button>
  );
}
```

### PostureFeedbackPanel

```tsx
// components/workout/analysis/PostureFeedbackPanel.tsx
'use client';

import { useEffect } from 'react';
import { PostureIssue } from '@/types/workout-posture';
import { X } from 'lucide-react';

interface PostureFeedbackPanelProps {
  issue: PostureIssue | null;
  onClose: () => void;
  onExerciseClick?: (exerciseId: string) => void;
}

const SEVERITY_TEXT = {
  good: '좋음',
  warning: '주의',
  critical: '교정 필요',
};

export function PostureFeedbackPanel({
  issue,
  onClose,
  onExerciseClick,
}: PostureFeedbackPanelProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!issue) return null;

  return (
    <div data-testid="posture-feedback-panel" className="fixed inset-x-0 bottom-0 z-50">
      {/* 오버레이 */}
      <div
        data-testid="posture-feedback-overlay"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* 패널 */}
      <div className="relative bg-white rounded-t-2xl p-6 animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2" aria-label="패널 닫기">
          <X className="w-5 h-5" />
        </button>

        {/* 심각도 배지 */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              issue.severity === 'good' && 'bg-green-100 text-green-700',
              issue.severity === 'warning' && 'bg-yellow-100 text-yellow-700',
              issue.severity === 'critical' && 'bg-red-100 text-red-700'
            )}
          >
            {SEVERITY_TEXT[issue.severity]}
          </span>
        </div>

        {/* 설명 */}
        <p className="text-gray-700 mb-4">{issue.description}</p>

        {/* 각도 정보 (있는 경우) */}
        {issue.currentAngle !== undefined && issue.idealAngle !== undefined && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between text-sm">
              <span>
                현재 각도: <strong>{issue.currentAngle}°</strong>
              </span>
              <span>
                이상 각도: <strong>{issue.idealAngle}°</strong>
              </span>
            </div>
          </div>
        )}

        {/* 교정 가이드 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">교정 방법</h4>
          <p className="text-blue-700">{issue.correction}</p>
        </div>

        {/* 교정 운동 링크 */}
        {issue.relatedExercise && onExerciseClick && (
          <button
            onClick={() => onExerciseClick(issue.relatedExercise!)}
            className="w-full btn btn-primary"
          >
            교정 운동 보기
          </button>
        )}
      </div>
    </div>
  );
}
```

### PostureZoomViewer (통합 컴포넌트)

```tsx
// components/workout/analysis/PostureZoomViewer.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZoomableImage } from '@/components/ui/ZoomableImage';
import { PostureMarker } from './PostureMarker';
import { PostureFeedbackPanel } from './PostureFeedbackPanel';
import type { PostureIssue } from '@/types/workout-posture';

interface PostureZoomViewerProps {
  imageUrl: string;
  postureIssues: PostureIssue[];
  exerciseId?: string;
}

export function PostureZoomViewer({ imageUrl, postureIssues, exerciseId }: PostureZoomViewerProps) {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState<PostureIssue | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | undefined>();

  const handleMarkerClick = (issue: PostureIssue) => {
    setSelectedIssue(issue);
    setFocusPoint({ x: issue.location.x, y: issue.location.y });
  };

  const handleExerciseClick = (exerciseId: string) => {
    router.push(`/workout/exercise/${exerciseId}`);
  };

  return (
    <div data-testid="posture-zoom-viewer" className="relative w-full h-full">
      <ZoomableImage
        src={imageUrl}
        alt="운동 자세 분석"
        focusPoint={focusPoint}
        minZoom={1}
        maxZoom={3}
      >
        {/* 마커 오버레이 */}
        {postureIssues.map((issue) => (
          <PostureMarker
            key={issue.id}
            issue={issue}
            onClick={() => handleMarkerClick(issue)}
            isSelected={selectedIssue?.id === issue.id}
            showLabel={!selectedIssue}
          />
        ))}
      </ZoomableImage>

      {/* 피드백 패널 */}
      <PostureFeedbackPanel
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onExerciseClick={handleExerciseClick}
      />

      {/* 가이드 텍스트 */}
      {!selectedIssue && postureIssues.length > 0 && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            마커를 탭하여 교정 방법 확인
          </span>
        </div>
      )}
    </div>
  );
}
```

## 3.5 AI 프롬프트 확장

```typescript
// lib/gemini.ts에 추가

const POSTURE_ANALYSIS_PROMPT = `
당신은 전문 운동 자세 분석 AI입니다.

📊 분석할 부위:
1. shoulder_alignment (어깨 정렬) - 좌우 높이 차이
2. hip_alignment (골반 정렬) - 골반 기울기
3. knee_angle (무릎 각도) - 적정 굴곡 여부
4. spine_curve (척추 곡률) - 과도한 전만/후만
5. head_position (머리 위치) - 전방 머리 자세
6. foot_placement (발 위치) - 발 너비, 각도
7. arm_angle (팔 각도) - 운동별 적정 각도
8. core_engagement (코어 활성화) - 복부 긴장 상태

📋 분석 기준:
- good: 올바른 자세, 유지 권장
- warning: 약간의 문제, 주의 필요
- critical: 부상 위험, 즉시 교정 필요

⚠️ 주의사항:
- 이미지가 불명확하면 분석하지 말고 재촬영 요청
- 의류로 가려진 부위는 추정하지 말고 "불명확"으로 표시
- 좌표는 이미지 기준 0-100 (%) 범위

다음 JSON 형식으로만 응답:
{
  "exerciseDetected": "[운동명 또는 null]",
  "overallScore": [0-100],
  "issues": [
    {
      "id": "[uuid]",
      "type": "[PostureIssueType]",
      "severity": "[good|warning|critical]",
      "location": { "x": [0-100], "y": [0-100], "radius": [8-16] },
      "currentAngle": [현재 각도 또는 null],
      "idealAngle": [이상 각도 또는 null],
      "description": "[한국어 설명]",
      "correction": "[교정 방법]"
    }
  ],
  "analysisReliability": "[high|medium|low]"
}
`;
```

## 3.6 파일 목록

```
신규 파일:
├── types/workout-posture.ts                      # 타입 (~40줄)
├── components/workout/analysis/
│   ├── PostureMarker.tsx                         # 마커 (~60줄)
│   ├── PostureFeedbackPanel.tsx                  # 패널 (~100줄)
│   └── PostureZoomViewer.tsx                     # 통합 (~80줄)
├── lib/mock/workout-posture.ts                   # Mock 데이터 (~60줄)
├── tests/components/workout/analysis/
│   ├── PostureMarker.test.tsx                    # (~40줄)
│   ├── PostureFeedbackPanel.test.tsx             # (~60줄)
│   └── PostureZoomViewer.test.tsx                # (~80줄)
└── app/api/analyze/workout/posture/route.ts      # API (~100줄)

수정 파일:
├── lib/gemini.ts                                 # 프롬프트 추가
├── app/(main)/workout/result/[id]/page.tsx       # 뷰어 통합
└── components/ui/ZoomableImage.tsx               # children prop 지원 (이미 완료)
```

## 3.7 복잡도 분석

```
파일 수: 10-12개 → 15점
아키텍처: Phase E 패턴 재사용 → 10점
외부 연동: Gemini (기존) → 5점
테스트: 단위 + 통합 → 10점
────────────────────────
총점: 40점 → Light 트랙 (code-quality 에이전트)
```

---

# Feature 4: 글로벌 제품 추천

## 4.1 현재 상태

- 한국 제품 DB만 존재 (850+ 제품)
- 어필리에이트: 쿠팡, iHerb 연동 완료
- 글로벌 지역 미지원

## 4.2 목표

```
┌────────────────────────────────────────────────────────────┐
│                  글로벌 제품 추천 전략                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [지역 감지] 자동                                           │
│  └── IP 기반 또는 브라우저 locale                           │
│                                                            │
│  [Phase 1] 한국 (현재)                                      │
│  ├── 쿠팡 어필리에이트                                      │
│  └── iHerb 어필리에이트                                     │
│                                                            │
│  [Phase 2] 미국/글로벌                                      │
│  ├── Amazon Associates                                     │
│  └── iHerb (글로벌)                                        │
│                                                            │
│  [Phase 3] 일본                                            │
│  ├── Amazon JP Associates                                  │
│  └── Rakuten 어필리에이트                                   │
│                                                            │
│  [Phase 4] 동남아/기타                                      │
│  └── 정보만 제공 (구매 링크 없음)                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 4.3 아키텍처

### 지역 감지

```typescript
// lib/region/detector.ts

export type SupportedRegion = 'KR' | 'US' | 'JP' | 'CN' | 'SEA' | 'EU' | 'OTHER';

interface RegionInfo {
  code: SupportedRegion;
  currency: string;
  language: string;
  affiliateSupport: boolean;
  affiliatePartners: string[];
}

const REGION_CONFIG: Record<SupportedRegion, RegionInfo> = {
  KR: {
    code: 'KR',
    currency: 'KRW',
    language: 'ko',
    affiliateSupport: true,
    affiliatePartners: ['coupang', 'iherb'],
  },
  US: {
    code: 'US',
    currency: 'USD',
    language: 'en',
    affiliateSupport: true,
    affiliatePartners: ['amazon_us', 'iherb'],
  },
  JP: {
    code: 'JP',
    currency: 'JPY',
    language: 'ja',
    affiliateSupport: true,
    affiliatePartners: ['amazon_jp', 'rakuten'],
  },
  // ... 기타 지역
};

export function detectRegion(): SupportedRegion {
  // 1. 사용자 설정 확인
  const savedRegion = localStorage.getItem('user_region');
  if (savedRegion && savedRegion in REGION_CONFIG) {
    return savedRegion as SupportedRegion;
  }

  // 2. 브라우저 locale
  const locale = navigator.language || navigator.languages?.[0];
  if (locale) {
    if (locale.startsWith('ko')) return 'KR';
    if (locale.startsWith('ja')) return 'JP';
    if (locale.startsWith('zh')) return 'CN';
    if (locale.startsWith('en-US')) return 'US';
  }

  // 3. 기본값
  return 'OTHER';
}
```

### 제품 Repository 확장

```typescript
// lib/products/repositories/global.ts

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { SupportedRegion } from '@/lib/region/detector';

interface GlobalProductFilter {
  region: SupportedRegion;
  category?: string;
  skinType?: string;
  concerns?: string[];
  limit?: number;
}

export async function getGlobalProducts(filter: GlobalProductFilter) {
  const supabase = createClerkSupabaseClient();

  let query = supabase
    .from('cosmetic_products')
    .select('*')
    .contains('available_regions', [filter.region]);

  if (filter.category) {
    query = query.eq('category', filter.category);
  }

  if (filter.skinType) {
    query = query.contains('recommended_skin_types', [filter.skinType]);
  }

  const { data, error } = await query.limit(filter.limit || 20);

  if (error) throw error;
  return data;
}
```

### 어필리에이트 링크 생성

```typescript
// lib/affiliate/global-links.ts

import type { SupportedRegion } from '@/lib/region/detector';

interface AffiliateLinkOptions {
  productId: string;
  productUrl?: string;
  region: SupportedRegion;
  partner: string;
}

const AFFILIATE_CONFIGS: Record<
  string,
  {
    baseUrl: string;
    trackingParam: string;
    affiliateId: string;
  }
> = {
  coupang: {
    baseUrl: 'https://link.coupang.com/a/',
    trackingParam: 'subid',
    affiliateId: process.env.COUPANG_AFFILIATE_ID!,
  },
  amazon_us: {
    baseUrl: 'https://www.amazon.com/dp/',
    trackingParam: 'tag',
    affiliateId: process.env.AMAZON_US_AFFILIATE_ID!,
  },
  amazon_jp: {
    baseUrl: 'https://www.amazon.co.jp/dp/',
    trackingParam: 'tag',
    affiliateId: process.env.AMAZON_JP_AFFILIATE_ID!,
  },
  iherb: {
    baseUrl: 'https://iherb.com/',
    trackingParam: 'rcode',
    affiliateId: process.env.IHERB_AFFILIATE_ID!,
  },
};

export function generateAffiliateLink(options: AffiliateLinkOptions): string | null {
  const config = AFFILIATE_CONFIGS[options.partner];
  if (!config) return null;

  const url = new URL(config.baseUrl + options.productId);
  url.searchParams.set(config.trackingParam, config.affiliateId);

  return url.toString();
}
```

## 4.4 DB 스키마 확장

```sql
-- 기존 cosmetic_products 테이블에 컬럼 추가
ALTER TABLE cosmetic_products
ADD COLUMN IF NOT EXISTS available_regions TEXT[] DEFAULT ARRAY['KR'],
ADD COLUMN IF NOT EXISTS global_ids JSONB DEFAULT '{}';  -- { "amazon_us": "ASIN123", "amazon_jp": "B00XXX" }

-- 지역별 가격 테이블
CREATE TABLE IF NOT EXISTS product_regional_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES cosmetic_products(id) ON DELETE CASCADE,
  region VARCHAR(5) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  price DECIMAL(10, 2),
  affiliate_partner VARCHAR(50),
  affiliate_url TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, region)
);

-- 인덱스
CREATE INDEX idx_products_regions ON cosmetic_products USING GIN(available_regions);
CREATE INDEX idx_regional_prices_product ON product_regional_prices(product_id);
CREATE INDEX idx_regional_prices_region ON product_regional_prices(region);
```

## 4.5 파일 목록

```
신규 파일:
├── lib/region/
│   ├── detector.ts                  # 지역 감지 (~60줄)
│   └── config.ts                    # 지역 설정 (~40줄)
├── lib/products/repositories/global.ts  # 글로벌 제품 조회 (~80줄)
├── lib/affiliate/global-links.ts    # 어필리에이트 링크 (~60줄)
├── components/products/RegionSelector.tsx  # 지역 선택 (~40줄)
├── hooks/useRegion.ts               # 지역 훅 (~30줄)
├── supabase/migrations/xxx_global_products.sql
└── tests/lib/region/detector.test.ts

수정 파일:
├── lib/affiliate/products.ts        # 글로벌 확장
├── app/(main)/products/page.tsx     # 지역 필터 추가
├── components/products/ProductCard.tsx  # 어필리에이트 링크 분기
└── .env.local                       # 글로벌 어필리에이트 키
```

## 4.6 복잡도 분석

```
파일 수: 10-12개 → 15점
아키텍처: 기존 패턴 확장 → 10점
외부 연동: 여러 어필리에이트 → 15점
DB 변경: 스키마 확장 → 10점
테스트: 단위 + 통합 → 10점
────────────────────────
총점: 60점 → Standard 트랙 (code-quality + test-writer)
```

---

# 종합 분석

## 시지푸스 적용 여부

| 기능           | 총점 | 트랙     | 시지푸스          |
| -------------- | ---- | -------- | ----------------- |
| QR 코드        | 20점 | Quick    | ❌ 직접 실행      |
| 소셜 공유      | 30점 | Quick    | ❌ 직접 실행      |
| 운동 확대 뷰어 | 40점 | Light    | ⚠️ code-quality만 |
| 글로벌 제품    | 60점 | Standard | ✅ sisyphus       |

## 병렬 작업 가능 여부

```
┌────────────────────────────────────────────────────────────┐
│                    전체 병렬 작업 계획                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Week 1: Quick 기능 (병렬 가능)                             │
│  ──────────────────────────────                            │
│  [1] QR 코드        ──────────────┐                        │
│                                   ├──→ 완료               │
│  [2] 소셜 공유      ──────────────┘                        │
│                                                            │
│  Week 2: Light 기능                                        │
│  ──────────────────                                        │
│  [3] 운동 확대 뷰어 ──────────────────→ 완료               │
│                                                            │
│  Week 3-4: Standard 기능                                   │
│  ─────────────────────                                     │
│  [4] 글로벌 제품    ──────────────────────────→ 완료       │
│                                                            │
│                                                            │
│  ✅ 병렬 가능: [1] + [2]                                    │
│  ✅ 병렬 가능: [3] 일부 + [4] 일부 (DB 독립)                │
│  ❌ 순차 필요: [4] API → UI (내부 의존성)                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 권장 실행 순서

1. **즉시 실행** (직접, 병렬):
   - QR 코드 기능
   - 소셜 공유 확대

2. **다음 Phase** (Light 트랙):
   - 운동 자세 분석 확대 뷰어

3. **시장 검증 후** (Standard 트랙, /sisyphus):
   - 글로벌 제품 추천

---

## 연관 문서

- [SDD-PRODUCT-SCAN.md](./SDD-PRODUCT-SCAN.md) - 바코드/성분 스캔 기능 (별도)
- [SDD-PHASE-E-SKIN-ZOOM.md](./SDD-PHASE-E-SKIN-ZOOM.md) - 피부 분석 확대 (운동 참조)
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - DB 스키마

---

**Version History**

| 버전 | 날짜       | 변경 내용                 |
| ---- | ---------- | ------------------------- |
| 1.0  | 2026-01-11 | 초안 작성 (4개 기능 통합) |
