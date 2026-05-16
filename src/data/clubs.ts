export type ClubDefinition = {
  slug: string;
  name: string;
  teamId: string;
  aliases: string[];
};

export const footballClubs: ClubDefinition[] = [
  {
    slug: "arsenal",
    name: "Arsenal",
    teamId: "eng.1-ars",
    aliases: ["arsenal", "gunners", "afc", "arteta", "saka", "odegaard"],
  },
  {
    slug: "chelsea",
    name: "Chelsea",
    teamId: "eng.1-che",
    aliases: ["chelsea", "cfc", "blues", "palmer"],
  },
  {
    slug: "man-utd",
    name: "Manchester United",
    teamId: "eng.1-man",
    aliases: ["man united", "man utd", "manutd", "mufc", "red devils", "bruno"],
  },
  {
    slug: "liverpool",
    name: "Liverpool",
    teamId: "eng.1-liv",
    aliases: ["liverpool", "lfc", "reds", "salah", "klopp", "slot"],
  },
  {
    slug: "man-city",
    name: "Manchester City",
    teamId: "eng.1-mnc",
    aliases: ["man city", "manchester city", "city", "mcfc", "pep", "haaland"],
  },
  {
    slug: "tottenham",
    name: "Tottenham",
    teamId: "eng.1-tot",
    aliases: ["spurs", "tottenham", "thfc", "son"],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    teamId: "esp.1-bar",
    aliases: ["barca", "barcelona", "fcb", "lamine"],
  },
  {
    slug: "real-madrid",
    name: "Real Madrid",
    teamId: "esp.1-rma",
    aliases: ["real madrid", "madrid", "rmfc", "vini", "mbappe", "bellingham"],
  },
];
