import { sendChatMessage } from '../chatGateway';
import {
  resolveRequestPhotos,
  submitRequest,
  updateRequestEverywhere,
  deleteRequestEverywhere,
} from '../requestsGateway';
import {
  savePermsEverywhere,
  saveUserEverywhere,
  removeUserEverywhere,
} from '../adminGateway';
import { startLiveDataSync } from '../liveDataGateway';

export function createFirebaseProvider() {
  return {
    provider: 'firebase',
    chat: { sendMessage: sendChatMessage },
    requests: {
      resolvePhotos: resolveRequestPhotos,
      submit: submitRequest,
      updateEverywhere: updateRequestEverywhere,
      deleteEverywhere: deleteRequestEverywhere,
    },
    admin: {
      savePermsEverywhere,
      saveUserEverywhere,
      removeUserEverywhere,
    },
    liveData: { startSync: startLiveDataSync },
  };
}
