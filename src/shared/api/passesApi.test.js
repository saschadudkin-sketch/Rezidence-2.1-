describe('passesApi (demo mode)', () => {
  let api;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../config/runtimeMode', () => ({ isLiveMode: () => false }));
    api = require('./passesApi');
    api.__resetPassesApiDemoState();
  });

  test('createPass + getPasses', async () => {
    await api.createPass({ userId: 'u1', validUntil: '2030-01-01T00:00:00.000Z' });
    const passes = await api.getPasses();
    expect(passes).toHaveLength(1);
    expect(passes[0].userId).toBe('u1');
  });

  test('validatePass returns denied for expired pass', async () => {
    const result = await api.validatePass(
      { userId: 'u1', validUntil: '2020-01-01T00:00:00.000Z' },
      { now: new Date('2021-01-01T00:00:00.000Z') },
    );
    expect(result.status).toBe('denied');
  });

  test('logVisit stores entry', async () => {
    const entry = await api.logVisit({ userId: 'u1', requestId: 'r1', result: 'allowed', reason: 'ok' });
    expect(entry.userId).toBe('u1');
    expect(entry.requestId).toBe('r1');
    expect(entry.result).toBe('allowed');
    const logs = await api.getVisitLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].reason).toBe('ok');
  });

  test('visit logs survive module reload via localStorage', async () => {
    await api.logVisit({ userId: 'u1', requestId: 'r42', result: 'denied', reason: 'expired' });
    jest.resetModules();
    jest.doMock('../../config/runtimeMode', () => ({ isLiveMode: () => false }));
    const apiReloaded = require('./passesApi');
    const logs = await apiReloaded.getVisitLogs();
    expect(logs[0].requestId).toBe('r42');
    expect(logs[0].reason).toBe('expired');
  });

  test('clearVisitLogs removes persisted events', async () => {
    await api.logVisit({ userId: 'u1', requestId: 'r11', result: 'allowed', reason: 'ok' });
    await api.clearVisitLogs();
    const logs = await api.getVisitLogs();
    expect(logs).toEqual([]);
  });

  test('getVisitLogs keeps reverse-chronological order (newest first)', async () => {
    await api.logVisit({ userId: 'u1', requestId: 'older', result: 'allowed', reason: 'ok' });
    await new Promise((resolve) => setTimeout(resolve, 2));
    await api.logVisit({ userId: 'u1', requestId: 'newer', result: 'denied', reason: 'expired' });
    const logs = await api.getVisitLogs();
    expect(logs[0].requestId).toBe('newer');
    expect(logs[1].requestId).toBe('older');
  });
});

describe('passesApi (live mode fallback)', () => {
  let api;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../config/runtimeMode', () => ({ isLiveMode: () => true }));
    jest.doMock('./firebase', () => ({ getFirebaseApp: () => null }));
    api = require('./passesApi');
    api.__resetPassesApiDemoState();
  });

  test('createPass falls back to in-memory storage when Firebase app is unavailable', async () => {
    await api.createPass({ userId: 'u_live_1' });
    const passes = await api.getPasses();
    expect(passes).toHaveLength(1);
    expect(passes[0].userId).toBe('u_live_1');
  });

  test('visit logs are still persisted/retrieved in live mode fallback path', async () => {
    await api.logVisit({ userId: 'u_live_1', requestId: 'r_live_1', result: 'allowed', reason: 'ok' });
    const logs = await api.getVisitLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].requestId).toBe('r_live_1');
  });
});
