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

export function MusicPanel({ project }: MusicPanelProps) {
  return (
    <div className="space-y-6 text-white">
      <header className="space-y-4 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="panel-title text-3xl text-white sm:text-4xl">{project.title}</h2>
          </div>
          <span className="panel-meta text-xs text-white/60">
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.description && (<p className="panel-body max-w-3xl text-sm text-white/78 sm:text-base">{project.description}</p>)}
      </header>

      <section>
        <p className="panel-meta text-[0.72rem] uppercase text-white/45">Current rotation</p>
        <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
          {ALBUMS.map((album) => (
            <div key={album.id} className="space-y-2">
              <picture>
                <source srcSet={album.optimizedArtworkSrc} type="image/avif" />
                <img
                  src={album.artworkSrc}
                  alt={`${album.title} — ${album.artist} album art`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </picture>
              <p className="label-long text-sm text-white/90">{album.title}</p>
              <p className="panel-meta text-[0.62rem] uppercase text-white/50">{album.artist}</p>
              <div className="flex flex-wrap gap-x-3">
                <a
                  href={album.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="panel-meta inline-flex min-h-11 items-center text-xs text-cyan-100/80 transition hover:text-white"
                >
                  Spotify ↗
                </a>
                <a
                  href={album.appleMusicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="panel-meta inline-flex min-h-11 items-center text-xs text-cyan-100/80 transition hover:text-white"
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
