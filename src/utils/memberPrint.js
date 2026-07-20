export function getMembersPrintUrl({ tags } = {}) {
  const base = "/members/print";
  if (!tags?.length) return base;

  const params = new URLSearchParams();
  tags.forEach((tag) => params.append("tag", tag));
  return `${base}?${params.toString()}`;
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

  const sortMembers = (rows) =>
    [...rows].sort((a, b) => {
      const last = (a.lastName || "").localeCompare(b.lastName || "");
      if (last !== 0) return last;
      return (a.firstName || "").localeCompare(b.firstName || "");
    });

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
