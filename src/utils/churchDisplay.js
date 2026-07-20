export function getChurchDisplayName(church) {
  if (!church) return "";
  if (typeof church === "string") return church;
  const shortName = church.shortName?.trim();
  return shortName || church.name || "";
}

/** True for the main campus (e.g. "BHCCCI - Main"), not names like "Mainit". */
export function isMainChurchName(name) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!normalized) return false;
  return (
    normalized === "main" ||
    normalized === "bhccci - main" ||
    normalized === "bhccci-main" ||
    /(?:^|[\s-])main$/.test(normalized)
  );
}

export function compareChurchNamesMainFirst(a, b) {
  const nameA = typeof a === "string" ? a : getChurchDisplayName(a);
  const nameB = typeof b === "string" ? b : getChurchDisplayName(b);
  const aMain = isMainChurchName(nameA);
  const bMain = isMainChurchName(nameB);
  if (aMain !== bMain) return aMain ? -1 : 1;
  return String(nameA || "").localeCompare(String(nameB || ""), undefined, { sensitivity: "base" });
}

export function sortChurchesMainFirst(items, getName = getChurchDisplayName) {
  return [...(items || [])].sort((a, b) => compareChurchNamesMainFirst(getName(a), getName(b)));
}
