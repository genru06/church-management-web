export function getEventSignupPath(eventId) {
  return `/events/${eventId}/signup`;
}

export function getEventSignupQrPath(eventId) {
  return `/events/${eventId}/signup-qr`;
}

function appBasePath() {
  const base = (process.env.VUE_ROUTER_BASE || "/").replace(/\/+$/, "");
  return base === "" ? "" : base;
}

function absoluteAppPath(path) {
  const base = appBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalizedPath;
  return `${base}${normalizedPath}`.replace(/\/{2,}/g, "/");
}

export function getEventSignupUrl(eventId) {
  const path = getEventSignupPath(eventId);
  if (typeof window === "undefined") return absoluteAppPath(path);

  const origin = window.location.origin;
  const hashMode = process.env.VUE_ROUTER_MODE !== "history";
  if (hashMode) {
    return `${origin}${appBasePath() || ""}#${path}`;
  }
  return `${origin}${absoluteAppPath(path)}`;
}

export function isRegistrationOpen(event) {
  if (!event) return false;
  if (event.registrationOpen !== undefined) return event.registrationOpen;

  if (event.status !== "published") return false;

  if (event.eventDate) {
    const today = new Date().toISOString().slice(0, 10);
    const eventDate = String(event.eventDate).slice(0, 10);
    if (eventDate < today) return false;
  }

  return true;
}

export function getRegistrationClosedReason(event) {
  if (!event) return "Registration is unavailable.";
  if (event.registrationClosedReason) return event.registrationClosedReason;
  if (event.status !== "published") return "Registration is only available for published events.";
  if (event.eventDate) {
    const today = new Date().toISOString().slice(0, 10);
    const eventDate = String(event.eventDate).slice(0, 10);
    if (eventDate < today) return "Registration is closed because the event date has passed.";
  }
  return "Registration is unavailable.";
}

export function getEventSignupQrUrl(eventId) {
  const path = getEventSignupQrPath(eventId);
  if (typeof window === "undefined") return absoluteAppPath(path);

  const origin = window.location.origin;
  const hashMode = process.env.VUE_ROUTER_MODE !== "history";
  if (hashMode) {
    return `${origin}${appBasePath() || ""}#${path}`;
  }
  return `${origin}${absoluteAppPath(path)}`;
}

export async function generateRegistrationQrDataUrl(eventId, size = 240) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(getEventSignupUrl(eventId), { width: size, margin: 2 });
}
