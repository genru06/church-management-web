export function buildChurchQrPayload(church) {
  return JSON.stringify({
    type: "church",
    churchId: Number(church.id)
  });
}

export async function generateChurchQrDataUrl(church, size = 220) {
  const QRCode = (await import("qrcode")).default;
  const payload = buildChurchQrPayload(church);

  try {
    const svg = await QRCode.toString(payload, { type: "svg", width: size, margin: 2 });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return QRCode.toDataURL(payload, { width: size, margin: 2 });
  }
}
