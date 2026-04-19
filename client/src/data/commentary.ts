export interface CommentaryEntry {
  pageId: string;
  title: string;
  body: string;
}

export const COMMENTARY: CommentaryEntry[] = [
  {
    pageId: "heaven-and-nature",
    title: "Heaven & Nature commentary",
    body:
      "Placeholder commentary. This page will eventually hold Andrew's own notes about how the brand site was built, what visual decisions mattered, and what the collaboration with Angel revealed about taste, authorship, and process.",
  },
  {
    pageId: "see-canto",
    title: "See Canto commentary",
    body:
      "Placeholder commentary. This space is reserved for the story behind See Canto: why classical singing became an interface problem worth exploring, what the tool is trying to make visible, and how the concept might evolve from study into software.",
  },
  {
    pageId: "music",
    title: "Music commentary",
    body:
      "Placeholder commentary. This will become a freer, more reflective note about Andrew's music practice, the role sound plays in the larger portfolio, and the textures or references that matter beyond track listings.",
  },
  {
    pageId: "contact",
    title: "Contact commentary",
    body:
      "Placeholder commentary. The final version can explain how Andrew prefers to be reached, what kinds of collaborations feel aligned, and why contact surfaces should feel intentional rather than purely transactional.",
  },
  {
    pageId: "reading-list",
    title: "Reading List commentary",
    body:
      "Placeholder commentary. This will eventually hold Andrew's thoughts on the books and texts that shaped his aesthetic, ethics, and technical sensibility, along with why these selections belong together.",
  },
  {
    pageId: "inspirations",
    title: "Inspirations commentary",
    body:
      "Placeholder commentary. The final note can tie together the visual worlds, objects, interfaces, and feelings that inform the site, making the page read more like a guided constellation than a moodboard dump.",
  },
];

export function getCommentaryByPageId(pageId: string) {
  return COMMENTARY.find((entry) => entry.pageId === pageId) ?? null;
}
