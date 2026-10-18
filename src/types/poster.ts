export interface MovieMetadata {
  title: string;
  year: string;
  duration: string;
  director: string;
  genre: string;
  posterUrl: string;
}

export interface ScheduleInfo {
  doorsTime: string;
  showTime: string;
  reminderText: string;
}

export interface PosterTheme {
  badgeText: string;
  headlineText: string;
  footerLeft: string;
  footerCenter: string;
  footerRight: string;
}

export interface ImageAdjustment {
  posY: number;
  scale: number;
}

export interface MovieSearchResult {
  trackId: string | number;
  trackName: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  artistName?: string;
  artworkUrl100: string;
}
