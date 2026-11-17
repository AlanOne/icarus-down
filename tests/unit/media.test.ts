import { describe, expect, it } from 'vitest';
import { resolveMedia } from '../../src/lib/media';

describe('resolveMedia', () => {
  it('resolves a stored media path', () => {
    const img = resolveMedia('/src/assets/media/zagorje-2026-singer.jpg');
    expect(img?.width).toBeGreaterThan(0);
  });

  it('resolves a stored media path, including spaces and upper-case extensions', () => {
    const img = resolveMedia('/src/assets/media/Zagorje 2026 Stage.JPG');
    expect(img?.width).toBeGreaterThan(0);
    expect(img?.height).toBeGreaterThan(0);
  });

  it('returns undefined for a missing media path', () => {
    expect(resolveMedia('/src/assets/media/nope.jpg')).toBeUndefined();
  });

  it('returns undefined for an empty path', () => {
    expect(resolveMedia('')).toBeUndefined();
  });
});
