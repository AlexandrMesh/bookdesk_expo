import React from 'react';

import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';

import CloseIcon from '~assets/close.svg';

import { useAppDispatch, useAppSelector } from '~hooks';

import { COVER_VIEWER } from '~constants/modalTypes';
import { hideModal } from '~redux/actions/booksActions';
import { getActiveModal, getCoverUrl } from '~redux/selectors/books';
import colors from '~styles/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CoverViewer = () => {
  const dispatch = useAppDispatch();
  const isVisible = useAppSelector(getActiveModal) === COVER_VIEWER;
  const coverUrl = useAppSelector(getCoverUrl);

  const handleClose = () => {
    dispatch(hideModal());
  };

  if (!coverUrl) {
    return null;
  }

  // eslint-disable-next-line no-console
  console.log('🔍 [CoverViewer] Открытие обложки:', coverUrl);
  // eslint-disable-next-line no-console
  console.log('🔍 [CoverViewer] isVisible:', isVisible);

  return (
    <Modal visible={isVisible} transparent={true} animationType='fade' onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.container}>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <CloseIcon width={24} height={24} fill={colors.neutral_light} />
          </Pressable>
          <Image
            style={styles.cover}
            source={{ uri: coverUrl }}
            contentFit='contain'
            transition={200}
            cachePolicy='memory-disk'
            onError={(error) => {
              // eslint-disable-next-line no-console
              console.error('❌ [CoverViewer] Ошибка загрузки изображения:', error);
            }}
            onLoad={() => {
              // eslint-disable-next-line no-console
              console.log('✅ [CoverViewer] Изображение загружено успешно');
            }}
          />
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: {
    width: '100%',
    height: '100%',
    maxWidth: 600,
    maxHeight: 900,
  },
});

export default CoverViewer;

