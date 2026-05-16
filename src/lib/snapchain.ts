const SNAPCHAIN_BASE_URL = "http://153.75.248.217:3381/v1";
const FOOTBALL_PARENT_URL = "https://farcaster.xyz/~/channel/football";

type SnapchainMessagesResponse = {
  messages?: unknown[];
  nextPageToken?: string | null;
};

export type FootballCast = {
  fid: number;
  text: string;
  mentionedAt: string;
  username?: string | null;
  displayName?: string | null;
};

export async function fetchFootballChannelCasts(maxPages = 10, pageSize = 100) {
  const collected: FootballCast[] = [];
  let pageToken: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(`${SNAPCHAIN_BASE_URL}/castsByParent`);
    url.searchParams.set("url", FOOTBALL_PARENT_URL);
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("reverse", "true");

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Snapchain casts: ${response.status}`);
    }

    const payload = (await response.json()) as SnapchainMessagesResponse;
    const messages = payload.messages ?? [];

    if (messages.length === 0) {
      break;
    }

    for (const message of messages) {
      const cast = coerceFootballCast(message);

      if (cast) {
        collected.push(cast);
      }
    }

    if (!payload.nextPageToken || payload.nextPageToken === pageToken) {
      break;
    }

    pageToken = payload.nextPageToken;
  }

  return {
    casts: collected,
    source: {
      parentUrl: FOOTBALL_PARENT_URL,
      snapchainBaseUrl: SNAPCHAIN_BASE_URL,
    },
  };
}

function coerceFootballCast(message: unknown): FootballCast | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const fid = readNumber(message, [
    ["data", "fid"],
    ["fid"],
    ["message", "data", "fid"],
    ["cast", "fid"],
  ]);

  const text = readString(message, [
    ["data", "castAddBody", "text"],
    ["castAddBody", "text"],
    ["text"],
    ["message", "data", "castAddBody", "text"],
  ]);

  const mentionedAt =
    readString(message, [
      ["data", "timestamp"],
      ["timestamp"],
      ["message", "data", "timestamp"],
      ["createdAt"],
    ]) ?? new Date().toISOString();

  if (!fid || !text) {
    return null;
  }

  return {
    fid,
    text,
    mentionedAt: normalizeTimestamp(mentionedAt),
    username: readString(message, [["username"], ["author", "username"], ["data", "username"]]),
    displayName: readString(message, [["displayName"], ["author", "displayName"], ["data", "displayName"]]),
  };
}

function normalizeTimestamp(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString();
}

function readString(value: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    const result = getPath(value, path);

    if (typeof result === "string" && result.trim()) {
      return result;
    }
  }

  return null;
}

function readNumber(value: unknown, paths: string[][]): number | null {
  for (const path of paths) {
    const result = getPath(value, path);

    if (typeof result === "number" && Number.isFinite(result)) {
      return result;
    }

    if (typeof result === "string") {
      const parsed = Number.parseInt(result, 10);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function getPath(value: unknown, path: string[]) {
  let current: unknown = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function getSnapchainConfig() {
  return {
    baseUrl: SNAPCHAIN_BASE_URL,
    parentUrl: FOOTBALL_PARENT_URL,
  };
}
