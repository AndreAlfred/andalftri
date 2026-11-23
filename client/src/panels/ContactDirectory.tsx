import type { Influence } from "@/data/influences";

export function ContactDirectory({ contact }: { contact: Influence }) {
  return (
    <address className="contact-directory">
      {contact.items.map(({ name, url, note }) => {
        if (!url) return null;
        if (url.startsWith("mailto:")) {
          return <a key={name} className="contact-email" href={url}>{url.slice(7)}</a>;
        }
        return (
          <a key={name} className="contact-destination" href={url} target="_blank" rel="noreferrer">
            <span>{name}</span>
            {note.startsWith("@") && <small>{note}</small>}
            <span aria-hidden="true" className="contact-arrow">↗</span>
          </a>
        );
      })}
    </address>
  );
}
