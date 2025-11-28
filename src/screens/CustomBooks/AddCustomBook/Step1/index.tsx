import React, { useState } from 'react';

import { View, Text } from 'react-native';

import isEmpty from 'lodash/isEmpty';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import {
  setCurrentStep,
  setAvailableStep,
  setNewCustomBookName,
  clearStep2,
  clearStep3,
} from '~redux/actions/customBookActions';
import { getNewCustomBookName } from '~redux/selectors/customBook';
import { useThemedStyles } from '~theme/useThemedStyles';
import Button from '~UI/Button';
import Input from '~UI/TextInput';

import createStyles from './styles';

const Step1 = () => {
  const { t } = useTranslation(['customBook, common, errors']);
  const dispatch = useAppDispatch();
  const bookName = useAppSelector(getNewCustomBookName);
  const styles = useThemedStyles(createStyles);

  const [bookNameTemp, setBookNameTemp] = useState<string>(bookName.value);

  const clearSteps = () => {
    dispatch(clearStep2());
    dispatch(clearStep3());
  };

  const handleAddBook = () => {
    if (!isEmpty(bookNameTemp)) {
      clearSteps();
      dispatch(setNewCustomBookName({ name: bookNameTemp.trim(), error: null }));
      dispatch(setAvailableStep(2));
      dispatch(setCurrentStep(2));
    }
  };

  const handleClear = () => {
    dispatch(setNewCustomBookName({ name: '', error: null }));
    clearSteps();
    dispatch(setAvailableStep(1));
    setBookNameTemp('');
    return true;
  };

  const handleChangeBookName = (value: string) => {
    if (isEmpty(value)) {
      handleClear();
      return;
    }
    setBookNameTemp(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Input
          placeholder={t('customBook:enterBookName')}
          onChangeText={handleChangeBookName}
          value={bookNameTemp}
          wrapperClassName={styles.bookNameInputWrapper}
          shouldDisplayClearButton={!!bookNameTemp}
          onClear={handleClear}
        />

        <Button
          disabled={!bookNameTemp || bookNameTemp.trim().length === 0}
          style={styles.addButton}
          onPress={handleAddBook}
          title={t('common:add')}
        />
      </View>
    </View>
  );
};

export default Step1;
