import { isLiveMode } from '../config/runtimeMode';
import { SYNC_STATUS } from '../constants/syncStatuses';
import {
  savePerms as saveRemotePerms,
  saveUser as saveRemoteUser,
  removeUser as removeRemoteUser,
} from './firebaseService';

export async function savePermsEverywhere({ uid, perms, saveLocal }) {
  saveLocal(uid, perms);
  if (!isLiveMode()) return SYNC_STATUS.LOCAL;

  try {
    await saveRemotePerms(uid, perms);
    return SYNC_STATUS.REMOTE;
  } catch (e) {
    console.warn(e);
    return SYNC_STATUS.LOCAL_FALLBACK;
  }
}

export async function saveUserEverywhere({ uid, patch, updateLocal, oldPhone }) {
  updateLocal(uid, patch, oldPhone);
  if (!isLiveMode()) return SYNC_STATUS.LOCAL;

  try {
    await saveRemoteUser(uid, patch);
    return SYNC_STATUS.REMOTE;
  } catch (e) {
    console.warn(e);
    return SYNC_STATUS.LOCAL_FALLBACK;
  }
}

export async function removeUserEverywhere({ uid, removeLocal }) {
  removeLocal(uid);
  if (!isLiveMode()) return SYNC_STATUS.LOCAL;

  try {
    await removeRemoteUser(uid);
    return SYNC_STATUS.REMOTE;
  } catch (e) {
    console.warn(e);
    return SYNC_STATUS.LOCAL_FALLBACK;
  }
}
