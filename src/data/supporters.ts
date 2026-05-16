export type Supporter = {
  fid: number;
  username: string;
  displayName?: string;
  club: string;
  clubSlug: string;
};

export const clubs = [
  { name: "Arsenal", slug: "arsenal", aliases: ["arsenal", "gunners", "afc"] },
  { name: "Chelsea", slug: "chelsea", aliases: ["chelsea", "cfc", "blues"] },
  {
    name: "Manchester United",
    slug: "man-utd",
    aliases: ["man united", "man utd", "manchester united", "mutd", "red devils"],
  },
  { name: "Liverpool", slug: "liverpool", aliases: ["liverpool", "lfc", "reds"] },
  {
    name: "Manchester City",
    slug: "man-city",
    aliases: ["man city", "manchester city", "city"],
  },
  { name: "Tottenham", slug: "tottenham", aliases: ["spurs", "tottenham", "thfc"] },
  { name: "Barcelona", slug: "barcelona", aliases: ["barca", "barcelona", "fcb"] },
  {
    name: "Real Madrid",
    slug: "real-madrid",
    aliases: ["real madrid", "madrid", "rmfc"],
  },
] as const;

export const supporters: Supporter[] = [
  { fid: 123, username: "gabedev.eth", displayName: "Gabriel", club: "Arsenal", clubSlug: "arsenal" },
  { fid: 224, username: "bukayo77", displayName: "Seyi", club: "Arsenal", clubSlug: "arsenal" },
  { fid: 225, username: "northbankday", displayName: "Lara", club: "Arsenal", clubSlug: "arsenal" },
  { fid: 226, username: "odegaard.zone", displayName: "Martin", club: "Arsenal", clubSlug: "arsenal" },
  { fid: 227, username: "afcbanter", displayName: "Tomi", club: "Arsenal", clubSlug: "arsenal" },
  { fid: 228, username: "cannoncaster", displayName: "Kemi", club: "Arsenal", clubSlug: "arsenal" },
  { fid: 320, username: "bluebridgen", displayName: "Nina", club: "Chelsea", clubSlug: "chelsea" },
  { fid: 321, username: "stamfordsam", displayName: "Sam", club: "Chelsea", clubSlug: "chelsea" },
  { fid: 420, username: "mufcmax", displayName: "Max", club: "Manchester United", clubSlug: "man-utd" },
  { fid: 421, username: "theatreofmemes", displayName: "Ada", club: "Manchester United", clubSlug: "man-utd" },
  { fid: 520, username: "kopendkat", displayName: "Kat", club: "Liverpool", clubSlug: "liverpool" },
  { fid: 521, username: "scousecaster", displayName: "Joel", club: "Liverpool", clubSlug: "liverpool" },
  { fid: 620, username: "citytilt", displayName: "Imran", club: "Manchester City", clubSlug: "man-city" },
  { fid: 720, username: "spursandverbs", displayName: "Tade", club: "Tottenham", clubSlug: "tottenham" },
  { fid: 820, username: "viscabarca", displayName: "Rosa", club: "Barcelona", clubSlug: "barcelona" },
  { fid: 920, username: "halamadridfc", displayName: "Dami", club: "Real Madrid", clubSlug: "real-madrid" }
];
