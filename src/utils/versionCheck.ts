import Constants from 'expo-constants';
import * as semver from 'semver';

// URL публичного ресурса Яндекс.Диска с конфигом приложения.
// Из этого ответа берём поле `file` — прямую ссылку на config.json.
const YANDEX_CONFIG_RESOURCE_URL = 'https://cloud-api.yandex.net/v1/disk/public/resources?public_key=https://disk.yandex.ru/d/AoLEwxwE9ksmaw';

export interface RemoteConfig {
  apiUrl: string;
  imgUrl: string;
  minimumSupportedAppVersion: string;
  appVersion: string;
  googlePlayUrl: string;
  underConstruction: string;
  underConstructionMessage: string;
  underConstructionMessageEn: string;
  enabledSupportAppModal: string;
  daysRegisteredUserFromNowToDisplaySupportAppModal: string;
  daysViewedSupportModalFromNowToDisplaySupportAppModal: string;
  appName: string;
  email: string;
  description: string;
  descriptionEn: string;
}

/**
 * Получает текущую версию приложения из expo config
 */
export const getCurrentAppVersion = (): string => {
  return Constants.expoConfig?.version || '1.0.0';
};

/**
 * Получает удалённый конфиг приложения.
 *
 * Шаг 1: запрашиваем метаданные публичного ресурса Яндекс.Диска.
 * Шаг 2: из поля `file` берём прямую ссылку и загружаем сам config.json.
 */
export const fetchRemoteConfig = async (): Promise<RemoteConfig | null> => {
  try {
    // 1. Получаем метаданные публичного ресурса
    const metaResponse = await fetch(YANDEX_CONFIG_RESOURCE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!metaResponse.ok) {
      console.error(`Failed to fetch Yandex Disk resource meta: ${metaResponse.status}`);
      return null;
    }

    const metaData: { file?: string } = await metaResponse.json();

    if (!metaData.file) {
      console.error('Yandex Disk meta does not contain `file` field with config URL');
      return null;
    }

    // 2. Загружаем сам config.json по ссылке из поля `file`
    const configResponse = await fetch(metaData.file, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!configResponse.ok) {
      console.error(`Failed to fetch remote config from file URL: ${configResponse.status}`);
      return null;
    }

    const config: RemoteConfig = await configResponse.json();
    return config;
  } catch (error) {
    console.error('Error fetching remote config:', error);
    return null;
  }
};

/**
 * Сравнивает версии и определяет, доступно ли обновление
 * @param currentVersion - текущая версия приложения
 * @param remoteVersion - версия из удалённого конфига
 * @returns true если remoteVersion > currentVersion
 */
export const isUpdateAvailable = (currentVersion: string, remoteVersion: string): boolean => {
  try {
    // Приводим версии к валидному semver формату
    const cleanCurrent = semver.valid(semver.coerce(currentVersion));
    const cleanRemote = semver.valid(semver.coerce(remoteVersion));

    if (!cleanCurrent || !cleanRemote) {
      console.error('Invalid version format:', { currentVersion, remoteVersion });
      return false;
    }

    return semver.gt(cleanRemote, cleanCurrent);
  } catch (error) {
    console.error('Error comparing versions:', error);
    return false;
  }
};

/**
 * Проверяет наличие обновления приложения
 * @returns объект с информацией об обновлении
 */
export const checkForAppUpdate = async (): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string | null;
  googlePlayUrl: string | null;
}> => {
  const currentVersion = getCurrentAppVersion();

  try {
    const remoteConfig = await fetchRemoteConfig();

    if (!remoteConfig) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
        googlePlayUrl: null,
      };
    }

    const hasUpdate = isUpdateAvailable(currentVersion, remoteConfig.appVersion);

    return {
      hasUpdate,
      currentVersion,
      latestVersion: remoteConfig.appVersion,
      googlePlayUrl: remoteConfig.googlePlayUrl,
    };
  } catch (error) {
    console.error('Error checking for app update:', error);
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: null,
      googlePlayUrl: null,
    };
  }
};
