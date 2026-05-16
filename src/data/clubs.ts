export type ClubDefinition = {
  slug: string;
  name: string;
  aliases: string[];
};

export const footballClubs: ClubDefinition[] = [
  {
    slug: "arsenal",
    name: "Arsenal",
    aliases: ["arsenal", "gunners", "afc", "arteta", "saka", "odegaard"],
  },
  {
    slug: "chelsea",
    name: "Chelsea",
    aliases: ["chelsea", "cfc", "blues", "palmer"],
  },
  {
    slug: "man-utd",
    name: "Manchester United",
    aliases: ["man united", "man utd", "manutd", "mufc", "red devils", "bruno"],
  },
  {
    slug: "liverpool",
    name: "Liverpool",
    aliases: ["liverpool", "lfc", "reds", "salah", "klopp", "slot"],
  },
  {
    slug: "man-city",
    name: "Manchester City",
    aliases: ["man city", "manchester city", "city", "mcfc", "pep", "haaland"],
  },
  {
    slug: "tottenham",
    name: "Tottenham",
    aliases: ["spurs", "tottenham", "thfc", "son"],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    aliases: ["barca", "barcelona", "fcb", "lamine"],
  },
  {
    slug: "real-madrid",
    name: "Real Madrid",
    aliases: ["real madrid", "madrid", "rmfc", "vini", "mbappe", "bellingham"],
  },
];
