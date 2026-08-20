describe('mobile analytics session', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('같은 앱 런타임에서는 세션 ID를 유지하고 명시 종료 뒤 새 ID를 만든다', () => {
    const session =
      require('../../../lib/analytics/session') as typeof import('../../../lib/analytics/session');

    const first = session.getOrCreateSession();
    expect(session.getOrCreateSession()).toBe(first);

    session.endSession();
    expect(session.getOrCreateSession()).not.toBe(first);
  });
});
