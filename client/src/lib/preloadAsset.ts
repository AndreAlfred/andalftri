export function shouldPreloadScene(
  forceLite: boolean,
  forceFullScene: boolean,
  capabilityIsWeak: boolean,
): boolean {
  return !forceLite && (forceFullScene || !capabilityIsWeak);
}

/** Insert one preload hint early enough to race a lazy JavaScript chunk. */
export function preloadAsset(
  documentLike: Document,
  href: string,
  as: string,
  type = "",
): boolean {
  const existing = documentLike.querySelector(
    `link[rel="preload"][href="${href}"]`,
  );
  if (existing) return false;

  const link = documentLike.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  link.type = type;
  link.crossOrigin = "anonymous";
  documentLike.head.append(link);
  return true;
}
