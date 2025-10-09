import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

const useDisplayAlert = (onConfirm: any) => {
  const { t } = useTranslation('common');

  const createAlert = useCallback(
    () =>
      Alert.alert(t('confirmationDeleteTitle'), t('confirmationDeleteDescription'), [
        {
          text: t('cancel'),
        },
        { text: t('confirm'), onPress: onConfirm },
      ]),
    [t, onConfirm],
  );

  return createAlert;
};

export default useDisplayAlert;
