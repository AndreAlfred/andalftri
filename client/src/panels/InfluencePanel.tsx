import type { Influence } from "@/data/influences";

interface InfluencePanelProps {
  influence: Influence;
}

function groupItemsByCategory(influence: Influence) {
  const groups = new Map<string, Influence["items"]>();

  influence.items.forEach((item) => {
    const category = item.category ?? "Notes";
    const existing = groups.get(category) ?? [];
    existing.push(item);
    groups.set(category, existing);
  });

  return Array.from(groups.entries());
}

export function InfluencePanel({ influence }: InfluencePanelProps) {
  const groupedItems = groupItemsByCategory(influence);

  return (
    <div className="space-y-6 text-white">
      <header className="space-y-4 border-b border-white/10 pb-5">
        <div className="space-y-2">
          <p className="panel-kicker text-[0.72rem] uppercase text-cyan-200/75">Influences</p>
          <h2 className="panel-title text-4xl text-white sm:text-5xl">{influence.title}</h2>
        </div>
        {influence.intro ? (
          <p className="panel-body max-w-3xl text-sm text-white/78 sm:text-base">{influence.intro}</p>
        ) : null}
      </header>

      <section className="space-y-4">
        {groupedItems.map(([category, items]) => (
          <div
            key={category}
            className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <p className="panel-meta text-[0.72rem] uppercase text-white/45">{category}</p>
            <div className="mt-4 space-y-3">
              {items.map((item) => {
                const Wrapper = item.url ? "a" : "div";
                const wrapperProps = item.url
                  ? {
                      href: item.url,
                      target: "_blank",
                      rel: "noreferrer",
                    }
                  : {};

                return (
                  <Wrapper
                    key={`${category}-${item.name}`}
                    {...wrapperProps}
                    className={`block rounded-[20px] border px-4 py-4 transition ${
                      item.url
                        ? "border-white/10 bg-black/20 hover:border-cyan-200/30 hover:bg-cyan-200/8"
                        : "border-white/8 bg-black/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="panel-title text-2xl text-white sm:text-[1.9rem]">{item.name}</h3>
                          {item.url ? (
                            <span className="panel-meta text-xs uppercase text-cyan-100/70">Link</span>
                          ) : null}
                        </div>
                        <p className="panel-body text-sm text-white/72">{item.note}</p>
                      </div>
                      {item.url ? (
                        <span aria-hidden="true" className="panel-meta pt-1 text-white/40">
                          ↗
                        </span>
                      ) : null}
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
