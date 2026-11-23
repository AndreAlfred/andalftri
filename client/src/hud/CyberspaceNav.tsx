import { PAGES } from "@/data/sceneConfig";

interface CyberspaceNavProps {
  currentPageId: string | null;
  onNavigate: (pageId: string) => void;
}

export function CyberspaceNav({ currentPageId, onNavigate }: CyberspaceNavProps) {
  return (
    <nav aria-label="Jump links">
      <h3 className="panel-meta mb-3 text-xs uppercase text-cyan-100/75">Jump links</h3>
      <ul>
        {PAGES.map((page) => (
          <li key={page.id}>
            <button
              type="button"
              onClick={() => onNavigate(page.id)}
              aria-current={page.id === currentPageId ? "page" : undefined}
              className="index-link"
            >
              {page.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
