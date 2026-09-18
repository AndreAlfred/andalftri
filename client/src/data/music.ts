export interface Album {
  id: string;
  title: string;
  artist: string;
  artworkSrc: string; // local /images/music/*.jpg
  optimizedArtworkSrc: string;
  appleMusicUrl: string;
  spotifyUrl: string;
}

export const ALBUMS: Album[] = [
  {
    id: "profound-foolishness",
    title: "The Profound Foolishness Of ~",
    artist: "AMXNRADIO & Joel Houston",
    artworkSrc: "/images/music/amxnradio-profound-foolishness.jpg?v=1",
    optimizedArtworkSrc: "/images/music/amxnradio-profound-foolishness-v1.avif",
    appleMusicUrl:
      "https://music.apple.com/us/album/the-profound-foolishness-of/1802087148",
    spotifyUrl: "https://open.spotify.com/album/1GQi7aoQSNIAZoyzMLl1gA",
  },
  {
    id: "two-star-dream-police",
    title: "Two Star & The Dream Police",
    artist: "Mk.gee",
    artworkSrc: "/images/music/mkgee-two-star.jpg?v=1",
    optimizedArtworkSrc: "/images/music/mkgee-two-star-v1.avif",
    appleMusicUrl:
      "https://music.apple.com/us/album/two-star-the-dream-police/1882613139",
    spotifyUrl: "https://open.spotify.com/album/6DlLdXBGCsSDPOV8R2pCl7",
  },
  {
    id: "firstborn",
    title: "Firstborn",
    artist: "Poor Bishop Hooper",
    artworkSrc: "/images/music/pbh-firstborn.jpg?v=1",
    optimizedArtworkSrc: "/images/music/pbh-firstborn-v1.avif",
    appleMusicUrl: "https://music.apple.com/us/album/firstborn-ep/1473338622",
    spotifyUrl: "https://open.spotify.com/album/5xTvyuTnVo2NyrzT9vpEwj",
  },
  {
    id: "golgotha",
    title: "Golgotha",
    artist: "Poor Bishop Hooper",
    artworkSrc: "/images/music/pbh-golgotha.jpg?v=1",
    optimizedArtworkSrc: "/images/music/pbh-golgotha-v1.avif",
    appleMusicUrl: "https://music.apple.com/us/album/golgotha/1217897571",
    spotifyUrl: "https://open.spotify.com/album/18sQeC99NhI2Ye55ARM0W8",
  },
  {
    id: "preludes",
    title: "Preludes (Original Cast Recording)",
    artist: "Dave Malloy",
    artworkSrc: "/images/music/malloy-preludes.jpg?v=1",
    optimizedArtworkSrc: "/images/music/malloy-preludes-v1.avif",
    appleMusicUrl:
      "https://music.apple.com/us/album/preludes-original-cast-recording/1307080494",
    spotifyUrl: "https://open.spotify.com/album/46F2NSjcwMVVOyJLDPYMpW",
  },
];

export function getAlbumById(id: string) {
  return ALBUMS.find((album) => album.id === id) ?? null;
}
