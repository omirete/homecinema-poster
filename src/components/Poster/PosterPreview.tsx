import React, { useState, useEffect, useCallback } from 'react';
import type { MovieMetadata, ScheduleInfo, PosterTheme, ImageAdjustment } from '../../types/poster';
import './PosterPreview.css';

interface PosterPreviewProps {
  posterRef: React.RefObject<HTMLDivElement | null>;
  metadata: MovieMetadata;
  schedule: ScheduleInfo;
  theme: PosterTheme;
  adjustment: ImageAdjustment;
}

const CANONICAL_WIDTH = 520;
const CANONICAL_HEIGHT = 780;

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterRef,
  metadata,
  schedule,
  theme,
  adjustment,
}) => {
  const calculateFitScale = useCallback(() => {
    if (typeof window === 'undefined') return 0.78;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Mobile / Tablet stacked mode (<= 1024px)
    if (vw <= 1024) {
      const availableWidth = Math.min(vw - 32, CANONICAL_WIDTH);
      return Math.min(1.0, Math.max(0.5, Math.round((availableWidth / CANONICAL_WIDTH) * 100) / 100));
    }

    // Laptop / Desktop fixed view:
    // Available height is viewport height minus header, container paddings, indicator, and safe margins
    const verticalDeduction = vh <= 760 ? 120 : 140;
    const availableHeight = vh - verticalDeduction;
    const fitScale = availableHeight / CANONICAL_HEIGHT;

    // Keep scale between 55% and 100% so it comfortably fits laptop screens
    const clamped = Math.min(1.0, Math.max(0.55, fitScale));
    return Math.round(clamped * 100) / 100;
  }, []);

  const [scale, setScale] = useState<number>(calculateFitScale);

  useEffect(() => {
    const handleResize = () => {
      setScale(calculateFitScale());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitScale]);

  const handleWheel = (e: React.WheelEvent) => {
    const controls = document.querySelector('.controls-panel');
    if (controls) {
      controls.scrollTop += e.deltaY;
    }
  };

  return (
    <div className="preview-area" onWheel={handleWheel}>
      <div className="preview-indicator">
        <span className="live-dot" />
        <span>Vista Previa en Vivo • Proporción 2:3</span>
      </div>

      <div
        className="poster-scaler-wrapper"
        style={{
          width: `${Math.round(CANONICAL_WIDTH * scale)}px`,
          height: `${Math.round(CANONICAL_HEIGHT * scale)}px`,
        }}
      >
        <div
          className="poster-canvas"
          id="poster"
          ref={posterRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
        {/* Artwork Layer */}
        <div className="poster-artwork">
          <img
            id="posterImg"
            src={metadata.posterUrl}
            alt={metadata.title}
            crossOrigin="anonymous"
            style={{
              objectPosition: `center ${adjustment.posY}%`,
              transform: `scale(${adjustment.scale})`,
            }}
          />
          <div className="artwork-fade" />
        </div>

        {/* Vintage Top Header */}
        <div className="poster-header">
          <div className="poster-badge">{theme.badgeText}</div>
          <div className="poster-headline">{theme.headlineText}</div>
        </div>

        {/* Lower Details & Ticket */}
        <div className="poster-footer">
          <div className="movie-title-box">
            <h2 className="movie-title" id="outTitle">
              {metadata.title || 'SIN TÍTULO'}
            </h2>
            <div className="movie-metadata">
              <span id="outYear">{metadata.year || '----'}</span>
              <span id="outGenre">{metadata.genre?.toUpperCase() || 'CINE'}</span>
              <span id="outDuration">{metadata.duration?.toUpperCase() || '--H --M'}</span>
            </div>
            <div className="movie-director">
              Dirigida por <strong id="outDirector">{metadata.director || 'Desconocido'}</strong>
            </div>
          </div>

          <div className="schedule-ticket">
            <div className="time-slot">
              <span className="time-label">Puertas</span>
              <span className="time-val" id="outDoors">
                {schedule.doorsTime}
              </span>
            </div>
            <div className="ticket-divider">|</div>
            <div className="time-slot">
              <span className="time-label">Función</span>
              <span className="time-val" id="outShow" style={{ color: 'var(--poster-gold)' }}>
                {schedule.showTime}
              </span>
            </div>
            <div className="snack-reminder" id="outReminder">
              {schedule.reminderText}
            </div>
          </div>

          <div className="film-strip-credits">
            <span>{theme.footerLeft}</span>
            <span>{theme.footerCenter}</span>
            <span>{theme.footerRight}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
