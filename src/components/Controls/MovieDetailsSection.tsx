import React from 'react';
import { Clapperboard } from 'lucide-react';
import type { MovieMetadata } from '../../types/poster';

interface MovieDetailsSectionProps {
  metadata: MovieMetadata;
  onChangeMetadata: (metadata: MovieMetadata) => void;
}

export const MovieDetailsSection: React.FC<MovieDetailsSectionProps> = ({
  metadata,
  onChangeMetadata,
}) => {
  const handleChange = (field: keyof MovieMetadata, value: string) => {
    onChangeMetadata({
      ...metadata,
      [field]: value,
    });
  };

  return (
    <div className="control-card">
      <div className="section-header">
        <div className="section-title">
          <Clapperboard size={15} />
          <span>3. Detalles de la Película</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="field-group">
          <label htmlFor="inTitle">Título de la Película</label>
          <input
            type="text"
            id="inTitle"
            value={metadata.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ej: CINEMA PARADISO"
          />
        </div>

        <div className="grid-2">
          <div className="field-group">
            <label htmlFor="inYear">Año</label>
            <input
              type="text"
              id="inYear"
              value={metadata.year}
              onChange={(e) => handleChange('year', e.target.value)}
              placeholder="1988"
            />
          </div>
          <div className="field-group">
            <label htmlFor="inDuration">Duración</label>
            <input
              type="text"
              id="inDuration"
              value={metadata.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="2h 04m"
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field-group">
            <label htmlFor="inDirector">Director</label>
            <input
              type="text"
              id="inDirector"
              value={metadata.director}
              onChange={(e) => handleChange('director', e.target.value)}
              placeholder="Giuseppe Tornatore"
            />
          </div>
          <div className="field-group">
            <label htmlFor="inGenre">Género</label>
            <input
              type="text"
              id="inGenre"
              value={metadata.genre}
              onChange={(e) => handleChange('genre', e.target.value)}
              placeholder="Drama"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
