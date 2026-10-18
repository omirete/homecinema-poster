import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { MovieSearchResult } from '../../types/poster';
import { searchMovies, getHighResArtwork } from '../../services/movieApi';

interface MovieSearchSectionProps {
  onSelectMovie: (movie: MovieSearchResult, highResUrl: string) => void;
}

export const MovieSearchSection: React.FC<MovieSearchSectionProps> = ({ onSelectMovie }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSearch = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setStatusMessage('Buscando afiches y metadatos...');
    setIsError(false);

    try {
      const movies = await searchMovies(cleanQuery);
      setResults(movies);

      if (movies.length === 0) {
        setStatusMessage('No se encontraron películas. Podés ingresar los datos manualmente.');
        setIsError(false);
      } else {
        setStatusMessage(`Se encontraron ${movies.length} afiches disponibles.`);
        setSelectedIndex(0);
        // Automatically apply the first movie result
        const first = movies[0];
        onSelectMovie(first, getHighResArtwork(first.artworkUrl100));
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

  const handleSelect = (movie: MovieSearchResult, index: number) => {
    setSelectedIndex(index);
    onSelectMovie(movie, getHighResArtwork(movie.artworkUrl100));
  };

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

      {results.length > 0 && (
        <div className="gallery-wrapper" id="resultsWrapper">
          <label>Elegí la carátula o versión que más te guste:</label>
          <div className="results-gallery" id="resultsGallery">
            {results.map((item, index) => (
              <div
                key={item.trackId || index}
                className={`thumb-option ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(item, index)}
                title={item.trackName}
              >
                <img src={item.artworkUrl100} alt={item.trackName} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
