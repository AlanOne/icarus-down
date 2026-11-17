import {
  siApplemusic,
  siAudiomack,
  siBandcamp,
  siDeezer,
  siSoundcloud,
  siSpotify,
  siTidal,
  siYoutubemusic,
} from 'simple-icons';

/** Brand icon paths (24 x 24 viewBox) for streaming services, by their button label. */
const ICONS: Record<string, string> = {
  spotify: siSpotify.path,
  'apple music': siApplemusic.path,
  bandcamp: siBandcamp.path,
  'youtube music': siYoutubemusic.path,
  soundcloud: siSoundcloud.path,
  deezer: siDeezer.path,
  tidal: siTidal.path,
  audiomack: siAudiomack.path,
};

/** A plain "play" triangle for anything without a brand icon (e.g. the pre-save "Listen" link). */
const PLAY = 'M7 4.5v15l12.5-7.5z';

export function serviceIcon(label: string): string {
  return ICONS[label.trim().toLowerCase()] ?? PLAY;
}
