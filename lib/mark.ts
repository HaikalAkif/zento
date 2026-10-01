// The Zento mark: a lowercase z whose top stroke is the amount (ink) and whose bottom
// stroke is the result (mint), the same story the converter tells. One geometry,
// drawn as the SVG favicon, the header mark and the generated PNG app icons.

export const MARK = {
  paper: '#0d110f',
  ink: '#ece7da',
  accent: '#7fd1a8',
  /** On a 32-unit grid */
  top: 'M9 10.5H23',
  diagonal: 'M22 11.5L10 21.5',
  bottom: 'M9 22.5H23',
  stroke: 3.2,
} as const;

/**
 * The full SVG, on its rounded tile, for any square size. `mono` draws every stroke in
 * one colour (notification badges are drawn from the alpha channel only).
 */
export function markSvg({ tile = true, mono }: { tile?: boolean; mono?: string } = {}): string {
  const { paper, top, diagonal, bottom, stroke } = MARK;
  const ink = mono ?? MARK.ink;
  const accent = mono ?? MARK.accent;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${
    tile ? `<rect width="32" height="32" rx="7.5" fill="${paper}"/>` : ''
  }<g fill="none" stroke-width="${stroke}" stroke-linecap="round"><path d="${top}" stroke="${ink}"/><path d="${diagonal}" stroke="${ink}"/><path d="${bottom}" stroke="${accent}"/></g></svg>`;
}
