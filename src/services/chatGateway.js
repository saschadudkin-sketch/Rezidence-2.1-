import { isLiveMode } from '../config/runtimeMode';
import { SYNC_STATUS } from '../constants/syncStatuses';
import { sendMessage as fbSendMessage } from './firebaseService';

/**
 * Единая точка отправки сообщений чата с учётом режима (demo/live).
 * Возвращает 'remote' или 'local', чтобы UI мог решать, нужен ли optimistic update.
 */
export async function sendChatMessage({ remotePayload, localMessage, sendLocal }) {
  if (isLiveMode()) {
    try {
      await fbSendMessage(remotePayload);
      return SYNC_STATUS.REMOTE;
    } catch (e) {
      console.warn(e);
      sendLocal(localMessage);
      return SYNC_STATUS.LOCAL;
    }
  }

  sendLocal(localMessage);
  return SYNC_STATUS.LOCAL;
}
