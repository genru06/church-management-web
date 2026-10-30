import { LG_NETWORK_CHURCHES_PRINT_PATH } from "src/utils/churchTags";

export function getChurchesPrintUrl({ networkOnly = false, churchId = null } = {}) {
  const params = new URLSearchParams();
  if (churchId != null && churchId !== "") {
    params.set("churchId", String(churchId));
  }
  const query = params.toString();
  const path = networkOnly ? LG_NETWORK_CHURCHES_PRINT_PATH : "/churches/print";
  return query ? `${path}?${query}` : path;
}
