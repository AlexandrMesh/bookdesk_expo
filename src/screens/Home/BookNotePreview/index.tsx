import React, { FC } from 'react';
import { TouchableHighlight, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import isEmpty from 'lodash/isEmpty';
import { useNavigation } from '@react-navigation/native';
import { BOOK_NOTE_ROUTE } from '~constants/routes';
import { useAppSelector } from '~hooks';
import { deriveBookNote } from '~redux/selectors/books';
import ArrowDown from '~assets/arrow-down.svg';
import styles from './styles';

export type Props = {
  bookId: string;
  bookTitle?: string;
  numberOfLines?: number;
  fontSize?: number;
};

const BookNotePreview: FC<Props> = ({ bookId, bookTitle, numberOfLines = 2, fontSize = 14 }) => {
  const { t, i18n } = useTranslation(['books', 'common']);
  const navigation = useNavigation<any>();
  const { language } = i18n;
  const bookNote = useAppSelector(deriveBookNote(bookId));
  const bookNoteContent = bookNote?.comment;
  const bookNoteAdded = new Date(bookNote?.added as number).toLocaleDateString(language);

  return (
    <TouchableHighlight
      style={styles.info}
      onPress={() => navigation.navigate(BOOK_NOTE_ROUTE, { bookTitle, bookId, shouldOpenEditableMode: isEmpty(bookNote) })}
    >
      {bookNoteContent ? (
        <View>
          <View style={styles.wraper}>
            <Text style={[styles.mediumColor, { fontSize }]}>{t('bookNote')}</Text>
            <Text style={[styles.lightColor, { fontSize }]}>{bookNoteAdded}</Text>
          </View>
          <View style={styles.noteWrapper}>
            <View style={styles.textWrapper}>
              <Text numberOfLines={numberOfLines} style={[styles.lightColor, styles.italic, { fontSize }]}>
                {bookNoteContent}
              </Text>
            </View>
            <View style={styles.arrowWrapper}>
              <ArrowDown style={styles.arrowIcon} width={16} height={16} />
            </View>
          </View>
        </View>
      ) : (
        <Text style={[styles.mediumColor, { fontSize }]}>
          {t('bookNote')} <Text style={[styles.lightColor, { fontSize }]}>{t('common:add')}</Text>
        </Text>
      )}
    </TouchableHighlight>
  );
};

export default BookNotePreview;
