export type PosterTextSize = 'normal' | 'large' | 'xlarge';

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
  sessionNumber?: number | '';
}

export interface ImageAdjustment {
  x: number;
  y: number;
  scale: number;
  posY?: number;
}

export interface MovieImageOption {
  url: string;
  previewUrl: string;
  label: string;
  type: 'poster' | 'backdrop' | 'alternative' | 'itunes';
}

export interface MovieSearchResult {
  trackId: string | number;
  trackName: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  artistName?: string;
  artworkUrl100: string;
  availableImages?: MovieImageOption[];
}
