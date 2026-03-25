import {
  subscribeRequests,
  subscribeChat,
  fetchAllUsers,
  fetchPerms,
  fetchTemplates,
} from './firebaseService';

/**
 * Единая точка запуска live-синхронизации данных дашборда.
 * UI передаёт обработчики, gateway управляет подписками и первичной загрузкой.
 */
export function startLiveDataSync({
  userUid,
  onRequests,
  onChat,
  onUsers,
  onPerms,
  onTemplates,
}) {
  const unsubReqs = subscribeRequests((docs) => onRequests && onRequests(docs));
  const unsubChat = subscribeChat((docs) => onChat && onChat(docs));

  fetchAllUsers().then((u) => { if (u.length && onUsers) onUsers(u); }).catch(() => {});
  fetchPerms(userUid).then((p) => onPerms && onPerms(p)).catch(() => {});
  fetchTemplates(userUid).then((items) => onTemplates && onTemplates(items)).catch(() => {});

  return () => {
    unsubReqs();
    unsubChat();
  };
}
