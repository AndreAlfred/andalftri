import type { Project } from "@/data/projects";

interface ProjectPanelProps {
  project: Project;
}

// 2026-07-18 spec §4: project pages are a SHOWCASE now — the click-through
// screenshot stands alone, large, with minimal border elements. The
// explanation copy, tech stack, and links moved to the context overlay
// (hud/Commentary.tsx), reached via the pulsing "Tap to see context" bubble.
export function ProjectPanel({ project }: ProjectPanelProps) {
  const preview = project.media.screenshots?.[0] ?? null;
  const previewHref = project.media.liveUrl ?? project.media.repoUrl ?? null;
  const previewLabel = project.media.liveUrl
    ? "Open live site"
    : project.media.repoUrl
      ? "Open repository"
      : "";

  if (!preview) {
    // Fallback for a future project that ships before its screenshot does.
    return (
      <div className="space-y-4 text-white">
        <p className="panel-kicker text-[0.72rem] uppercase text-cyan-200/75">Oeuvre</p>
        <h2 className="panel-title text-3xl text-white sm:text-4xl">{project.title}</h2>
        <div className="panel-body rounded-[20px] border border-dashed border-white/12 bg-black/20 px-4 py-5 text-sm text-white/68">
          <p>
            Screenshots, video, and process notes will land here as this
            project surfaces. Consider it a darkened gallery wall — the work
            is on its way.
          </p>
        </div>
      </div>
    );
  }

  const screenshot = (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[12px]">
      <img
        src={preview}
        alt={`${project.title} interface preview`}
        loading="lazy"
        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.015]"
      />
    </div>
  );

  return (
    // hud-frame-lg chamfer 1.25rem -> the p-6 (24px) padding on this frame
    // clears the >= 1.5rem coupling minimum documented on .hud-frame.
    <div className="hud-frame hud-frame-lg p-6 text-white">
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
          <span className="panel-meta text-[0.66rem] uppercase tracking-[0.24em] text-cyan-100/80">
            {previewLabel} <span aria-hidden="true">↗</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
