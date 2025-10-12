import { useCallback, useEffect, useState } from 'react';

import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

/**
 * Хук для работы с EAS Updates
 * Позволяет проверять и устанавливать обновления в приложении
 */

interface UpdateInfo {
  isUpdateAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  currentUpdateId: string | undefined;
  channel: string | undefined;
  error: string | undefined;
}

export const useAppUpdates = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    isUpdateAvailable: false,
    isChecking: false,
    isDownloading: false,
    currentUpdateId: Updates.updateId ?? undefined,
    channel: Updates.channel ?? undefined,
    error: undefined,
  });

  const isExpoGo = Constants.appOwnership === 'expo';

  // Проверить наличие обновлений
  const checkForUpdates = useCallback(async () => {
    if (isExpoGo || !Updates.isEnabled) {
      return;
    }

    setUpdateInfo((prev) => ({ ...prev, isChecking: true, error: undefined }));

    try {
      const update = await Updates.checkForUpdateAsync();

      setUpdateInfo((prev) => ({
        ...prev,
        isUpdateAvailable: update.isAvailable,
        isChecking: false,
      }));

      return update.isAvailable;
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        error: 'Ошибка проверки обновлений',
      }));
      return false;
    }
  }, [isExpoGo]);

  // Загрузить и установить обновление
  const downloadAndInstallUpdate = useCallback(async () => {
    if (isExpoGo || !Updates.isEnabled) {
      return;
    }

    setUpdateInfo((prev) => ({ ...prev, isDownloading: true, error: undefined }));

    try {
      // Загрузить обновление
      const fetchResult = await Updates.fetchUpdateAsync();

      if (fetchResult.isNew) {
        // Перезапустить приложение с новым обновлением
        await Updates.reloadAsync();
      } else {
        setUpdateInfo((prev) => ({
          ...prev,
          isDownloading: false,
          isUpdateAvailable: false,
        }));
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        isDownloading: false,
        error: 'Ошибка загрузки обновления',
      }));
    }
  }, [isExpoGo]);

  // Проверить и установить обновление одной командой
  const checkAndInstallUpdate = useCallback(async () => {
    if (isExpoGo || !Updates.isEnabled) {
      return false;
    }

    try {
      const isAvailable = await checkForUpdates();

      if (isAvailable) {
        await downloadAndInstallUpdate();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in checkAndInstallUpdate:', error);
      return false;
    }
  }, [checkForUpdates, downloadAndInstallUpdate, isExpoGo]);

  // Автоматическая проверка при монтировании (опционально)
  useEffect(() => {
    // Раскомментируйте, если хотите автоматически проверять обновления при запуске
    // checkForUpdates();
  }, []);

  return {
    ...updateInfo,
    checkForUpdates,
    downloadAndInstallUpdate,
    checkAndInstallUpdate,
    isExpoGo,
    isUpdatesEnabled: Updates.isEnabled,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch, // true если первый запуск, false если запущено после update
  };
};
