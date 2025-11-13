import React, { FC } from 'react';

import { Alert, ScrollView, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { ABOUT_ROUTE } from '~constants/routes';
import { SECONDARY } from '~constants/themes';
import { useAppUpdates } from '~hooks/useAppUpdates';
import { resetData } from '~redux/actions/authActions';
import { getRegistered, getUserEmail } from '~redux/selectors/auth';
import Button from '~UI/Button';

import LanguageSettings from './LanguageSettings';
import styles from './styles';

type Props = {
  isUpdateAvailable?: boolean;
  googlePlayUrl: string;
};

const Profile: FC<Props> = ({ isUpdateAvailable, googlePlayUrl }) => {
  const { t, i18n } = useTranslation(['profile', 'common', 'app']);
  const navigation = useNavigation<any>();

  const { language } = i18n;

  const dispatch = useAppDispatch();
  const _resetData = () => {
    Alert.alert(
      t('resetDataTitle'),
      t('resetDataConfirm'),
      [
        {
          text: t('common:cancel', { defaultValue: 'Отмена' }),
          style: 'cancel',
        },
        {
          text: t('resetData'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(resetData()).unwrap();
              Alert.alert(t('resetDataTitle'), t('resetDataSuccess'));
            } catch (error) {
              Alert.alert(t('resetDataTitle'), t('resetDataError'));
              console.error('Error resetting data:', error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const email = useAppSelector(getUserEmail);
  const registered = useAppSelector(getRegistered);
  const { downloadAndInstallUpdate, isDownloading } = useAppUpdates();

  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <Text style={styles.label}>
          {t('email')} <Text style={styles.value}>{email}</Text>
        </Text>
        <Text style={styles.label}>
          {t('registered')} <Text style={styles.value}>{new Date(Number(registered)).toLocaleDateString(language)}</Text>
        </Text>
        <View>
          <Text style={[styles.label, styles.mTop]}>{t('app:appLanguage')}</Text>
          <LanguageSettings />
        </View>
      </View>
      <View style={styles.buttonsWrapper}>
        <View style={styles.buttons}>
          <ScrollView>
            {isUpdateAvailable && (
              <View style={styles.marginBottom}>
                <Text style={[styles.updateLabel]}>{t('newVersionAvailable')}</Text>
                <Button
                  disabled={isDownloading}
                  onPress={downloadAndInstallUpdate}
                  title={isDownloading ? t('common:downloading', { defaultValue: 'Загрузка...' }) : t('common:update')}
                />
              </View>
            )}
            <Button theme={SECONDARY} style={styles.marginBottom} onPress={() => navigation.navigate(ABOUT_ROUTE)} title={t('aboutApp')} />
            <Button theme={SECONDARY} onPress={_resetData} title={t('resetData')} />
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default Profile;
