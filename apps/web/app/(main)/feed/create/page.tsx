'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import type { PostType } from '@/lib/feed/types';

/**
 * 피드 포스트 작성 페이지
 * - 포스트 타입 선택
 * - 이미지 업로드 (최대 4장)
 * - 해시태그 입력
 */

const postTypes: { id: PostType; label: string; description: string }[] = [
  { id: 'general', label: '일반', description: '자유롭게 글을 작성해요' },
  { id: 'review', label: '리뷰', description: '제품이나 루틴 후기를 공유해요' },
  { id: 'question', label: '질문', description: '궁금한 것을 물어봐요' },
  { id: 'tip', label: '팁', description: '나만의 노하우를 알려줘요' },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('general');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로그인 체크
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로그인이 필요합니다</p>
      </div>
    );
  }

  // 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - images.length;
    const newFiles = files.slice(0, remaining);

    if (newFiles.length > 0) {
      setImages((prev) => [...prev, ...newFiles]);

      // 미리보기 생성
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // 이미지 삭제
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 해시태그 추가
  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags((prev) => [...prev, tag]);
      setHashtagInput('');
    }
  };

  // 해시태그 삭제
  const handleRemoveHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  // 제출
  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      // 이미지 업로드 (있는 경우)
      const mediaUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('bucket', 'feed-images');

        // 이미지 업로드 API 호출 (기존 인벤토리 업로드 API 재사용)
        const uploadRes = await fetch('/api/inventory/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            mediaUrls.push(uploadData.url);
          }
        }
      }

      // 포스트 생성
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          post_type: postType,
          hashtags,
          media_urls: mediaUrls,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/feed');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="feed-create-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="취소"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">새 글 작성</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              content.trim() && !isSubmitting
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            게시
          </button>
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4 pb-24">
        {/* 포스트 타입 선택 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-2 block">글 유형</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {postTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setPostType(type.id)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-lg border text-sm transition-colors',
                  postType === type.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {postTypes.find((t) => t.id === postType)?.description}
          </p>
        </div>

        {/* 내용 입력 */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="무슨 생각을 하고 계세요?"
            className="w-full h-40 p-3 bg-card border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{content.length}/500</p>
        </div>

        {/* 이미지 업로드 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-2 block">사진 (최대 4장)</label>
          <div className="grid grid-cols-4 gap-2">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* 해시태그 */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-2 block">
            해시태그 (최대 10개)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAddHashtag();
                }
              }}
              placeholder="#태그입력"
              className="flex-1 px-3 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleAddHashtag}
              disabled={!hashtagInput.trim() || hashtags.length >= 10}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
            >
              추가
            </button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  #{tag}
                  <button onClick={() => handleRemoveHashtag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
