import { PAGES } from "@/data/sceneConfig";

interface CyberspaceNavProps {
  currentPageId: string | null;
  onNavigate: (pageId: string) => void;
}

export function CyberspaceNav({ currentPageId, onNavigate }: CyberspaceNavProps) {
  return (
    <nav className="cyberspace-panel relative overflow-hidden p-4 text-white">
      <div className="cyberspace-sheen pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative space-y-4">
        <div className="space-y-1">
          <p className="panel-kicker text-[11px] uppercase text-[#00e5ff]/82">Cyberspace nav</p>
          <h3 className="panel-meta text-sm uppercase text-white/72">Jump links</h3>
        </div>

        <ul className="space-y-2">
          {PAGES.map((page, index) => {
            const isActive = page.id === currentPageId;

            return (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(page.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`cyberspace-link group relative flex w-full items-center justify-between gap-3 overflow-hidden px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[#00e5ff]/55 bg-[#00e5ff]/16 text-white shadow-[0_0_32px_rgba(0,229,255,0.14)]"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:border-[#00e5ff]/35 hover:bg-[#00e5ff]/10 hover:text-white"
                  }`}
                >
                  <span className="panel-meta text-[11px] uppercase text-[#00e5ff]/80">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate panel-body text-sm uppercase tracking-[0.08em]">
                    {page.label}
                  </span>
                  <span className="panel-meta text-[10px] uppercase text-white/45">{isActive ? "Live" : "Jump"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
