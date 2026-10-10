export interface VimeoVideo {
  id: string;
  hash?: string;
  watchUrl: string;
  embedUrl: string;
}

export const parseVimeoVideo = (
  input: string,
  h?: string,
): VimeoVideo | null => {
  const match =
    /^(?:https?:\/\/(?:(?:www\.)?vimeo\.com\/|player\.vimeo\.com\/video\/))?([1-9]\d*)(?:\/([a-zA-Z0-9]+))?\/?(?:\?([^#]*))?(?:#.*)?$/i.exec(
      input.trim(),
    );

  if (!match) return null;

  const id = match[1];
  const hashes: string[] = [];

  if (match[2]) hashes.push(match[2]);
  if (h !== undefined) hashes.push(h.trim());

  try {
    for (const part of (match[3] ?? '').split('&')) {
      const [name, ...value] = part.split('=');

      if (decodeURIComponent(name) === 'h') {
        hashes.push(decodeURIComponent(value.join('=')));
      }
    }
  } catch {
    return null;
  }

  if (
    hashes.some((hash) => !/^[a-zA-Z0-9]+$/.test(hash)) ||
    new Set(hashes).size > 1
  ) {
    return null;
  }

  const hash = hashes[0];

  return {
    id,
    hash,
    watchUrl: `https://vimeo.com/${id}${hash ? `/${hash}` : ''}`,
    embedUrl: `https://player.vimeo.com/video/${id}${
      hash ? `?h=${encodeURIComponent(hash)}` : ''
    }`,
  };
};
