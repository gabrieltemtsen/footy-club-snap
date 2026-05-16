import "@farcaster/snap";
import { registerSnapHandler } from "@farcaster/snap-hono";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  findMatchingClubs,
  getCasterLabel,
  getClubBySlug,
  getClubShareText,
  getFriendlyBanter,
  paginateClubItems,
} from "@/src/lib/club-finder";
import { fetchPrimarySupporters, getPreferredSupporterHandle } from "@/src/lib/fc-footy";
import { readRankingSnapshot } from "@/src/lib/ranking-store";
import { addButtons, createPage, input, stack, text, type ElementNode } from "@/src/lib/snap-ui";

const app = new Hono().basePath("/api/snap");

registerSnapHandler(
  app,
  async (ctx) => {
    const url = new URL(ctx.request.url);
    const action = url.searchParams.get("action");
    const baseUrl = getBaseUrl(ctx.request.url);

    if (ctx.action.type === "get" || action === "back" || action === null) {
      return buildHomePage(baseUrl);
    }

    if (action === "search") {
      const rawClub = readClubInput(ctx.action.inputs);
      return buildSearchResultsPage(baseUrl, rawClub);
    }

    if (action === "club") {
      return buildClubLeaderboardPage(baseUrl, url.searchParams.get("club"), url.searchParams.get("page"));
    }

    return buildHomePage(baseUrl);
  },
  {
    skipJFSVerification: process.env.SKIP_JFS_VERIFICATION === "1",
  },
);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(app);
export const POST = handle(app);

function buildHomePage(baseUrl: string) {
  const elements = {
    title: text("Find Your Club Casters", "bold"),
    description: text("Search a club and see who talks about them most in /football.", "regular", "secondary"),
    clubInput: input("club", "Search club", "Arsenal, Chelsea, Barca..."),
    actions: stack(["searchButton"]),
  };

  addButtons(elements, [
    {
      id: "searchButton",
      label: "Search",
      variant: "primary",
      action: {
        action: "submit",
        params: {
          target: `${baseUrl}/api/snap?action=search`,
        },
      },
    },
  ]);

  return createPage(elements, ["title", "description", "clubInput", "actions"]);
}

function buildSearchResultsPage(baseUrl: string, rawClub: string) {
  const matches = findMatchingClubs(rawClub);
  const buttonIds = matches.map((club) => `club-${club.slug}`);

  const elements: Record<string, ElementNode> = {
    title: text("Choose a club", "bold"),
    subtitle: text(
      matches.length
        ? `Showing matches for "${rawClub || "popular clubs"}".`
        : `No confident match for "${rawClub}". Try one of these.`,
      "regular",
      "secondary",
    ),
    clubButtons: stack(buttonIds),
    footerButtons: stack(["backButton"]),
  };

  addButtons(elements, [
    ...matches.map((club, index) => {
      const variant: "primary" | "secondary" = index === 0 ? "primary" : "secondary";

      return {
        id: `club-${club.slug}`,
        label: club.name,
        variant,
        action: {
          action: "submit",
          params: {
            target: `${baseUrl}/api/snap?action=club&club=${club.slug}`,
          },
        },
      };
    }),
    {
      id: "backButton",
      label: "Back",
      action: {
        action: "submit",
        params: {
          target: `${baseUrl}/api/snap?action=back`,
        },
      },
    },
  ]);

  return createPage(elements, ["title", "subtitle", "clubButtons", "footerButtons"]);
}

