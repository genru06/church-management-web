export function getChurchDisplayName(church) {
  if (!church) return "";
  if (typeof church === "string") return church;
  const shortName = church.shortName?.trim();
  return shortName || church.name || "";
}
