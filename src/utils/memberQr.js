export function buildMemberQrPayload(member) {
  return JSON.stringify({
    type: "member",
    memberId: Number(member.id),
    token: member.qrToken
  });
}

export async function generateMemberQrDataUrl(member, size = 220) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(buildMemberQrPayload(member), { width: size, margin: 2 });
}
