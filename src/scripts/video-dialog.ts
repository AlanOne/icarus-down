// Video pop-up: a click on a video thumbnail (a plain link to YouTube) opens the
// no-cookie player in a modal dialog instead. Without JavaScript, or with ctrl/cmd-click,
// the link simply opens the video on YouTube in a new tab.

export function setupVideoDialog(root: Document): void {
  const dialog = root.querySelector<HTMLDialogElement>('dialog.video-dialog');
  if (!dialog) return;
  const frameBox = dialog.querySelector<HTMLElement>('.video-dialog-frame')!;
  const youtube = dialog.querySelector<HTMLAnchorElement>('a.video-dialog-youtube');
  let opener: HTMLElement | null = null;

  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-embed]')) {
    link.addEventListener('click', (e) => {
      // Let the browser handle "open in new tab" gestures.
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const title = link.dataset.title ?? 'Video';
      const frame = root.createElement('iframe');
      frame.setAttribute('src', link.dataset.embed!);
      frame.setAttribute('title', title);
      frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      frame.setAttribute('allowfullscreen', '');
      frameBox.replaceChildren(frame);
      dialog.setAttribute('aria-label', title);
      if (youtube) youtube.setAttribute('href', link.href);
      opener = link;
      dialog.showModal();
    });
  }

  const close = () => dialog.close();
  dialog.querySelector('[data-close]')?.addEventListener('click', close);
  // A click on the dark backdrop (the dialog element itself, outside its content) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  // However it closes (button, Esc, backdrop): stop the video and go back to the thumbnail.
  dialog.addEventListener('close', () => {
    frameBox.replaceChildren();
    opener?.focus();
  });
}

if (typeof document !== 'undefined') setupVideoDialog(document);
