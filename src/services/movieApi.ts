import type { MovieSearchResult, MovieImageOption } from '../types/poster';

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
 * Enhance artwork to high-resolution safely without breaking URLs or losing crop parameters
 */
export function getHighResArtwork(url?: string): string {
  if (!url) return '';

  // 1. iTunes artwork: upgrade safely to 1200x1200
  if (url.includes('apple.com')) {
    return url.replace(/\/[0-9]+x[0-9]+bb\./, '/1200x1200bb.');
  }

  // 2. Metahub image: Metahub ONLY supports /small/ and /medium/.
  // Replacing with /large/ causes 404! So we upgrade /small/ to /medium/, and keep /medium/.
  if (url.includes('metahub.space')) {
    return url
      .replace('/poster/small/', '/poster/medium/')
      .replace('/background/small/', '/background/medium/');
  }

  // 3. IMDb / Amazon images:
  // If the image has custom crop parameter (_CR), do NOT strip it as it crops to poster ratio.
  // Only upgrade pure width/height constraint tags.
  if (url.includes('media-amazon.com')) {
    if (url.includes('._V1_SX') && !url.includes('_CR')) {
      return url.replace(/\._V1_SX\d+\.jpg$/, '._V1_SX1000.jpg');
    }
    if (url.includes('._V1_UX') && !url.includes('_CR')) {
      return url.replace(/\._V1_UX\d+\.jpg$/, '._V1_UX1000.jpg');
    }
    if (url.includes('._V1_UY') && !url.includes('_CR')) {
      return url.replace(/\._V1_UY\d+\.jpg$/, '._V1_UY1200.jpg');
    }
  }

  return url;
}

function collectMovieImages(
  id: string,
  details: Record<string, unknown>,
  itemPoster?: string,
  itunesArtwork?: string
): MovieImageOption[] {
  const images: MovieImageOption[] = [];
  const seenUrls = new Set<string>();

  const addImage = (
    rawUrl?: unknown,
    label = 'Afiche Oficial',
    type: MovieImageOption['type'] = 'poster'
  ) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const clean = rawUrl.trim();
    if (!clean || !clean.startsWith('http')) return;
    const highRes = getHighResArtwork(clean);
    if (seenUrls.has(highRes) || seenUrls.has(clean)) return;
    seenUrls.add(highRes);
    seenUrls.add(clean);
    images.push({
      url: highRes,
      previewUrl: clean,
      label,
      type,
    });
  };

  // 1. Cinemeta meta poster (primary official poster)
  if (details.poster) {
    addImage(details.poster, 'Afiche Oficial', 'poster');
  }

  // 2. iTunes high-res store poster (if found)
  if (itunesArtwork) {
    addImage(itunesArtwork, 'Carátula HD (iTunes)', 'itunes');
  }

  // 3. Cinemeta catalog poster (if distinct from meta poster)
  if (itemPoster) {
    addImage(itemPoster, 'Afiche Alternativo', 'alternative');
  }

  // 4. Cinemeta background / backdrop scene (landscape key visual)
  if (details.background) {
    addImage(details.background, 'Escena / Fondo', 'backdrop');
  }

  // 5. Metahub background if IMDb id available
  if (id && String(id).startsWith('tt')) {
    const metahubBg = `https://images.metahub.space/background/medium/${id}/img`;
    addImage(metahubBg, 'Fondo Cinemático', 'backdrop');
  }

  return images;
}

/**
 * Search movies via Cinemeta (IMDb catalog) and enrich with all available pictures & iTunes API
 */
export async function searchMovies(query: string, limit = 8): Promise<MovieSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // Start iTunes search in parallel to discover additional high-res artworks or fallback results
  const itunesPromise = fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&media=all&limit=${limit * 2}`
  )
    .then((res) => (res.ok ? res.json() : { results: [] }))
    .then((data) => data.results || [])
    .catch(() => []);

  // 1. Primary: Cinemeta Movie Catalog (public IMDb catalog with rich metadata)
  try {
    const cinemetaUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(cleanQuery)}.json`;
    const response = await fetch(cinemetaUrl);

    if (response.ok) {
      const data = await response.json();
      const metas = (data.metas || []).slice(0, limit);

      if (metas.length > 0) {
        const itunesResults = await itunesPromise;

        // Fetch detailed metadata in parallel for top results
        const results = await Promise.all(
          metas.map(
            async (item: {
              id: string;
              name: string;
              poster?: string;
              year?: string;
              releaseInfo?: string;
            }) => {
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

              const releaseYear =
                (details.year as string) || (details.releaseInfo ? String(details.releaseInfo) : '');
              const releaseDate = releaseYear ? `${releaseYear}-01-01T00:00:00Z` : undefined;

              // Match corresponding iTunes item to extract iTunes official store poster
              const movieNameLower = ((details.name as string) || item.name || '').toLowerCase();
              const itunesMatch = itunesResults.find((it: { trackName?: string }) => {
                if (!it.trackName) return false;
                const itName = it.trackName.toLowerCase();
                return itName === movieNameLower || itName.includes(movieNameLower) || movieNameLower.includes(itName);
              });
              const itunesArtwork = itunesMatch?.artworkUrl100
                ? getHighResArtwork(itunesMatch.artworkUrl100)
                : undefined;

              // Collect all available pictures for this movie (posters, backdrops, alternative covers)
              const availableImages = collectMovieImages(
                item.id,
                details,
                item.poster,
                itunesArtwork
              );

              const primaryArtwork =
                availableImages[0]?.url ||
                getHighResArtwork((details.poster as string) || item.poster || '');

              return {
                trackId: (details.id as string) || item.id,
                trackName: (details.name as string) || item.name || cleanQuery,
                releaseDate,
                trackTimeMillis,
                primaryGenreName: genre,
                artistName: director,
                artworkUrl100: primaryArtwork,
                availableImages,
              } as MovieSearchResult;
            }
          )
        );

        const validResults = results.filter((r) => r.availableImages && r.availableImages.length > 0);
        if (validResults.length > 0) {
          return validResults;
        }
      }
    }
  } catch (err) {
    console.warn('Cinemeta search failed, attempting iTunes fallback:', err);
  }

  // 2. Fallback: iTunes Search API if Cinemeta has no results
  try {
    const itunesResults = await itunesPromise;
    const movieResults = (itunesResults || [])
      .filter(
        (item: { kind?: string; wrapperType?: string }) =>
          item.kind === 'feature-movie' || item.wrapperType === 'track'
      )
      .slice(0, limit);

    if (movieResults.length > 0) {
      return movieResults.map(
        (item: {
          trackId: number;
          trackName: string;
          releaseDate?: string;
          trackTimeMillis?: number;
          primaryGenreName?: string;
          artistName?: string;
          artworkUrl100: string;
        }) => {
          const highRes = getHighResArtwork(item.artworkUrl100);
          const availableImages: MovieImageOption[] = [
            {
              url: highRes,
              previewUrl: item.artworkUrl100,
              label: 'Carátula Oficial',
              type: 'itunes',
            },
          ];

          return {
            trackId: item.trackId,
            trackName: item.trackName,
            releaseDate: item.releaseDate,
            trackTimeMillis: item.trackTimeMillis,
            primaryGenreName: item.primaryGenreName,
            artistName: item.artistName,
            artworkUrl100: highRes,
            availableImages,
          };
        }
      );
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
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}`;
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
