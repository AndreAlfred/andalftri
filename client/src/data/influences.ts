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
      "Places to reach Andrew, depending on context — direct, professional, or public.",
    items: [
      {
        name: "Email",
        url: "mailto:Andrewtrimbleis@gmail.com",
        note: "Andrewtrimbleis@gmail.com — best for direct or professional contact.",
        category: "Direct",
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/andrew-trimble-610128345/",
        note: "Professional profile and work history.",
        category: "Direct",
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/littletrimble/",
        note: "@littletrimble",
        category: "Social",
      },
      {
        name: "Substack",
        url: "https://substack.com/@deprogramming80",
        note: "@deprogramming80",
        category: "Social",
      },
      {
        name: "GitHub",
        url: "https://github.com/AndreAlfred",
        note: "Public surface for code and active project links.",
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
