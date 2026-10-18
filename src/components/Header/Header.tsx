import React from 'react';
import { Film, RotateCcw } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
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
        <span className="header-tag">Edición Semanal</span>
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
