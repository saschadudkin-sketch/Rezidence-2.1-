import { canApproveScannedRequest } from './scanDecision';

describe('canApproveScannedRequest', () => {
  test('allows pending request only for allowed validation', () => {
    expect(canApproveScannedRequest({ requestStatus: 'pending', validationStatus: 'allowed' })).toBe(true);
    expect(canApproveScannedRequest({ requestStatus: 'pending', validationStatus: 'denied' })).toBe(false);
  });

  test('allows approved request only for allowed validation', () => {
    expect(canApproveScannedRequest({ requestStatus: 'approved', validationStatus: 'allowed' })).toBe(true);
    expect(canApproveScannedRequest({ requestStatus: 'approved', validationStatus: null })).toBe(false);
  });

  test('rejects non-approvable statuses', () => {
    expect(canApproveScannedRequest({ requestStatus: 'cancelled', validationStatus: 'allowed' })).toBe(false);
    expect(canApproveScannedRequest({ requestStatus: 'rejected', validationStatus: 'allowed' })).toBe(false);
  });
});

