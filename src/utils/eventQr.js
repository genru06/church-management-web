export function buildCheckInPayload(eventId, participant) {
  return JSON.stringify({
    eventId: Number(eventId),
    participantId: participant.id,
    token: participant.qrToken
  });
}

export async function generateQrDataUrl(text, size = 160) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(text, { width: size, margin: 1 });
}
