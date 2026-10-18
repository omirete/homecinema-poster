import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Palette, Type } from 'lucide-react';
import type { ScheduleInfo, PosterTheme, PosterTextSize } from '../../types/poster';

interface ScheduleSectionProps {
  schedule: ScheduleInfo;
  theme: PosterTheme;
  textSize: PosterTextSize;
  onChangeSchedule: (schedule: ScheduleInfo) => void;
  onChangeTheme: (theme: PosterTheme) => void;
  onChangeTextSize: (size: PosterTextSize) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedule,
  theme,
  textSize,
  onChangeSchedule,
  onChangeTheme,
  onChangeTextSize,
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

  const handleSessionChange = (newVal: number | '') => {
    const formatted =
      newVal !== '' && !isNaN(Number(newVal))
        ? `NO. ${String(newVal).padStart(4, '0')}`
        : '';
    onChangeTheme({
      ...theme,
      sessionNumber: newVal,
      footerLeft: formatted,
    });
    if (typeof window !== 'undefined') {
      if (newVal !== '') {
        localStorage.setItem('homecinema_session_number', String(newVal));
      } else {
        localStorage.removeItem('homecinema_session_number');
      }
    }
  };

  return (
    <div className="control-card">
      <div className="section-header">
        <div className="section-title">
          <Clock size={15} />
          <span>4. Horarios & Sesión</span>
        </div>
      </div>

      {/* Session / Edition Number */}
      <div className="field-group">
        <label htmlFor="inSession" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Nº de Edición / Sesión (Pie Izquierdo)</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>
            {theme.sessionNumber !== undefined && theme.sessionNumber !== ''
              ? `NO. ${String(theme.sessionNumber).padStart(4, '0')}`
              : 'Sin número'}
          </span>
        </label>
        <div className="session-stepper">
          <button
            type="button"
            className="btn-stepper"
            onClick={() => handleSessionChange(Math.max(1, (Number(theme.sessionNumber) || 1) - 1))}
            title="Edición anterior (-1)"
          >
            -
          </button>
          <input
            type="number"
            id="inSession"
            min="1"
            className="session-number-input"
            value={theme.sessionNumber ?? ''}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val === '') {
                handleSessionChange('');
              } else {
                const parsed = parseInt(val, 10);
                handleSessionChange(isNaN(parsed) ? '' : Math.max(1, parsed));
              }
            }}
            placeholder="Ingresa el número de sesión"
          />
          <button
            type="button"
            className="btn-stepper"
            onClick={() => handleSessionChange((Number(theme.sessionNumber) || 1) + 1)}
            title="Siguiente edición (+1)"
          >
            +
          </button>
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

      {/* WhatsApp Text Size Selector */}
      <div className="field-group" style={{ marginTop: '2px' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Type size={13} style={{ color: 'var(--accent)' }} />
            Tamaño de Textos (WhatsApp)
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px' }}>
            {textSize === 'xlarge' ? 'Extra Grande' : textSize === 'large' ? 'Grande (WhatsApp)' : 'Normal'}
          </span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '6px' }}>
          <button
            type="button"
            className={`btn-size ${textSize === 'normal' ? 'active' : ''}`}
            onClick={() => onChangeTextSize('normal')}
          >
            Normal
          </button>
          <button
            type="button"
            className={`btn-size ${textSize === 'large' ? 'active' : ''}`}
            onClick={() => onChangeTextSize('large')}
          >
            Grande ★
          </button>
          <button
            type="button"
            className={`btn-size ${textSize === 'xlarge' ? 'active' : ''}`}
            onClick={() => onChangeTextSize('xlarge')}
          >
            Extra Grande
          </button>
        </div>
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
