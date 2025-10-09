import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import isEmpty from 'lodash/isEmpty';
import { getValidationFailure, validationTypes } from '~utils/validation';
import BooksList from '~screens/Home/BooksList';
import Button from '~UI/Button';
import Input from '~UI/TextInput';
import { useAppDispatch, useAppSelector } from '~hooks';
import { getNewCustomBookName, deriveSuggestBooksData, getSuggestedBooksLoadingStatus, deriveIsValidStep1 } from '~redux/selectors/customBook';
import {
  setCurrentStep,
  setAvailableStep,
  setNewCustomBookName,
  loadSuggestedBooks,
  clearStep2,
  clearStep3,
  clearSuggestedBooks,
} from '~redux/actions/customBookActions';
import { PENDING, SUCCEEDED, IDLE } from '~constants/loadingStatuses';
import styles from './styles';

const Step1 = () => {
  const { t } = useTranslation(['customBook, common, errors']);
  const dispatch = useAppDispatch();
  const bookName = useAppSelector(getNewCustomBookName);
  const suggestedBooks = useAppSelector(deriveSuggestBooksData);
  const loadingDataStatus = useAppSelector(getSuggestedBooksLoadingStatus);
  const allowsNextAction = useAppSelector(deriveIsValidStep1);

  const [bookNameTemp, setBookNameTemp] = useState<string>(bookName.value);
  const [bookNameErrorTemp, setBookNameErrorTemp] = useState<string | null>(bookName.error);

  const clearSteps = () => {
    dispatch(clearStep2());
    dispatch(clearStep3());
  };

  const handleAddBook = async () => {
    dispatch(setNewCustomBookName({ name: '', error: null }));
    const params = { minLength: 3, maxLength: 64 };
    const error = getValidationFailure(
      bookNameTemp,
      [validationTypes.containsSpecialCharacters, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    const hasError = error ? t(`errors:${error}`, params) : null;
    setBookNameErrorTemp(hasError);

    if (isEmpty(error) && !isEmpty(bookNameTemp)) {
      clearSteps();
      dispatch(setAvailableStep(1));
      const { error } = await dispatch(loadSuggestedBooks(bookNameTemp)).unwrap();
      setBookNameErrorTemp(error as any);
      if (!error) {
        dispatch(setNewCustomBookName({ name: bookNameTemp, error: null }));
      }
    }
  };

  const handleClear = () => {
    if (loadingDataStatus === PENDING) {
      return false;
    }
    dispatch(setNewCustomBookName({ name: '', error: null }));
    dispatch(clearSuggestedBooks());
    clearSteps();
    dispatch(setAvailableStep(1));
    setBookNameErrorTemp(null);
    setBookNameTemp('');
    return true;
  };

  const handleChangeBookName = (value: string) => {
    if (isEmpty(value)) {
      handleClear();
      return;
    }
    setBookNameErrorTemp(null);
    setBookNameTemp(value);
  };

  const onPressNext = () => {
    dispatch(setCurrentStep(2));
    dispatch(setAvailableStep(2));
  };

  const shouldDisplayError = !!bookNameErrorTemp;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Input
          placeholder={t('customBook:enterBookName')}
          onChangeText={handleChangeBookName}
          value={bookNameTemp}
          wrapperClassName={[styles.bookNameInputWrapper, shouldDisplayError && styles.bookNameInputWithErrorWrapper]}
          errorWrapperClassName={styles.errorWrapperClassName}
          shouldDisplayClearButton={!!bookNameTemp && loadingDataStatus !== PENDING}
          error={bookNameErrorTemp}
          disabled={loadingDataStatus === PENDING}
          validateable={shouldDisplayError}
          onClear={handleClear}
        />

        <Button
          disabled={!!(!bookNameTemp || !!bookNameErrorTemp || loadingDataStatus === PENDING || (bookNameTemp && bookNameTemp === bookName.value))}
          style={styles.addButton}
          onPress={handleAddBook}
          title={t('common:add')}
        />
      </View>
      <View style={styles.bookListWrapper}>
        {loadingDataStatus !== PENDING && suggestedBooks.length > 0 && bookNameTemp === bookName.value && !bookNameErrorTemp && (
          <Text style={styles.suggestionLabel}>{t('customBook:weHaveTheSimilarBooks')}</Text>
        )}
        {!bookNameErrorTemp && loadingDataStatus === SUCCEEDED && suggestedBooks.length === 0 ? (
          <Text style={[styles.suggestionLabel, styles.successLabel]}>{t('customBook:pressNextToAddTheBook')}</Text>
        ) : (
          loadingDataStatus !== IDLE && <BooksList data={suggestedBooks} loadingDataStatus={loadingDataStatus} />
        )}
      </View>

      {allowsNextAction ? (
        <View style={styles.nextButtonWrapper}>
          <Button disabled={!allowsNextAction} style={styles.nextButton} onPress={onPressNext} title={t('common:next')} />
        </View>
      ) : null}
    </View>
  );
};

export default Step1;
