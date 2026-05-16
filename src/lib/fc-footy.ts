const FC_FOOTY_BASE_URL = "https://fc-footy.vercel.app";

export type FootySupporter = {
  fid: number;
  username?: string | null;
  displayName?: string | null;
  primaryTeamId?: string | null;
  supportsTargetAsPrimary?: boolean | null;
};

type SupportersResponse = {
  supporters: FootySupporter[];
};

export async function fetchPrimarySupporters(teamId: string) {
  const searchParams = new URLSearchParams({
    teamId,
    primaryOnly: "true",
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

export function getPreferredSupporterHandle(supporter: FootySupporter) {
  return supporter.username?.trim() || supporter.displayName?.trim() || `FID ${supporter.fid}`;
}
