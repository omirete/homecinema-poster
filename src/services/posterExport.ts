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
