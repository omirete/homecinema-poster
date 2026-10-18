import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import type { ScheduleInfo, PosterTheme } from '../../types/poster';

interface ScheduleSectionProps {
  schedule: ScheduleInfo;
  theme: PosterTheme;
  onChangeSchedule: (schedule: ScheduleInfo) => void;
  onChangeTheme: (theme: PosterTheme) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedule,
  theme,
  onChangeSchedule,
  onChangeTheme,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleScheduleChange = (field: keyof ScheduleInfo, value: string) => {
    onChangeSchedule({
      ...schedule,
      [field]: value,
    });
  };

  const handleThemeChange = (field: keyof PosterTheme, value: string) => {
    onChangeTheme({
      ...theme,
      [field]: value,
    });
  };

  return (
    <div className="control-card">
      <div className="section-header">
        <div className="section-title">
          <Clock size={15} />
          <span>4. Horarios & Convivencia</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="field-group">
          <label htmlFor="inDoors">Apertura de Puertas</label>
          <input
            type="text"
            id="inDoors"
            value={schedule.doorsTime}
            onChange={(e) => handleScheduleChange('doorsTime', e.target.value)}
            placeholder="20:00 HS"
          />
        </div>

        <div className="field-group">
          <label htmlFor="inShow">Inicio de Función</label>
          <input
            type="text"
            id="inShow"
            value={schedule.showTime}
            onChange={(e) => handleScheduleChange('showTime', e.target.value)}
            placeholder="21:00 HS"
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="inReminder">Recordatorio / Mensaje</label>
        <input
          type="text"
          id="inReminder"
          value={schedule.reminderText}
          onChange={(e) => handleScheduleChange('reminderText', e.target.value)}
          placeholder="🍿 Traer para picar"
        />
      </div>

      {/* Advanced Poster Customization (Badge & Headline) */}
      <div style={{ marginTop: '4px', borderTop: '1px solid #2d313d', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '4px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={13} style={{ color: 'var(--accent)' }} />
            Personalizar Encabezados del Póster
          </span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div className="field-group">
              <label>Distintivo Superior (Badge)</label>
              <input
                type="text"
                value={theme.badgeText}
                onChange={(e) => handleThemeChange('badgeText', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Titular Superior (Headline)</label>
              <input
                type="text"
                value={theme.headlineText}
                onChange={(e) => handleThemeChange('headlineText', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Crédito Pie Central</label>
              <input
                type="text"
                value={theme.footerCenter}
                onChange={(e) => handleThemeChange('footerCenter', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
