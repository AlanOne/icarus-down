import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\s*([^;]+);`));
  if (!m) throw new Error(`tokens.css has no --${name}`);
  return m[1].trim();
}

function luminance(hex: string): number {
  const [r, g, b] = hex.replace('#', '').match(/../g)!.map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('design tokens', () => {
  it('defines every token the plan names', () => {
    const names = [
      'color-bg', 'color-text', 'color-accent', 'color-muted', 'font-display', 'font-body',
      'step--1', 'step-0', 'step-1', 'step-2', 'step-3', 'step-4',
      'space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6', 'space-7', 'space-8',
      'radius', 'max-width',
    ];
    for (const n of names) expect(() => token(n), n).not.toThrow();
  });

  it.each([
    ['color-text', 'color-bg'],
    ['color-muted', 'color-bg'],
    ['color-accent', 'color-bg'],
    ['color-accent-2', 'color-bg'],
    ['color-bg', 'color-accent'], // dark text on accent buttons
  ])('%s on %s meets WCAG AA (4.5:1)', (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps hero text readable over any photo, even pure white (scrim)', () => {
    // Text on the hero photo always sits on --hero-scrim (bg color at this opacity).
    // Worst case is a white photo behind it: blend bg over white and check the contrast.
    const alpha = parseFloat(token('hero-scrim'));
    const [br, bgc, bb] = token('color-bg').replace('#', '').match(/../g)!.map((c) => parseInt(c, 16));
    const mix = (c: number) => Math.round(alpha * c + (1 - alpha) * 255).toString(16).padStart(2, '0');
    const worst = `#${mix(br)}${mix(bgc)}${mix(bb)}`;
    expect(contrast(token('color-text'), worst)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('color-muted'), worst)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('color-bg'), token('color-accent'))).toBeGreaterThanOrEqual(4.5);
  });
});
