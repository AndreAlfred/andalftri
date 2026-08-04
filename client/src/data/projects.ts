export interface Project {
  id: string;
  title: string;
  description: string;
  media: {
    screenshots?: string[];
    videoUrl?: string;
    liveUrl?: string;
    repoUrl?: string;
  };
  techStack: string[];
  status: "live" | "in-progress" | "concept";
}

export const PROJECTS: Project[] = [
  {
    id: "heaven-and-nature",
    title: "Heaven & Nature",
    description:
      "Art-driven ethical streetwear brand website. Built alongside an autonomous AI build agent named Angel, with the site itself treated as an aesthetic object instead of a plain storefront. The visual language pulls from dense 2000s personal-web energy: visible borders, texture, ornament, and intentional friction.",
    media: {
      liveUrl: "https://heaven-and-nature.vercel.app",
      screenshots: ["/images/heaven-and-nature.png"],
    },
    techStack: ["React", "Vite", "Tailwind CSS", "Vercel", "OpenClaw"],
    status: "live",
  },
  {
    id: "see-canto",
    title: "See Canto",
    description:
      "A classical singing visualization and analysis tool focused on making vocal technique legible. The concept blends performance, pedagogy, and interface design, turning subtle musical behavior into something visible, explorable, and emotionally resonant.",
    media: {
      repoUrl: "https://github.com/AndreAlfred/see-canto",
      screenshots: ["/images/see-canto.png"],
    },
    techStack: ["Research", "Audio Analysis", "Visualization", "Creative Coding"],
    status: "concept",
  },
  {
    id: "pgh",
    title: "PGH",
    // Scaffold copy under the publication-copy gate: every claim below is
    // drawn from the repository's own README rather than written for Andrew.
    // Replace with his voice before publication.
    description:
      "A public tracker for the Professor Grant Horner Bible reading plan — ten independent chapter lists cycling in parallel. Built as a static, dependency-free app: progress lives in the browser rather than an account, the KJV text ships bundled, and readers can import their own translation as JSON that never leaves their device. Unofficial, and deliberately free of copyrighted modern translations.",
    media: {
      liveUrl: "https://pgh-bible-plan-public.vercel.app",
      repoUrl: "https://github.com/AndreAlfred/pgh-bible-plan-public",
    },
    techStack: ["Vanilla JS", "localStorage", "IndexedDB", "Web Speech API", "Vercel"],
    status: "live",
  },
  {
    id: "music",
    title: "Music",
    description:
      "A home for Andrew's music work, listening practice, and sonic interests. This page will eventually gather releases, sketches, references, and process notes into a single panel that treats music as both craft and atmosphere.",
    media: {},
    techStack: ["Composition", "Production", "Curation"],
    status: "in-progress",
  },
];

export function getProjectById(id: string) {
  return PROJECTS.find((project) => project.id === id) ?? null;
}
