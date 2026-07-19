import type { Influence, InfluenceItem } from "@/data/influences";

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

function ImageCard({ item }: { item: InfluenceItem }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        {item.images?.map((image) => (
          <figure key={image.src} className="space-y-1.5">
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              className="w-full rounded-[14px] border border-white/10 object-cover"
            />
            <figcaption className="panel-meta text-[0.6rem] uppercase tracking-wide text-white/40">
              {image.caption}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="label-long text-base text-white sm:text-lg">{item.name}</h3>
        <p className="panel-body text-sm text-white/72">{item.note}</p>
      </div>
    </div>
  );
}

function TileGrid({ items }: { items: InfluenceItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.name}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="group relative block min-h-[7rem] rounded-[16px] border border-white/10 bg-black/25 p-4 transition hover:border-cyan-200/35"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h3 className="label-long text-lg text-white">{item.name}</h3>
              {item.meta ? (
                <p className="panel-meta text-xs text-white/45">{item.meta}</p>
              ) : null}
            </div>
            <span aria-hidden="true" className="panel-meta pt-1 text-white/40">
              ↗
            </span>
          </div>
          <div className="absolute inset-0 rounded-[16px] bg-black/85 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <p className="panel-body text-xs text-white/78">{item.note}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export function InfluencePanel({ influence }: InfluencePanelProps) {
  const groupedItems = groupItemsByCategory(influence);

  return (
    <div className="space-y-6 text-white">
      <header className="space-y-4 border-b border-white/10 pb-5">
        <div className="space-y-2">
          <p className="panel-kicker text-[0.72rem] uppercase text-cyan-200/75">Influences</p>
          <h2 className="panel-title panel-title-influence text-3xl text-white sm:text-4xl">{influence.title}</h2>
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
              {items.every((item) => item.display === "tile") ? (
                <TileGrid items={items} />
              ) : (
                items.map((item) => {
                  if (item.images && item.images.length > 0) {
                    return <ImageCard key={`${category}-${item.name}`} item={item} />;
                  }

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
                            <h3 className="label-long text-base text-white sm:text-lg">{item.name}</h3>
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
                })
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
