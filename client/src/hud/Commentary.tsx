import { getCommentaryByPageId } from "@/data/commentary";
import type { Project } from "@/data/projects";
import { PAGES } from "@/data/sceneConfig";

interface CommentaryProps {
  pageId: string | null;
  // 2026-07-18 spec §4: for oeuvre pages the explanation copy, tech stack, and
  // links moved here from the panel — the panel keeps only the showcase
  // screenshot, and this overlay is where "Tap to see context" lands.
  project?: Project | null;
}

export function Commentary({ pageId, project = null }: CommentaryProps) {
  if (!pageId) return null;

  const entry = getCommentaryByPageId(pageId);
  const page = PAGES.find((item) => item.id === pageId);

  const projectLinks = project
    ? [
        project.media.liveUrl ? { label: "Live Site", href: project.media.liveUrl } : null,
        project.media.repoUrl ? { label: "GitHub", href: project.media.repoUrl } : null,
        project.media.videoUrl ? { label: "Video", href: project.media.videoUrl } : null,
      ].filter((link): link is { label: string; href: string } => Boolean(link))
    : [];

  return (
    <div className="space-y-6 text-white">
      {project ? (
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="panel-kicker text-xs uppercase text-[#89f1ff]/80">Oeuvre</p>
            <h2 className="panel-title text-3xl text-white sm:text-4xl">{project.title}</h2>
          </div>
          <p className="panel-body text-sm leading-7 text-white/80 sm:text-base">
            {project.description}
          </p>

          <div className="space-y-3">
            <p className="panel-meta text-[0.72rem] uppercase text-white/45">Tech stack</p>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((item) => (
                <span
                  key={item}
                  className="panel-chip rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs uppercase text-white/78"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {projectLinks.length ? (
            <div className="space-y-2">
              <p className="panel-meta text-[0.72rem] uppercase text-white/45">Links</p>
              <div className="flex flex-wrap gap-2">
                {projectLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="panel-meta rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase text-white/78 transition hover:border-cyan-200/30 hover:bg-cyan-200/8 hover:text-white"
                  >
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="space-y-3">
        <p className="panel-kicker text-xs uppercase text-[#89f1ff]/80">Director&apos;s commentary</p>
        <div className="space-y-2">
          {project ? null : (
            <h2
              className={`panel-title text-3xl text-white sm:text-4xl${
                page?.group === "influences" ? " panel-title-influence" : ""
              }`}
            >
              {entry?.title ?? `${page?.label ?? "Current page"} commentary`}
            </h2>
          )}
          {page && !project ? (
            <p className="panel-meta text-xs uppercase text-white/55">Page: {page.label}</p>
          ) : null}
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
