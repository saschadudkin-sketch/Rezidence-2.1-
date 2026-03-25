jest.mock('./firebaseService', () => ({
  subscribeRequests: jest.fn(),
  subscribeChat: jest.fn(),
  fetchAllUsers: jest.fn(),
  fetchPerms: jest.fn(),
  fetchTemplates: jest.fn(),
}));

import {
  subscribeRequests,
  subscribeChat,
  fetchAllUsers,
  fetchPerms,
  fetchTemplates,
} from './firebaseService';
import { startLiveDataSync } from './liveDataGateway';

describe('liveDataGateway.startLiveDataSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('wires subscriptions, bootstrap fetches and cleanup', async () => {
    const unsubReq = jest.fn();
    const unsubChat = jest.fn();
    subscribeRequests.mockImplementation((cb) => { cb([{ id: 'r1' }]); return unsubReq; });
    subscribeChat.mockImplementation((cb) => { cb([{ id: 'm1' }]); return unsubChat; });
    fetchAllUsers.mockResolvedValue([{ uid: 'u1' }]);
    fetchPerms.mockResolvedValue({ visitors: [] });
    fetchTemplates.mockResolvedValue([{ id: 't1' }]);

    const onRequests = jest.fn();
    const onChat = jest.fn();
    const onUsers = jest.fn();
    const onPerms = jest.fn();
    const onTemplates = jest.fn();

    const stop = startLiveDataSync({
      userUid: 'u1',
      onRequests,
      onChat,
      onUsers,
      onPerms,
      onTemplates,
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(onRequests).toHaveBeenCalledWith([{ id: 'r1' }]);
    expect(onChat).toHaveBeenCalledWith([{ id: 'm1' }]);
    expect(onUsers).toHaveBeenCalledWith([{ uid: 'u1' }]);
    expect(onPerms).toHaveBeenCalledWith({ visitors: [] });
    expect(onTemplates).toHaveBeenCalledWith([{ id: 't1' }]);

    stop();
    expect(unsubReq).toHaveBeenCalledTimes(1);
    expect(unsubChat).toHaveBeenCalledTimes(1);
  });
});
