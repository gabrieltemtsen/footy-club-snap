import { footballClubs } from "@/src/data/clubs";
import { type ClubRankingSnapshot, type RankedCaster, normalizeClubInput } from "@/src/lib/club-finder";
import { fetchFootballChannelCasts, getSnapchainConfig, type FootballCast } from "@/src/lib/snapchain";

type MutableCasterStats = {
  fid: number;
  username?: string | null;
  displayName?: string | null;
  mentionCount: number;
  uniqueDays: Set<string>;
  lastMentionedAt: string;
  sampleCasts: Array<{
    text: string;
    mentionedAt: string;
  }>;
};

export async function buildClubRankingSnapshot() {
  const maxPages = Number.parseInt(process.env.SNAPCHAIN_MAX_PAGES ?? "10", 10);
  const pageSize = Number.parseInt(process.env.SNAPCHAIN_PAGE_SIZE ?? "100", 10);
  const { casts, source } = await fetchFootballChannelCasts(maxPages, pageSize);
  const recentCasts = casts.filter((cast) => isWithinLastDays(cast.mentionedAt, 7));

  const clubs = Object.fromEntries(
    footballClubs.map((club) => [
      club.slug,
      {
        club,
        leaderboard: buildLeaderboardForClub(club.slug, recentCasts),
      },
    ]),
  );

  const snapshot: ClubRankingSnapshot = {
    generatedAt: new Date().toISOString(),
    source: {
      parentUrl: source.parentUrl,
      snapchainBaseUrl: source.snapchainBaseUrl,
      indexedMessages: recentCasts.length,
    },
    clubs,
  };

  return snapshot;
}

function buildLeaderboardForClub(clubSlug: string, casts: FootballCast[]): RankedCaster[] {
  const club = footballClubs.find((entry) => entry.slug === clubSlug);

  if (!club) {
    return [];
  }

  const stats = new Map<number, MutableCasterStats>();

  for (const cast of casts) {
    const matchCount = countClubMentions(cast.text, club.aliases);

    if (matchCount === 0) {
      continue;
    }

    const existing = stats.get(cast.fid) ?? {
      fid: cast.fid,
      username: cast.username,
      displayName: cast.displayName,
      mentionCount: 0,
      uniqueDays: new Set<string>(),
      lastMentionedAt: cast.mentionedAt,
      sampleCasts: [],
    };

    existing.username = existing.username ?? cast.username;
    existing.displayName = existing.displayName ?? cast.displayName;
    existing.mentionCount += matchCount;
    existing.uniqueDays.add(cast.mentionedAt.slice(0, 10));

    if (new Date(cast.mentionedAt).getTime() > new Date(existing.lastMentionedAt).getTime()) {
      existing.lastMentionedAt = cast.mentionedAt;
    }

    if (existing.sampleCasts.length < 3) {
      existing.sampleCasts.push({
        text: cast.text.slice(0, 180),
        mentionedAt: cast.mentionedAt,
      });
    }

    stats.set(cast.fid, existing);
  }

  return [...stats.values()]
    .map((entry) => {
      const uniqueDaysMentioned = entry.uniqueDays.size;
      const score = entry.mentionCount * 3 + uniqueDaysMentioned * 2 + getRecentMentionBonus(entry.lastMentionedAt);

      return {
        fid: entry.fid,
        username: entry.username,
        displayName: entry.displayName,
        mentionCount: entry.mentionCount,
        uniqueDaysMentioned,
        lastMentionedAt: entry.lastMentionedAt,
        score,
        sampleCasts: entry.sampleCasts,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.mentionCount !== left.mentionCount) {
        return right.mentionCount - left.mentionCount;
      }

      return right.lastMentionedAt.localeCompare(left.lastMentionedAt);
    });
}

function countClubMentions(text: string, aliases: string[]) {
  const normalizedText = normalizeClubInput(text);
  let mentions = 0;

  for (const alias of aliases) {
    const normalizedAlias = normalizeClubInput(alias);

    if (!normalizedAlias) {
      continue;
    }

    const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedAlias)}(?=\\s|$)`, "g");
    const matches = normalizedText.match(pattern);
    mentions += matches?.length ?? 0;
  }

  return mentions;
}

function getRecentMentionBonus(lastMentionedAt: string) {
  const ageMs = Date.now() - new Date(lastMentionedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= 1) {
    return 5;
  }

  if (ageDays <= 3) {
    return 3;
  }

  if (ageDays <= 7) {
    return 1;
  }

  return 0;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWithinLastDays(isoTimestamp: string, days: number) {
  const ageMs = Date.now() - new Date(isoTimestamp).getTime();
  return ageMs <= days * 24 * 60 * 60 * 1000;
}

export function getIndexerInfo() {
  return {
    ...getSnapchainConfig(),
    supportedClubs: footballClubs.map((club) => club.name),
  };
}
