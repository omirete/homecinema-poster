import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportPosterAsPng } from '../../services/posterExport';

interface ExportSectionProps {
  posterRef: React.RefObject<HTMLDivElement | null>;
  movieTitle: string;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ posterRef, movieTitle }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDownload = async () => {
    if (!posterRef.current) {
      setErrorMessage('No se encontró el elemento del póster para exportar.');
      return;
    }

    setIsExporting(true);
    setErrorMessage('');
    setSuccessMessage(false);

    try {
      await exportPosterAsPng(posterRef.current, movieTitle, 2);
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 4000);
    } catch (err) {
      console.error('Error al exportar póster:', err);
      setErrorMessage(
        'Hubo un problema al exportar. Si usás una imagen externa bloqueada por CORS, podés subir una imagen local con el botón de "subir archivo".'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        className="btn-download"
        id="btnDownload"
        onClick={handleDownload}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 size={20} className="spin" />
            <span>Generando póster en alta resolución...</span>
          </>
        ) : (
          <>
            <Download size={20} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span>Descargar Póster HD (1040 × 1560)</span>
              <span className="btn-download-sub">Listo para WhatsApp & Redes Sociales</span>
            </div>
          </>
        )}
      </button>

      {successMessage && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '4px',
          }}
        >
          <CheckCircle2 size={15} />
          <span>¡Póster descargado correctamente!</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            background: 'rgba(231, 76, 60, 0.1)',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid rgba(231, 76, 60, 0.3)',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
