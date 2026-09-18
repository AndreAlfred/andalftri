import assert from "node:assert/strict";
import test from "node:test";
import {
  preloadAsset,
  shouldPreloadScene,
} from "../client/src/lib/preloadAsset.ts";

interface FakeLink {
  rel: string;
  href: string;
  as: string;
  type: string;
  crossOrigin: string;
}

function createFakeDocument() {
  const links: FakeLink[] = [];
  const document = {
    createElement(tag: string) {
      assert.equal(tag, "link");
      return { rel: "", href: "", as: "", type: "", crossOrigin: "" };
    },
    querySelector(selector: string) {
      const href = selector.match(/href="([^"]+)"/)?.[1];
      return links.find((link) => link.rel === "preload" && link.href === href) ?? null;
    },
    head: {
      append(link: FakeLink) {
        links.push(link);
      },
    },
  };

  return { document, links };
}

test("preloadAsset inserts a typed anonymous fetch hint", () => {
  const { document, links } = createFakeDocument();

  const inserted = preloadAsset(
    document as unknown as Document,
    "/models/medallion-v2.glb",
    "fetch",
    "model/gltf-binary",
  );

  assert.equal(inserted, true);
  assert.deepEqual(links, [
    {
      rel: "preload",
      href: "/models/medallion-v2.glb",
      as: "fetch",
      type: "model/gltf-binary",
      crossOrigin: "anonymous",
    },
  ]);
});

test("preloadAsset does not insert the same URL twice", () => {
  const { document, links } = createFakeDocument();

  const documentLike = document as unknown as Document;
  assert.equal(preloadAsset(documentLike, "/models/medallion-v2.glb", "fetch"), true);
  assert.equal(preloadAsset(documentLike, "/models/medallion-v2.glb", "fetch"), false);
  assert.equal(links.length, 1);
});

test("scene preloading follows the route that will actually render", () => {
  assert.equal(shouldPreloadScene(false, false, false), true);
  assert.equal(shouldPreloadScene(true, false, false), false);
  assert.equal(shouldPreloadScene(false, false, true), false);
  assert.equal(
    shouldPreloadScene(false, true, true),
    true,
    "the explicit force-3d preview still needs the model",
  );
});
