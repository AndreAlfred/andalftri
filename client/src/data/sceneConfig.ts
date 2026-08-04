export interface PageConfig {
  id: string;
  label: string;
  route: string;
  group: "oeuvre" | "influences";
  buttonOffset: [number, number, number];
  cameraPosition: [number, number, number];
  cameraLookAt: [number, number, number];
}

export const PAGES: PageConfig[] = [
  {
    id: "heaven-and-nature",
    label: "Heaven & Nature",
    route: "/heaven-and-nature",
    group: "oeuvre",
    buttonOffset: [-3.5, 1.8, 0.5],
    cameraPosition: [-15, 2, 8],
    cameraLookAt: [-15, 0, 0],
  },
  {
    id: "see-canto",
    label: "See Canto",
    route: "/see-canto",
    group: "oeuvre",
    buttonOffset: [3.2, 2.2, -0.3],
    cameraPosition: [15, 3, 8],
    cameraLookAt: [15, 0, 0],
  },
  {
    id: "music",
    label: "Music",
    route: "/music",
    group: "oeuvre",
    buttonOffset: [-2, -1.5, 0.8],
    cameraPosition: [-10, -8, 8],
    cameraLookAt: [-10, -8, 0],
  },
  {
    id: "pgh",
    label: "PGH",
    route: "/pgh",
    group: "oeuvre",
    buttonOffset: [1.6, 1.2, -0.8],
    // Up-and-right, a quadrant no other page occupies. The 16:8 ratio is
    // deliberate: `computeReturnAnchor` positions the return bubble at
    // 50 + (dy/dx) * 50 along the edge, so a ratio above 0.6 would push it
    // into ALONG_CLAMP and park the bubble in a corner-adjacent constant.
    cameraPosition: [16, 8, 8],
    cameraLookAt: [16, 8, 0],
  },
  {
    id: "contact",
    label: "Contact",
    route: "/contact",
    group: "influences",
    buttonOffset: [2.8, -1, -0.5],
    cameraPosition: [12, -6, 8],
    cameraLookAt: [12, -6, 0],
  },
  {
    id: "reading-list",
    label: "Reading List",
    route: "/reading-list",
    group: "influences",
    buttonOffset: [0.5, 3, 0.2],
    cameraPosition: [3, 15, 8],
    cameraLookAt: [3, 15, 0],
  },
  {
    id: "inspirations",
    label: "Inspirations",
    route: "/inspirations",
    group: "influences",
    buttonOffset: [-1, -3.2, 0.4],
    cameraPosition: [-5, -15, 8],
    cameraLookAt: [-5, -15, 0],
  },
];

export const MENU_HUB_CAMERA = {
  position: [0, 0, 8] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};
