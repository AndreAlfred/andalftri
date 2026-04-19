export interface InfluenceItem {
  name: string;
  url?: string;
  note: string;
  category?: string;
}

export interface Influence {
  id: string;
  title: string;
  intro?: string;
  items: InfluenceItem[];
}

export const INFLUENCES: Influence[] = [
  {
    id: "contact",
    title: "Contact",
    intro:
      "The future contact panel will gather the right places to reach Andrew depending on context: professional, collaborative, or conversational. For now, this acts as structured placeholder content so the panel system can be wired cleanly in the next task.",
    items: [
      {
        name: "Email",
        note: "Primary contact address to be added once Andrew confirms the preferred inbox.",
        category: "Direct",
      },
      {
        name: "GitHub",
        url: "https://github.com/AndreAlfred",
        note: "Best current public surface for code and active project links.",
        category: "Public",
      },
      {
        name: "Portfolio",
        url: "https://andalftri.vercel.app",
        note: "The canonical home for this work as it develops.",
        category: "Public",
      },
    ],
  },
  {
    id: "reading-list",
    title: "Reading List",
    intro:
      "A curated shelf for books, essays, and texts that sharpen Andrew's visual taste, ethics, and technical imagination. These are seed entries for layout and content structure, not the final canon.",
    items: [
      {
        name: "The Medium Is the Massage",
        note: "A reminder that form and delivery are part of the message, not packaging around it.",
        category: "Media Theory",
      },
      {
        name: "Understanding Media",
        note: "Useful scaffolding for thinking about interfaces as environments that reshape perception.",
        category: "Media Theory",
      },
      {
        name: "Pilgrim at Tinker Creek",
        note: "A tonal reference for close observation, attention, and the spiritual charge of description.",
        category: "Literature",
      },
    ],
  },
  {
    id: "inspirations",
    title: "Inspirations",
    intro:
      "A collection page for the references that shaped Andrew's taste: interface eras, artists, websites, objects, and atmospheres. These entries are placeholders chosen to support panel design and annotation patterns.",
    items: [
      {
        name: "Halo CE / Halo 2 HUD",
        note: "Key reference for the cyberspace overlay language: angular, tactical, translucent, and cool without being sterile.",
        category: "Interface",
      },
      {
        name: "Frutiger Aero",
        note: "Not nostalgia for its own sake, but a lesson in optimism, gloss, and spatial depth as emotional design tools.",
        category: "Aesthetic",
      },
      {
        name: "Early personal-web portfolios",
        note: "A reference for density, voice, and the feeling that a site can still be authored rather than templated.",
        category: "Web",
      },
    ],
  },
];

export function getInfluenceById(id: string) {
  return INFLUENCES.find((influence) => influence.id === id) ?? null;
}
