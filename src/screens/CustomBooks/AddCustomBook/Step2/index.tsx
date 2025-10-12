/* eslint-disable import/order */
import React, { useEffect } from 'react';

import { ImageStyle, Pressable, ScrollView, Text, View, ViewStyle } from 'react-native';

import { useBackHandler } from '@react-native-community/hooks';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { DEFAULT_COVER } from '~constants/customBooks';
import { PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { SECONDARY } from '~constants/themes';
import { useAppDispatch, useAppSelector } from '~hooks';
import useGetImgUrl from '~hooks/useGetImgUrl';
import { loadSuggestedCovers, selectCover, setAvailableStep, setCurrentStep, setShouldAddCover } from '~redux/actions/customBookActions';
import {
    deriveIsValidStep2,
    getNewCustomBookName,
    getSelectedCover,
    getShouldAddCover,
    getSuggestedCoversData,
    getSuggestedCoversLoadingDataStatus,
} from '~redux/selectors/customBook';
import Button from '~UI/Button';
import RadioButton from '~UI/RadioButton';
import { Spinner } from '~UI/Spinner';

import styles from './styles';

const Step2 = () => {
  const { t } = useTranslation(['customBook, common']);

  const dispatch = useAppDispatch();
  const onPressBack = () => dispatch(setCurrentStep(1));
  const onPressNext = () => {
    dispatch(setCurrentStep(3));
    dispatch(setAvailableStep(3));
  };

  const shouldAddCover = useAppSelector(getShouldAddCover);
  const allowsNextActionInTheStep2 = useAppSelector(deriveIsValidStep2);
  const bookName = useAppSelector(getNewCustomBookName);
  const loadingDataStatus = useAppSelector(getSuggestedCoversLoadingDataStatus);
  const suggestedCoversData = useAppSelector(getSuggestedCoversData);
  const selectedCover = useAppSelector(getSelectedCover);

  const imgUrl = useGetImgUrl();

  const handlePressOnWithoutCover = () => {
    dispatch(setShouldAddCover(false));
  };

  const handlePressOnWithCover = () => dispatch(setShouldAddCover(true));

  const suggestedCoversExist = suggestedCoversData.length > 0;

  useBackHandler(() => {
    onPressBack();
    return true;
  });

  useEffect(() => {
    if (bookName.value && shouldAddCover && !suggestedCoversExist) {
      dispatch(loadSuggestedCovers());
    }
  }, [dispatch, bookName.value, shouldAddCover, suggestedCoversExist]);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {shouldAddCover === undefined && <Text style={styles.suggestionLabel}>{t('customBook:chooseTheOptionForBookCover')}</Text>}

        <View style={styles.buttonsWrapper}>
          <Button
            disabled={shouldAddCover === false}
            theme={SECONDARY}
            style={styles.button as ViewStyle}
            onPress={handlePressOnWithoutCover}
            title={t('customBook:withoutCover')}
          />
          <Button disabled={shouldAddCover} style={styles.button} onPress={handlePressOnWithCover} title={t('customBook:findCover')} />
        </View>

        {shouldAddCover && loadingDataStatus === PENDING ? (
          <View style={styles.contentWrapper}>
            <Spinner />
          </View>
        ) : (
          <ScrollView style={styles.contentWrapper} keyboardShouldPersistTaps='handled'>
            {shouldAddCover === false && (
              <View style={styles.defaultCoverWrapper}>
                <Text style={styles.suggestionLabel}>{t('customBook:theExampleOfTheBookCover')}</Text>
                <View>
                  <View style={[styles.defaultCover, styles.selectedCover]}>
                    <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected />
                    {imgUrl && (
                      <Image
                        style={styles.cover as ImageStyle}
                        source={{
                          uri: `${imgUrl}/${DEFAULT_COVER}.webp`,
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>
            )}
            {shouldAddCover && loadingDataStatus === SUCCEEDED && suggestedCoversData.length > 0 && (
              <View style={styles.suggestedCovers}>
                <Text style={styles.suggestionLabel}>{t('customBook:chooseTheBookCover')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coversScrollContent}>
                  {suggestedCoversData.map((item) => {
                    const selected = selectedCover === item.coverPath;
                    return (
                      <Pressable
                        key={item.coverPath}
                        style={[styles.coverWrapper, selected && styles.selectedCover]}
                        onPress={() => dispatch(selectCover(item.coverPath))}
                      >
                        <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected={selected} />
                        <Image
                          style={styles.cover as ImageStyle}
                          source={{
                            uri: item.coverPath,
                          }}
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View style={styles.footerButtonsWrapper}>
        <Button theme={SECONDARY} style={styles.footerButton} onPress={onPressBack} title={t('common:back')} />
        <Button disabled={!allowsNextActionInTheStep2} style={styles.footerButton} onPress={onPressNext} title={t('common:next')} />
      </View>
    </View>
  );
};

export default Step2;
