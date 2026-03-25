import { validatePassByRules } from './passValidation';

describe('validatePassByRules', () => {
  test('denies expired pass', () => {
    const result = validatePassByRules(
      { id: 'p1', userId: 'u1', validUntil: '2020-01-01T00:00:00.000Z' },
      { now: new Date('2021-01-01T00:00:00.000Z') },
    );
    expect(result.status).toBe('denied');
    expect(result.reason).toBe('expired');
  });

  test('denies blacklisted pass holder', () => {
    const result = validatePassByRules(
      { id: 'p2', userId: 'u2', validUntil: '2030-01-01T00:00:00.000Z' },
      { blacklist: [{ userId: 'u2' }] },
    );
    expect(result.status).toBe('denied');
    expect(result.reason).toBe('blacklisted');
  });

  test('allows valid pass', () => {
    const result = validatePassByRules(
      { id: 'p3', userId: 'u3', validUntil: '2030-01-01T00:00:00.000Z' },
      { blacklist: [{ userId: 'u9' }] },
    );
    expect(result.status).toBe('allowed');
  });
});

