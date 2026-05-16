import { footballClubs, type ClubDefinition } from "@/src/data/clubs";

export type RankedCaster = {
  fid: number;
  username?: string | null;
  displayName?: string | null;
  mentionCount: number;
  uniqueDaysMentioned: number;
  lastMentionedAt: string;
  score: number;
  sampleCasts: Array<{
    text: string;
    mentionedAt: string;
  }>;
};

export type ClubRankingSnapshot = {
  generatedAt: string;
  source: {
    parentUrl: string;
    snapchainBaseUrl: string;
    indexedMessages: number;
  };
  clubs: Record<
    string,
    {
      club: ClubDefinition;
      leaderboard: RankedCaster[];
    }
  >;
};

export function normalizeClubInput(value: string | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

export function findMatchingClubs(rawClub: string | undefined) {
  const query = normalizeClubInput(rawClub);

  if (!query) {
    return footballClubs.slice(0, 6);
  }

  const scored = footballClubs
    .map((club) => {
      const values = [club.name, ...club.aliases].map((value) => normalizeClubInput(value));
      let score = 0;

      for (const value of values) {
        if (value === query) {
          score = Math.max(score, 100);
        } else if (value.startsWith(query)) {
          score = Math.max(score, 75);
        } else if (value.includes(query) || query.includes(value)) {
          score = Math.max(score, 50);
        }
      }

      return { club, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.club.name.localeCompare(right.club.name));

  return scored.slice(0, 6).map((entry) => entry.club);
}

export function getClubBySlug(slug: string | null) {
  if (!slug) {
    return null;
  }

  return footballClubs.find((club) => club.slug === slug) ?? null;
}

export function getClubShareText(clubName: string) {
  return `Top ${clubName} casters are heating up /football. Come see the ranking.`;
}

export function getFriendlyBanter(clubName: string, caster: RankedCaster) {
  const handle = caster.username?.trim() || caster.displayName?.trim() || `FID ${caster.fid}`;
  return `${handle} is on the ${clubName} rankings in /football. Friendly football banter only: are they speaking facts or just making noise today?`;
}

export function getCasterLabel(clubName: string, caster: RankedCaster) {
  if (caster.score >= 25) {
    return `Loud ${clubName} fan`;
  }

  if (caster.score >= 12) {
    return `Active ${clubName} talker`;
  }

  return `${clubName} mentioner`;
}
