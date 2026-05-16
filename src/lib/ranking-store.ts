import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { type ClubRankingSnapshot } from "@/src/lib/club-finder";

const SNAPSHOT_KEY = "club-finder:football-rankings:snapshot";
const LOCAL_SNAPSHOT_PATH = path.join("/tmp", "club-finder-football-rankings.json");

type SnapshotStore = {
  read: () => Promise<ClubRankingSnapshot | null>;
  write: (snapshot: ClubRankingSnapshot) => Promise<void>;
};

export async function readRankingSnapshot() {
  const store = createSnapshotStore();
  return store.read();
}

export async function writeRankingSnapshot(snapshot: ClubRankingSnapshot) {
  const store = createSnapshotStore();
  await store.write(snapshot);
}

function createSnapshotStore(): SnapshotStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });

    return {
      async read() {
        const snapshot = await redis.get<ClubRankingSnapshot>(SNAPSHOT_KEY);
        return snapshot ?? null;
      },
      async write(snapshot) {
        await redis.set(SNAPSHOT_KEY, snapshot);
      },
    };
  }

  return {
    async read() {
      try {
        const raw = await fs.readFile(LOCAL_SNAPSHOT_PATH, "utf8");
        return JSON.parse(raw) as ClubRankingSnapshot;
      } catch {
        return null;
      }
    },
    async write(snapshot) {
      await fs.writeFile(LOCAL_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
    },
  };
}
