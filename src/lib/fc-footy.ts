const FC_FOOTY_BASE_URL = "https://fc-footy.vercel.app";
const SUPPORTERS_PER_PAGE = 3;

export type FootyClub = {
  teamId: string;
  name: string;
  abbreviation?: string | null;
  leagueId?: string | null;
  leagueName?: string | null;
  logoUrl?: string | null;
  roomHash?: string | null;
  type: "club" | "country" | "all" | string;
};

export type FootySupporter = {
  fid: number;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
  primaryTeamId?: string | null;
  supportsTargetAsPrimary?: boolean | null;
};

type ClubsResponse = {
  clubs: FootyClub[];
};

type SupportersResponse = {
  supporters: FootySupporter[];
};

export async function fetchClubs() {
  const response = await fetch(`${FC_FOOTY_BASE_URL}/api/fanclubs/clubs`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch clubs: ${response.status}`);
  }

  const payload = (await response.json()) as ClubsResponse;
  return payload.clubs;
}

export async function fetchSupporters(teamId: string, primaryOnly = true) {
  const searchParams = new URLSearchParams({
    teamId,
    primaryOnly: primaryOnly ? "true" : "false",
    includePreferences: "false",
  });

  const response = await fetch(`${FC_FOOTY_BASE_URL}/api/fanclubs/supporters?${searchParams.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch supporters: ${response.status}`);
  }

  const payload = (await response.json()) as SupportersResponse;
  return payload.supporters;
}

export function normalizeSearchTerm(value: string | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

export function findClubByTeamId(clubs: FootyClub[], teamId: string | null) {
  if (!teamId) {
    return null;
  }

  return clubs.find((club) => club.teamId === teamId) ?? null;
}

export function rankClubMatches(clubs: FootyClub[], rawQuery: string | undefined) {
  const query = normalizeSearchTerm(rawQuery);

  if (!query) {
    return clubs.slice(0, 6);
  }

  const scored = clubs
    .map((club) => {
      const normalizedName = normalizeSearchTerm(club.name);
      const normalizedAbbreviation = normalizeSearchTerm(club.abbreviation ?? "");
      const normalizedLeagueName = normalizeSearchTerm(club.leagueName ?? "");
      const normalizedLeagueId = normalizeSearchTerm(club.leagueId ?? "");

      let score = 0;

      if (normalizedName === query) {
        score += 120;
      }

      if (normalizedAbbreviation && normalizedAbbreviation === query) {
        score += 100;
      }

      if (normalizedName.startsWith(query)) {
        score += 80;
      }

      if (normalizedName.includes(query)) {
        score += 60;
      }

      if (normalizedAbbreviation && normalizedAbbreviation.includes(query)) {
        score += 50;
      }

      if (query.includes(normalizedName) && normalizedName.length > 2) {
        score += 40;
      }

      if (query.includes(normalizedAbbreviation) && normalizedAbbreviation.length > 1) {
        score += 30;
      }

      const queryTokens = query.split(" ");
      const nameTokens = normalizedName.split(" ");
      const sharedTokenCount = queryTokens.filter((token) => token && nameTokens.includes(token)).length;
      score += sharedTokenCount * 10;

      if (normalizedLeagueName && query.includes(normalizedLeagueName)) {
        score += 8;
      }

      if (normalizedLeagueId && query.includes(normalizedLeagueId)) {
        score += 6;
      }

      return { club, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.club.name.localeCompare(right.club.name);
    });

  return scored.slice(0, 6).map((item) => item.club);
}

export function paginateSupporters(items: FootySupporter[], pageRaw: string | null) {
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

export function getPreferredHandle(supporter: FootySupporter) {
  return supporter.username?.trim() || supporter.displayName?.trim() || `FID ${supporter.fid}`;
}

export function getShareText(clubName: string) {
  return `I found ${clubName} fans on Farcaster. Come find your club people.`;
}

export function getFriendlyBanter(clubName: string, supporter: FootySupporter) {
  return `Found ${getPreferredHandle(supporter)} in the ${clubName} fan club. Friendly football banter only: are they title-chasing or just talking big?`;
}
