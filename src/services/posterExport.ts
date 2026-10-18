import html2canvas from 'html2canvas';

/**
 * Render a DOM element to a high-resolution PNG image and trigger browser download
 */
export async function exportPosterAsPng(
  posterElement: HTMLElement,
  movieTitle: string,
  scale: number = 2
): Promise<void> {
  const canvas = await html2canvas(posterElement, {
    scale, // 2x scale produces a crisp ~1040x1560 resolution suitable for printing or messaging
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#11100e',
    logging: false,
    onclone: async (_clonedDoc, clonedElement) => {
      // Ensure the exported element is rendered at full canonical dimensions (520x780)
      clonedElement.style.transform = 'none';
      clonedElement.style.width = '520px';
      clonedElement.style.height = '780px';
      if (clonedElement.parentElement) {
        clonedElement.parentElement.style.width = '520px';
        clonedElement.parentElement.style.height = '780px';
        clonedElement.parentElement.style.overflow = 'visible';
      }
      const overlay = clonedElement.querySelector('.poster-adjust-overlay');
      if (overlay) {
        overlay.remove();
      }

      // Bake the vintage film color filter into the artwork image so html2canvas renders the graded colors
      const originalImg = posterElement.querySelector<HTMLImageElement>('#posterImg');
      const clonedImg = clonedElement.querySelector<HTMLImageElement>('#posterImg');

      if (originalImg && clonedImg && originalImg.naturalWidth > 0) {
        try {
          const filterCanvas = document.createElement('canvas');
          filterCanvas.width = originalImg.naturalWidth;
          filterCanvas.height = originalImg.naturalHeight;
          const ctx = filterCanvas.getContext('2d');
          if (ctx) {
            ctx.filter = 'contrast(108%) brightness(92%) saturate(90%)';
            ctx.drawImage(originalImg, 0, 0);
            const dataUrl = filterCanvas.toDataURL('image/png');
            await new Promise<void>((resolve) => {
              clonedImg.onload = () => resolve();
              clonedImg.onerror = () => resolve();
              clonedImg.src = dataUrl;
              clonedImg.style.filter = 'none';
              if (clonedImg.complete) resolve();
            });
          }
        } catch (e) {
          console.warn('Could not bake image filter due to CORS or canvas error:', e);
        }
      }
    },
  });

  const slug = (movieTitle || 'cine-club-poster')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const downloadFilename = `${slug || 'cine-poster'}-poster.png`;

  const link = document.createElement('a');
  link.download = downloadFilename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Capture a lightweight preview thumbnail (data URL) of the poster for the projects panel
 */
export async function generatePosterThumbnail(
  posterElement: HTMLElement,
  fallbackUrl: string = ''
): Promise<string> {
  try {
    const canvas = await html2canvas(posterElement, {
      scale: 0.35, // Low scale produces a lightweight ~182x273 preview
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#11100e',
      logging: false,
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.transform = 'none';
        clonedElement.style.width = '520px';
        clonedElement.style.height = '780px';
        const overlay = clonedElement.querySelector('.poster-adjust-overlay');
        if (overlay) {
          overlay.remove();
        }
      },
    });
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn('Could not generate canvas thumbnail, falling back to artwork URL:', err);
    return fallbackUrl;
  }
}

