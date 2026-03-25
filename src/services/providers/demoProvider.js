export function createDemoProvider() {
  return {
    provider: 'demo',
    chat: {
      sendMessage: async ({ localMessage, sendLocal }) => {
        sendLocal(localMessage);
        return 'local';
      },
    },
    requests: {
      resolvePhotos: async (_reqId, photos) => photos || [],
      submit: ({ request, addLocal }) => {
        addLocal(request);
        return 'local';
      },
      updateEverywhere: ({ requestId, patch, updateLocal }) => {
        updateLocal(requestId, patch);
      },
      deleteEverywhere: ({ requestId, deleteLocal }) => {
        deleteLocal(requestId);
      },
    },
    admin: {
      savePermsEverywhere: ({ uid, perms, saveLocal }) => saveLocal(uid, perms),
      saveUserEverywhere: ({ uid, patch, updateLocal, oldPhone }) => updateLocal(uid, patch, oldPhone),
      removeUserEverywhere: ({ uid, removeLocal }) => removeLocal(uid),
    },
    liveData: { startSync: () => () => {} },
  };
}
