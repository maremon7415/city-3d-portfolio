/** Thin typed wrapper around the inline loader defined in index.html. */
interface InlineLoader {
  set: (p: number, text?: string) => void
  onReady: (cb?: () => void) => void
  hide: () => void
}

const w = window as unknown as { __loader?: InlineLoader }

export const loader: InlineLoader = {
  set: (p, text) => w.__loader?.set(p, text),
  onReady: (cb) => w.__loader?.onReady(cb),
  hide: () => w.__loader?.hide(),
}

export function loaderButtons() {
  return {
    enter: document.getElementById('ld-enter') as HTMLButtonElement | null,
    enterSound: document.getElementById('ld-enter-sound') as HTMLButtonElement | null,
    skip: document.getElementById('ld-skip') as HTMLButtonElement | null,
  }
}
