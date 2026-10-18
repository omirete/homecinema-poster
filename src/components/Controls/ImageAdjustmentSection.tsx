import React, { useRef } from 'react';
import { Move, Check, Upload, RotateCcw } from 'lucide-react';
import type { ImageAdjustment } from '../../types/poster';

interface ImageAdjustmentSectionProps {
  adjustment: ImageAdjustment;
  onChangeAdjustment: (adjustment: ImageAdjustment) => void;
  onCustomImageUpload: (dataUrl: string) => void;
  isAdjusting?: boolean;
  onToggleAdjusting?: () => void;
}

export const ImageAdjustmentSection: React.FC<ImageAdjustmentSectionProps> = ({
  adjustment,
  onChangeAdjustment,
  onCustomImageUpload,
  isAdjusting = false,
  onToggleAdjusting,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scalePercent = Math.round((adjustment.scale || 1) * 100);
  const isShifted =
    (adjustment.x !== 0 && adjustment.x !== undefined) ||
    (adjustment.y !== 0 && adjustment.y !== undefined);

  const handleReset = () => {
    onChangeAdjustment({
      x: 0,
      y: 0,
      scale: 1,
      posY: 30,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          onCustomImageUpload(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="control-card">
      <div className="section-header">
        <div className="section-title">
          <Move size={15} />
          <span>2. Ajustar Imagen & Encuadre</span>
        </div>
      </div>

      {/* Button to enable/disable picture modification */}
      {onToggleAdjusting && (
        <button
          type="button"
          className={`btn-toggle-adjust-compact ${isAdjusting ? 'active' : ''}`}
          onClick={onToggleAdjusting}
          id="btnToggleAdjust2D"
        >
          {isAdjusting ? (
            <>
              <Check size={18} />
              <span>Finalizar edición de imagen</span>
            </>
          ) : (
            <>
              <Move size={18} />
              <span>Modificar posición y escala</span>
            </>
          )}
        </button>
      )}

      {/* Status indicator when active or adjusted */}
      {(isAdjusting || isShifted || scalePercent !== 100) && (
        <div className="adjust-compact-status">
          <span className="compact-status-val">
            Escala: <strong>{scalePercent}%</strong>
            {isShifted ? ` • Desplazado: (${adjustment.x || 0}px, ${adjustment.y || 0}px)` : ''}
          </span>
          <button
            type="button"
            className="btn-text-reset"
            onClick={handleReset}
            title="Restablecer posición y escala a valores originales"
          >
            <RotateCcw size={12} />
            <span>Restablecer</span>
          </button>
        </div>
      )}

      {/* Local File Upload */}
      <div className="file-upload-section">
        <label>O subir tu propio archivo de imagen:</label>
        <div
          className="file-input-custom"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <Upload size={18} style={{ color: 'var(--accent)' }} />
          <span className="file-input-text">
            Seleccionar archivo desde tu dispositivo (JPG, PNG, WEBP)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            id="localFileInput"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
