import axios from 'axios';

import { RU } from '~constants/languages';
import i18n from '~translations/i18n';

export interface ICover {
  coverPath: string;
}

const OL_SEARCH = 'https://openlibrary.org/search.json';
const REQUEST_TIMEOUT = 12000;

const coverUrlFromId = (coverId: number, size: 'M' | 'L' = 'L') => `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;

/**
 * Suggested covers from Open Library (keyless).
 */
export const loadSuggestedCovers = async (bookName: string): Promise<ICover[]> => {
  const title = bookName.trim();
  if (!title) return [];

  try {
    const isRu = (i18n.language || '').toLowerCase().startsWith(RU);
    const fieldList = 'key,title,cover_i,edition_count';

    const queries: Array<Record<string, string | number>> = [
      { title, limit: 24, fields: fieldList, ...(isRu ? { language: 'rus' } : {}) },
      { q: title, limit: 24, fields: fieldList },
      { title, limit: 24, fields: fieldList },
    ];

    const seen = new Set<number>();
    const covers: ICover[] = [];

    for (const params of queries) {
      if (covers.length >= 12) break;
      const { data } = await axios.get(OL_SEARCH, {
        params,
        timeout: REQUEST_TIMEOUT,
        headers: { Accept: 'application/json' },
      });
      const docs: Array<{ cover_i?: number; title?: string }> = Array.isArray(data?.docs) ? data.docs : [];
      for (const doc of docs) {
        if (!doc?.cover_i || seen.has(doc.cover_i)) continue;
        seen.add(doc.cover_i);
        covers.push({ coverPath: coverUrlFromId(doc.cover_i, 'L') });
        if (covers.length >= 12) break;
      }
    }

    return covers;
  } catch (error) {
    console.error('Error loading suggested covers from Open Library:', error);
    throw error;
  }
};
