import { initializeApp, getApps, getApp } from 'firebase/app';
import { isLiveMode } from '../../config/runtimeMode';

function readFirebaseConfig() {
  return {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };
}

function hasMinimalConfig(config) {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

/**
 * Единая точка инициализации Firebase.
 * В demo-режиме и при отсутствии конфига возвращает `null`.
 */
export function getFirebaseApp() {
  if (!isLiveMode()) return null;
  const config = readFirebaseConfig();
  if (!hasMinimalConfig(config)) return null;
  return getApps().length ? getApp() : initializeApp(config);
}

