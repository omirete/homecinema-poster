import React, { useState } from 'react';
import { Search, Loader2, Check, Film, Image as ImageIcon } from 'lucide-react';
import type { MovieSearchResult } from '../../types/poster';
import { searchMovies } from '../../services/movieApi';

interface MovieSearchSectionProps {
  onSelectMovie: (movie: MovieSearchResult, chosenArtworkUrl: string) => void;
}

export const MovieSearchSection: React.FC<MovieSearchSectionProps> = ({ onSelectMovie }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSearch = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setStatusMessage('Buscando afiches, escenas y metadatos...');
    setIsError(false);

    try {
      const movies = await searchMovies(cleanQuery);
      setResults(movies);

      if (movies.length === 0) {
        setStatusMessage('No se encontraron películas. Podés ingresar los datos manualmente.');
        setIsError(false);
      } else {
        const totalImages = movies.reduce(
          (sum, m) => sum + (m.availableImages?.length || 1),
          0
        );
        setStatusMessage(
          `Se encontraron ${movies.length} ${
            movies.length === 1 ? 'película' : 'películas'
          } con ${totalImages} imágenes disponibles.`
        );
        setSelectedIndex(0);
        setSelectedImageIndex(0);

        // Automatically apply the first movie result with its first available picture
        const first = movies[0];
        const firstArtwork = first.availableImages?.[0]?.url || first.artworkUrl100;
        onSelectMovie(first, firstArtwork);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error al conectar con la base de datos de cine.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectMovieTab = (index: number) => {
    const movie = results[index];
    if (!movie) return;
    setSelectedIndex(index);
    setSelectedImageIndex(0);
    const chosenArtwork = movie.availableImages?.[0]?.url || movie.artworkUrl100;
    onSelectMovie(movie, chosenArtwork);
  };

  const handleSelectImage = (imgIndex: number) => {
    const movie = results[selectedIndex];
    if (!movie || !movie.availableImages?.[imgIndex]) return;
    setSelectedImageIndex(imgIndex);
    const chosenArtwork = movie.availableImages[imgIndex].url;
    onSelectMovie(movie, chosenArtwork);
  };

  const currentMovie = results[selectedIndex];
  const currentImages = currentMovie?.availableImages || [];

  return (
    <div className="control-card">
      <div className="section-header">
        <div className="section-title">
          <Search size={15} />
          <span>1. Buscar Película</span>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            id="movieSearchInput"
            placeholder="Ej: Pulp Fiction, Alien, Cinema Paradiso..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <button
          className="btn-search"
          id="btnSearch"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>Buscar</span>
            </>
          )}
        </button>
      </div>

      {statusMessage && (
        <div className={`search-status ${isError ? 'error' : ''}`} id="statusMessage">
          {statusMessage}
        </div>
      )}

      {results.length > 0 && currentMovie && (
        <div className="gallery-wrapper" id="resultsWrapper">
          {/* Multiple Movie Matches Selector */}
          {results.length > 1 && (
            <div className="movie-results-selector">
              <label className="sub-label">Películas encontradas:</label>
              <div className="movie-chips-scroll">
                {results.map((movie, idx) => (
                  <button
                    key={movie.trackId || idx}
                    type="button"
                    className={`movie-chip ${idx === selectedIndex ? 'active' : ''}`}
                    onClick={() => handleSelectMovieTab(idx)}
                  >
                    <Film size={12} className="chip-icon" />
                    <span className="chip-title">{movie.trackName}</span>
                    {movie.releaseDate && (
                      <span className="chip-year">
                        ({movie.releaseDate.substring(0, 4)})
                      </span>
                    )}
                    {movie.availableImages && movie.availableImages.length > 1 && (
                      <span className="chip-badge">
                        <ImageIcon size={10} />
                        {movie.availableImages.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available Pictures for the Selected Movie */}
          <div className="available-images-container">
            <div className="gallery-header">
              <label>
                Imágenes de &quot;{currentMovie.trackName}&quot; (
                {currentImages.length}{' '}
                {currentImages.length === 1 ? 'disponible' : 'disponibles'}):
              </label>
            </div>

            <div className="results-gallery" id="resultsGallery">
              {currentImages.map((imgOpt, imgIdx) => (
                <div
                  key={`${imgOpt.url}-${imgIdx}`}
                  className={`thumb-option image-card ${
                    imgIdx === selectedImageIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectImage(imgIdx)}
                  title={`${imgOpt.label} • ${currentMovie.trackName}`}
                >
                  <img
                    src={imgOpt.previewUrl || imgOpt.url}
                    alt={imgOpt.label}
                    loading="lazy"
                  />
                  <div className="thumb-meta-overlay">
                    <span className="thumb-label">{imgOpt.label}</span>
                  </div>
                  {imgIdx === selectedImageIndex && (
                    <div className="thumb-check-badge">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
