import type { Project } from "@/data/projects";
import { ALBUMS } from "@/data/music";

interface MusicPanelProps {
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

export function MusicPanel({ project }: MusicPanelProps) {
  return (
    <div className="space-y-6 text-white">
      <header className="space-y-4 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="panel-kicker text-[0.72rem] uppercase text-cyan-200/75">Oeuvre</p>
            <h2 className="panel-title text-3xl text-white sm:text-4xl">{project.title}</h2>
          </div>
          <span
            className={`panel-meta inline-flex rounded-full border px-3 py-1 text-[0.68rem] uppercase ${STATUS_STYLES[project.status]}`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <p className="panel-body max-w-3xl text-sm text-white/78 sm:text-base">{project.description}</p>
      </header>

      <section>
        <p className="panel-meta text-[0.72rem] uppercase text-white/45">Current rotation</p>
        <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
          {ALBUMS.map((album) => (
            <div key={album.id} className="space-y-2">
              <img
                src={album.artworkSrc}
                alt={`${album.title} — ${album.artist} album art`}
                loading="lazy"
                className="aspect-square w-full rounded-[18px] border border-white/12 object-cover"
              />
              <p className="label-long text-sm text-white/90">{album.title}</p>
              <p className="panel-meta text-[0.62rem] uppercase text-white/50">{album.artist}</p>
              <div className="flex gap-3">
                <a
                  href={album.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="panel-meta text-[0.6rem] uppercase text-cyan-100/70 transition hover:text-white"
                >
                  Spotify ↗
                </a>
                <a
                  href={album.appleMusicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="panel-meta text-[0.6rem] uppercase text-cyan-100/70 transition hover:text-white"
                >
                  Apple Music ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
