import { clubs, supporters, type Supporter } from "@/src/data/supporters";

const SUPPORTERS_PER_PAGE = 3;

export function normalizeClubInput(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function findMatchingClubs(rawClub: string | undefined) {
  const query = normalizeClubInput(rawClub);

  if (!query) {
    return clubs.slice(0, 6);
  }

  return clubs.filter((club) => {
    const haystacks = [club.name.toLowerCase(), club.slug, ...club.aliases.map((alias) => alias.toLowerCase())];
    return haystacks.some((value) => value.includes(query) || query.includes(value));
  });
}

export function getClubBySlug(slug: string | null) {
  if (!slug) {
    return null;
  }

  return clubs.find((club) => club.slug === slug) ?? null;
}

export function getSupportersByClub(slug: string) {
  return supporters.filter((supporter) => supporter.clubSlug === slug);
}

export function paginateSupporters(items: Supporter[], pageRaw: string | null) {
  const requestedPage = Number.parseInt(pageRaw ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(items.length / SUPPORTERS_PER_PAGE));
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;

  const startIndex = (page - 1) * SUPPORTERS_PER_PAGE;

  return {
    page,
    totalPages,
    visibleSupporters: items.slice(startIndex, startIndex + SUPPORTERS_PER_PAGE),
  };
}

export function getDisplayHandle(supporter: Supporter) {
  return supporter.displayName ?? supporter.username;
}

export function getFriendlyBanter(clubName: string, supporter?: Supporter) {
  const opener = supporter
    ? `Found ${getDisplayHandle(supporter)} on Club Finder.`
    : `Found the ${clubName} crowd on Club Finder.`;

  return `${opener} Friendly football terms only: who is carrying this club right now?`;
}

export function getShareText(clubName: string) {
  return `I found ${clubName} fans on Farcaster. Come find your club people.`;
}
