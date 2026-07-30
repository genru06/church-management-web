export function buildMemberQrPayload(member) {
  return JSON.stringify({
    type: "member",
    memberId: Number(member.id),
    token: member.qrToken
  });
}

export async function generateMemberQrDataUrl(member, size = 220) {
  const QRCode = (await import("qrcode")).default;
  const payload = buildMemberQrPayload(member);

  try {
    // SVG data URLs are more reliable on iPad/Safari than canvas PNG data URLs.
    const svg = await QRCode.toString(payload, { type: "svg", width: size, margin: 2 });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return QRCode.toDataURL(payload, { width: size, margin: 2 });
  }
}
