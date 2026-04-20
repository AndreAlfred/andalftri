import { getCommentaryByPageId } from "@/data/commentary";
import { PAGES } from "@/data/sceneConfig";

interface CommentaryProps {
  pageId: string | null;
}

export function Commentary({ pageId }: CommentaryProps) {
  if (!pageId) return null;

  const entry = getCommentaryByPageId(pageId);
  const page = PAGES.find((item) => item.id === pageId);

  return (
    <div className="space-y-6 text-white">
      <div className="space-y-3">
        <p className="panel-kicker text-xs uppercase text-[#89f1ff]/80">Director&apos;s commentary</p>
        <div className="space-y-2">
          <h2 className="panel-title text-4xl text-white sm:text-5xl">
            {entry?.title ?? `${page?.label ?? "Current page"} commentary`}
          </h2>
          {page ? <p className="panel-meta text-xs uppercase text-white/55">Page: {page.label}</p> : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#89f1ff]/18 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
        <p className="panel-body text-[15px] leading-8 text-white/84 sm:text-base">
          {entry?.body ?? "Commentary for this page has not been written yet."}
        </p>
      </div>
    </div>
  );
}
