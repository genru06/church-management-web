export function getEventSignupUrl(eventId) {
  if (typeof window === "undefined") return `/events/${eventId}/signup`;
  return `${window.location.origin}/events/${eventId}/signup`;
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
  if (typeof window === "undefined") return `/events/${eventId}/signup-qr`;
  return `${window.location.origin}/events/${eventId}/signup-qr`;
}

export async function generateRegistrationQrDataUrl(eventId, size = 240) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(getEventSignupUrl(eventId), { width: size, margin: 2 });
}
