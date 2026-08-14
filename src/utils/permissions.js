export const USER_TAGS = {
  SUPER_USER: "Super User",
  EXECUTIVE_PASTOR: "Executive Pastor",
  PASTOR: "Pastor",
  LIFE_COACH: "Life Coach",
  MAIN_CHURCH_ADMIN: "Main Church Admin",
  EVENTS_MANAGER: "Events Manager"
};

export const ALL_USER_TAGS = Object.values(USER_TAGS);

export const ACL_ADMIN_TAGS = [USER_TAGS.SUPER_USER, USER_TAGS.MAIN_CHURCH_ADMIN];

export const FULL_ACCESS_TAGS = [
  USER_TAGS.SUPER_USER,
  USER_TAGS.EXECUTIVE_PASTOR,
  USER_TAGS.MAIN_CHURCH_ADMIN
];

export function isSuperUser(tags = []) {
  return tags.includes(USER_TAGS.SUPER_USER);
}

export function canManageAcl(tags = []) {
  return tags.some((t) => ACL_ADMIN_TAGS.includes(t));
}

export function hasFullAccess(tags = []) {
  return isSuperUser(tags);
}

export function hasAnyTag(tags = [], required = []) {
  if (isSuperUser(tags)) return true;
  return required.some((r) => tags.includes(r));
}

export function canManageUsers(tags = []) {
  return hasAnyTag(tags, FULL_ACCESS_TAGS);
}

/** Static fallback when session has no ACL permissions yet. */
export const PAGE_PERMISSIONS = {
  dashboard: ALL_USER_TAGS,
  members: [
    USER_TAGS.SUPER_USER,
    USER_TAGS.EXECUTIVE_PASTOR,
    USER_TAGS.MAIN_CHURCH_ADMIN,
    USER_TAGS.PASTOR,
    USER_TAGS.LIFE_COACH,
    USER_TAGS.EVENTS_MANAGER
  ],
  churches: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN, USER_TAGS.PASTOR],
  lifegroups: [
    USER_TAGS.SUPER_USER,
    USER_TAGS.EXECUTIVE_PASTOR,
    USER_TAGS.MAIN_CHURCH_ADMIN,
    USER_TAGS.PASTOR,
    USER_TAGS.LIFE_COACH
  ],
  events: [
    USER_TAGS.SUPER_USER,
    USER_TAGS.EXECUTIVE_PASTOR,
    USER_TAGS.MAIN_CHURCH_ADMIN,
    USER_TAGS.PASTOR,
    USER_TAGS.EVENTS_MANAGER
  ],
  operations: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN],
  attendance: [
    USER_TAGS.SUPER_USER,
    USER_TAGS.EXECUTIVE_PASTOR,
    USER_TAGS.MAIN_CHURCH_ADMIN,
    USER_TAGS.PASTOR,
    USER_TAGS.LIFE_COACH
  ],
  users: FULL_ACCESS_TAGS,
  tags: FULL_ACCESS_TAGS,
  acl: ACL_ADMIN_TAGS
};

export function hasPermission(permissions = [], key, tags = []) {
  if (isSuperUser(tags)) return true;
  return permissions.includes(key);
}

export function canAccessPage(tags = [], page, permissions = null) {
  if (isSuperUser(tags)) return true;
  if (page === "acl") return canManageAcl(tags);
  if (Array.isArray(permissions) && permissions.length) {
    return permissions.includes(`page.${page}`);
  }
  const required = PAGE_PERMISSIONS[page];
  if (!required) return false;
  return required.some((r) => tags.includes(r));
}

export function canAccessAction(tags = [], actionKey, permissions = []) {
  return hasPermission(permissions, actionKey, tags);
}

export function canAccessTab(tags = [], tabKey, permissions = []) {
  return hasPermission(permissions, tabKey, tags);
}

export function primaryTagLabel(tags = []) {
  if (!tags.length) return "No Access";
  const priority = [
    USER_TAGS.SUPER_USER,
    USER_TAGS.EXECUTIVE_PASTOR,
    USER_TAGS.MAIN_CHURCH_ADMIN,
    USER_TAGS.PASTOR,
    USER_TAGS.LIFE_COACH,
    USER_TAGS.EVENTS_MANAGER
  ];
  for (const tag of priority) {
    if (tags.includes(tag)) return tag;
  }
  return tags[0];
}

export const MODULE_META = {
  dashboard: { label: "Dashboard", icon: "dashboard" },
  members: { label: "Members", icon: "badge" },
  churches: { label: "Churches", icon: "church" },
  lifegroups: { label: "LifeGroups", icon: "hub" },
  events: { label: "Events", icon: "event" },
  operations: { label: "Operations", icon: "account_balance" },
  attendance: { label: "Attendance", icon: "event_available" },
  users: { label: "Users", icon: "manage_accounts" },
  tags: { label: "Tags", icon: "sell" },
  acl: { label: "ACL", icon: "security" }
};

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: "dashboard", page: "dashboard" },
  { label: "Members", to: "/members", icon: "badge", page: "members" },
  { label: "Churches", to: "/churches", icon: "church", page: "churches" },
  { label: "LG Network Churches", to: "/lg-network-churches", icon: "account_tree", page: "churches" },
  { label: "LifeGroups", to: "/lifegroups", icon: "hub", page: "lifegroups" },
  { label: "Events", to: "/events", icon: "event", page: "events" },
  { label: "Operations", to: "/operations", icon: "account_balance", page: "operations" },
  { label: "Attendance", to: "/attendance", icon: "event_available", page: "attendance" },
  { label: "Users", to: "/users", icon: "manage_accounts", page: "users" },
  { label: "Tags", to: "/tags", icon: "sell", page: "tags" },
  { label: "ACL", to: "/acl", icon: "security", page: "acl" }
];

export function filterNavByTags(tags = [], permissions = null) {
  return NAV_ITEMS.filter((item) => canAccessPage(tags, item.page, permissions));
}

export function defaultRouteForTags(tags = [], permissions = null) {
  const nav = filterNavByTags(tags, permissions);
  return nav[0]?.to || "/login";
}
