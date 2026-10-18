import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Move, Check, RotateCcw, Maximize2 } from 'lucide-react';
import type {
  MovieMetadata,
  ScheduleInfo,
  PosterTheme,
  ImageAdjustment,
  PosterTextSize,
} from '../../types/poster';
import './PosterPreview.css';

interface PosterPreviewProps {
  posterRef: React.RefObject<HTMLDivElement | null>;
  metadata: MovieMetadata;
  schedule: ScheduleInfo;
  theme: PosterTheme;
  adjustment: ImageAdjustment;
  textSize?: PosterTextSize;
  isAdjusting?: boolean;
  onToggleAdjusting?: () => void;
  onChangeAdjustment?: (adjustment: ImageAdjustment) => void;
}

const CANONICAL_WIDTH = 520;
const CANONICAL_HEIGHT = 780;

// Pre-generate retro scanline and film grain patterns as PNG data URLs for reliable cross-browser and export rendering
const SCANLINE_PATTERN = (() => {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 2;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fillRect(0, 0, 4, 1);
  return c.toDataURL('image/png');
})();

const GRAIN_PATTERN = (() => {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const imgData = ctx.createImageData(64, 64);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = Math.random() < 0.5 ? 0 : 255;
    const alpha = Math.floor(Math.random() * 14);
    imgData.data[i] = noise;
    imgData.data[i + 1] = noise;
    imgData.data[i + 2] = noise;
    imgData.data[i + 3] = alpha;
  }
  ctx.putImageData(imgData, 0, 0);
  return c.toDataURL('image/png');
})();

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterRef,
  metadata,
  schedule,
  theme,
  adjustment,
  textSize = 'large',
  isAdjusting = false,
  onToggleAdjusting,
  onChangeAdjustment,
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

    // Laptop / Desktop fixed view
    const verticalDeduction = vh <= 760 ? 120 : 140;
    const availableHeight = vh - verticalDeduction;
    const fitScale = availableHeight / CANONICAL_HEIGHT;

    const clamped = Math.min(1.0, Math.max(0.55, fitScale));
    return Math.round(clamped * 100) / 100;
  }, []);

  const [scale, setScale] = useState<number>(calculateFitScale);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeDragMode, setActiveDragMode] = useState<'move' | 'scale' | null>(null);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    initX: number;
    initY: number;
    initScale: number;
    screenCenterX: number;
    screenCenterY: number;
    initDist: number;
  } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setScale(calculateFitScale());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitScale]);

  const handleWheel = (e: React.WheelEvent) => {
    if (isAdjusting && onChangeAdjustment) {
      e.stopPropagation();
      const zoomFactor = -e.deltaY * 0.0015;
      const currentScale = adjustment.scale || 1;
      const nextScale = Math.min(3.5, Math.max(0.6, Math.round((currentScale + zoomFactor) * 100) / 100));
      onChangeAdjustment({
        ...adjustment,
        scale: nextScale,
      });
      return;
    }

    const controls = document.querySelector('.controls-panel');
    if (controls) {
      controls.scrollTop += e.deltaY;
    }
  };

  const [corsFailed, setCorsFailed] = useState<boolean>(false);

  useEffect(() => {
    setCorsFailed(false);
  }, [metadata.posterUrl]);

  // Handle start move (surface or center handle)
  const handleStartMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
    setActiveDragMode('move');

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: adjustment.x ?? 0,
      initY: adjustment.y ?? 0,
      initScale: adjustment.scale ?? 1,
      screenCenterX: 0,
      screenCenterY: 0,
      initDist: 0,
    };
  };

  // Handle start scale from corner handles
  const handleStartScale = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
    setActiveDragMode('scale');

    const canvasEl = posterRef.current;
    const rect = canvasEl ? canvasEl.getBoundingClientRect() : null;
    const currentCanvasScale = scale || 1;
    // Calculate image center on the screen
    const centerX = rect
      ? rect.left + (CANONICAL_WIDTH / 2 + (adjustment.x ?? 0)) * currentCanvasScale
      : e.clientX;
    const centerY = rect
      ? rect.top + (CANONICAL_HEIGHT / 2 + (adjustment.y ?? 0)) * currentCanvasScale
      : e.clientY;

    const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: adjustment.x ?? 0,
      initY: adjustment.y ?? 0,
      initScale: adjustment.scale ?? 1,
      screenCenterX: centerX,
      screenCenterY: centerY,
      initDist: Math.max(dist, 20),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !onChangeAdjustment) return;

    if (activeDragMode === 'move') {
      const currentScale = scale || 1;
      const deltaX = (e.clientX - dragStartRef.current.clientX) / currentScale;
      const deltaY = (e.clientY - dragStartRef.current.clientY) / currentScale;

      onChangeAdjustment({
        ...adjustment,
        x: Math.round(dragStartRef.current.initX + deltaX),
        y: Math.round(dragStartRef.current.initY + deltaY),
      });
    } else if (activeDragMode === 'scale') {
      const { screenCenterX, screenCenterY, initDist, initScale } = dragStartRef.current;
      const currentDist = Math.hypot(e.clientX - screenCenterX, e.clientY - screenCenterY);
      const ratio = currentDist / initDist;
      const nextScale = Math.min(3.5, Math.max(0.6, Math.round(initScale * ratio * 100) / 100));

      onChangeAdjustment({
        ...adjustment,
        scale: nextScale,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
      setActiveDragMode(null);
      dragStartRef.current = null;
    }
  };

  const handleCenterImage = () => {
    if (!onChangeAdjustment) return;
    onChangeAdjustment({
      ...adjustment,
      x: 0,
      y: 0,
    });
  };

  const posX = adjustment.x ?? 0;
  const posY = adjustment.y ?? 0;
  const imgScale = adjustment.scale ?? 1;

  // Clamped coordinates for move handle so it stays comfortably inside the visible poster
  const moveHandleLeft = Math.max(65, Math.min(CANONICAL_WIDTH - 65, CANONICAL_WIDTH / 2 + posX));
  const moveHandleTop = Math.max(85, Math.min(CANONICAL_HEIGHT - 85, CANONICAL_HEIGHT / 2 + posY));

  return (
    <div className="preview-area" onWheel={handleWheel}>
      <div className="preview-indicator">
        <div className="indicator-left">
          <span className="live-dot" />
          <span>Vista Previa en Vivo • Proporción 2:3</span>
        </div>
        {onToggleAdjusting && (
          <button
            type="button"
            className={`btn-preview-adjust ${isAdjusting ? 'active' : ''}`}
            onClick={onToggleAdjusting}
            title={isAdjusting ? 'Finalizar edición' : 'Modificar posición y escala de imagen'}
          >
            {isAdjusting ? (
              <>
                <Check size={13} />
                <span>Listo</span>
              </>
            ) : (
              <>
                <Move size={13} />
                <span>Modificar Imagen</span>
              </>
            )}
          </button>
        )}
      </div>

      <div
        className="poster-scaler-wrapper"
        style={{
          width: `${Math.round(CANONICAL_WIDTH * scale)}px`,
          height: `${Math.round(CANONICAL_HEIGHT * scale)}px`,
        }}
      >
        <div
          className={`poster-canvas text-${textSize}`}
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
              crossOrigin={metadata.posterUrl?.startsWith('data:') ? undefined : corsFailed ? undefined : 'anonymous'}
              onError={() => {
                if (!corsFailed) {
                  setCorsFailed(true);
                }
              }}
              style={{
                transform: `translate(${posX}px, ${posY}px) scale(${imgScale})`,
                transformOrigin: 'center center',
              }}
            />
            <div className="artwork-fade" />
          </div>

          {/* Retro Effects Layer: Vignette, Scanlines & Film Grain */}
          <div className="poster-retro-texture" aria-hidden="true">
            <div className="poster-vignette" />
            <div
              className="poster-scanlines"
              style={{ backgroundImage: SCANLINE_PATTERN ? `url(${SCANLINE_PATTERN})` : undefined }}
            />
            <div
              className="poster-grain"
              style={{ backgroundImage: GRAIN_PATTERN ? `url(${GRAIN_PATTERN})` : undefined }}
            />
          </div>

          {/* Vintage Double Frame (Outer solid line + Inner dashed gold line) */}
          <div className="poster-frame-outer" aria-hidden="true" />
          <div className="poster-frame-inner" aria-hidden="true" />

          {/* Vintage Top Header */}
          <div className="poster-header">
            <div className="poster-badge">{theme.badgeText}</div>
            <div className="poster-headline">{theme.headlineText}</div>
          </div>

          {/* Lower Details & Ticket */}
          <div className="poster-footer">
            <div className="movie-title-box">
              <h2
                className="movie-title"
                id="outTitle"
                style={{
                  fontSize:
                    (metadata.title || '').length > 32
                      ? '2.4rem'
                      : (metadata.title || '').length > 20
                      ? '2.85rem'
                      : '3.3rem',
                }}
              >
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

            <div className={`schedule-ticket ${!schedule.reminderText?.trim() ? 'no-reminder' : ''}`}>
              <div className="ticket-times">
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
              </div>
              {schedule.reminderText && schedule.reminderText.trim() !== '' && (
                <div className="snack-reminder" id="outReminder">
                  {schedule.reminderText}
                </div>
              )}
            </div>

            <div className="film-strip-credits">
              <span id="outEdition">
                {theme.sessionNumber !== undefined && theme.sessionNumber !== ''
                  ? `NO. ${String(theme.sessionNumber).padStart(4, '0')}`
                  : theme.footerLeft || ''}
              </span>
              <span>{theme.footerCenter}</span>
              <span>{theme.footerRight}</span>
            </div>
          </div>

          {/* Picture Modification Handles & Viewfinder Overlay */}
          {isAdjusting && (
            <div
              className={`poster-adjust-overlay ${isDragging ? `dragging-${activeDragMode}` : ''}`}
              data-html2canvas-ignore="true"
              onPointerDown={handleStartMove}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Picture Frame Box */}
              <div className="picture-frame-box">
                {/* Rule of Thirds Guide */}
                <div className="viewfinder-grid">
                  <div className="grid-line vert l1" />
                  <div className="grid-line vert l2" />
                  <div className="grid-line horiz h1" />
                  <div className="grid-line horiz h2" />
                </div>

                {/* 4 Interactive Corner Scale Handles */}
                <div
                  className="picture-handle-scale tl"
                  title="Arrastrar para escalar imagen"
                  onPointerDown={handleStartScale}
                >
                  <Maximize2 size={13} />
                </div>
                <div
                  className="picture-handle-scale tr"
                  title="Arrastrar para escalar imagen"
                  onPointerDown={handleStartScale}
                >
                  <Maximize2 size={13} />
                </div>
                <div
                  className="picture-handle-scale bl"
                  title="Arrastrar para escalar imagen"
                  onPointerDown={handleStartScale}
                >
                  <Maximize2 size={13} />
                </div>
                <div
                  className="picture-handle-scale br"
                  title="Arrastrar para escalar imagen"
                  onPointerDown={handleStartScale}
                >
                  <Maximize2 size={14} />
                  <span className="scale-handle-label">Escalar</span>
                </div>
              </div>

              {/* Central Move Handle directly on the picture */}
              <div
                className="picture-handle-move"
                style={{
                  left: `${moveHandleLeft}px`,
                  top: `${moveHandleTop}px`,
                }}
                title="Arrastrar para mover la imagen en 2D"
                onPointerDown={handleStartMove}
              >
                <Move size={18} />
                <span>Mover</span>
              </div>

              {/* Floating Mini Action Toolbar */}
              <div
                className="picture-handle-toolbar"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="toolbar-scale-badge">
                  {Math.round(imgScale * 100)}%
                </span>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={handleCenterImage}
                  title="Centrar posición (0, 0)"
                >
                  <RotateCcw size={12} />
                  <span>Centrar</span>
                </button>
                <button
                  type="button"
                  className="toolbar-btn done"
                  onClick={onToggleAdjusting}
                  title="Finalizar edición"
                >
                  <Check size={13} />
                  <span>Listo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
