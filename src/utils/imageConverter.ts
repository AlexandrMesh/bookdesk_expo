/**
 * Конвертация Uint8Array в base64 строку
 * Работает в React Native
 */
const uint8ArrayToBase64 = (uint8Array: Uint8Array): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < uint8Array.length) {
    const a = uint8Array[i++];
    const b = i < uint8Array.length ? uint8Array[i++] : 0;
    const c = i < uint8Array.length ? uint8Array[i++] : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < uint8Array.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < uint8Array.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
};

/**
 * Конвертация изображения в base64 data URI
 * Работает в React Native через fetch и arrayBuffer
 */
export const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}, status: ${response.status}`);
      return null;
    }

    // В React Native используем arrayBuffer вместо blob
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Конвертируем в base64
    const base64 = uint8ArrayToBase64(uint8Array);

    // Определяем MIME тип из заголовков ответа или по расширению
    const contentType = response.headers.get('content-type') || 'image/webp';
    const base64String = `data:${contentType};base64,${base64}`;

    return base64String;
  } catch (error) {
    console.error(`Error converting image to base64: ${imageUrl}`, error);
    return null;
  }
};

/**
 * Конвертация обложки книги в base64 data URI
 * Если обложка уже в формате data:image, возвращает её без изменений
 */
export const convertBookCoverToBase64 = async (coverPath: string, imgUrl: string): Promise<string | null> => {
  try {
    // Если обложка уже в формате data:image, возвращаем её
    if (coverPath.startsWith('data:image')) {
      return coverPath;
    }

    // Если это абсолютный URL, используем его напрямую
    if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) {
      return await convertImageToBase64(coverPath);
    }

    // Формируем URL для относительного пути
    const hasWebpExtension = coverPath.endsWith('.webp');
    const finalCoverPath = hasWebpExtension ? coverPath : `${coverPath}.webp`;
    const fullUrl = `${imgUrl}/${finalCoverPath}`;

    return await convertImageToBase64(fullUrl);
  } catch (error) {
    console.error(`Error converting book cover to base64: ${coverPath}`, error);
    return null;
  }
};

