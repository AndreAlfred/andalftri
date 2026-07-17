import type { Project } from "@/data/projects";

interface ProjectPanelProps {
  project: Project;
}

const STATUS_LABELS: Record<Project["status"], string> = {
  live: "Live",
  "in-progress": "In Progress",
  concept: "Concept",
};

const STATUS_STYLES: Record<Project["status"], string> = {
  live: "border-emerald-400/25 bg-emerald-400/12 text-emerald-100",
  "in-progress": "border-cyan-300/25 bg-cyan-300/12 text-cyan-100",
  concept: "border-fuchsia-300/25 bg-fuchsia-300/12 text-fuchsia-100",
};

export function ProjectPanel({ project }: ProjectPanelProps) {
  const links = [
    project.media.liveUrl
      ? { label: "Live Site", href: project.media.liveUrl }
      : null,
    project.media.repoUrl
      ? { label: "GitHub", href: project.media.repoUrl }
      : null,
    project.media.videoUrl
      ? { label: "Video", href: project.media.videoUrl }
      : null,
  ].filter((link): link is { label: string; href: string } => Boolean(link));

  const preview = project.media.screenshots?.[0] ?? null;
  const previewHref = project.media.liveUrl ?? project.media.repoUrl ?? null;
  const previewLabel = project.media.liveUrl
    ? "Open live site"
    : project.media.repoUrl
      ? "Open repository"
      : "";

  return (
    <div className="space-y-6 text-white">
      <header className="space-y-4 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="panel-kicker text-[0.72rem] uppercase text-cyan-200/75">Oeuvre</p>
            <h2 className="panel-title text-4xl text-white sm:text-5xl">{project.title}</h2>
          </div>
          <span
            className={`panel-meta inline-flex rounded-full border px-3 py-1 text-[0.68rem] uppercase ${STATUS_STYLES[project.status]}`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <p className="panel-body max-w-3xl text-sm text-white/78 sm:text-base">{project.description}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.9fr)]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="panel-meta text-[0.72rem] uppercase text-white/45">
            {preview ? "Preview" : "Project notes"}
          </p>
          {preview ? (
            previewHref ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title}: ${previewLabel.toLowerCase()}`}
                className="group mt-4 block overflow-hidden rounded-[20px] border border-white/12 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-cyan-200/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={preview}
                    alt={`${project.title} interface preview`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-80 transition group-hover:opacity-95" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3">
                    <span className="panel-meta text-[0.7rem] uppercase tracking-wide text-white/85">
                      {previewLabel}
                    </span>
                    <span aria-hidden="true" className="panel-meta text-cyan-100/90">
                      ↗
                    </span>
                  </div>
                </div>
              </a>
            ) : (
              <figure className="mt-4 overflow-hidden rounded-[20px] border border-white/12 bg-black/30">
                <img
                  src={preview}
                  alt={`${project.title} interface preview`}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover object-top"
                />
              </figure>
            )
          ) : (
            <div className="panel-body mt-4 rounded-[20px] border border-dashed border-white/12 bg-black/20 px-4 py-5 text-sm text-white/68">
              <p>
                Screenshots, video, and process notes will land here as this
                project surfaces. Consider it a darkened gallery wall — the
                work is on its way.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="panel-meta text-[0.72rem] uppercase text-white/45">Tech stack</p>
            <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="panel-meta text-[0.72rem] uppercase text-white/45">Links</p>
            <div className="mt-4 space-y-2">
              {links.length ? (
                links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 transition hover:border-cyan-200/30 hover:bg-cyan-200/8 hover:text-white"
                  >
                    <span className="panel-body">{link.label}</span>
                    <span aria-hidden="true" className="panel-meta text-white/45">
                      ↗
                    </span>
                  </a>
                ))
              ) : (
                <p className="panel-body rounded-2xl border border-dashed border-white/12 bg-black/20 px-4 py-3 text-sm text-white/55">
                  Public links will land here as each project surface goes live.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
