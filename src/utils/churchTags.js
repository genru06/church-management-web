export const LG_NETWORK_CHURCH_TAG = "LG Network Church";
export const LG_NETWORK_CHURCHES_PATH = "/lg-network-churches";
export const LG_NETWORK_MEMBERS_PATH = "/lg-network-churches/members";
export const LG_NETWORK_MEMBERS_PRINT_PATH = "/lg-network-churches/members/print";
export const LG_NETWORK_MEMBERS_FROM = "lg-network-churches";

export function isLgNetworkChurch(tags = []) {
  const needle = LG_NETWORK_CHURCH_TAG.toLowerCase();
  return (tags || []).some((tag) => String(tag || "").trim().toLowerCase() === needle);
}

export function membersListPathFromQuery(query = {}) {
  return query?.from === LG_NETWORK_MEMBERS_FROM ? LG_NETWORK_MEMBERS_PATH : "/members";
}
