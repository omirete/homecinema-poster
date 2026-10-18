import type { MovieSearchResult } from '../types/poster';

/**
 * Format milliseconds into standard movie duration string "Xh Ym"
 */
export function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return 'N/D';
  const totalMin = Math.round(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
}

/**
 * Enhance artwork to high-resolution (supports IMDb/Amazon, Metahub, and iTunes URLs)
 */
export function getHighResArtwork(url?: string): string {
  if (!url) return '';

  // IMDb / Amazon image: replace thumbnail constraints with high-res 1200px
  if (url.includes('media-amazon.com')) {
    return url.replace(/\._V1_.*\.jpg$/, '._V1_SX1200.jpg');
  }

  // Metahub image: upgrade to large
  if (url.includes('metahub.space')) {
    return url.replace('/poster/small/', '/poster/large/').replace('/poster/medium/', '/poster/large/');
  }

  // iTunes artwork: upgrade to 1200x1200
  if (url.includes('apple.com')) {
    return url.replace(/\/[0-9]+x[0-9]+bb\./, '/1200x1200bb.');
  }

  return url;
}

/**
 * Search movies via Cinemeta (IMDb catalog) with automatic fallback to iTunes API
 */
export async function searchMovies(query: string, limit = 8): Promise<MovieSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // 1. Primary: Cinemeta Movie Catalog (public, robust movie metadata & posters)
  try {
    const url = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(cleanQuery)}.json`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const metas = (data.metas || []).slice(0, limit);

      if (metas.length > 0) {
        // Fetch detailed metadata in parallel for top results to obtain director, runtime, genres, year
        const results = await Promise.all(
          metas.map(async (item: { id: string; name: string; poster?: string; year?: string; releaseInfo?: string }) => {
            let details: Record<string, unknown> = item as unknown as Record<string, unknown>;
            try {
              const detailRes = await fetch(`https://v3-cinemeta.strem.io/meta/movie/${item.id}.json`);
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                if (detailData?.meta) {
                  details = detailData.meta;
                }
              }
            } catch {
              // fallback to item summary if detail fetch fails
            }

            // Parse runtime in minutes to milliseconds
            let trackTimeMillis: number | undefined;
            if (details.runtime) {
              const minutes = parseInt(String(details.runtime).replace(/\D/g, ''), 10);
              if (!isNaN(minutes)) {
                trackTimeMillis = minutes * 60000;
              }
            }

            const director = Array.isArray(details.director)
              ? (details.director as string[]).join(', ')
              : typeof details.director === 'string'
              ? details.director
              : '';

            let genre = 'CINE';
            if (Array.isArray(details.genres) && details.genres.length > 0) {
              genre = String(details.genres[0]);
            } else if (Array.isArray(details.genre) && details.genre.length > 0) {
              genre = String(details.genre[0]);
            } else if (typeof details.genre === 'string') {
              genre = details.genre;
            }

            const releaseYear = (details.year as string) || (details.releaseInfo ? String(details.releaseInfo) : '');
            const releaseDate = releaseYear ? `${releaseYear}-01-01T00:00:00Z` : undefined;

            return {
              trackId: (details.id as string) || item.id,
              trackName: (details.name as string) || item.name || cleanQuery,
              releaseDate,
              trackTimeMillis,
              primaryGenreName: genre,
              artistName: director,
              artworkUrl100: (details.poster as string) || item.poster || '',
            } as MovieSearchResult;
          })
        );

        const validResults = results.filter((r) => Boolean(r.artworkUrl100));
        if (validResults.length > 0) {
          return validResults;
        }
      }
    }
  } catch (err) {
    console.warn('Cinemeta search failed, attempting iTunes fallback:', err);
  }

  // 2. Fallback: iTunes Search API (media=all to avoid broken entity=movie)
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=all&limit=${limit * 2}`;
    const itunesRes = await fetch(itunesUrl);
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      return (itunesData.results || [])
        .filter((item: { kind?: string; wrapperType?: string }) => item.kind === 'feature-movie' || item.wrapperType === 'track')
        .slice(0, limit)
        .map((item: {
          trackId: number;
          trackName: string;
          releaseDate?: string;
          trackTimeMillis?: number;
          primaryGenreName?: string;
          artistName?: string;
          artworkUrl100: string;
        }) => ({
          trackId: item.trackId,
          trackName: item.trackName,
          releaseDate: item.releaseDate,
          trackTimeMillis: item.trackTimeMillis,
          primaryGenreName: item.primaryGenreName,
          artistName: item.artistName,
          artworkUrl100: item.artworkUrl100,
        }));
    }
  } catch (err) {
    console.error('All movie search providers failed:', err);
  }

  return [];
}

/**
 * Convert a remote image to a base64 Data URL or safe blob to prevent canvas tainting during export
 */
export async function loadCorsSafeImage(originalUrl: string): Promise<string> {
  if (!originalUrl || originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  // 1. Direct fetch attempt with CORS
  try {
    const directRes = await fetch(originalUrl, { mode: 'cors' });
    if (directRes.ok) {
      const blob = await directRes.blob();
      return await blobToDataUrl(blob);
    }
  } catch {
    // If direct CORS fetch fails, try image proxy
  }

  // 2. Weserv image proxy attempt (free, open, adds CORS)
  try {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&default=${encodeURIComponent(originalUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return await blobToDataUrl(blob);
    }
  } catch (err) {
    console.warn('Image proxy failed, falling back to original URL:', err);
  }

  return originalUrl;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
