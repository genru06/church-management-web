export const USER_TAGS = {
  SUPER_USER: "Super User",
  EXECUTIVE_PASTOR: "Executive Pastor",
  PASTOR: "Pastor",
  LIFE_COACH: "Life Coach",
  MAIN_CHURCH_ADMIN: "Main Church Admin"
};

export const ALL_USER_TAGS = Object.values(USER_TAGS);

export const FULL_ACCESS_TAGS = [
  USER_TAGS.SUPER_USER,
  USER_TAGS.EXECUTIVE_PASTOR,
  USER_TAGS.MAIN_CHURCH_ADMIN
];

export function hasFullAccess(tags = []) {
  return tags.some((t) => FULL_ACCESS_TAGS.includes(t));
}

export function hasAnyTag(tags = [], required = []) {
  if (hasFullAccess(tags)) return true;
  return required.some((r) => tags.includes(r));
}

export function canManageUsers(tags = []) {
  return hasAnyTag(tags, FULL_ACCESS_TAGS);
}

export const PAGE_PERMISSIONS = {
  dashboard: ALL_USER_TAGS,
  members: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN, USER_TAGS.PASTOR, USER_TAGS.LIFE_COACH],
  churches: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN, USER_TAGS.PASTOR],
  lifegroups: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN, USER_TAGS.PASTOR, USER_TAGS.LIFE_COACH],
  events: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN, USER_TAGS.PASTOR],
  operations: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN],
  attendance: [USER_TAGS.SUPER_USER, USER_TAGS.EXECUTIVE_PASTOR, USER_TAGS.MAIN_CHURCH_ADMIN, USER_TAGS.PASTOR, USER_TAGS.LIFE_COACH],
  users: FULL_ACCESS_TAGS
};

export function canAccessPage(tags = [], page) {
  const required = PAGE_PERMISSIONS[page];
  if (!required) return false;
  return hasAnyTag(tags, required);
}

export function primaryTagLabel(tags = []) {
  if (!tags.length) return "No Access";
  const priority = [
    USER_TAGS.SUPER_USER,
    USER_TAGS.EXECUTIVE_PASTOR,
    USER_TAGS.MAIN_CHURCH_ADMIN,
    USER_TAGS.PASTOR,
    USER_TAGS.LIFE_COACH
  ];
  for (const tag of priority) {
    if (tags.includes(tag)) return tag;
  }
  return tags[0];
}

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: "dashboard", page: "dashboard" },
  { label: "Members", to: "/members", icon: "badge", page: "members" },
  { label: "Churches", to: "/churches", icon: "church", page: "churches" },
  { label: "LifeGroups", to: "/lifegroups", icon: "hub", page: "lifegroups" },
  { label: "Events", to: "/events", icon: "event", page: "events" },
  { label: "Operations", to: "/operations", icon: "account_balance", page: "operations" },
  { label: "Attendance", to: "/attendance", icon: "event_available", page: "attendance" },
  { label: "Users", to: "/users", icon: "manage_accounts", page: "users" }
];

export function filterNavByTags(tags = []) {
  return NAV_ITEMS.filter((item) => canAccessPage(tags, item.page));
}

export function defaultRouteForTags(tags = []) {
  const nav = filterNavByTags(tags);
  return nav[0]?.to || "/login";
}
