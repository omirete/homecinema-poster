import React, { useState, useMemo, useRef } from 'react';
import {
  Film,
  X,
  Plus,
  Search,
  Clock,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Upload,
  Check,
  AlertCircle,
  Save,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { SavedPosterProject } from '../../types/poster';
import { exportProjectsBackupJson, importProjectsBackupJson } from '../../services/posterStorage';
import './SavedPostersPanel.css';

interface SavedPostersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedPosterProject[];
  currentProjectId: string | null;
  onLoadProject: (project: SavedPosterProject) => void;
  onSaveCurrent: (forceNew?: boolean) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: SavedPosterProject) => void;
  isSaving?: boolean;
  currentMovieTitle?: string;
}

export const SavedPostersPanel: React.FC<SavedPostersPanelProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onLoadProject,
  onSaveCurrent,
  onNewProject,
  onDeleteProject,
  onDuplicateProject,
  isSaving = false,
  currentMovieTitle = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter projects by title, session number, year or director
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return projects;

    return projects.filter((p) => {
      const titleMatch = (p.metadata?.title || p.title || '').toLowerCase().includes(q);
      const sessionMatch =
        p.sessionNumber !== undefined &&
        p.sessionNumber !== '' &&
        String(p.sessionNumber).includes(q);
      const yearMatch = (p.metadata?.year || '').toLowerCase().includes(q);
      const directorMatch = (p.metadata?.director || '').toLowerCase().includes(q);
      const genreMatch = (p.metadata?.genre || '').toLowerCase().includes(q);
      return titleMatch || sessionMatch || yearMatch || directorMatch || genreMatch;
    });
  }, [projects, searchQuery]);

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportProjectsBackupJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `homecinema-posters-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupMessage({ text: 'Copia de seguridad descargada correctamente.', type: 'success' });
      setTimeout(() => setBackupMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setBackupMessage({ text: 'Error al exportar la copia.', type: 'error' });
      setTimeout(() => setBackupMessage(null), 3500);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const count = await importProjectsBackupJson(text);
      setBackupMessage({ text: `Se importaron ${count} pósters correctamente.`, type: 'success' });
      setTimeout(() => setBackupMessage(null), 4000);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setBackupMessage({
        text: err?.message || 'Error al importar archivo. Verifica el formato.',
        type: 'error',
      });
      setTimeout(() => setBackupMessage(null), 4000);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isCurrentProjectActive = (id: string) => id === currentProjectId;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`saved-panel-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`saved-posters-panel ${isOpen ? 'open' : ''}`} aria-label="Historial de pósters semanales">
        {/* Header */}
        <div className="saved-panel-header">
          <div className="saved-header-title">
            <div className="header-icon-badge">
              <Film size={18} />
            </div>
            <div>
              <h3>Colección Semanal</h3>
              <span className="saved-count">
                {projects.length} {projects.length === 1 ? 'función guardada' : 'funciones guardadas'}
              </span>
            </div>
          </div>

          <div className="saved-header-actions">
            <button
              type="button"
              className="btn-close-panel"
              onClick={onClose}
              title="Cerrar panel lateral"
              aria-label="Cerrar panel lateral"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="saved-panel-cta">
          <button
            type="button"
            className="btn-save-current"
            onClick={() => onSaveCurrent(false)}
            disabled={isSaving}
            title={
              currentProjectId
                ? `Guardar cambios en ${currentMovieTitle ? `"${currentMovieTitle}"` : 'el póster actual'}`
                : 'Guardar póster actual en la colección'
            }
          >
            {isSaving ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <Save size={16} />
            )}
            <span>
              {isSaving
                ? 'Guardando...'
                : currentProjectId
                  ? 'Actualizar Guardado'
                  : 'Guardar póster actual'}
            </span>
          </button>

          <button
            type="button"
            className="btn-new-poster"
            onClick={onNewProject}
            title="Crear un póster nuevo para la próxima semana"
          >
            <Plus size={15} />
            <span>Nueva función semanal</span>
          </button>
        </div>

        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="saved-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por título, nº sesión, año..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="saved-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Backup Feedback message */}
        {backupMessage && (
          <div className={`backup-alert ${backupMessage.type}`}>
            {backupMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{backupMessage.text}</span>
          </div>
        )}

        {/* Projects List */}
        <div className="saved-projects-list">
          {projects.length === 0 ? (
            <div className="saved-empty-state">
              <div className="empty-icon-circle">
                <Sparkles size={28} />
              </div>
              <h4>Tu archivo está vacío</h4>
              <p>
                Diseña tu póster de esta semana y haz clic en <strong>"Guardar Póster Actual"</strong> para comenzar a organizar tu cineclub.
              </p>
              <button
                type="button"
                className="btn-empty-save"
                onClick={() => onSaveCurrent(true)}
                disabled={isSaving}
              >
                <Save size={15} />
                <span>Guardar póster en pantalla</span>
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="saved-empty-search">
              <Search size={24} />
              <p>No se encontraron pósters que coincidan con "{searchQuery}".</p>
              <button
                type="button"
                className="btn-reset-search"
                onClick={() => setSearchQuery('')}
              >
                Ver todos los pósters
              </button>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isActive = isCurrentProjectActive(project.id);
              const sessionFormatted =
                project.sessionNumber !== undefined && project.sessionNumber !== ''
                  ? `NO. ${String(project.sessionNumber).padStart(4, '0')}`
                  : null;

              const isConfirmingDelete = deleteConfirmId === project.id;

              return (
                <article
                  key={project.id}
                  className={`saved-project-card ${isActive ? 'active-project' : ''}`}
                >
                  {/* Poster Thumbnail */}
                  <div
                    className="card-poster-thumb"
                    onClick={() => onLoadProject(project)}
                    title="Clic para abrir este póster en el editor"
                  >
                    {project.thumbnailUrl || project.metadata.posterUrl ? (
                      <img
                        src={project.thumbnailUrl || project.metadata.posterUrl}
                        alt={project.metadata.title || project.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="thumb-placeholder">
                        <Film size={24} />
                      </div>
                    )}
                    <div className="thumb-hover-overlay">
                      <ExternalLink size={16} />
                      <span>Abrir</span>
                    </div>
                  </div>

                  {/* Poster Information */}
                  <div className="card-info">
                    <div className="card-top-row">
                      {sessionFormatted && (
                        <span className="session-pill">{sessionFormatted}</span>
                      )}
                      {isActive && (
                        <span className="active-pill" title="Este póster está cargado actualmente en el editor">
                          <span className="active-dot" /> En Editor
                        </span>
                      )}
                      <span className="card-date">{formatDate(project.createdAt)}</span>
                    </div>

                    <h4
                      className="card-title"
                      onClick={() => onLoadProject(project)}
                      title={`Abrir ${project.metadata.title || project.title}`}
                    >
                      {project.metadata.title || project.title || 'SIN TÍTULO'}
                    </h4>

                    <div className="card-meta">
                      {project.metadata.year && <span>{project.metadata.year}</span>}
                      {project.metadata.genre && <span>• {project.metadata.genre}</span>}
                      {project.metadata.duration && <span>• {project.metadata.duration}</span>}
                    </div>

                    {project.schedule.showTime && (
                      <div className="card-schedule-hint">
                        <Clock size={11} />
                        <span>Función: {project.schedule.showTime}</span>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="card-actions">
                      <button
                        type="button"
                        className={`btn-card-action load ${isActive ? 'is-active' : ''}`}
                        onClick={() => onLoadProject(project)}
                        title="Cargar y revisar póster en el editor"
                      >
                        <ExternalLink size={13} />
                        <span>{isActive ? 'Póster Activo' : 'Abrir'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-card-action duplicate"
                        onClick={() => onDuplicateProject(project)}
                        title="Duplicar este póster para una nueva semana"
                      >
                        <Copy size={13} />
                        <span>Duplicar</span>
                      </button>

                      {isConfirmingDelete ? (
                        <div className="delete-confirm-box">
                          <span>¿Eliminar?</span>
                          <button
                            type="button"
                            className="btn-confirm-yes"
                            onClick={() => {
                              onDeleteProject(project.id);
                              setDeleteConfirmId(null);
                            }}
                            title="Confirmar eliminación"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            className="btn-confirm-no"
                            onClick={() => setDeleteConfirmId(null)}
                            title="Cancelar"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-card-action delete"
                          onClick={() => setDeleteConfirmId(project.id)}
                          title="Eliminar este póster de la colección"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Footer Backup & Offline Note */}
        <div className="saved-panel-footer">
          <div className="backup-buttons">
            <button
              type="button"
              className="btn-backup export"
              onClick={handleExportBackup}
              title="Descargar una copia de seguridad en JSON de todos tus pósters"
            >
              <Download size={13} />
              <span>Copia de Seguridad (.JSON)</span>
            </button>

            <button
              type="button"
              className="btn-backup import"
              onClick={() => fileInputRef.current?.click()}
              title="Restaurar pósters desde una copia previa"
            >
              <Upload size={13} />
              <span>Restaurar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>

          <div className="storage-note">
            <span>Almacenamiento 100% privado y local (IndexedDB)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
