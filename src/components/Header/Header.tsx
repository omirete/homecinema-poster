import React from 'react';
import { Film, RotateCcw, Save, FolderKanban, Check, Loader2 } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  onReset: () => void;
  onSave: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  onToggleSavedPanel: () => void;
  isSavedPanelOpen: boolean;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onSave,
  isSaving = false,
  saveSuccess = false,
  onToggleSavedPanel,
  isSavedPanelOpen,
  savedCount,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Film size={20} />
        </div>
        <div className="brand-title">
          <span>Domingo de Cine</span> • Generador de Póster
        </div>
      </div>

      <div className="header-meta">
        {/* Save current project button */}
        <button
          className={`header-save-btn ${saveSuccess ? 'success' : ''}`}
          onClick={onSave}
          disabled={isSaving}
          title="Guardar póster actual en tu colección semanal"
        >
          {isSaving ? (
            <Loader2 size={14} className="spin" />
          ) : saveSuccess ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          <span>{isSaving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar Póster'}</span>
        </button>

        {/* Toggle Saved Posters side panel */}
        <button
          className={`header-collection-btn ${isSavedPanelOpen ? 'active' : ''}`}
          onClick={onToggleSavedPanel}
          title={isSavedPanelOpen ? 'Ocultar panel de pósters' : 'Abrir historial de pósters guardados'}
          aria-expanded={isSavedPanelOpen}
        >
          <FolderKanban size={15} />
          <span>Mis Pósters</span>
          {savedCount > 0 && <span className="header-count-badge">{savedCount}</span>}
        </button>

        {/* Reset button */}
        <button
          className="header-reset-btn"
          onClick={onReset}
          title="Restablecer plantilla a los valores predeterminados"
        >
          <RotateCcw size={13} />
          <span>Restablecer</span>
        </button>
      </div>
    </header>
  );
};
