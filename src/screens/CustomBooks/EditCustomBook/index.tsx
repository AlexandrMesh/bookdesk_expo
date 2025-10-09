import React, { useState } from 'react';
import { ScrollView, View, ToastAndroid, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import uniqueId from 'lodash/uniqueId';
import { Spinner } from '~UI/Spinner';
import { SECONDARY } from '~constants/themes';
import { CLOSE_ICON } from '~constants/dimensions';
import { getValidationFailure, validationTypes } from '~utils/validation';
import Input from '~UI/TextInput';
import Button from '~UI/Button';
import CloseIcon from '~assets/close.svg';
import colors from '~styles/colors';
import { useAppDispatch } from '~hooks';
import { updateUserCustomBook } from '~redux/actions/customBookActions';
import { BookStatus } from '~types/books';
import styles from './styles';

type ParamList = {
  EditCustomBook: {
    bookId: string;
    title: string;
    pages: string;
    authorsList: string[];
    annotation: string;
    bookStatus: BookStatus;
  };
};

const showToast = (message: string) => {
  ToastAndroid.show(message, ToastAndroid.SHORT);
};

const EditCustomBook = () => {
  const { t } = useTranslation(['customBook, common, books, categories, errors']);

  const { params } = useRoute<RouteProp<ParamList, 'EditCustomBook'>>();

  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const [_title, setTitle] = useState<string | null>(params.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [_pages, setPages] = useState<string | null>(params.pages.toString());
  const [authors, setAuthors] = useState(params.authorsList.map((item: string) => ({ id: uniqueId(), name: item, error: null })));
  const [_annotation, setAnnotation] = useState(params.annotation);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [annotationError, setAnnotationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isValidForm = !titleError && !pagesError && !annotationError && authors.length > 0 && authors.every((item: any) => item.name && !item.error);

  const handleAddAuthor = () => {
    setAuthors([...authors, { id: uniqueId(), name: '', error: null }]);
  };

  const updateAuthor = (id: string, name: string | null, error: string | null) =>
    setAuthors(authors.map((item: any) => (item.id === id ? { ...item, name, error } : item)));

  const removeAuthor = (id: string) => setAuthors(authors.filter((item: any) => item.id !== id));

  const handleAuthorChange = (value: string, id: string) => {
    const params = {
      minLength: 6,
      maxLength: 64,
    };
    const error = getValidationFailure(
      value,
      [validationTypes.mustContainOnlyLetters, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    updateAuthor(id, value, error ? t(`errors:${error}`, params) : null);
  };

  const handleChangeTitle = (value: string) => {
    const params = { minLength: 3, maxLength: 64 };
    const error = getValidationFailure(
      value,
      [validationTypes.containsSpecialCharacters, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    if (error) {
      setTitleError(t(`errors:${error}`, params));
    } else {
      setTitle(value);
      setTitleError(null);
    }
  };

  const handleChangePages = (value: string) => {
    const params = {
      minLength: 2,
      maxLength: 5,
    };
    const error = getValidationFailure(
      value,
      [validationTypes.mustContainOnlyNumbers, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    if (error) {
      setPagesError(t(`errors:${error}`, params));
    } else {
      setPages(value);
      setPagesError(null);
    }
  };

  const handleChangeAnnotation = (value: string) => {
    setAnnotationError(null);
    setAnnotation(value);
  };

  const validateAnnotation = () => {
    const params = {
      minLength: 100,
      maxLength: 1000,
    };
    const error = getValidationFailure(
      _annotation,
      [validationTypes.containsSpecialCharacters, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    if (error) {
      setAnnotationError(t(`errors:${error}`, params));
    }
    return !error;
  };

  const handleEditBook = async () => {
    const isAnnotationValid = validateAnnotation();

    if (isAnnotationValid) {
      setIsSaving(true);
      try {
        await dispatch(
          updateUserCustomBook({
            bookId: params.bookId,
            title: _title as string,
            pages: _pages as string,
            authorsList: authors.map((item) => item.name),
            annotation: _annotation,
            bookStatus: params.bookStatus,
          }),
        );
        navigation.goBack();
        showToast(t('customBook:bookSuccessfullyUpdated'));
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <ScrollView style={styles.inputWrapper} keyboardShouldPersistTaps='handled'>
          <View>
            <Text style={styles.subTitle}>
              {t('customBook:bookTitle')}
              {t('common:required')}
            </Text>
            <Input
              placeholder={t('customBook:enterBookTitle')}
              disabled={isSaving}
              onChangeText={handleChangeTitle}
              value={_title as string}
              error={titleError}
              shouldDisplayClearButton={!!_title}
              onClear={() => setTitle(null)}
            />
          </View>

          <View>
            <Text style={styles.subTitle}>
              {t('customBook:pages')}
              {t('common:required')}
            </Text>
            <Input
              placeholder={t('customBook:enterPagesCount')}
              disabled={isSaving}
              onChangeText={handleChangePages}
              value={_pages as string}
              error={pagesError}
              shouldDisplayClearButton={!!_pages}
              onClear={() => setPages(null)}
              inputMode='numeric'
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.subTitle}>
              {t('customBook:authorsList')}
              {t('common:required')}
            </Text>
            {authors.map(({ id, name, error }) => (
              <View style={styles.authorWrapper} key={id}>
                <Input
                  wrapperClassName={styles.authorsNameInputWrapper}
                  disabled={isSaving}
                  placeholder={t('customBook:enterAuthorsName')}
                  onChangeText={(value) => handleAuthorChange(value, id)}
                  value={name as string}
                  error={error}
                  shouldDisplayClearButton={!!name}
                  onClear={() => updateAuthor(id, '', null)}
                />
                <Pressable style={styles.removeAuthorButton} onPress={() => removeAuthor(id)}>
                  <CloseIcon width={CLOSE_ICON.width} height={CLOSE_ICON.height} fill={colors.neutral_light} />
                </Pressable>
              </View>
            ))}

            <Button
              disabled={authors.length > 2 || isSaving}
              style={[styles.button, styles.addAuthorButton]}
              onPress={handleAddAuthor}
              title={t(authors.length > 0 ? 'customBook:addAnotherAuthor' : 'customBook:addAuthor')}
            />
          </View>

          <View style={styles.block}>
            <View style={styles.annotationLabelWrapper}>
              <Text style={styles.subTitle}>
                {t('customBook:annotation')}
                {t('common:required')}
              </Text>
              {_annotation && <Text style={styles.subTitle}>{t('common:charactersCount', { count: _annotation.length, maxCount: 100 })}</Text>}
            </View>

            <Input
              placeholder={t('customBook:enterAnnotation')}
              disabled={isSaving}
              wrapperClassName={styles.annotationWrapperClassName}
              className={styles.annotationInput}
              onChangeText={handleChangeAnnotation}
              value={_annotation}
              error={annotationError}
              shouldDisplayClearButton={!!_annotation}
              onClear={() => setAnnotation('')}
              multiline
              numberOfLines={5}
            />
          </View>
        </ScrollView>

        <View>
          <Text style={styles.tip}>{t('common:requiredFields')}</Text>
          <View style={styles.footerButtonsWrapper}>
            <Button disabled={isSaving} theme={SECONDARY} style={styles.footerButton} onPress={() => navigation.goBack()} title={t('common:back')} />
            <Button
              icon={isSaving ? <Spinner size='small' /> : undefined}
              style={styles.footerButton}
              disabled={!isValidForm || isSaving}
              onPress={handleEditBook}
              title={t('common:save')}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default EditCustomBook;
