import axios from 'axios';

import { RU } from '~constants/languages';
import i18n from '~translations/i18n';

export interface ICover {
  coverPath: string;
}

const GOOGLE_SEARCH_API_KEY = 'AIzaSyD0Gx2sBVthtxNrNGLZwQYVpGSeKaBnvUM';
const GOOGLE_SEARCH_ENGINE_ID = '42a8480a652154a54';
const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

/**
 * Загружает предложенные обложки для книги из Google Custom Search API
 * @param bookName - название книги
 * @returns массив обложек с путями
 */
export const loadSuggestedCovers = async (bookName: string): Promise<ICover[]> => {
  try {
    const { language } = i18n;
    const query = language === RU ? `${bookName.trim()} книга` : `${bookName.trim()} book`;
    const gl = language === RU ? 'ru' : 'us';

    const { data } = await axios.get(GOOGLE_SEARCH_API_URL, {
      params: {
        gl,
        searchType: 'image',
        key: GOOGLE_SEARCH_API_KEY,
        q: query,
        cx: GOOGLE_SEARCH_ENGINE_ID,
        num: 10,
      },
    });

    const items =
      (data as unknown as { items?: Array<{ fileFormat?: string; link: string }> }).items
        ?.filter(({ fileFormat }) => fileFormat === 'image/jpeg' || fileFormat === 'image/png' || fileFormat === 'image/webp')
        .map(({ link }) => ({
          coverPath: link,
        })) || [];

    return items;
  } catch (error) {
    console.error('Error loading suggested covers:', error);
    throw error;
  }
};
