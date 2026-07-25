export const LIFEGROUP_FILTER_TAG = "lifegroup";

export function isLifeGroupFilterTag(tag) {
  return String(tag || "").trim().toLowerCase() === LIFEGROUP_FILTER_TAG;
}

export function hasLifeGroupFilterTag(tags = []) {
  return (tags || []).some(isLifeGroupFilterTag);
}

export function tagsForMemberApi(tags = []) {
  return (tags || []).filter((tag) => !isLifeGroupFilterTag(tag));
}

export function getMembersPrintUrl({ tags, lifeGroupId } = {}) {
  const params = new URLSearchParams();
  (tags || []).forEach((tag) => params.append("tag", tag));
  if (lifeGroupId != null && lifeGroupId !== "") {
    params.set("lifeGroupId", String(lifeGroupId));
  }
  const query = params.toString();
  return query ? `/members/print?${query}` : "/members/print";
}

function sortMembers(rows) {
  return [...rows].sort((a, b) => {
    const last = (a.lastName || "").localeCompare(b.lastName || "");
    if (last !== 0) return last;
    return (a.firstName || "").localeCompare(b.firstName || "");
  });
}

export function groupMembersByLifeGroup(members, { lifeGroupName } = {}) {
  const title = lifeGroupName || "LifeGroup";
  return [
    {
      key: `lifegroup:${String(title).toLowerCase()}`,
      tagName: title,
      members: sortMembers(members)
    }
  ].filter((group) => group.members.length);
}

export function groupMembersByTag(members, { tagFilter = [], allTagNames = [] } = {}) {
  const filterSet = new Set(tagFilter.map((tag) => String(tag).toLowerCase()));
  const hasFilter = filterSet.size > 0;

  const tagNames = hasFilter
    ? [...filterSet].map((key) => {
        const fromAll = allTagNames.find((name) => name.toLowerCase() === key);
        const fromMember = members
          .flatMap((member) => member.tags || [])
          .find((name) => name.toLowerCase() === key);
        return fromAll || fromMember || key;
      })
    : [...allTagNames].sort((a, b) => a.localeCompare(b));

  const seenTagKeys = new Set();
  const orderedTags = [];

  tagNames.forEach((name) => {
    const key = String(name).toLowerCase();
    if (seenTagKeys.has(key)) return;
    seenTagKeys.add(key);
    orderedTags.push(name);
  });

  if (!hasFilter) {
    members.forEach((member) => {
      (member.tags || []).forEach((name) => {
        const key = String(name).toLowerCase();
        if (seenTagKeys.has(key)) return;
        seenTagKeys.add(key);
        orderedTags.push(name);
      });
    });
    orderedTags.sort((a, b) => a.localeCompare(b));
  }

  const groups = orderedTags.map((tagName) => {
    const key = tagName.toLowerCase();
    const rows = members.filter((member) =>
      (member.tags || []).some((tag) => String(tag).toLowerCase() === key)
    );
    return {
      key,
      tagName,
      members: sortMembers(rows)
    };
  }).filter((group) => group.members.length);

  if (!hasFilter) {
    const untagged = sortMembers(
      members.filter((member) => !(member.tags || []).length)
    );
    if (untagged.length) {
      groups.push({
        key: "untagged",
        tagName: "Untagged",
        members: untagged
      });
    }
  }

  return groups;
}
