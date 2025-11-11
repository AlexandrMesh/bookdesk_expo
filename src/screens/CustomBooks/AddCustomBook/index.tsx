import React, { lazy, useEffect } from 'react';

import { Text, View } from 'react-native';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { COMPLETED, IN_PROGRESS, PLANNED } from '~constants/boardType';
import { PENDING } from '~constants/loadingStatuses';
import { COMPLETED_BOOKS_ROUTE, HOME_NAVIGATOR_ROUTE, IN_PROGRESS_BOOKS_ROUTE, PLANNED_BOOKS_ROUTE } from '~constants/routes';
import { SECONDARY } from '~constants/themes';
import { clearAddCustomBookState, setCurrentStep, setStatus } from '~redux/actions/customBookActions';
import { getAddedCustomBook, getAvailableStep, getCurrentStep, getSavingCustomBookStatus, getStatus } from '~redux/selectors/customBook';
import InSuspense from '~screens/Main/InSuspense';
import { BookStatus } from '~types/books';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';
import Stepper from '~UI/Stepper';

import styles from './styles';

const Step1 = lazy(() => import('./Step1'));
const Step2 = lazy(() => import('./Step2'));
const Step3 = lazy(() => import('./Step3'));

const getBoardRoute = (bookStatus: BookStatus | null) => {
  // Если книга добавлена на конкретную доску, переходим на эту доску
  if (bookStatus === PLANNED) return PLANNED_BOOKS_ROUTE;
  if (bookStatus === IN_PROGRESS) return IN_PROGRESS_BOOKS_ROUTE;
  if (bookStatus === COMPLETED) return COMPLETED_BOOKS_ROUTE;
  // Если книга без статуса или null, переходим в Запланированные
  return PLANNED_BOOKS_ROUTE;
};

type ParamList = {
  CustomBooks: {
    initialStatus?: BookStatus;
  };
};

const AddCustomBook = () => {
  const { t } = useTranslation('customBook');
  const dispatch = useAppDispatch();
  const route = useRoute<RouteProp<ParamList, 'CustomBooks'>>();
  const availableStep = useAppSelector(getAvailableStep);
  const currentStep = useAppSelector(getCurrentStep);
  const addedCustomBook = useAppSelector(getAddedCustomBook);
  const savingCustomBookStatus = useAppSelector(getSavingCustomBookStatus);
  const customBookStatus = useAppSelector(getStatus);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  // Устанавливаем статус из параметров навигации при монтировании (только один раз)
  useEffect(() => {
    const initialStatus = route.params?.initialStatus;
    if (initialStatus) {
      dispatch(setStatus(initialStatus));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try {
      dispatch(clearAddCustomBookState());
      const targetRoute = getBoardRoute(customBookStatus);
      // Переходим на HomeNavigator с указанным экраном
      navigation.getParent()?.navigate(HOME_NAVIGATOR_ROUTE, {
        screen: targetRoute,
      });
    } catch (error) {
      console.error('Navigation error:', error);
      // В случае ошибки переходим в Запланированные
      dispatch(clearAddCustomBookState());
      navigation.getParent()?.navigate(HOME_NAVIGATOR_ROUTE, {
        screen: PLANNED_BOOKS_ROUTE,
      });
    }
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
