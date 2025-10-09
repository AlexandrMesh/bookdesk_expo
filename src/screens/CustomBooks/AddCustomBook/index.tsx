import React, { lazy } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Stepper from '~UI/Stepper';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';
import { SECONDARY } from '~constants/themes';
import { PLANNED_BOOKS_ROUTE, IN_PROGRESS_BOOKS_ROUTE, COMPLETED_BOOKS_ROUTE, ALL_BOOKS_ROUTE } from '~constants/routes';
import { PENDING } from '~constants/loadingStatuses';
import { PLANNED, IN_PROGRESS, COMPLETED, ALL } from '~constants/boardType';
import { BookStatus } from '~types/books';
import { useAppDispatch, useAppSelector } from '~hooks';
import { getAvailableStep, getCurrentStep, getAddedCustomBook, getSavingCustomBookStatus, getStatus } from '~redux/selectors/customBook';
import { setCurrentStep, clearAddCustomBookState } from '~redux/actions/customBookActions';
import InSuspense from '~screens/Main/InSuspense';
import styles from './styles';

const Step1 = lazy(() => import('./Step1'));
const Step2 = lazy(() => import('./Step2'));
const Step3 = lazy(() => import('./Step3'));

const getBoardRoute = (bookStatus: BookStatus) =>
  ({
    [PLANNED]: PLANNED_BOOKS_ROUTE,
    [IN_PROGRESS]: IN_PROGRESS_BOOKS_ROUTE,
    [COMPLETED]: COMPLETED_BOOKS_ROUTE,
    [ALL]: ALL_BOOKS_ROUTE,
  }[bookStatus] || ALL_BOOKS_ROUTE);

const AddCustomBook = () => {
  const { t } = useTranslation('customBook');
  const dispatch = useAppDispatch();
  const availableStep = useAppSelector(getAvailableStep);
  const currentStep = useAppSelector(getCurrentStep);
  const addedCustomBook = useAppSelector(getAddedCustomBook);
  const savingCustomBookStatus = useAppSelector(getSavingCustomBookStatus);
  const customBookStatus = useAppSelector(getStatus);

  const navigation = useNavigation<any>();

  const steps = [
    {
      step: 1,
      component: (
        <InSuspense>
          <Step1 />
        </InSuspense>
      ),
    },
    {
      step: 2,
      component: (
        <InSuspense>
          <Step2 />
        </InSuspense>
      ),
    },
    {
      step: 3,
      component: (
        <InSuspense>
          <Step3 />
        </InSuspense>
      ),
    },
  ];

  const handleBackToBoard = () => {
    dispatch(clearAddCustomBookState());
    navigation.navigate(getBoardRoute(customBookStatus));
  };

  return addedCustomBook ? (
    <View style={styles.successContainer}>
      <View style={styles.successHeader}>
        <Text style={styles.successTitle}>{t('congratulations')}</Text>
        <Text style={styles.successSubTitle}>{t('theBookWasAdded')}</Text>
      </View>
      <View style={styles.buttons}>
        <Button style={styles.button} onPress={() => dispatch(clearAddCustomBookState())} title={t('addOneMoreBook')} />
        <Button theme={SECONDARY} style={styles.button} onPress={handleBackToBoard} title={t('backToTheDesk')} />
      </View>
    </View>
  ) : (
    <View style={styles.container}>
      {savingCustomBookStatus === PENDING ? (
        <Spinner />
      ) : (
        <Stepper
          steps={steps}
          lastAvailableStep={availableStep}
          currentStep={currentStep}
          onStepPress={(step: number) => dispatch(setCurrentStep(step))}
        />
      )}
    </View>
  );
};

export default AddCustomBook;