async function buildClubLeaderboardPage(baseUrl: string, clubSlug: string | null, pageRaw: string | null) {
  const club = getClubBySlug(clubSlug);

  if (!club) {
    return buildErrorPage(baseUrl, "That club could not be resolved. Go back and search again.");
  }

  const snapshot = await readRankingSnapshot();
  const ranking = snapshot?.clubs[club.slug];

  if (!ranking || ranking.leaderboard.length === 0) {
    return buildSupporterFallbackPage(baseUrl, club.name, club.teamId, club.slug, pageRaw);
  }

  const { page, totalPages, visibleItems } = paginateClubItems(ranking.leaderboard, pageRaw);
  const topCasters = visibleItems;
  const cardIds = topCasters.map((caster) => `caster-${caster.fid}`);
  const actionIds = ["shareButton", "backButton"];

  if (page > 1) {
    actionIds.unshift("prevButton");
  }

  if (page < totalPages) {
    actionIds.unshift("nextButton");
  }

  const elements: Record<string, ElementNode> = {
    title: text(`Top ${club.name} Casters in /football`, "bold"),
    summary: text(
      `${topCasters.length} of ${ranking.leaderboard.length} ranked casters · page ${page}/${totalPages} · updated ${formatRelative(snapshot.generatedAt)}`,
      "regular",
      "secondary",
    ),
    leaderboard: stack(cardIds),
    actions: stack(actionIds),
  };

  for (const caster of topCasters) {
    const cardId = `caster-${caster.fid}`;
    const labelId = `${cardId}-label`;
    const statId = `${cardId}-stats`;
    const buttonsId = `${cardId}-buttons`;
    const viewId = `${cardId}-view`;
    const banterId = `${cardId}-banter`;
    const handle = caster.username?.trim() || caster.displayName?.trim() || `FID ${caster.fid}`;

    elements[labelId] = text(`${handle} · FID ${caster.fid} · ${getCasterLabel(club.name, caster)}`, "regular");
    elements[statId] = text(`${caster.mentionCount} mentions · score ${caster.score}`, "regular", "secondary");
    elements[buttonsId] = stack([viewId, banterId], "horizontal");
    elements[cardId] = stack([labelId, statId, buttonsId]);

    addButtons(elements, [
      {
        id: viewId,
        label: "View Profile",
        icon: "user",
        action: {
          action: "view_profile",
          params: {
            fid: caster.fid,
          },
        },
      },
      {
        id: banterId,
        label: "Banter",
        icon: "message-circle",
        action: {
          action: "compose_cast",
          params: {
            text: getFriendlyBanter(club.name, caster),
          },
        },
      },
    ]);
  }

  if (topCasters.length === 0) {
    elements.leaderboard = stack(["emptyState"]);
    elements.emptyState = text("No ranked casters found for this club yet.", "regular", "secondary");
  }

  addButtons(elements, [
    {
      id: "nextButton",
      label: "Next",
      action: {
        action: "submit",
        params: {
          target: `${baseUrl}/api/snap?action=club&club=${club.slug}&page=${page + 1}`,
        },
      },
    },
    {
      id: "prevButton",
      label: "Prev",
      action: {
        action: "submit",
        params: {
          target: `${baseUrl}/api/snap?action=club&club=${club.slug}&page=${page - 1}`,
        },
      },
    },
    {
      id: "shareButton",
      label: "Share Ranking",
      variant: "primary",
      icon: "share",
      action: {
        action: "compose_cast",
        params: {
          text: getClubShareText(club.name),
          embeds: [`${baseUrl}/api/snap`],
        },
      },
    },
    {
      id: "backButton",
      label: "Back",
      action: {
        action: "submit",
        params: {
          target: `${baseUrl}/api/snap?action=back`,
        },
      },
    },
  ]);

  return createPage(elements, ["title", "summary", "leaderboard", "actions"]);
}

