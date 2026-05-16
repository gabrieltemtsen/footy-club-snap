import { NextResponse } from "next/server";
import { buildClubRankingSnapshot, getIndexerInfo } from "@/src/lib/ranking-indexer";
import { writeRankingSnapshot } from "@/src/lib/ranking-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await buildClubRankingSnapshot();
  await writeRankingSnapshot(snapshot);

  return NextResponse.json({
    ok: true,
    generatedAt: snapshot.generatedAt,
    indexedMessages: snapshot.source.indexedMessages,
    clubs: Object.values(snapshot.clubs).map((entry) => ({
      club: entry.club.name,
      rankedCasters: entry.leaderboard.length,
      topFid: entry.leaderboard[0]?.fid ?? null,
    })),
    source: getIndexerInfo(),
  });
}

export const POST = GET;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
