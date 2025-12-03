import { useCallback, useEffect, useState } from 'react';

import { Linking, Platform } from 'react-native';

import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import i18n from '~translations/i18n';
import { checkForAppUpdate, getCurrentAppVersion } from '~utils/versionCheck';

import useNetworkStatus from './useNetworkStatus';

/**
 * Хук для работы с обновлениями приложения
 * - Проверяет EAS Updates для OTA обновлений
 * - Проверяет версию с удалённого config.json для нативных обновлений
 */

interface UpdateInfo {
  // EAS Updates
  isEASUpdateAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  currentUpdateId: string | undefined;
  channel: string | undefined;
  easError: string | undefined;
  // Native version check (config.json)
  isNativeUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string | null;
  googlePlayUrl: string | null;
  // Combined
  isUpdateAvailable: boolean;
}

export const useAppUpdates = () => {
  const isOnline = useNetworkStatus();

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    // EAS Updates
    isEASUpdateAvailable: false,
    isChecking: false,
    isDownloading: false,
    currentUpdateId: Updates.updateId ?? undefined,
    channel: Updates.channel ?? undefined,
    easError: undefined,
    // Native version check
    isNativeUpdateAvailable: false,
    currentVersion: getCurrentAppVersion(),
    latestVersion: null,
    googlePlayUrl: null,
    // Combined
    isUpdateAvailable: false,
  });

  const isExpoGo = Constants.appOwnership === 'expo';

  // Проверить наличие EAS обновлений
  const checkForEASUpdates = useCallback(async () => {
    if (isExpoGo || !Updates.isEnabled) {
      return false;
    }

    setUpdateInfo((prev) => ({ ...prev, isChecking: true, easError: undefined }));

    try {
      const update = await Updates.checkForUpdateAsync();

      setUpdateInfo((prev) => ({
        ...prev,
        isEASUpdateAvailable: update.isAvailable,
        isChecking: false,
        isUpdateAvailable: update.isAvailable || prev.isNativeUpdateAvailable,
      }));

      return update.isAvailable;
    } catch (error) {
      console.error('Error checking for EAS updates:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        easError: i18n.t('app:updateCheckError'),
      }));
      return false;
    }
  }, [isExpoGo]);

  // Проверить наличие нативного обновления (через config.json)
  const checkForNativeUpdate = useCallback(async () => {
    if (!isOnline) {
      return false;
    }

    setUpdateInfo((prev) => ({ ...prev, isChecking: true }));

    try {
      const result = await checkForAppUpdate();

      setUpdateInfo((prev) => ({
        ...prev,
        isNativeUpdateAvailable: result.hasUpdate,
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        googlePlayUrl: result.googlePlayUrl,
        isChecking: false,
        isUpdateAvailable: result.hasUpdate || prev.isEASUpdateAvailable,
      }));

      return result.hasUpdate;
    } catch (error) {
      console.error('Error checking for native update:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
      }));
      return false;
    }
  }, [isOnline]);

  // Комбинированная проверка обновлений
  const checkForUpdates = useCallback(async () => {
    const [easAvailable, nativeAvailable] = await Promise.all([checkForEASUpdates(), checkForNativeUpdate()]);

    return easAvailable || nativeAvailable;
  }, [checkForEASUpdates, checkForNativeUpdate]);

  // Загрузить и установить EAS обновление
  const downloadAndInstallUpdate = useCallback(async () => {
    if (isExpoGo || !Updates.isEnabled) {
      return;
    }

    setUpdateInfo((prev) => ({ ...prev, isDownloading: true, easError: undefined }));

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
          isEASUpdateAvailable: false,
          isUpdateAvailable: prev.isNativeUpdateAvailable,
        }));
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        isDownloading: false,
        easError: i18n.t('app:updateDownloadError'),
      }));
    }
  }, [isExpoGo]);

  // Открыть Google Play для нативного обновления
  const openGooglePlay = useCallback(async () => {
    const url = updateInfo.googlePlayUrl;
    if (!url) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening Google Play:', error);
    }
  }, [updateInfo.googlePlayUrl]);

  // Обработчик обновления - выбирает подходящий способ
  const handleUpdate = useCallback(async () => {
    // Приоритет: EAS Updates -> Google Play
    if (updateInfo.isEASUpdateAvailable) {
      await downloadAndInstallUpdate();
    } else if (updateInfo.isNativeUpdateAvailable && Platform.OS === 'android') {
      await openGooglePlay();
    }
  }, [updateInfo.isEASUpdateAvailable, updateInfo.isNativeUpdateAvailable, downloadAndInstallUpdate, openGooglePlay]);

  // Проверить и установить обновление одной командой
  const checkAndInstallUpdate = useCallback(async () => {
    if (isExpoGo || !Updates.isEnabled) {
      // Если EAS недоступен, проверяем только нативное обновление
      return checkForNativeUpdate();
    }

    try {
      const isAvailable = await checkForUpdates();

      if (updateInfo.isEASUpdateAvailable) {
        await downloadAndInstallUpdate();
        return true;
      }

      return isAvailable;
    } catch (error) {
      console.error('Error in checkAndInstallUpdate:', error);
      return false;
    }
  }, [checkForUpdates, checkForNativeUpdate, downloadAndInstallUpdate, updateInfo.isEASUpdateAvailable, isExpoGo]);

  // Автоматическая проверка при монтировании и при появлении интернета
  useEffect(() => {
    if (isOnline) {
      checkForNativeUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return {
    ...updateInfo,
    checkForUpdates,
    checkForEASUpdates,
    checkForNativeUpdate,
    downloadAndInstallUpdate,
    openGooglePlay,
    handleUpdate,
    checkAndInstallUpdate,
    isExpoGo,
    isUpdatesEnabled: Updates.isEnabled,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
};
