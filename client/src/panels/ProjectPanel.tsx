import { screenshotAspectOf, type Project } from "@/data/projects";

interface ProjectPanelProps {
  project: Project;
}

// 2026-07-18 spec §4: project pages are a SHOWCASE now — the click-through
// screenshot stands alone, large, with minimal border elements. The
// explanation copy, tech stack, and links moved to the context overlay
// (hud/Commentary.tsx), reached via the pulsing "Tap to see context" bubble.
export function ProjectPanel({ project }: ProjectPanelProps) {
  const preview = project.media.screenshots?.[0] ?? null;
  const optimizedPreview = project.media.optimizedScreenshots?.[0] ?? null;
  const previewHref = project.media.liveUrl ?? project.media.repoUrl ?? null;
  const previewLabel = project.media.liveUrl
    ? "Open live site"
    : project.media.repoUrl
      ? "Open repository"
      : "";

  if (!preview) {
    // Fallback for a project that ships before its screenshot does.
    //
    // 2026-08-04: this branch used to render only the title and the "on its
    // way" note. The context overlay carries description/stack/links for
    // SHOWCASE projects only (`isShowcase` requires a screenshot), so a
    // screenshot-less project had its liveUrl and repoUrl present in the data
    // and reachable from nowhere in the UI. The gallery-wall note is still the
    // right voice for a missing image; it is just no longer the only content.
    return (
      <div className="space-y-4 text-white">
        <h2 className="panel-title text-3xl text-white sm:text-4xl">{project.title}</h2>
        <p className="panel-body text-sm leading-relaxed text-white/78">{project.description}</p>
        {previewHref ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-cyan-100 underline underline-offset-4"
          >
            {previewLabel} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
        <div className="panel-body text-sm text-white/68">
          <p>
            Screenshots, video, and process notes will land here as this
            project surfaces. Consider it a darkened gallery wall — the work
            is on its way.
          </p>
        </div>
      </div>
    );
  }

  // The frame takes the screenshot's own shape rather than cropping it into a
  // fixed 16:10. `object-cover object-top` stays as the safety net for a small
  // mismatch between the declared aspect and the file, but with a correct
  // declaration there is nothing left to crop.
  const screenshot = (
    <div
      className="relative overflow-hidden"
      style={{ aspectRatio: String(screenshotAspectOf(project)) }}
    >
      <picture className="block h-full w-full">
        {optimizedPreview ? (
          <source srcSet={optimizedPreview} type="image/avif" />
        ) : null}
        <img
          src={preview}
          alt={`${project.title} interface preview`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-top"
        />
      </picture>
    </div>
  );

  return (
    <div className="text-white">
      {previewHref ? (
        <a
          href={previewHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`${project.title}: ${previewLabel.toLowerCase()}`}
          className="group block"
        >
          {screenshot}
        </a>
      ) : (
        <figure className="group">{screenshot}</figure>
      )}
      <div className="flex items-center justify-between pt-4">
        <span className="panel-meta text-[0.66rem] uppercase tracking-[0.24em] text-white/55">
          {project.title}
        </span>
        {previewHref ? (
          <a href={previewHref} target="_blank" rel="noreferrer" className="panel-meta text-xs text-cyan-100 underline underline-offset-4">
            {previewLabel} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
