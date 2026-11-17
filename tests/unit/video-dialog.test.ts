// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { setupVideoDialog } from '../../src/scripts/video-dialog';

const ID = 'DkHlmyuQFbU';

beforeEach(() => {
  document.body.innerHTML = `
    <a class="lite-yt" href="https://www.youtube.com/watch?v=${ID}" target="_blank" rel="noopener"
       data-embed="https://www.youtube-nocookie.com/embed/${ID}?autoplay=1" data-title="Push Me"
       aria-label="Play video: Push Me">thumb</a>
    <dialog class="video-dialog" aria-label="Video">
      <div class="video-dialog-frame"></div>
      <a class="video-dialog-youtube" target="_blank" rel="noopener" href="#">Watch on YouTube</a>
      <button type="button" data-close>Close</button>
    </dialog>`;
  setupVideoDialog(document);
});

const link = () => document.querySelector<HTMLAnchorElement>('a.lite-yt')!;
const dialog = () => document.querySelector<HTMLDialogElement>('dialog.video-dialog')!;
const click = (init: MouseEventInit = {}) => {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  link().dispatchEvent(e);
  return e;
};

describe('video pop-up', () => {
  it('opens the pop-up with the no-cookie player instead of following the link', () => {
    const e = click();
    expect(e.defaultPrevented).toBe(true);
    expect(dialog().open).toBe(true);
    const frame = dialog().querySelector('iframe')!;
    expect(frame.getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${ID}?autoplay=1`);
    expect(frame.getAttribute('title')).toBe('Push Me');
    expect(frame.getAttribute('allow')).toContain('autoplay');
  });

  it('names the pop-up after the video and offers it on YouTube', () => {
    click();
    expect(dialog().getAttribute('aria-label')).toBe('Push Me');
    expect(dialog().querySelector('a.video-dialog-youtube')!.getAttribute('href')).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });

  it('stops the video and returns focus to the thumbnail when closed', () => {
    click();
    (dialog().querySelector('[data-close]') as HTMLButtonElement).click();
    expect(dialog().open).toBe(false);
    expect(dialog().querySelector('iframe')).toBeNull();
    expect(document.activeElement).toBe(link());
  });

  it('lets a ctrl/cmd-click or middle-click open YouTube in a new tab as usual', () => {
    expect(click({ ctrlKey: true }).defaultPrevented).toBe(false);
    expect(click({ metaKey: true }).defaultPrevented).toBe(false);
    expect(dialog().open).toBe(false);
  });

  it('does nothing without the pop-up in the page (the link still works)', () => {
    document.body.innerHTML = `<a class="lite-yt" href="https://www.youtube.com/watch?v=${ID}" data-embed="x">thumb</a>`;
    setupVideoDialog(document);
    expect(click().defaultPrevented).toBe(false);
  });
});
