import React, { useRef } from 'react';
import { Sliders, Upload } from 'lucide-react';
import type { ImageAdjustment } from '../../types/poster';

interface ImageAdjustmentSectionProps {
  adjustment: ImageAdjustment;
  onChangeAdjustment: (adjustment: ImageAdjustment) => void;
  onCustomImageUpload: (dataUrl: string) => void;
}

export const ImageAdjustmentSection: React.FC<ImageAdjustmentSectionProps> = ({
  adjustment,
  onChangeAdjustment,
  onCustomImageUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePosYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeAdjustment({
      ...adjustment,
      posY: Number(e.target.value),
    });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeAdjustment({
      ...adjustment,
      scale: Number(e.target.value),
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
          <Sliders size={15} />
          <span>2. Ajustar Imagen & Encuadre</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="field-group">
          <div className="slider-header">
            <label htmlFor="imgPosY">Posición Vertical</label>
            <span className="slider-val">{adjustment.posY}%</span>
          </div>
          <input
            type="range"
            id="imgPosY"
            min="0"
            max="100"
            value={adjustment.posY}
            onChange={handlePosYChange}
          />
        </div>

        <div className="field-group">
          <div className="slider-header">
            <label htmlFor="imgScale">Zoom / Escala</label>
            <span className="slider-val">{adjustment.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            id="imgScale"
            min="1"
            max="1.6"
            step="0.02"
            value={adjustment.scale}
            onChange={handleScaleChange}
          />
        </div>
      </div>

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
