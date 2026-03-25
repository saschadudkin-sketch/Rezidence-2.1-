jest.mock('../chatGateway', () => ({
  sendChatMessage: jest.fn(),
}));

jest.mock('../requestsGateway', () => ({
  resolveRequestPhotos: jest.fn(),
  submitRequest: jest.fn(),
  updateRequestEverywhere: jest.fn(),
  deleteRequestEverywhere: jest.fn(),
}));

jest.mock('../adminGateway', () => ({
  savePermsEverywhere: jest.fn(),
  saveUserEverywhere: jest.fn(),
  removeUserEverywhere: jest.fn(),
}));

jest.mock('../liveDataGateway', () => ({
  startLiveDataSync: jest.fn(),
}));

import { sendChatMessage } from '../chatGateway';
import {
  resolveRequestPhotos,
  submitRequest,
  updateRequestEverywhere,
  deleteRequestEverywhere,
} from '../requestsGateway';
import { savePermsEverywhere, saveUserEverywhere, removeUserEverywhere } from '../adminGateway';
import { startLiveDataSync } from '../liveDataGateway';
import { createFirebaseProvider } from './firebaseProvider';

describe('firebaseProvider', () => {
  test('exposes firebase provider identity', () => {
    const provider = createFirebaseProvider();
    expect(provider.provider).toBe('firebase');
  });

  test('delegates chat to sendChatMessage', () => {
    const provider = createFirebaseProvider();
    const payload = { remotePayload: { text: 'hi' }, localMessage: { text: 'hi' }, sendLocal: jest.fn() };

    provider.chat.sendMessage(payload);

    expect(sendChatMessage).toHaveBeenCalledWith(payload);
  });

  test('delegates requests/admin/liveData to corresponding gateways', () => {
    const provider = createFirebaseProvider();

    provider.requests.resolvePhotos('r1', ['p1']);
    provider.requests.submit({ request: { id: 'r1' }, addLocal: jest.fn() });
    provider.requests.updateEverywhere({ requestId: 'r1', patch: { a: 1 }, updateLocal: jest.fn() });
    provider.requests.deleteEverywhere({ requestId: 'r1', deleteLocal: jest.fn() });

    provider.admin.savePermsEverywhere({ uid: 'u1', perms: {}, saveLocal: jest.fn() });
    provider.admin.saveUserEverywhere({ uid: 'u1', patch: {}, updateLocal: jest.fn(), oldPhone: '' });
    provider.admin.removeUserEverywhere({ uid: 'u1', removeLocal: jest.fn() });

    provider.liveData.startSync({ userUid: 'u1' });

    expect(resolveRequestPhotos).toHaveBeenCalled();
    expect(submitRequest).toHaveBeenCalled();
    expect(updateRequestEverywhere).toHaveBeenCalled();
    expect(deleteRequestEverywhere).toHaveBeenCalled();
    expect(savePermsEverywhere).toHaveBeenCalled();
    expect(saveUserEverywhere).toHaveBeenCalled();
    expect(removeUserEverywhere).toHaveBeenCalled();
    expect(startLiveDataSync).toHaveBeenCalled();
  });
});
