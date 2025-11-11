import React, { useState, useEffect, useMemo, useRef } from 'react';

import { ScrollView, View, ToastAndroid, Pressable, Text, ImageStyle, ViewStyle, Modal } from 'react-native';

import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import uniqueId from 'lodash/uniqueId';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from '~hooks';

import CloseIcon from '~assets/close.svg';
import { DEFAULT_COVER } from '~constants/customBooks';
import { CLOSE_ICON } from '~constants/dimensions';
import { RU } from '~constants/languages';
import { PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { SECONDARY } from '~constants/themes';
import useGetImgUrl from '~hooks/useGetImgUrl';
import { updateUserCustomBook } from '~redux/actions/customBookActions';
import colors from '~styles/colors';
import i18n from '~translations/i18n';
import { BookStatus } from '~types/books';
import Button from '~UI/Button';
import RadioButton from '~UI/RadioButton';
import { Spinner } from '~UI/Spinner';
import Input from '~UI/TextInput';
import { getValidationFailure, validationTypes } from '~utils/validation';

import styles from './styles';

type ParamList = {
  EditCustomBook: {
    bookId: string;
    title: string;
    pages: string;
    authorsList: string[];
    annotation: string;
    bookStatus: BookStatus;
    coverPath?: string;
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
  const imgUrl = useGetImgUrl();

  const [_title, setTitle] = useState<string | null>(params.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [_pages, setPages] = useState<string | null>(params.pages.toString());
  const [authors, setAuthors] = useState(
    params.authorsList && params.authorsList.length > 0
      ? params.authorsList.map((item: string) => ({ id: uniqueId(), name: item, error: null }))
      : [],
  );
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cover state
  const initialCoverPath = params.coverPath || DEFAULT_COVER;
  const [shouldAddCover, setShouldAddCover] = useState<boolean | undefined>(initialCoverPath === DEFAULT_COVER ? false : true);
  const [selectedCover, setSelectedCover] = useState<string>(initialCoverPath === DEFAULT_COVER ? '' : initialCoverPath);

  useEffect(() => {
    console.log('EditCustomBook mounted - params.coverPath:', params.coverPath);
    console.log('initialCoverPath:', initialCoverPath);
    console.log('imgUrl:', imgUrl);
    console.log('selectedCover:', selectedCover);
  }, []);
  const [isPickingFromDevice, setIsPickingFromDevice] = useState(false);
  const [suggestedCoversData, setSuggestedCoversData] = useState<Array<{ coverPath: string }>>([]);
  const [loadingDataStatus, setLoadingDataStatus] = useState<'idle' | 'pending' | 'succeeded' | 'failed'>('idle');
  const [isCoverModalVisible, setIsCoverModalVisible] = useState(false);
  const backupSelectedCoverRef = useRef<string>('');
  const backupShouldAddCoverRef = useRef<boolean | undefined>(undefined);
  // Draft state for modal (apply on Save only)
  const [draftShouldAddCover, setDraftShouldAddCover] = useState<boolean | undefined>(undefined);
  const [draftSelectedCover, setDraftSelectedCover] = useState<string>('');
  const [draftIsPickingFromDevice, setDraftIsPickingFromDevice] = useState(false);
  const [draftSuggestedCoversData, setDraftSuggestedCoversData] = useState<Array<{ coverPath: string }>>([]);
  const [draftLoadingDataStatus, setDraftLoadingDataStatus] = useState<'idle' | 'pending' | 'succeeded' | 'failed'>('idle');

  const suggestedCoversExist = suggestedCoversData.length > 0;
  const isSelectedInSuggestedList = !!selectedCover && suggestedCoversData.some((item) => item.coverPath === selectedCover);
  const isCurrentCover = selectedCover === initialCoverPath && initialCoverPath !== DEFAULT_COVER;
  const isSelectedFromDevice =
    !!selectedCover &&
    !isSelectedInSuggestedList &&
    !isCurrentCover &&
    (selectedCover.startsWith('file:') || selectedCover.startsWith('content:') || selectedCover.startsWith('data:'));

  // Валидация: только название обязательно, страницы и авторы необязательны
  const isValidForm = !titleError && _title && _title.trim().length > 0 && authors.every((item: any) => !item.error);

  const handleAddAuthor = () => {
    setAuthors([...authors, { id: uniqueId(), name: '', error: null }]);
  };

  const updateAuthor = (id: string, name: string | null, error: string | null) =>
    setAuthors(authors.map((item: any) => (item.id === id ? { ...item, name, error } : item)));

  const removeAuthor = (id: string) => setAuthors(authors.filter((item: any) => item.id !== id));

  const handleAuthorChange = (value: string, id: string) => {
    // Авторы не обязательны, валидация мягкая (только буквы)
    const params = {
      minLength: 0,
      maxLength: 64,
    };
    const error = value ? getValidationFailure(value, [validationTypes.mustContainOnlyLetters, validationTypes.isTooLong], params) : null;
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
    // Страницы не обязательны, допускаем пустое значение
    const params = {
      minLength: 0,
      maxLength: 5,
    };
    const error = value ? getValidationFailure(value, [validationTypes.mustContainOnlyNumbers, validationTypes.isTooLong], params) : null;
    if (error) {
      setPagesError(t(`errors:${error}`, params));
    } else {
      setPages(value);
      setPagesError(null);
    }
  };

  // Cover handlers
  const handlePressOnWithoutCover = () => {
    setDraftShouldAddCover(false);
    setDraftSelectedCover(DEFAULT_COVER);
  };

  const handleFindCover = () => {
    setDraftShouldAddCover(true);
    setDraftSelectedCover('');
    setDraftSuggestedCoversData([]);
    setDraftLoadingDataStatus('idle');
  };

  const pickImageFromDevice = async () => {
    try {
      setDraftIsPickingFromDevice(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setDraftShouldAddCover(true);
        setDraftSelectedCover(uri);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraftIsPickingFromDevice(false);
    }
  };

  // Load suggested covers (modal drafts)
  useEffect(() => {
    if (_title && draftShouldAddCover && !draftSuggestedCoversData.length && !draftSelectedCover) {
      setDraftLoadingDataStatus('pending');
      const loadCovers = async () => {
        try {
          const bookName = _title.trim();
          const { language } = i18n;
          const query = language === RU ? `${bookName} книга` : `${bookName} book`;
          const gl = language === RU ? 'ru' : 'us';

          const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
              gl,
              searchType: 'image',
              key: 'AIzaSyD0Gx2sBVthtxNrNGLZwQYVpGSeKaBnvUM',
              q: query,
              cx: '42a8480a652154a54',
              num: 10,
            },
          });

          const items =
            (data as unknown as { items?: Array<{ fileFormat?: string; link: string }> }).items
              ?.filter(({ fileFormat }) => fileFormat === 'image/jpeg' || fileFormat === 'image/png' || fileFormat === 'image/webp')
              .map(({ link }) => ({
                coverPath: link,
              })) || [];

          setDraftSuggestedCoversData(items);
          setDraftLoadingDataStatus('succeeded');
        } catch (error) {
          console.error('Error loading suggested covers:', error);
          setDraftLoadingDataStatus('failed');
        }
      };
      loadCovers();
    }
  }, [_title, draftShouldAddCover, draftSuggestedCoversData.length, draftSelectedCover]);

  // Reset all state when switching to another book
  useEffect(() => {
    setTitle(params.title);
    setPages(params.pages.toString());
    setAuthors(params.authorsList.map((item: string) => ({ id: uniqueId(), name: item, error: null })));
    const init = params.coverPath || DEFAULT_COVER;
    setShouldAddCover(init === DEFAULT_COVER ? false : true);
    setSelectedCover(init === DEFAULT_COVER ? '' : init);
    setSuggestedCoversData([]);
    setLoadingDataStatus('idle');
  }, [params.bookId]);

  const handleEditBook = async () => {
    setIsSaving(true);
    try {
      const coverPath = shouldAddCover === false ? DEFAULT_COVER : selectedCover || params.coverPath || DEFAULT_COVER;
      await dispatch(
        updateUserCustomBook({
          bookId: params.bookId,
          title: _title as string,
          pages: _pages || '',
          authorsList: authors.map((item) => item.name).filter(Boolean),
          annotation: '',
          bookStatus: params.bookStatus,
          coverPath,
        }),
      );
      navigation.goBack();
      showToast(t('customBook:bookSuccessfullyUpdated'));
    } finally {
      setIsSaving(false);
    }
  };

  const getImageUri = (cover: string) => {
    console.log('getImageUri called with cover:', cover, 'imgUrl:', imgUrl);
    if (!cover || cover === DEFAULT_COVER) {
      // Для дефолтной обложки всегда возвращаем URI, даже если imgUrl еще не готов
      const uri = imgUrl ? `${imgUrl}/${DEFAULT_COVER}.webp` : '';
      console.log('Default cover URI:', uri);
      return uri;
    }
    const lower = String(cover);
    const isAbsolute = /^https?:\/\//i.test(lower) || lower.startsWith('file:') || lower.startsWith('content:') || lower.startsWith('data:');
    if (isAbsolute) {
      console.log('Absolute URI:', cover);
      return cover;
    }
    const uri = imgUrl ? `${imgUrl}/${cover}.webp` : '';
    console.log('Relative URI:', uri);
    return uri;
  };

  const currentCoverThumb = useMemo(() => {
    const cover = selectedCover || initialCoverPath;
    console.log('currentCoverThumb useMemo - cover:', cover, 'selectedCover:', selectedCover, 'initialCoverPath:', initialCoverPath);
    const uri = getImageUri(cover);
    console.log('currentCoverThumb result:', uri);
    return uri;
  }, [selectedCover, initialCoverPath, imgUrl]);

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

          {/* Cover block with thumbnail and Change button */}
          <View style={styles.block}>
            <Text style={styles.subTitle}>{t('customBook:bookCover')}</Text>
            <View style={styles.editThumbWrapper}>
              <View style={styles.editThumbCover}>
                {currentCoverThumb ? (
                  <Image
                    style={styles.cover as ImageStyle}
                    source={{
                      uri: currentCoverThumb,
                    }}
                    onError={(e) => {
                      console.log('Image load error:', e.nativeEvent.error);
                      console.log('Failed URI:', currentCoverThumb);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', currentCoverThumb);
                    }}
                  />
                ) : (
                  <View style={styles.coverPlaceholder} />
                )}
              </View>
              <Button style={styles.editChangeButton} titleStyle={styles.buttonTitle} title={t('common:edit')} onPress={() => setIsCoverModalVisible(true)} />
            </View>
          </View>

          {/* Cover selection modal (reuses step 2 logic) */}
          <Modal
            visible={isCoverModalVisible}
            transparent
            animationType='slide'
            onShow={() => {
              backupSelectedCoverRef.current = selectedCover;
              backupShouldAddCoverRef.current = shouldAddCover;
            }}
            onRequestClose={() => setIsCoverModalVisible(false)}
          >
            <View style={styles.wrapper}>
              <View style={styles.container}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>{t('customBook:bookCover')}</Text>
                  <Pressable
                    onPress={() => {
                      // discard changes
                      setSelectedCover(backupSelectedCoverRef.current);
                      setShouldAddCover(backupShouldAddCoverRef.current);
                      setIsCoverModalVisible(false);
                    }}
                  >
                    <CloseIcon width={CLOSE_ICON.width} height={CLOSE_ICON.height} fill={colors.neutral_light} />
                  </Pressable>
                </View>
                <ScrollView style={styles.inputWrapper} keyboardShouldPersistTaps='handled'>
                  {shouldAddCover === undefined && <Text style={styles.suggestionLabel}>{t('customBook:chooseTheOptionForBookCover')}</Text>}

                  <View style={styles.buttonsWrapper}>
                    <Button
                      theme={SECONDARY}
                      style={styles.button as ViewStyle}
                      titleStyle={styles.buttonTitle}
                      onPress={() => {
                        setShouldAddCover(true);
                        setSelectedCover(initialCoverPath);
                      }}
                      title={t('customBook:currentCover')}
                    />
                    <Button
                      disabled={shouldAddCover === false}
                      theme={SECONDARY}
                      style={styles.button as ViewStyle}
                      titleStyle={styles.buttonTitle}
                      onPress={handlePressOnWithoutCover}
                      title={t('customBook:withoutCover')}
                    />
                    <Button
                      disabled={!!(shouldAddCover && !isSelectedFromDevice && !isCurrentCover)}
                      style={styles.button}
                      titleStyle={styles.buttonTitle}
                      onPress={handleFindCover}
                      title={t('customBook:findCover')}
                    />
                    <Button style={styles.button} titleStyle={styles.buttonTitle} onPress={pickImageFromDevice} title={t('common:choose')} />
                  </View>

                  <ScrollView style={styles.contentWrapper} keyboardShouldPersistTaps='handled'>
                    {shouldAddCover === false && !isPickingFromDevice && (
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

                    {(isPickingFromDevice || (shouldAddCover && !isSelectedFromDevice && !isCurrentCover && loadingDataStatus === 'pending')) && (
                      <View style={styles.contentSpinnerWrapper}>
                        <Spinner />
                      </View>
                    )}

                    {shouldAddCover && !isPickingFromDevice && isSelectedFromDevice && (
                      <View style={styles.deviceCoverWrapper}>
                        <View style={[styles.coverWrapper, styles.selectedCover]}>
                          <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected={true} />
                          <Image
                            style={styles.cover as ImageStyle}
                            source={{
                              uri: selectedCover,
                            }}
                          />
                        </View>
                      </View>
                    )}

                    {shouldAddCover === true && !isPickingFromDevice && isCurrentCover && (
                      <View style={styles.deviceCoverWrapper}>
                        <Text style={styles.suggestionLabel}>{t('customBook:currentCover')}</Text>
                        <View style={[styles.coverWrapper, styles.selectedCover]}>
                          <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected={true} />
                          <Image
                            style={styles.cover as ImageStyle}
                            source={{
                              uri: getImageUri(selectedCover),
                            }}
                          />
                        </View>
                      </View>
                    )}

                    {shouldAddCover &&
                      !isSelectedFromDevice &&
                      !isCurrentCover &&
                      !isPickingFromDevice &&
                      loadingDataStatus === 'succeeded' &&
                      suggestedCoversData.length > 0 && (
                        <View style={styles.suggestedCovers}>
                          <Text style={styles.suggestionLabel}>{t('customBook:chooseTheBookCover')}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coversScrollContent}>
                            {suggestedCoversData.map((item) => {
                              const selected = selectedCover === item.coverPath;
                              return (
                                <Pressable
                                  key={item.coverPath}
                                  style={[styles.coverWrapper, selected && styles.selectedCover]}
                                  onPress={() => setSelectedCover(item.coverPath)}
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
                </ScrollView>
                <View style={styles.footerButtonsWrapper}>
                  <Button
                    theme={SECONDARY}
                    style={styles.footerButton}
                    onPress={() => {
                      // discard changes
                      setSelectedCover(backupSelectedCoverRef.current);
                      setShouldAddCover(backupShouldAddCoverRef.current);
                      setIsCoverModalVisible(false);
                    }}
                    title={t('common:back')}
                  />
                  <Button style={styles.footerButton} onPress={() => setIsCoverModalVisible(false)} title={t('common:save')} />
                </View>
              </View>
            </View>
          </Modal>

          <View>
            <Text style={styles.subTitle}>{t('customBook:pages')}</Text>
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
            <Text style={styles.subTitle}>{t('customBook:authorsList')}</Text>
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
