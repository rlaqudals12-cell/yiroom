import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateServiceRoleClient = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockCreateServiceRoleClient(),
}));

const {
  ImageStorageOperationError,
  ImageStorageRollbackError,
  rollbackUploadedSessionImages,
  uploadSessionImages,
} = await import('@/lib/analysis/integrated/internal/storage-uploader');

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('uploadSessionImages — 저장과 rollback 원자 경계', () => {
  const upload = vi.fn();
  const remove = vi.fn();
  const storageFrom = vi.fn(() => ({ upload, remove }));
  const supabase = { storage: { from: storageFrom } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServiceRoleClient.mockReturnValue(supabase);
    upload.mockImplementation(async (path: string) => ({ data: { path }, error: null }));
    remove.mockResolvedValue({ data: null, error: null });
  });

  it('저장 동의가 없으면 Storage 클라이언트도 만들지 않고 null 경로를 반환한다', async () => {
    await expect(
      uploadSessionImages(
        'session-1',
        'user-1',
        'data:image/jpeg;base64,YQ==',
        'data:image/jpeg;base64,Yg=='
      )
    ).resolves.toEqual({ faceImageUrl: null, bodyImageUrl: null });

    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it('동의하면 얼굴·전신을 명시 경로에 저장한다', async () => {
    await expect(
      uploadSessionImages(
        'session-1',
        'user-1',
        'data:image/jpeg;base64,YQ==',
        'data:image/webp;base64,Yg==',
        true
      )
    ).resolves.toEqual({
      faceImageUrl: 'user-1/session-1/face.jpg',
      bodyImageUrl: 'user-1/session-1/body.webp',
    });
  });

  it('얼굴 upload promise reject도 얼굴 후보 경로를 rollback한다', async () => {
    upload.mockRejectedValueOnce(new Error('face network rejected'));

    const result = uploadSessionImages(
      'session-1',
      'user-1',
      'data:image/jpeg;base64,YQ==',
      null,
      true
    );

    await expect(result).rejects.toMatchObject({
      name: 'ImageStorageOperationError',
      cleanupConfirmed: true,
      stage: 'face_upload',
    });
    expect(remove).toHaveBeenCalledWith(['user-1/session-1/face.jpg']);
  });

  it('얼굴 upload resolved error도 얼굴 후보 경로를 rollback한다', async () => {
    upload.mockResolvedValueOnce({ data: null, error: { message: 'face rejected' } });

    await expect(
      uploadSessionImages('session-1', 'user-1', 'data:image/jpeg;base64,YQ==', null, true)
    ).rejects.toBeInstanceOf(ImageStorageOperationError);

    expect(remove).toHaveBeenCalledWith(['user-1/session-1/face.jpg']);
  });

  it('전신 resolved error는 얼굴·전신 후보를 함께 rollback한다', async () => {
    upload
      .mockResolvedValueOnce({ data: { path: 'face' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'body failed' } });

    await expect(
      uploadSessionImages(
        'session-1',
        'user-1',
        'data:image/jpeg;base64,YQ==',
        'data:image/heic;base64,Yg==',
        true
      )
    ).rejects.toMatchObject({ stage: 'body_upload', cleanupConfirmed: true });

    expect(remove).toHaveBeenCalledWith([
      'user-1/session-1/face.jpg',
      'user-1/session-1/body.heic',
    ]);
  });

  it('늦은 얼굴 upload가 resolve돼도 rollback 완료 전에는 호출이 끝나지 않는다', async () => {
    const lateUpload = deferred<{ data: { path: string }; error: null }>();
    const lateRemove = deferred<{ data: null; error: null }>();
    upload.mockReturnValueOnce(lateUpload.promise);
    remove.mockReturnValueOnce(lateRemove.promise);
    const deadline = { throwIfExpired: vi.fn(), expired: vi.fn().mockReturnValue(true) };

    let settled = false;
    const result = uploadSessionImages(
      'session-1',
      'user-1',
      'data:image/jpeg;base64,YQ==',
      null,
      true,
      deadline as never
    ).finally(() => {
      settled = true;
    });

    lateUpload.resolve({ data: { path: 'face' }, error: null });
    await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(settled).toBe(false);

    lateRemove.resolve({ data: null, error: null });
    await expect(result).rejects.toMatchObject({
      name: 'ImageStorageOperationError',
      stage: 'face_deadline',
    });
  });

  it('rollback의 resolved error는 원본·정리 오류와 후보 경로를 모두 보존한다', async () => {
    upload.mockRejectedValueOnce(new Error('original upload error'));
    remove.mockResolvedValueOnce({ data: null, error: { message: 'remove denied' } });

    const result = uploadSessionImages(
      'session-1',
      'user-1',
      'data:image/jpeg;base64,YQ==',
      null,
      true
    );

    await expect(result).rejects.toMatchObject({
      name: 'ImageStorageRollbackError',
      cleanupConfirmed: false,
      candidatePaths: ['user-1/session-1/face.jpg'],
    });
    await expect(result).rejects.toThrow(/original upload error.*remove denied/);
  });

  it('포인터 부착 실패 보상도 공통 rollback 경계를 사용한다', async () => {
    const result = rollbackUploadedSessionImages(
      {
        faceImageUrl: 'user-1/session-1/face.jpg',
        bodyImageUrl: 'user-1/session-1/body.webp',
      },
      new Error('attach response lost')
    );

    await expect(result).rejects.toBeInstanceOf(ImageStorageOperationError);
    expect(remove).toHaveBeenCalledWith([
      'user-1/session-1/face.jpg',
      'user-1/session-1/body.webp',
    ]);
  });

  it('포인터 부착 보상 remove의 resolved error도 cleanup-unconfirmed다', async () => {
    remove.mockResolvedValueOnce({ data: null, error: { message: 'remove failed' } });

    const result = rollbackUploadedSessionImages(
      { faceImageUrl: 'user-1/session-1/face.jpg', bodyImageUrl: null },
      new Error('attach failed')
    );

    await expect(result).rejects.toBeInstanceOf(ImageStorageRollbackError);
    await expect(result).rejects.toThrow(/attach failed.*remove failed/);
  });
});
