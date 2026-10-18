import React, { useState, useRef } from 'react';
import type {
  MovieMetadata,
  ScheduleInfo,
  PosterTheme,
  ImageAdjustment,
  MovieSearchResult,
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

const DEFAULT_THEME: PosterTheme = {
  badgeText: 'Entrada gratis',
  headlineText: 'DOMINGO DE CINE EN CASA',
  footerLeft: 'NO. 0002',
  footerCenter: 'SONIDO STEREO // 35MM VIBES',
  footerRight: 'NO SPOILERS',
};

const DEFAULT_ADJUSTMENT: ImageAdjustment = {
  posY: 30,
  scale: 1,
};

export const App: React.FC = () => {
  const posterRef = useRef<HTMLDivElement | null>(null);

  const [metadata, setMetadata] = useState<MovieMetadata>(DEFAULT_METADATA);
  const [schedule, setSchedule] = useState<ScheduleInfo>(DEFAULT_SCHEDULE);
  const [theme, setTheme] = useState<PosterTheme>(DEFAULT_THEME);
  const [adjustment, setAdjustment] = useState<ImageAdjustment>(DEFAULT_ADJUSTMENT);

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

    // Update metadata fields immediately
    setMetadata((prev) => ({
      ...prev,
      title: title.toUpperCase(),
      year,
      duration: duration.toUpperCase(),
      director,
      genre: genre.toUpperCase(),
    }));

    // Preload image safely for Canvas CORS export
    if (highResArtworkUrl) {
      try {
        const safeUrl = await loadCorsSafeImage(highResArtworkUrl);
        setMetadata((prev) => ({
          ...prev,
          posterUrl: safeUrl,
        }));
      } catch (err) {
        setMetadata((prev) => ({
          ...prev,
          posterUrl: highResArtworkUrl,
        }));
      }
    }
  };

  const handleCustomImageUpload = (dataUrl: string) => {
    setMetadata((prev) => ({
      ...prev,
      posterUrl: dataUrl,
    }));
  };

  const handleReset = () => {
    setMetadata(DEFAULT_METADATA);
    setSchedule(DEFAULT_SCHEDULE);
    setTheme(DEFAULT_THEME);
    setAdjustment(DEFAULT_ADJUSTMENT);
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
          />

          <MovieDetailsSection
            metadata={metadata}
            onChangeMetadata={setMetadata}
          />

          <ScheduleSection
            schedule={schedule}
            theme={theme}
            onChangeSchedule={setSchedule}
            onChangeTheme={setTheme}
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
        />
      </main>
    </>
  );
};

export default App;
