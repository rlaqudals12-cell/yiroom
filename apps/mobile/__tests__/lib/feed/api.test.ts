import {
  createFeedPost,
  createFeedComment,
  getFeedComments,
  getFeedPost,
} from '@/lib/feed/api';

const fetchMock = jest.fn();

function response(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('feed API client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('게시물 생성은 인증된 웹 API를 사용한다', async () => {
    fetchMock.mockResolvedValueOnce(response({ success: true, post: { id: 'post-1' } }, 201));

    await createFeedPost(
      'token',
      { content: '분석 결과를 공유해요', type: 'analysis' },
      'https://api.example.com'
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/feed',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'x-yiroom-client': 'mobile',
        }),
        body: JSON.stringify({
          content: '분석 결과를 공유해요',
          post_type: 'general',
          hashtags: ['yiroom-analysis'],
        }),
      })
    );
  });

  it('댓글 조회·작성은 게시물 댓글 API를 사용한다', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({
          success: true,
          comments: [
            {
              id: 'comment-1',
              clerk_user_id: 'user-1',
              content: '좋아요',
              created_at: '2026-08-18T01:00:00.000Z',
              author: { name: '이룸' },
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        response(
          {
            success: true,
            comment: {
              id: 'comment-2',
              clerk_user_id: 'user-1',
              content: '정말 좋아요',
              created_at: '2026-08-18T02:00:00.000Z',
              author: { name: '이룸' },
            },
          },
          201
        )
      );

    await expect(
      getFeedComments('post-1', 'token', 'https://api.example.com')
    ).resolves.toEqual([
      expect.objectContaining({ id: 'comment-1', userName: '이룸', content: '좋아요' }),
    ]);
    await createFeedComment('post-1', '정말 좋아요', 'token', 'https://api.example.com');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/feed/post-1/comments',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/feed/post-1/comments',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: '정말 좋아요' }) })
    );
  });

  it('단일 게시물의 웹 형상을 모바일 FeedItem으로 변환한다', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        post: {
          id: 'post-1',
          clerk_user_id: 'user-1',
          content: '오늘의 분석\n설명',
          hashtags: ['yiroom-analysis'],
          likes_count: 3,
          comments_count: 2,
          created_at: '2026-08-18T00:00:00.000Z',
          author: { name: '이룸', avatar_url: null },
          is_liked: true,
        },
      })
    );

    await expect(getFeedPost('post-1', 'token', 'https://api.example.com')).resolves.toEqual(
      expect.objectContaining({
        id: 'post-1',
        userName: '이룸',
        content: '오늘의 분석',
        detail: '설명',
        likes: 3,
        comments: 2,
        isLiked: true,
      })
    );
  });

  it('유효한 이룸 태그가 없으면 분석 게시물로 위장하지 않는다', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        success: true,
        post: {
          id: 'post-general',
          clerk_user_id: 'user-1',
          content: '일반 소식',
          hashtags: [],
          created_at: '2026-08-18T00:00:00.000Z',
        },
      })
    );

    await expect(getFeedPost('post-general', 'token', 'https://api.example.com')).resolves.toEqual(
      expect.objectContaining({ type: 'general' })
    );
  });
});
