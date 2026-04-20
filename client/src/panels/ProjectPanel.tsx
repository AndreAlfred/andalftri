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

  return (
    <div className="space-y-6 text-white">
      <header className="space-y-4 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[0.72rem] uppercase tracking-[0.26em] text-cyan-200/75">
              Oeuvre
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">{project.title}</h2>
          </div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] ${STATUS_STYLES[project.status]}`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-white/78 sm:text-base">
          {project.description}
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.9fr)]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-white/45">Project notes</p>
          <div className="mt-4 rounded-[20px] border border-dashed border-white/12 bg-black/20 px-4 py-5 text-sm leading-7 text-white/68">
            {project.media.screenshots?.length ? (
              <p>
                Media slots are ready. Wire screenshots into <code>project.media.screenshots</code>
                when Andrew drops assets into <code>client/public/images</code>.
              </p>
            ) : (
              <p>
                This panel is ready for screenshots, videos, or process media. For now it keeps the
                composition stable while the content and assets catch up.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-white/45">Tech stack</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.techStack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/78"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-white/45">Links</p>
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
                    <span>{link.label}</span>
                    <span aria-hidden="true" className="text-white/45">
                      ↗
                    </span>
                  </a>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/12 bg-black/20 px-4 py-3 text-sm text-white/55">
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
