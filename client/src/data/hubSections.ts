export const SECTION_PAGE_MAP: Record<number, string | null> = {
  7: "heaven-and-nature",
  3: "see-canto",
  5: "music",
  1: "reading-list",
  2: "contact",
  4: "inspirations",
  6: null,
};

export function getSectionForPage(pageId: string | null) {
  if (!pageId) return null;

  const match = Object.entries(SECTION_PAGE_MAP).find(([, mappedPageId]) => mappedPageId === pageId);
  return match ? Number(match[0]) : null;
}
