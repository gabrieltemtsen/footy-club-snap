import "@farcaster/snap";
import { registerSnapHandler } from "@farcaster/snap-hono";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  fetchClubs,
  fetchSupporters,
  findClubByTeamId,
  getFriendlyBanter,
  getPreferredHandle,
  getShareText,
  paginateSupporters,
  rankClubMatches,
  type FootyClub,
} from "@/src/lib/club-finder";
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
      return buildClubFansPage(baseUrl, url.searchParams.get("club"), url.searchParams.get("page"));
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
    title: text("Find Your Club Fans", "bold"),
    description: text("Search a club and discover Farcaster fans to follow or banter.", "regular", "secondary"),
    clubInput: input("club", "Club name", "Arsenal, Barca, Man Utd..."),
    actions: stack(["searchButton"]),
  };

  addButtons(elements, [
    {
      id: "searchButton",
      label: "Search Club",
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

async function buildSearchResultsPage(baseUrl: string, rawClub: string) {
  try {
    const clubs = await fetchClubs();
    const matches = rankClubMatches(clubs, rawClub);
    const buttonIds = matches.map((club) => `club-${club.teamId}`);
    const subtitle = matches.length
      ? `Showing matches for "${rawClub || "popular clubs"}".`
      : `No confident match for "${rawClub}". Try one of these.`;

    const elements: Record<string, ElementNode> = {
      title: text("Choose a club", "bold"),
      subtitle: text(subtitle, "regular", "secondary"),
      clubButtons: stack(buttonIds),
      footerButtons: stack(["backButton"]),
    };

    addButtons(elements, [
      ...matches.map((club, index) => {
        const variant: "primary" | "secondary" = index === 0 ? "primary" : "secondary";
        const clubLabel = getClubButtonLabel(club);

        return {
          id: `club-${club.teamId}`,
          label: clubLabel,
          variant,
          action: {
            action: "submit",
            params: {
              target: `${baseUrl}/api/snap?action=club&club=${encodeURIComponent(club.teamId)}`,
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
  } catch {
    return buildErrorPage(baseUrl, "Could not load clubs right now. Try again in a moment.");
  }
}

async function buildClubFansPage(baseUrl: string, teamId: string | null, pageRaw: string | null) {
  try {
    const clubs = await fetchClubs();
    const club = findClubByTeamId(clubs, teamId);

    if (!club) {
      return buildErrorPage(baseUrl, "That club could not be resolved. Go back and search again.");
    }

    const allSupporters = await fetchSupporters(club.teamId, true);
    const { page, totalPages, visibleSupporters } = paginateSupporters(allSupporters, pageRaw);

    const supporterCardIds = visibleSupporters.map((supporter) => `fan-card-${supporter.fid}`);
    const actionRowIds = ["backButton", "shareButton"];

    if (page > 1) {
      actionRowIds.unshift("prevButton");
    }

    if (page < totalPages) {
      actionRowIds.push("nextButton");
    }

    const elements: Record<string, ElementNode> = {
      title: text(club.name, "bold"),
      summary: text(`${allSupporters.length} primary supporters found on FC Footy.`, "regular", "secondary"),
      supportersList: stack(supporterCardIds),
      pagination: text(`Page ${page} of ${totalPages}`, "regular", "secondary"),
      actions: stack(actionRowIds),
    };

    visibleSupporters.forEach((supporter) => {
      const cardId = `fan-card-${supporter.fid}`;
      const labelId = `${cardId}-label`;
      const buttonsId = `${cardId}-buttons`;
      const viewId = `${cardId}-view`;
      const banterId = `${cardId}-banter`;

      elements[labelId] = text(
        `${getPreferredHandle(supporter)} · FID ${supporter.fid} · ${club.name} fan`,
        "regular",
      );
      elements[buttonsId] = stack([viewId, banterId], "horizontal");
      elements[cardId] = stack([labelId, buttonsId]);

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
          label: "Banter Cast",
          icon: "message-circle",
          action: {
            action: "compose_cast",
            params: {
              text: getFriendlyBanter(club.name, supporter),
            },
          },
        },
      ]);
    });

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
      {
        id: "shareButton",
        label: "Share",
        icon: "share",
        action: {
          action: "compose_cast",
          params: {
            text: getShareText(club.name),
            embeds: [`${baseUrl}/api/snap`],
          },
        },
      },
      {
        id: "prevButton",
        label: "Prev",
        action: {
          action: "submit",
          params: {
            target: `${baseUrl}/api/snap?action=club&club=${encodeURIComponent(club.teamId)}&page=${page - 1}`,
          },
        },
      },
      {
        id: "nextButton",
        label: "Next",
        variant: "primary",
        action: {
          action: "submit",
          params: {
            target: `${baseUrl}/api/snap?action=club&club=${encodeURIComponent(club.teamId)}&page=${page + 1}`,
          },
        },
      },
    ]);

    if (visibleSupporters.length === 0) {
      elements.supportersList = stack(["emptyState"]);
      elements.emptyState = text("No primary Farcaster supporters found for this club yet.", "regular", "secondary");
    }

    return createPage(elements, ["title", "summary", "supportersList", "pagination", "actions"]);
  } catch {
    return buildErrorPage(baseUrl, "Could not load supporters right now. Try again in a moment.");
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

function getClubButtonLabel(club: FootyClub) {
  if (club.leagueName) {
    return `${club.name} · ${club.leagueName}`;
  }

  return club.name;
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

  const origin = new URL(requestUrl).origin;
  const isLocalhost =
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1") ||
    origin.startsWith("http://[::1]") ||
    origin.startsWith("https://localhost") ||
    origin.startsWith("https://127.0.0.1") ||
    origin.startsWith("https://[::1]");

  return isLocalhost ? origin : origin.replace(/\/+$/, "");
}
