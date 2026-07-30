export function buildCheckInPayload(eventId, participant) {
  // Prefer the member's permanent QR when linked — works across all events
  if (participant.memberId && participant.memberQrToken) {
    return JSON.stringify({
      type: "member",
      memberId: Number(participant.memberId),
      token: participant.memberQrToken
    });
  }

  return JSON.stringify({
    eventId: Number(eventId),
    participantId: participant.id,
    token: participant.qrToken
  });
}

export async function generateQrDataUrl(text, size = 160) {
  const QRCode = (await import("qrcode")).default;

  try {
    const svg = await QRCode.toString(text, { type: "svg", width: size, margin: 1 });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return QRCode.toDataURL(text, { width: size, margin: 1 });
  }
}
