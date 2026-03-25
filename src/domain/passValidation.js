/**
 * Правила валидации пропуска:
 * - deny if expired
 * - deny if in blacklist
 * - allow if valid
 */
export function validatePassByRules(pass, { blacklist = [], now = new Date() } = {}) {
  if (!pass) return { status: 'denied', reason: 'not_found' };

  const validUntil = pass.validUntil ? new Date(pass.validUntil) : null;
  if (validUntil && validUntil.getTime() < now.getTime()) {
    return { status: 'denied', reason: 'expired' };
  }

  const passUserId = pass.userId || pass.uid || pass.id;
  const isBlacklisted = blacklist.some(item => {
    const itemUserId = item.userId || item.uid || item.id;
    return itemUserId && passUserId && itemUserId === passUserId;
  });
  if (isBlacklisted) {
    return { status: 'denied', reason: 'blacklisted' };
  }

  return { status: 'allowed', reason: 'ok' };
}

