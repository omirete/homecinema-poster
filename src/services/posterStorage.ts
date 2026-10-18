import type { SavedPosterProject } from '../types/poster';

const DB_NAME = 'homecinema_posters_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const LOCAL_STORAGE_FALLBACK_KEY = 'homecinema_saved_posters_fallback';

/**
 * Open or upgrade the IndexedDB instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('sessionNumber', 'sessionNumber', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Fallback helpers for localStorage in case IndexedDB is disabled (e.g. strict private mode)
 */
function getFallbackProjects(): SavedPosterProject[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallbackProjects(projects: SavedPosterProject[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('LocalStorage fallback error:', e);
  }
}

/**
 * Retrieve all saved poster projects, sorted with newest or highest session number first
 */
export async function getAllSavedProjects(): Promise<SavedPosterProject[]> {
  try {
    const db = await openDatabase();
    return await new Promise<SavedPosterProject[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as SavedPosterProject[]) || [];
        // Sort primarily by sessionNumber descending, fallback to createdAt descending
        results.sort((a, b) => {
          const numA = typeof a.sessionNumber === 'number' ? a.sessionNumber : -1;
          const numB = typeof b.sessionNumber === 'number' ? b.sessionNumber : -1;
          if (numA !== numB) {
            return numB - numA;
          }
          return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
        });
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, using localStorage fallback:', err);
    const list = getFallbackProjects();
    list.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    return list;
  }
}

/**
 * Retrieve a single saved project by ID
 */
export async function getSavedProject(id: string): Promise<SavedPosterProject | null> {
  try {
    const db = await openDatabase();
    return await new Promise<SavedPosterProject | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as SavedPosterProject) || null);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get error, using fallback:', err);
    const list = getFallbackProjects();
    return list.find((p) => p.id === id) || null;
  }
}

/**
 * Save or update a poster project
 */
export async function savePosterProject(project: SavedPosterProject): Promise<void> {
  const preparedProject: SavedPosterProject = {
    ...project,
    updatedAt: Date.now(),
    createdAt: project.createdAt || Date.now(),
  };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(preparedProject);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, using fallback:', err);
    const list = getFallbackProjects();
    const idx = list.findIndex((p) => p.id === preparedProject.id);
    if (idx >= 0) {
      list[idx] = preparedProject;
    } else {
      list.unshift(preparedProject);
    }
    saveFallbackProjects(list);
  }
}

/**
 * Delete a poster project by ID
 */
export async function deletePosterProject(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed, using fallback:', err);
    const list = getFallbackProjects().filter((p) => p.id !== id);
    saveFallbackProjects(list);
  }
}

/**
 * Export all saved projects as a JSON string for easy offline backups
 */
export async function exportProjectsBackupJson(): Promise<string> {
  const all = await getAllSavedProjects();
  return JSON.stringify(
    {
      app: 'homecinema-poster',
      version: 1,
      exportedAt: new Date().toISOString(),
      projectsCount: all.length,
      projects: all,
    },
    null,
    2
  );
}

/**
 * Import poster projects from a backup JSON string
 */
export async function importProjectsBackupJson(jsonString: string): Promise<number> {
  const parsed = JSON.parse(jsonString);
  const items: SavedPosterProject[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.projects)
    ? parsed.projects
    : [];

  if (!items.length) {
    throw new Error('No se encontraron proyectos válidos en el archivo JSON.');
  }

  let count = 0;
  for (const item of items) {
    if (item.id && item.metadata && item.schedule && item.theme) {
      await savePosterProject(item);
      count++;
    }
  }

  return count;
}
