function normalizeOrigin(value) {
  try {
    const parsed = new URL(value);
    if (parsed.username || parsed.password || (parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) return null;
    return parsed.origin === 'null' ? `${parsed.protocol}//${parsed.host}` : parsed.origin;
  } catch {
    return null;
  }
}

function createTrustedOrigins(configuredOrigins, isProd) {
  const origins = new Set(configuredOrigins.map(normalizeOrigin).filter(Boolean));
  if (!isProd) {
    for (const value of ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000', 'http://localhost', 'capacitor://localhost']) {
      const origin = normalizeOrigin(value);
      if (origin) origins.add(origin);
    }
  }
  return origins;
}

function isAllowedOrigin(value, trustedOrigins, isProd) {
  if (!value || !isProd) return true;
  const origin = normalizeOrigin(value);
  return origin !== null && trustedOrigins.has(origin);
}

module.exports = { normalizeOrigin, createTrustedOrigins, isAllowedOrigin };
