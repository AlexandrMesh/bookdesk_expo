import { ImageSourcePropType } from 'react-native';

import { DEFAULT_COVER } from '~constants/customBooks';

// Local stub — remote default_cover.webp from img server is unreliable
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const DEFAULT_COVER_SOURCE: ImageSourcePropType = require('../assets/default_cover.jpg');

export const isDefaultCover = (coverPath?: string | null): boolean => {
  if (!coverPath) return true;
  const value = String(coverPath).trim();
  if (!value || value === DEFAULT_COVER) return true;
  return /(^|\/)default_cover(\.webp|\.png|\.jpe?g)?$/i.test(value);
};

export const resolveCoverImageSource = (coverPath?: string | null, imgUrl?: string): ImageSourcePropType => {
  if (isDefaultCover(coverPath)) {
    return DEFAULT_COVER_SOURCE;
  }

  const lower = String(coverPath);
  if (lower.startsWith('data:image') || /^https?:\/\//i.test(lower) || lower.startsWith('file:') || lower.startsWith('content:')) {
    return { uri: coverPath as string };
  }

  if (!imgUrl) {
    return DEFAULT_COVER_SOURCE;
  }

  const hasExt = /\.(webp|jpg|jpeg|png)$/i.test(lower);
  const finalPath = hasExt ? coverPath : `${coverPath}.webp`;
  return { uri: `${imgUrl}/${finalPath}` };
};
