export interface InfluenceItem {
  name: string;
  url?: string;
  note: string;
  category?: string;
  display?: "tile";
  meta?: string;
  images?: { src: string; alt: string; caption: string }[];
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
      "Read during and after Lent 2026 — podcasts went on the shelf for the season, and these took their place.",
    items: [
      {
        name: "The Word for World is Forest",
        note: "Ursula K. Le Guin",
        category: "Lent 2026",
      },
      {
        name: "Piranesi",
        note: "Susanna Clarke",
        category: "Lent 2026",
      },
      {
        name: "Glorious Exploits",
        note: "Ferdia Lennon",
        category: "Lent 2026",
      },
      {
        name: "The Mote in God's Eye",
        note: "Larry Niven & Jerry Pournelle",
        category: "Lent 2026",
      },
      {
        name: "The Gripping Hand",
        note: "Larry Niven & Jerry Pournelle",
        category: "Lent 2026",
      },
      {
        name: "Dune",
        note: "Frank Herbert",
        category: "Lent 2026",
      },
      {
        name: "The Martian",
        note: "Andy Weir",
        category: "Lent 2026",
      },
      {
        name: "Project Hail Mary",
        note: "Andy Weir",
        category: "Lent 2026",
      },
      {
        name: "The Remains of the Day",
        note: "Kazuo Ishiguro",
        category: "Lent 2026",
      },
      {
        name: "Ender's Game",
        note: "Orson Scott Card",
        category: "April 2026",
      },
      {
        name: "Speaker for the Dead",
        note: "Orson Scott Card",
        category: "April 2026",
      },
      {
        name: "The Hitchhiker's Guide to the Galaxy",
        note: "Douglas Adams",
        category: "June 2026",
      },
      {
        name: "Xenocide",
        note: "Orson Scott Card",
        category: "Summer 2026",
      },
      {
        name: "A Fire Upon the Deep",
        note: "Vernor Vinge",
        category: "Summer 2026",
      },
    ],
  },
  {
    id: "inspirations",
    title: "Inspirations",
    intro:
      "The references that shaped Andrew's taste — two painters first, then the shows in regular rotation, then the interface eras this site draws from.",
    items: [
      {
        name: "Georges Seurat",
        note: "French Post-Impressionist (1859–1891) who developed pointillism, building luminous scenes from small systematic strokes of pure color. A Sunday on La Grande Jatte turned modern leisure into monumental, almost architectural composition.",
        category: "Painters",
        images: [
          {
            src: "/images/inspirations/seurat-grande-jatte.jpg",
            alt: "Georges Seurat, A Sunday on La Grande Jatte, pointillist park scene",
            caption: "A Sunday on La Grande Jatte (1884–1886) — public domain",
          },
          {
            src: "/images/inspirations/seurat-bathers-asnieres.jpg",
            alt: "Georges Seurat, Bathers at Asnières, figures resting by the Seine",
            caption: "Bathers at Asnières (1884) — public domain",
          },
        ],
      },
      {
        name: "Piet Mondrian",
        note: "Dutch painter (1872–1944) who pared painting down to vertical and horizontal lines and primary colors, co-founding De Stijl and naming the approach Neoplasticism. His grids became a foundational grammar for modern graphic and interface design.",
        category: "Painters",
        images: [
          {
            src: "/images/inspirations/mondrian-composition-ii.jpg",
            alt: "Piet Mondrian, Composition II in Red, Blue and Yellow, primary-color grid",
            caption: "Composition II in Red, Blue and Yellow (1930) — public domain",
          },
          {
            src: "/images/inspirations/mondrian-tableau-i.jpg",
            alt: "Piet Mondrian, Tableau I, black-line grid with primary color planes",
            caption: "Tableau I (1921) — public domain",
          },
        ],
      },
      {
        name: "Cortex",
        meta: "Relay FM",
        url: "https://www.relay.fm/cortex",
        note: "CGP Grey and Myke Hurley on the operating systems behind two self-employed creators.",
        category: "Podcasts",
        display: "tile",
      },
      {
        name: "Double Tap",
        meta: "AMI-audio",
        url: "https://www.doubletaponair.com",
        note: "Steven Scott and Shaun Preece's daily, candid show about accessible technology.",
        category: "Podcasts",
        display: "tile",
      },
      {
        name: "Reply All",
        meta: "Gimlet — ended 2022",
        url: "https://gimletmedia.com/shows/reply-all",
        note: "Gimlet's show about the internet and the strange things people do on it.",
        category: "Podcasts",
        display: "tile",
      },
      {
        name: "Spotless",
        meta: "Independent",
        url: "https://spotlesspod.com",
        note: "Andrew Walsh and Hanna Brooks Olsen's friendly show about cleaning, ADHD, and keeping a life together.",
        category: "Podcasts",
        display: "tile",
      },
      {
        name: "White Horse Inn",
        meta: "Sola Media",
        url: "https://www.whitehorseinn.org",
        note: "A Reformed theology roundtable on Scripture, culture, and the church, running since 1990.",
        category: "Podcasts",
        display: "tile",
      },
      {
        name: "Connected",
        meta: "Relay FM",
        url: "https://www.relay.fm/connected",
        note: "Stephen Hackett, Myke Hurley, and Federico Viticci's weekly Apple roundtable.",
        category: "Podcasts",
        display: "tile",
      },
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
