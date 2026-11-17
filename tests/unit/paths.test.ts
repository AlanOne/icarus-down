import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { url } from '../../src/lib/paths';

describe('url', () => {
  beforeEach(() => vi.stubEnv('BASE_URL', '/icarus-down/'));
  afterEach(() => vi.unstubAllEnvs());

  it('prefixes a relative path with the base', () => {
    expect(url('press/')).toBe('/icarus-down/press/');
  });

  it('keeps exactly one slash when the path starts with /', () => {
    expect(url('/press/')).toBe('/icarus-down/press/');
  });

  it('returns the base for an empty path', () => {
    expect(url('')).toBe('/icarus-down/');
  });

  it('returns absolute http(s) URLs unchanged', () => {
    expect(url('https://open.spotify.com/x')).toBe('https://open.spotify.com/x');
    expect(url('http://example.com/a')).toBe('http://example.com/a');
  });

  it('returns mailto: and tel: URLs unchanged', () => {
    expect(url('mailto:booking@example.com')).toBe('mailto:booking@example.com');
    expect(url('tel:+38640123456')).toBe('tel:+38640123456');
  });

  it('works when the base has no trailing slash', () => {
    vi.stubEnv('BASE_URL', '/icarus-down');
    expect(url('press/')).toBe('/icarus-down/press/');
  });
});
