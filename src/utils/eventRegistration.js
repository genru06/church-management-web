import { lastEventDate } from "./eventDates";

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

  const lastDate = lastEventDate(event);
  if (lastDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (lastDate < today) return false;
  }

  return true;
}

export function getRegistrationClosedReason(event) {
  if (!event) return "Registration is unavailable.";
  if (event.registrationClosedReason) return event.registrationClosedReason;
  if (event.status !== "published") return "Registration is only available for published events.";
  const lastDate = lastEventDate(event);
  if (lastDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (lastDate < today) return "Registration is closed because the event date has passed.";
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
  const url = getEventSignupUrl(eventId);

  try {
    const svg = await QRCode.toString(url, { type: "svg", width: size, margin: 2 });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return QRCode.toDataURL(url, { width: size, margin: 2 });
  }
}
