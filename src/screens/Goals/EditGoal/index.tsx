import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getValidationFailure, validationTypes } from '~utils/validation';
import Button from '~UI/Button';
import Input from '~UI/TextInput';
import { useAppDispatch, useAppSelector } from '~hooks';
import { getGoalNumberOfPages, getGoalType } from '~redux/selectors/goals';
import { updateGoal } from '~redux/actions/goalsActions';
import { Spinner } from '~UI/Spinner';
import RadioButton from '~UI/RadioButton';
import { DAILY, MONTHLY } from '~constants/goals';
import { GoalType } from '~types/goals';
import styles from './styles';

const EditGoal = () => {
  const { t } = useTranslation(['goals', 'common']);
  const [pages, setPages] = useState<string>('');
  const _goalType = useAppSelector(getGoalType);
  const [goalType, setGoalType] = useState<GoalType>(_goalType);

  const [errorForPage, setErrorForPages] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const goalTypes = [
    { type: DAILY, action: () => setGoalType(DAILY) },
    { type: MONTHLY, action: () => setGoalType(MONTHLY) },
  ];

  const dispatch = useAppDispatch();

  const _updateGoal = (numberOfPages: string, type: GoalType) => dispatch(updateGoal({ numberOfPages, type }));

  const goalNumberOfPages = useAppSelector(getGoalNumberOfPages) || 0;

  const validateForm = () => {
    const params = {
      lessComparedValue: 5,
      moreComparedValue: 1000,
    };
    const error = getValidationFailure(
      pages,
      [validationTypes.mustContainOnlyNumbers, validationTypes.isMoreThan, validationTypes.isLessThan],
      params,
    );
    return error ? t(`errors:${error}`, params) : null;
  };

  const handleUpdateGoal = async () => {
    try {
      setIsLoading(true);
      await _updateGoal(pages, goalType);
      navigation.goBack();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitForm = () => {
    const error = validateForm();
    if (error) {
      setErrorForPages(error);
    } else {
      handleUpdateGoal();
    }
  };

  const handleChangePages = (value: string) => {
    setErrorForPages('');
    setPages(value);
  };

  const clearPages = () => {
    setErrorForPages('');
    setPages('');
  };

  const handleClearPages = () => {
    clearPages();
  };

  useEffect(() => {
    setPages(goalNumberOfPages.toString());
    return () => {
      clearPages();
    };
  }, [setPages, goalNumberOfPages]);

  return (
    <View style={styles.wrapper}>
      {isLoading ? (
        <Spinner />
      ) : (
        <View style={styles.content}>
          <Text style={styles.text}>{t('goalType')}</Text>
          {goalTypes.map(({ type, action }) => {
            return (
              <Pressable key={type} onPress={action} style={styles.radioButtonWrapper}>
                <RadioButton isSelected={goalType === type} />
                <Text style={styles.radioButtonLabel}>{t(type)}</Text>
              </Pressable>
            );
          })}

          <Text style={styles.text}>{t('howManyPagesDoYouWantReadDescription')}</Text>
          <Input
            placeholder={t('enterPagesCount')}
            error={errorForPage}
            onChangeText={handleChangePages}
            shouldDisplayClearButton={!!pages}
            onClear={handleClearPages}
            inputMode='numeric'
            value={pages}
          />
          <View style={styles.submitButtonWrapper}>
            <Button title={t('common:save')} onPress={submitForm} />
          </View>
        </View>
      )}
    </View>
  );
};

export default EditGoal;
