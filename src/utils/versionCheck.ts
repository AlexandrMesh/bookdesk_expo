import Constants from 'expo-constants';
import * as semver from 'semver';

const CONFIG_URL = 'https://omegaprokat.ru/bookdesk/config.json';

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
 * Получает удалённый конфиг приложения
 */
export const fetchRemoteConfig = async (): Promise<RemoteConfig | null> => {
  try {
    const response = await fetch(CONFIG_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch remote config: ${response.status}`);
      return null;
    }

    const config: RemoteConfig = await response.json();
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

