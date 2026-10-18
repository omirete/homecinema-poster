import React, { useState, useRef } from 'react';
import type {
  MovieMetadata,
  ScheduleInfo,
  PosterTheme,
  ImageAdjustment,
  MovieSearchResult,
  PosterTextSize,
} from './types/poster';
import { Header } from './components/Header/Header';
import { MovieSearchSection } from './components/Controls/MovieSearchSection';
import { ImageAdjustmentSection } from './components/Controls/ImageAdjustmentSection';
import { MovieDetailsSection } from './components/Controls/MovieDetailsSection';
import { ScheduleSection } from './components/Controls/ScheduleSection';
import { ExportSection } from './components/Controls/ExportSection';
import { PosterPreview } from './components/Poster/PosterPreview';
import { formatDuration, loadCorsSafeImage } from './services/movieApi';
import './components/Controls/Controls.css';
import './App.css';

const DEFAULT_METADATA: MovieMetadata = {
  title: 'CINEMA PARADISO',
  year: '1988',
  duration: '2h 04m',
  director: 'Giuseppe Tornatore',
  genre: 'Drama',
  posterUrl:
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
};

const DEFAULT_SCHEDULE: ScheduleInfo = {
  doorsTime: '20:00 HS',
  showTime: '21:00 HS',
  reminderText: '🍿 Traer para picar',
};

const getInitialSessionNumber = (): number => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('homecinema_session_number');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return 2;
};

const initialSession = getInitialSessionNumber();

const DEFAULT_THEME: PosterTheme = {
  badgeText: 'Entrada gratis',
  headlineText: 'DOMINGO DE CINE EN CASA',
  footerLeft: `NO. ${String(initialSession).padStart(4, '0')}`,
  footerCenter: '',
  footerRight: 'VOSE',
  sessionNumber: initialSession,
};

const DEFAULT_ADJUSTMENT: ImageAdjustment = {
  x: 0,
  y: 0,
  scale: 1,
  posY: 30,
};

export const App: React.FC = () => {
  const posterRef = useRef<HTMLDivElement | null>(null);

  const [metadata, setMetadata] = useState<MovieMetadata>(DEFAULT_METADATA);
  const [schedule, setSchedule] = useState<ScheduleInfo>(DEFAULT_SCHEDULE);
  const [theme, setTheme] = useState<PosterTheme>(DEFAULT_THEME);
  const [adjustment, setAdjustment] = useState<ImageAdjustment>(DEFAULT_ADJUSTMENT);
  const [textSize, setTextSize] = useState<PosterTextSize>('large');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  const handleToggleAdjusting = () => {
    setIsAdjusting((prev) => !prev);
  };

  const handleSelectMovie = async (movie: MovieSearchResult, highResArtworkUrl: string) => {
    let year = '';
    if (movie.releaseDate) {
      const match = movie.releaseDate.match(/\b(19\d\d|20\d\d)\b/);
      if (match) {
        year = match[1];
      } else {
        const d = new Date(movie.releaseDate);
        if (!isNaN(d.getFullYear())) {
          year = String(d.getUTCFullYear());
        }
      }
    }
    const duration = formatDuration(movie.trackTimeMillis);
    const genre = movie.primaryGenreName || 'CINE';
    const director = movie.artistName || 'Desconocido';
    const title = movie.trackName || '';

    // Reset framing adjustment when selecting a new movie
    setAdjustment(DEFAULT_ADJUSTMENT);

    // Update metadata fields immediately AND posterUrl immediately so preview reflects the selection instantly!
    setMetadata((prev) => ({
      ...prev,
      title: title.toUpperCase(),
      year,
      duration: duration.toUpperCase(),
      director,
      genre: genre.toUpperCase(),
      posterUrl: highResArtworkUrl || prev.posterUrl,
    }));

    // Preload CORS-safe data URL in the background for clean canvas export
    if (highResArtworkUrl) {
      try {
        const safeUrl = await loadCorsSafeImage(highResArtworkUrl);
        setMetadata((prev) => {
          // Only replace if the user hasn't selected another image in the meantime
          if (prev.posterUrl === highResArtworkUrl) {
            return {
              ...prev,
              posterUrl: safeUrl,
            };
          }
          return prev;
        });
      } catch (err) {
        console.warn('Failed to load CORS safe image:', err);
      }
    }
  };

  const handleCustomImageUpload = (dataUrl: string) => {
    setAdjustment(DEFAULT_ADJUSTMENT);
    setMetadata((prev) => ({
      ...prev,
      posterUrl: dataUrl,
    }));
  };

  const handleReset = () => {
    const currentSession = getInitialSessionNumber();
    setMetadata(DEFAULT_METADATA);
    setSchedule(DEFAULT_SCHEDULE);
    setTheme({
      ...DEFAULT_THEME,
      sessionNumber: currentSession,
      footerLeft: `NO. ${String(currentSession).padStart(4, '0')}`,
    });
    setAdjustment(DEFAULT_ADJUSTMENT);
    setIsAdjusting(false);
    setTextSize('large');
  };

  return (
    <>
      <Header onReset={handleReset} />

      <main className="app-container">
        <div className="controls-panel">
          <MovieSearchSection onSelectMovie={handleSelectMovie} />

          <ImageAdjustmentSection
            adjustment={adjustment}
            onChangeAdjustment={setAdjustment}
            onCustomImageUpload={handleCustomImageUpload}
            isAdjusting={isAdjusting}
            onToggleAdjusting={handleToggleAdjusting}
          />

          <MovieDetailsSection
            metadata={metadata}
            onChangeMetadata={setMetadata}
          />

          <ScheduleSection
            schedule={schedule}
            theme={theme}
            textSize={textSize}
            onChangeSchedule={setSchedule}
            onChangeTheme={setTheme}
            onChangeTextSize={setTextSize}
          />

          <ExportSection
            posterRef={posterRef}
            movieTitle={metadata.title}
          />
        </div>

        <PosterPreview
          posterRef={posterRef}
          metadata={metadata}
          schedule={schedule}
          theme={theme}
          adjustment={adjustment}
          textSize={textSize}
          isAdjusting={isAdjusting}
          onToggleAdjusting={handleToggleAdjusting}
          onChangeAdjustment={setAdjustment}
        />
      </main>
    </>
  );
};

export default App;