async function buildSupporterFallbackPage(
  baseUrl: string,
  clubName: string,
  teamId: string,
  clubSlug: string,
  pageRaw: string | null,
) {
  try {
    const allSupporters = await fetchPrimarySupporters(teamId);
    const { page, totalPages, visibleItems } = paginateClubItems(allSupporters, pageRaw);
    const supporters = visibleItems;
    const cardIds = supporters.map((supporter) => `supporter-${supporter.fid}`);
    const actionIds = ["shareButton", "backButton"];

    if (page > 1) {
      actionIds.unshift("prevButton");
    }

    if (page < totalPages) {
      actionIds.unshift("nextButton");
    }

    const elements: Record<string, ElementNode> = {
      title: text(`${clubName} Fans`, "bold"),
      summary: text(
        supporters.length
          ? `Showing primary FC Footy supporters while rankings warm up · page ${page}/${totalPages}.`
          : `No primary FC Footy supporters found right now.`,
        "regular",
        "secondary",
      ),
      leaderboard: stack(cardIds.length ? cardIds : ["emptyState"]),
      actions: stack(actionIds),
    };

    for (const supporter of supporters) {
      const cardId = `supporter-${supporter.fid}`;
      const labelId = `${cardId}-label`;
      const statId = `${cardId}-stats`;
      const buttonsId = `${cardId}-buttons`;
      const viewId = `${cardId}-view`;
      const banterId = `${cardId}-banter`;
      const handle = getPreferredSupporterHandle(supporter);

      elements[labelId] = text(`${handle} · FID ${supporter.fid} · ${clubName} fan`, "regular");
      elements[statId] = text("Primary supporter fallback", "regular", "secondary");
      elements[buttonsId] = stack([viewId, banterId], "horizontal");
      elements[cardId] = stack([labelId, statId, buttonsId]);

      addButtons(elements, [
        {
          id: viewId,
          label: "View Profile",
          icon: "user",
          action: {
            action: "view_profile",
            params: {
              fid: supporter.fid,
            },
          },
        },
        {
          id: banterId,
          label: "Banter",
          icon: "message-circle",
          action: {
            action: "compose_cast",
            params: {
              text: `${handle} is repping ${clubName}. Friendly football banter only: is the fanbase cooking or coping today?`,
            },
          },
        },
      ]);
    }

    if (supporters.length === 0) {
      elements.emptyState = text("Rankings are warming up and no fallback supporters were found yet.", "regular", "secondary");
    }

    addButtons(elements, [
      {
        id: "nextButton",
        label: "Next",
        action: {
          action: "submit",
          params: {
            target: `${baseUrl}/api/snap?action=club&club=${clubSlug}&page=${page + 1}`,
          },
        },
      },
      {
        id: "prevButton",
        label: "Prev",
        action: {
          action: "submit",
          params: {
            target: `${baseUrl}/api/snap?action=club&club=${clubSlug}&page=${page - 1}`,
          },
        },
      },
      {
        id: "shareButton",
        label: "Share",
        variant: "primary",
        icon: "share",
        action: {
          action: "compose_cast",
          params: {
            text: getClubShareText(clubName),
            embeds: [`${baseUrl}/api/snap`],
          },
        },
      },
      {
        id: "backButton",
        label: "Back",
        action: {
          action: "submit",
          params: {
            target: `${baseUrl}/api/snap?action=back`,
          },
        },
      },
    ]);

    return createPage(elements, ["title", "summary", "leaderboard", "actions"]);
  } catch {
    return buildErrorPage(baseUrl, "Rankings are warming up and fallback supporters could not be loaded.");
  }
}

function buildErrorPage(baseUrl: string, message: string) {
  const elements: Record<string, ElementNode> = {
    title: text("Club Finder", "bold"),
    message: text(message, "regular", "secondary"),
    actions: stack(["backButton"]),
  };

  addButtons(elements, [
    {
      id: "backButton",
      label: "Back",
      action: {
        action: "submit",
        params: {
          target: `${baseUrl}/api/snap?action=back`,
        },
      },
    },
  ]);

  return createPage(elements, ["title", "message", "actions"]);
}

function readClubInput(inputs: unknown): string {
  if (!inputs || typeof inputs !== "object") {
    return "";
  }

  const value = (inputs as Record<string, unknown>).club;
  return typeof value === "string" ? value : "";
}

function getBaseUrl(requestUrl: string) {
  const configuredBaseUrl = process.env.SNAP_PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return new URL(requestUrl).origin.replace(/\/+$/, "");
}

function formatRelative(isoTimestamp: string) {
  const ageMs = Date.now() - new Date(isoTimestamp).getTime();
  const ageMinutes = Math.max(1, Math.round(ageMs / (1000 * 60)));

  if (ageMinutes < 60) {
    return `${ageMinutes}m ago`;
  }

  const ageHours = Math.round(ageMinutes / 60);

  if (ageHours < 24) {
    return `${ageHours}h ago`;
  }

  return `${Math.round(ageHours / 24)}d ago`;
}
