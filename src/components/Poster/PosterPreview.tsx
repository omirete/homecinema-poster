import React from 'react';
import type { MovieMetadata, ScheduleInfo, PosterTheme, ImageAdjustment } from '../../types/poster';
import './PosterPreview.css';

interface PosterPreviewProps {
  posterRef: React.RefObject<HTMLDivElement | null>;
  metadata: MovieMetadata;
  schedule: ScheduleInfo;
  theme: PosterTheme;
  adjustment: ImageAdjustment;
}

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterRef,
  metadata,
  schedule,
  theme,
  adjustment,
}) => {
  return (
    <div className="preview-area">
      <div className="preview-indicator">Vista Previa en Vivo • Proporción 2:3</div>
      
      <div className="poster-canvas" id="poster" ref={posterRef}>
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
  );
};
