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
    },
    techStack: ["React", "Vite", "Tailwind CSS", "Vercel", "OpenClaw"],
    status: "live",
  },
  {
    id: "see-canto",
    title: "See Canto",
    description:
      "A classical singing visualization and analysis tool focused on making vocal technique legible. The concept blends performance, pedagogy, and interface design, turning subtle musical behavior into something visible, explorable, and emotionally resonant.",
    media: {},
    techStack: ["Research", "Audio Analysis", "Visualization", "Creative Coding"],
    status: "concept",
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
