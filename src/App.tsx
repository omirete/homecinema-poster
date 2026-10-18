import React, { useState, useRef, useEffect, useCallback } from 'react';
import type {
  MovieMetadata,
  ScheduleInfo,
  PosterTheme,
  ImageAdjustment,
  MovieSearchResult,
  PosterTextSize,
  SavedPosterProject,
} from './types/poster';
import { Header } from './components/Header/Header';
import { MovieSearchSection } from './components/Controls/MovieSearchSection';
import { ImageAdjustmentSection } from './components/Controls/ImageAdjustmentSection';
import { MovieDetailsSection } from './components/Controls/MovieDetailsSection';
import { ScheduleSection } from './components/Controls/ScheduleSection';
import { ExportSection } from './components/Controls/ExportSection';
import { PosterPreview } from './components/Poster/PosterPreview';
import { SavedPostersPanel } from './components/SavedPosters/SavedPostersPanel';
import { formatDuration, loadCorsSafeImage } from './services/movieApi';
import {
  getAllSavedProjects,
  savePosterProject,
  deletePosterProject,
} from './services/posterStorage';
import { generatePosterThumbnail } from './services/posterExport';
import { FolderKanban, Check, Sparkles } from 'lucide-react';
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

  // Saved Posters Panel & Local Storage state
  const [savedProjects, setSavedProjects] = useState<SavedPosterProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSavedPanelOpen, setIsSavedPanelOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1400;
    }
    return false;
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Fetch saved projects on mount
  const refreshSavedProjects = useCallback(async () => {
    try {
      const projects = await getAllSavedProjects();
      setSavedProjects(projects);
    } catch (err) {
      console.error('Failed to load saved projects:', err);
    }
  }, []);

  useEffect(() => {
    refreshSavedProjects();
  }, [refreshSavedProjects]);

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

  // Save current project (either update existing or save as new)
  const handleSaveCurrentProject = async (forceNew: boolean = false) => {
    setIsSaving(true);
    try {
      let thumbUrl = metadata.posterUrl;
      if (posterRef.current) {
        try {
          thumbUrl = await generatePosterThumbnail(posterRef.current, metadata.posterUrl);
        } catch (e) {
          console.warn('Could not generate canvas thumbnail:', e);
        }
      }

      const id = !forceNew && currentProjectId
        ? currentProjectId
        : `poster_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const title = metadata.title || 'SIN TÍTULO';
      const sessionNum = theme.sessionNumber;

      const project: SavedPosterProject = {
        id,
        title,
        sessionNumber: sessionNum,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata,
        schedule,
        theme,
        adjustment,
        textSize,
        thumbnailUrl: thumbUrl,
      };

      await savePosterProject(project);
      setCurrentProjectId(id);

      if (sessionNum !== undefined && sessionNum !== '') {
        localStorage.setItem('homecinema_session_number', String(sessionNum));
      }

      await refreshSavedProjects();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      showToast(`¡Póster "${title}" guardado en tu colección semanal!`);
    } catch (err) {
      console.error('Failed to save poster:', err);
      showToast('Error al guardar el póster');
    } finally {
      setIsSaving(false);
    }
  };

  // Load a previously saved project into the editor
  const handleLoadProject = (project: SavedPosterProject) => {
    setMetadata(project.metadata);
    setSchedule(project.schedule);
    setTheme(project.theme);
    setAdjustment(project.adjustment || DEFAULT_ADJUSTMENT);
    setTextSize(project.textSize || 'large');
    setCurrentProjectId(project.id);
    setIsAdjusting(false);

    if (project.theme.sessionNumber !== undefined && project.theme.sessionNumber !== '') {
      localStorage.setItem('homecinema_session_number', String(project.theme.sessionNumber));
    }

    showToast(`Póster cargado: "${project.metadata.title || project.title}"`);
  };

  // Start a fresh new weekly poster with auto-incremented session number
  const handleNewWeeklyPoster = () => {
    // Determine next weekly session number
    let nextSession = 1;
    if (savedProjects.length > 0) {
      const maxSession = savedProjects.reduce((max, p) => {
        const num = typeof p.sessionNumber === 'number' ? p.sessionNumber : parseInt(String(p.sessionNumber), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      nextSession = maxSession + 1;
    } else {
      nextSession = getInitialSessionNumber();
    }

    setMetadata(DEFAULT_METADATA);
    setSchedule(DEFAULT_SCHEDULE);
    setTheme({
      ...DEFAULT_THEME,
      sessionNumber: nextSession,
      footerLeft: `NO. ${String(nextSession).padStart(4, '0')}`,
    });
    setAdjustment(DEFAULT_ADJUSTMENT);
    setIsAdjusting(false);
    setTextSize('large');
    setCurrentProjectId(null);

    localStorage.setItem('homecinema_session_number', String(nextSession));
    showToast(`Nueva función preparada: Edición Nº ${String(nextSession).padStart(4, '0')}`);
  };

  // Duplicate an existing project
  const handleDuplicateProject = async (project: SavedPosterProject) => {
    try {
      const maxSession = savedProjects.reduce((max, p) => {
        const num = typeof p.sessionNumber === 'number' ? p.sessionNumber : parseInt(String(p.sessionNumber), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      const nextSession = maxSession + 1;

      const duplicated: SavedPosterProject = {
        ...project,
        id: `poster_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `${project.metadata.title || project.title} (Copia)`,
        sessionNumber: nextSession,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        theme: {
          ...project.theme,
          sessionNumber: nextSession,
          footerLeft: `NO. ${String(nextSession).padStart(4, '0')}`,
        },
      };

      await savePosterProject(duplicated);
      await refreshSavedProjects();
      showToast(`Póster duplicado como nueva sesión #${nextSession}`);
    } catch (err) {
      console.error('Failed to duplicate project:', err);
      showToast('Error al duplicar póster');
    }
  };

  // Delete project from collection
  const handleDeleteProject = async (id: string) => {
    try {
      await deletePosterProject(id);
      if (currentProjectId === id) {
        setCurrentProjectId(null);
      }
      await refreshSavedProjects();
      showToast('Póster eliminado de tu colección');
    } catch (err) {
      console.error('Failed to delete project:', err);
      showToast('Error al eliminar póster');
    }
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
    setCurrentProjectId(null);
    showToast('Plantilla restablecida');
  };

  return (
    <>
      <Header
        onReset={handleReset}
        onSave={() => handleSaveCurrentProject(false)}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onToggleSavedPanel={() => setIsSavedPanelOpen((prev) => !prev)}
        isSavedPanelOpen={isSavedPanelOpen}
        savedCount={savedProjects.length}
      />

      <main className="app-container">
        {/* Left Column: Form Controls */}
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
            onSave={() => handleSaveCurrentProject(false)}
            isSaving={isSaving}
            onOpenSavedPanel={() => setIsSavedPanelOpen(true)}
            savedCount={savedProjects.length}
          />
        </div>

        {/* Center Column: Live Poster Preview */}
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

        {/* Right Column: Saved Posters History Panel */}
        <SavedPostersPanel
          isOpen={isSavedPanelOpen}
          onClose={() => setIsSavedPanelOpen(false)}
          projects={savedProjects}
          currentProjectId={currentProjectId}
          onLoadProject={handleLoadProject}
          onSaveCurrent={handleSaveCurrentProject}
          onNewProject={handleNewWeeklyPoster}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          isSaving={isSaving}
          currentMovieTitle={metadata.title}
        />
      </main>

      {/* Floating edge tab to open saved posters if panel is closed */}
      {!isSavedPanelOpen && (
        <button
          type="button"
          className="btn-open-panel-tab"
          onClick={() => setIsSavedPanelOpen(true)}
          title="Ver pósters guardados de semanas anteriores"
          aria-label="Abrir panel de pósters guardados"
        >
          <FolderKanban size={16} />
          <span className="tab-vertical-text">Pósters</span>
          {savedProjects.length > 0 && (
            <span className="tab-badge">{savedProjects.length}</span>
          )}
        </button>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite">
          <span className="app-toast-icon">
            <Sparkles size={16} />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export default App;
