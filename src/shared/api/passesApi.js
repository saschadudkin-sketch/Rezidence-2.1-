import { isLiveMode } from '../../config/runtimeMode';
import { validatePassByRules } from '../../domain/passValidation';
import { getFirebaseApp } from './firebase';

const demoPasses = [];
const demoVisitLogs = [];
const DEMO_VISIT_LOGS_KEY = 'residenze_demo_visit_logs_v1';

function loadDemoVisitLogs() {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(DEMO_VISIT_LOGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      demoVisitLogs.length = 0;
      demoVisitLogs.push(...parsed);
    }
  } catch {
    // ignore corrupted storage
  }
}

function saveDemoVisitLogs() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(DEMO_VISIT_LOGS_KEY, JSON.stringify(demoVisitLogs));
  } catch {
    // ignore storage failures
  }
}

/**
 * API layer для пропусков.
 * Компоненты не должны дергать Firebase напрямую.
 */
export async function getPasses() {
  if (!isLiveMode()) return [...demoPasses];

  const app = getFirebaseApp();
  if (!app) return [...demoPasses];
  // live implementation placeholder:
  // read passes from Firestore
  return [...demoPasses];
}

export async function createPass(pass) {
  const payload = {
    ...pass,
    id: pass.id || `p_${Date.now()}`,
    createdAt: pass.createdAt || new Date().toISOString(),
  };

  if (!isLiveMode()) {
    demoPasses.unshift(payload);
    return payload;
  }

  const app = getFirebaseApp();
  if (!app) {
    demoPasses.unshift(payload);
    return payload;
  }
  // live implementation placeholder:
  // write pass to Firestore
  demoPasses.unshift(payload);
  return payload;
}

export async function validatePass(passPayload, context = {}) {
  return validatePassByRules(passPayload, context);
}

export async function logVisit({ userId, timestamp = new Date().toISOString(), result, ...rest }) {
  const entry = { id: `v_${Date.now()}`, userId, timestamp, result, ...rest };
  if (!isLiveMode()) {
    loadDemoVisitLogs();
    demoVisitLogs.unshift(entry);
    saveDemoVisitLogs();
    return entry;
  }

  const app = getFirebaseApp();
  if (!app) {
    loadDemoVisitLogs();
    demoVisitLogs.unshift(entry);
    saveDemoVisitLogs();
    return entry;
  }
  // live implementation placeholder:
  // write visit log to Firestore
  loadDemoVisitLogs();
  demoVisitLogs.unshift(entry);
  saveDemoVisitLogs();
  return entry;
}

export async function getVisitLogs() {
  if (!isLiveMode()) {
    loadDemoVisitLogs();
    return [...demoVisitLogs];
  }

  const app = getFirebaseApp();
  if (!app) {
    loadDemoVisitLogs();
    return [...demoVisitLogs];
  }
  // live implementation placeholder:
  // read visit logs from Firestore
  return [...demoVisitLogs];
}

export async function clearVisitLogs() {
  demoVisitLogs.length = 0;
  saveDemoVisitLogs();
}

// test helpers
export function __resetPassesApiDemoState() {
  demoPasses.length = 0;
  demoVisitLogs.length = 0;
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(DEMO_VISIT_LOGS_KEY);
  } catch {
    // ignore
  }
}
