import React, { FC } from 'react';

import { Text, View } from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE, ADD_CUSTOM_BOOK_ROUTE, CUSTOM_BOOKS_ROUTE } from '~constants/routes';
import Button from '~UI/Button';

import styles from './styles';

export type Props = {
  shouldNotDisplayContent?: boolean;
  onAddPress?: () => void;
};

const EmptyBoard: FC<Props> = ({ shouldNotDisplayContent = false, onAddPress }) => {
  const { t } = useTranslation(['books', 'common']);
  const navigation = useNavigation<any>();
  const route = useRoute();

  return (
    <View style={styles.wrapper}>
      <View>
        <View style={styles.content}>
          {!shouldNotDisplayContent ? (
            <>
              <Text style={styles.text}>{t('emptyBoard')}</Text>
              <View style={styles.addButtonWrapper}>
                <Button
                  style={styles.addButton}
                  title={t('addBook')}
                  onPress={() => {
                    if (onAddPress) {
                      onAddPress();
                    } else {
                      navigation.navigate(
                        route.name === ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE ? ADD_CUSTOM_BOOK_ROUTE : ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE,
                        {
                          screen: CUSTOM_BOOKS_ROUTE,
                          params: {
                            screen: ADD_CUSTOM_BOOK_ROUTE,
                          },
                        },
                      );
                    }
                  }}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default EmptyBoard;
