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

function ImageStudy({ item }: { item: InfluenceItem }) {
  return (
    <div className="py-4">
      <div className="grid grid-cols-2 gap-3">
        {item.images?.map((image) => (
          <figure key={image.src} className="space-y-1.5">
            <picture>
              <source srcSet={image.optimizedSrc} type="image/avif" />
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                className="w-full object-cover"
              />
            </picture>
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

// Cover-art tiles (2026-07-19, Andrew: "that's what I intended for those
// tiles"). The blurb overlay covers only the ARTWORK, not the whole tile, so
// the show name and network stay readable while the note is revealed —
// hovering shouldn't cost you the label that told you what you're hovering.
function TileGrid({ items }: { items: InfluenceItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.name}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="group block"
        >
          <div className="relative overflow-hidden">
            {item.artworkSrc ? (
              <picture>
                {item.artworkOptimizedSrc ? (
                  <source srcSet={item.artworkOptimizedSrc} type="image/avif" />
                ) : null}
                <img
                  src={item.artworkSrc}
                  alt={`${item.name} cover art`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </picture>
            ) : (
              <div className="aspect-square w-full bg-white/[0.05]" />
            )}
            <div className="podcast-note absolute inset-0 flex items-center bg-black/88 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              <p className="panel-body text-xs leading-5 text-white/85">{item.note}</p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2 pt-3">
            <div className="space-y-1">
              <h3 className="label-long text-sm text-white">{item.name}</h3>
              {item.meta ? (
                <p className="panel-meta text-[0.6rem] uppercase text-white/45">{item.meta}</p>
              ) : null}
            </div>
            <span aria-hidden="true" className="panel-meta pt-0.5 text-white/40">
              ↗
            </span>
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
        <h2 className="panel-title panel-title-influence text-3xl text-white sm:text-4xl">{influence.title}</h2>
        {influence.intro ? (
          <p className="panel-body max-w-3xl text-sm text-white/78 sm:text-base">{influence.intro}</p>
        ) : null}
      </header>

      <section className="space-y-8">
        {groupedItems.map(([category, items]) => (
          <div
            key={category}
            className="pt-3"
          >
            <h3 className="panel-meta text-xs uppercase text-cyan-100/75">{category}</h3>
            <div className="mt-3">
              {items.every((item) => item.display === "tile") ? (
                <TileGrid items={items} />
              ) : (
                items.map((item) => {
                  if (item.images && item.images.length > 0) {
                    return <ImageStudy key={`${category}-${item.name}`} item={item} />;
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
                      className="catalog-row"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h4 className="label-long text-base text-white sm:text-lg">{item.name}</h4>
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
