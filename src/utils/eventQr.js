export function buildCheckInPayload(eventId, participant) {
  return JSON.stringify({
    eventId: Number(eventId),
    participantId: participant.id,
    token: participant.qrToken
  });
}

export async function generateQrDataUrl(text) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(text, { width: 160, margin: 1 });
}
