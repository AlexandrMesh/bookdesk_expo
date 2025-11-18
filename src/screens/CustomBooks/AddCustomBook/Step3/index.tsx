import React from 'react';

import { ScrollView, View, Pressable, Text } from 'react-native';

import { useBackHandler } from '@react-native-community/hooks';
import { useNavigation } from '@react-navigation/native';
import uniqueId from 'lodash/uniqueId';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import CloseIcon from '~assets/close.svg';
import { CLOSE_ICON } from '~constants/dimensions';
import { CUSTOM_CATEGORY_CHOOSER_ROUTE } from '~constants/routes';
import { SECONDARY } from '~constants/themes';
import { setPages, addAuthor, removeAuthor, updateAuthor, setCurrentStep, addCustomBook } from '~redux/actions/customBookActions';
import { getSelectedCategoryLabel, getPages, getAuthorsList } from '~redux/selectors/customBook';
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
  const _addCustomBook = () => dispatch(addCustomBook());

  const selectedCategoryLabel = useAppSelector(getSelectedCategoryLabel);
  const pages = useAppSelector(getPages);
  const authorsList = useAppSelector(getAuthorsList);

  const handleAddAuthor = () => {
    _addAuthor(uniqueId());
  };

  const handleAuthorChange = (value: string, id: string) => {
    // Авторы не обязательны, валидация мягкая (только буквы)
    const params = {
      minLength: 0,
      maxLength: 64,
    };
    const error = value ? getValidationFailure(value, [validationTypes.mustContainOnlyLetters, validationTypes.isTooLong], params) : null;
    _updateAuthor(id, value, error ? t(`errors:${error}`, params) : null);
  };

  const handleChangePages = (value: string) => {
    // Страницы не обязательны, допускаем пустое значение
    const params = {
      minLength: 0,
      maxLength: 5,
    };
    const error = value ? getValidationFailure(value, [validationTypes.mustContainOnlyNumbers, validationTypes.isTooLong], params) : null;
    _setPages(value, error ? t(`errors:${error}`, params) : null);
  };

  const handleAddBook = () => {
    _addCustomBook();
  };

  useBackHandler(() => {
    onPressBack();
    return true;
  });

  const isAddDisabled = !!pages.error || authorsList.some((a) => !!a.error);

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
          <Text style={styles.subTitle}>{t('customBook:pages')}</Text>
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
          <Text style={styles.subTitle}>{t('customBook:authorsList')}</Text>
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
            titleStyle={styles.addAuthorButtonTitle}
            onPress={handleAddAuthor}
            title={t(authorsList.length > 0 ? 'customBook:addAnotherAuthor' : 'customBook:addAuthor')}
          />
        </View>
      </ScrollView>

      <View>
        <Text style={styles.tip}>{t('common:requiredFields')}</Text>
        <View style={styles.footerButtonsWrapper}>
          <Button theme={SECONDARY} style={styles.footerButton} onPress={onPressBack} title={t('common:back')} />
          <Button disabled={isAddDisabled || !selectedCategoryLabel} style={styles.footerButton} onPress={handleAddBook} title={t('common:add')} />
        </View>
      </View>
    </View>
  );
};

export default Step3;
