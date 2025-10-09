import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE } from '~constants/routes';
import Button from '~UI/Button';
import styles from './styles';

const EmptyResults = () => {
  const { t } = useTranslation(['search', 'books', 'customBook']);
  const navigation = useNavigation<any>();

  return (
    <View style={styles.wrapper}>
      <View style={styles.emptyResultsWrapper}>
        <Text style={styles.label}>{t('noResults')}</Text>
        <View style={styles.addButtonWrapper}>
          <Text style={styles.label}>{t('customBook:addBookManually')}</Text>
          <Button style={styles.addButton} title={t('books:addBook')} onPress={() => navigation.navigate(ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE)} />
        </View>
      </View>
    </View>
  );
};

export default EmptyResults;
