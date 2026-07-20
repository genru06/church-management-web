const PUBLIC_PATH_PATTERNS = [
  /^\/login\/?$/,
  /^\/events\/[^/]+\/signup\/?$/,
  /^\/events\/[^/]+\/signup-qr\/?$/,
  /^\/events\/[^/]+\/register\/[^/]+\/?$/
];

const PUBLIC_API_PATTERNS = [
  /^\/events\/[^/]+\/signup\/?$/,
  /^\/events\/[^/]+\/register\/[^/]+\/?$/,
  /^\/events\/[^/]+\/register\/[^/]+\/pay\/?$/,
  /^\/auth\/login\/?$/,
  /^\/health\/?$/
];

function normalizePath(path = "") {
  const raw = String(path).split("?")[0].split("#")[0];
  if (!raw || raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

export function isPublicPath(path) {
  const normalized = normalizePath(path);
  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isPublicApiPath(url = "") {
  const normalized = normalizePath(url);
  return PUBLIC_API_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isPublicRouteRecord(route) {
  if (!route) return false;
  if (isPublicPath(route.path)) return true;
  return route.matched?.some((record) => record.meta?.public === true) ?? false;
}

export function currentPublicPath() {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.pathname);
}
