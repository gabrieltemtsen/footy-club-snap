import "@farcaster/snap";
import { registerSnapHandler } from "@farcaster/snap-hono";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import {
  findMatchingClubs,
  getClubBySlug,
  getFriendlyBanter,
  getShareText,
  getSupportersByClub,
  paginateSupporters,
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

function buildSearchResultsPage(baseUrl: string, rawClub: string) {
  const matches = findMatchingClubs(rawClub);
  const buttonIds = matches.slice(0, 6).map((club) => `club-${club.slug}`);
  const elements: Record<string, ElementNode> = {
    title: text("Choose a club", "bold"),
    subtitle: text(
      matches.length
        ? `Showing matches for "${rawClub || "popular clubs"}".`
        : `No exact match for "${rawClub}". Try one of these.`,
      "regular",
      "secondary",
    ),
    clubButtons: stack(buttonIds),
    footerButtons: stack(["backButton"]),
  };

  addButtons(elements, [
    ...matches.slice(0, 6).map((club, index) => {
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

function buildClubFansPage(baseUrl: string, clubSlug: string | null, pageRaw: string | null) {
  const club = getClubBySlug(clubSlug);

  if (!club) {
    return buildSearchResultsPage(baseUrl, "");
  }

  const allSupporters = getSupportersByClub(club.slug);
  const { page, totalPages, visibleSupporters } = paginateSupporters(allSupporters, pageRaw);

  const elements: Record<string, ElementNode> = {
    title: text(club.name, "bold"),
    summary: text(`${allSupporters.length} known fans in the local Footy dataset.`, "regular", "secondary"),
  };

  const rootChildren = ["title", "summary"];

  visibleSupporters.forEach((supporter, index) => {
    const rowId = `fan-${supporter.fid}`;
    const metaId = `${rowId}-meta`;
    const buttonsId = `${rowId}-buttons`;
    const viewId = `${rowId}-view`;
    const banterId = `${rowId}-banter`;

    elements[rowId] = text(
      `${supporter.displayName ?? supporter.username} · FID ${supporter.fid} · ${club.name} fan`,
      "regular",
    );
    elements[buttonsId] = stack([viewId, banterId], "horizontal");

    addButtons(elements, [
      {
        id: viewId,
        label: "View",
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
            text: getFriendlyBanter(club.name, supporter),
          },
        },
      },
    ]);

    rootChildren.push(rowId, buttonsId);

    if (index < visibleSupporters.length - 1) {
      elements[metaId] = text(" ", "regular", "secondary");
      rootChildren.push(metaId);
    }
  });

  elements.pagination = text(`Page ${page} of ${totalPages}`, "regular", "secondary");
  rootChildren.push("pagination");

  const actionRowIds = ["backButton", "shareButton"];

  if (page > 1) {
    actionRowIds.unshift("prevButton");
  }

  if (page < totalPages) {
    actionRowIds.push("nextButton");
  }

  elements.actions = stack(actionRowIds);
  rootChildren.push("actions");

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
          target: `${baseUrl}/api/snap?action=club&club=${club.slug}&page=${page - 1}`,
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
          target: `${baseUrl}/api/snap?action=club&club=${club.slug}&page=${page + 1}`,
        },
      },
    },
  ]);

  return createPage(elements, rootChildren);
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
