import React from 'react';

import { ScrollView, View, Pressable, Text } from 'react-native';

import { useBackHandler } from '@react-native-community/hooks';
import { useNavigation } from '@react-navigation/native';
import uniqueId from 'lodash/uniqueId';
import { useTranslation } from 'react-i18next';

import CloseIcon from '~assets/close.svg';
import { CLOSE_ICON } from '~constants/dimensions';
import { CUSTOM_CATEGORY_CHOOSER_ROUTE } from '~constants/routes';
import { SECONDARY } from '~constants/themes';
import { useAppDispatch, useAppSelector } from '~hooks';
import {
  setPages,
  addAuthor,
  removeAuthor,
  updateAuthor,
  setAnnotation,
  setAnnotationError,
  setCurrentStep,
  addCustomBook,
} from '~redux/actions/customBookActions';
import { getSelectedCategoryLabel, getPages, getAuthorsList, getAnnotation, deriveIsValidFullForm } from '~redux/selectors/customBook';
import colors from '~styles/colors';
import Button from '~UI/Button';
import Input from '~UI/TextInput';
import { getValidationFailure, validationTypes } from '~utils/validation';

import CustomBookStatusDropdown from '../CustomBookStatusDropdown';
import styles from './styles';

const Step3 = () => {
  const { t } = useTranslation(['customBook, common, books, categories, errors']);
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const onPressBack = () => dispatch(setCurrentStep(2));
  const showCategoryChooser = () => navigation.navigate(CUSTOM_CATEGORY_CHOOSER_ROUTE);
  const _setPages = (pages: string | null, error?: string | null) => dispatch(setPages({ pages, error }));
  const _addAuthor = (id: string) => dispatch(addAuthor(id));
  const _removeAuthor = (id: string) => dispatch(removeAuthor(id));
  const _updateAuthor = (id: string, name: string, error?: string | null) => dispatch(updateAuthor({ id, name, error }));
  const _setAnnotation = (annotation: string, error?: string | null) => dispatch(setAnnotation({ annotation, error }));
  const _setAnnotationError = (error: string | null) => dispatch(setAnnotationError(error));
  const _addCustomBook = () => dispatch(addCustomBook());

  const selectedCategoryLabel = useAppSelector(getSelectedCategoryLabel);
  const pages = useAppSelector(getPages);
  const authorsList = useAppSelector(getAuthorsList);
  const annotation = useAppSelector(getAnnotation);
  const isValidForm = useAppSelector(deriveIsValidFullForm);

  const handleAddAuthor = () => {
    _addAuthor(uniqueId());
  };

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
    _updateAuthor(id, value, error ? t(`errors:${error}`, params) : null);
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
    _setPages(value, error ? t(`errors:${error}`, params) : null);
  };

  const handleChangeAnnotation = (value: string) => {
    _setAnnotation(value, null);
  };

  const validateAnnotation = () => {
    const params = {
      minLength: 100,
      maxLength: 1000,
    };
    const error = getValidationFailure(
      annotation.value,
      [validationTypes.containsSpecialCharacters, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    _setAnnotationError(error ? t(`errors:${error}`, params) : null);
    return !error;
  };

  const handleAddBook = () => {
    const isAnnotationValid = validateAnnotation();

    if (isAnnotationValid) {
      _addCustomBook();
    }
  };

  useBackHandler(() => {
    onPressBack();
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.inputWrapper} keyboardShouldPersistTaps='handled'>
        <View style={styles.block}>
          <Text style={styles.subTitle}>
            {t('customBook:category')}
            {t('common:required')}
          </Text>
          <View style={styles.blockWrapper}>
            <Pressable style={[styles.inputBlockWrapper, selectedCategoryLabel ? styles.activeInputWrapper : {}]} onPress={showCategoryChooser}>
              <Text numberOfLines={1} style={[styles.inputLabel, selectedCategoryLabel ? styles.activeInputLabel : {}]}>
                {selectedCategoryLabel ? t(`categories:${selectedCategoryLabel}`) : t(`customBook:noCategory`)}
              </Text>
            </Pressable>
            <Button style={styles.mainButton} onPress={showCategoryChooser} title={t('common:choose')} />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.subTitle}>{t('customBook:status')}</Text>
          <View style={styles.blockWrapper}>
            <CustomBookStatusDropdown />
          </View>
        </View>

        <View>
          <Text style={styles.subTitle}>
            {t('customBook:pages')}
            {t('common:required')}
          </Text>
          <Input
            placeholder={t('customBook:enterPagesCount')}
            onChangeText={handleChangePages}
            value={pages.value as string}
            error={pages.error}
            shouldDisplayClearButton={!!pages.value}
            onClear={() => _setPages(null)}
            inputMode='numeric'
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.subTitle}>
            {t('customBook:authorsList')}
            {t('common:required')}
          </Text>
          {authorsList.map(({ id, name, error }) => (
            <View style={styles.authorWrapper} key={id}>
              <Input
                wrapperClassName={styles.authorsNameInputWrapper}
                placeholder={t('customBook:enterAuthorsName')}
                onChangeText={(value) => handleAuthorChange(value, id)}
                value={name as string}
                error={error}
                shouldDisplayClearButton={!!name}
                onClear={() => _updateAuthor(id, '')}
              />
              <Pressable style={styles.removeAuthorButton} onPress={() => _removeAuthor(id)}>
                <CloseIcon width={CLOSE_ICON.width} height={CLOSE_ICON.height} fill={colors.neutral_light} />
              </Pressable>
            </View>
          ))}

          <Button
            disabled={authorsList.length > 2}
            style={[styles.button, styles.addAuthorButton]}
            onPress={handleAddAuthor}
            title={t(authorsList.length > 0 ? 'customBook:addAnotherAuthor' : 'customBook:addAuthor')}
          />
        </View>

        <View style={styles.block}>
          <View style={styles.annotationLabelWrapper}>
            <Text style={styles.subTitle}>
              {t('customBook:annotation')}
              {t('common:required')}
            </Text>
            {annotation.value && (
              <Text style={styles.subTitle}>{t('common:charactersCount', { count: annotation.value.length, maxCount: 100 })}</Text>
            )}
          </View>

          <Input
            placeholder={t('customBook:enterAnnotation')}
            wrapperClassName={styles.annotationWrapperClassName}
            className={styles.annotationInput}
            onChangeText={handleChangeAnnotation}
            value={annotation.value as string}
            error={annotation.error}
            shouldDisplayClearButton={!!annotation.value}
            onClear={() => _setAnnotation('')}
            multiline
            numberOfLines={5}
          />
        </View>
      </ScrollView>

      <View>
        <Text style={styles.tip}>{t('common:requiredFields')}</Text>
        <View style={styles.footerButtonsWrapper}>
          <Button theme={SECONDARY} style={styles.footerButton} onPress={onPressBack} title={t('common:back')} />
          <Button disabled={!isValidForm} style={styles.footerButton} onPress={handleAddBook} title={t('common:add')} />
        </View>
      </View>
    </View>
  );
};

export default Step3;
