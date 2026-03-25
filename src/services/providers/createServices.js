import * as runtimeMode from '../../config/runtimeMode';
import { createDemoProvider } from './demoProvider';
import { createFirebaseProvider } from './firebaseProvider';

const LIVE_MODE = runtimeMode.LIVE_MODE || 'live';
const DEMO_MODE = runtimeMode.DEMO_MODE || 'demo';

function normalizeServiceMode(mode) {
  const normalized = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  return normalized === LIVE_MODE ? LIVE_MODE : DEMO_MODE;
}

/**
 * Фабрика сервисов.
 * Возвращает mode-aware набор сервисов, выбирая реализацию провайдера
 * по единому правилу режима.
 */
export function createServices(mode = runtimeMode.MODE) {
  const resolvedMode = normalizeServiceMode(mode);
  const provider = resolvedMode === LIVE_MODE ? createFirebaseProvider() : createDemoProvider();
  return { mode: resolvedMode, ...provider };
}
