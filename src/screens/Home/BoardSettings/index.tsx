import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '~hooks';
import { setHiddenBoards, setBoardOrder } from '~redux/actions/appActions';
import { getHiddenBoards, getBoardOrder } from '~redux/selectors/common';
import { useThemeColors } from '~theme/hooks';
import { saveHiddenBoards, saveBoardOrder } from '~utils/storage/boardPreferences';
import Button from '~UI/Button';

import CheckboxCheckedIcon from '~assets/checkbox-checked.svg';
import CheckboxBlankIcon from '~assets/checkbox-blank.svg';

const BOARDS = ['recommended', 'planned', 'inProgress', 'completed'] as const;
const ITEM_HEIGHT = 56;

interface DraggableBoardItemProps {
  boardKey: string;
  index: number;
  isVisible: boolean;
  isLastVisible: boolean;
  isDisabled: boolean;
  onToggle: (boardKey: string) => void;
  onDragEnd: (from: number, to: number) => void;
  t: any;
  themeColors: any;
}

const DraggableBoardItem: React.FC<DraggableBoardItemProps> = ({
  boardKey,
  index,
  isVisible,
  isLastVisible,
  isDisabled,
  onToggle,
  onDragEnd,
  t,
  themeColors,
}) => {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const contextY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      const moveBy = Math.round(translateY.value / ITEM_HEIGHT);
      const newIndex = index + moveBy;
      
      if (moveBy !== 0) {
        runOnJS(onDragEnd)(index, newIndex);
      }
      
      translateY.value = withSpring(0);
      isDragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isDragging.value ? 100 : 1,
    elevation: isDragging.value ? 5 : 0,
    opacity: isDragging.value ? 0.9 : 1,
  }));

  return (
    <Animated.View style={[animatedStyle]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.neutral_medium,
          backgroundColor: themeColors.primary_darkest,
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ marginRight: 12, padding: 4 }}>
            <MaterialIcons name="drag-indicator" size={24} color={themeColors.neutral_medium} />
          </Animated.View>
        </GestureDetector>
        
        <View
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          onTouchEnd={() => !isDisabled && onToggle(boardKey)}
        >
          {isVisible ? (
            <CheckboxCheckedIcon 
              width={24} 
              height={24} 
              fill={isLastVisible ? themeColors.neutral_medium : themeColors.success} 
            />
          ) : (
            <CheckboxBlankIcon width={24} height={24} fill={themeColors.neutral_medium} />
          )}
          <Text style={{ fontSize: 16, color: themeColors.neutral_light, marginLeft: 12 }}>
            {t(`books:${boardKey}`)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const BoardSettings = () => {
  const { t } = useTranslation(['books', 'common']);
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const savedHiddenBoards = useAppSelector(getHiddenBoards);
  const savedBoardOrder = useAppSelector(getBoardOrder);

  // Initialize board order
  const [localBoardOrder, setLocalBoardOrder] = useState<string[]>(() => {
    if (savedBoardOrder && savedBoardOrder.length > 0) {
      // Use saved order if available
      return savedBoardOrder;
    }
    // Otherwise use default order
    return [...BOARDS];
  });

  // Local state for editing
  const [localHiddenBoards, setLocalHiddenBoards] = useState<string[]>(savedHiddenBoards);
  const [isSaving, setIsSaving] = useState(false);

  // Update local board order when saved order changes
  useEffect(() => {
    if (savedBoardOrder && savedBoardOrder.length > 0) {
      setLocalBoardOrder(savedBoardOrder);
    }
  }, [savedBoardOrder]);

  const handleToggle = useCallback((boardKey: string) => {
    setLocalHiddenBoards((prev) => {
      if (prev.includes(boardKey)) {
        return prev.filter((key) => key !== boardKey);
      } else {
        return [...prev, boardKey];
      }
    });
  }, []);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    setLocalBoardOrder((prev) => {
      const newOrder = [...prev];
      const boundedToIndex = Math.max(0, Math.min(toIndex, newOrder.length - 1));
      
      if (fromIndex === boundedToIndex) {
        return prev;
      }
      
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(boundedToIndex, 0, movedItem);
      
      return newOrder;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveHiddenBoards(localHiddenBoards);
      await saveBoardOrder(localBoardOrder);
      dispatch(setHiddenBoards(localHiddenBoards));
      dispatch(setBoardOrder(localBoardOrder));
      navigation.goBack();
    } catch (error) {
      setIsSaving(false);
    }
  }, [localHiddenBoards, localBoardOrder, dispatch, navigation, isSaving]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.primary_dark,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.neutral_medium,
      textTransform: 'uppercase',
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    boardsList: {
      backgroundColor: themeColors.primary_darkest,
      borderRadius: 12,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.neutral_medium,
    },
    itemLast: {
      borderBottomWidth: 0,
    },
    itemText: {
      fontSize: 16,
      color: themeColors.neutral_light,
      marginLeft: 12,
    },
    itemDisabled: {
      opacity: 0.5,
    },
    footer: {
      padding: 16,
      paddingBottom: 16,
      alignItems: 'center',
    },
    saveButton: {
      minWidth: 120,
      paddingHorizontal: 24,
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t('common:boardVisibility')}</Text>
          <View style={styles.boardsList}>
            {localBoardOrder.map((boardKey, idx) => {
              const isVisible = !localHiddenBoards.includes(boardKey);
              const visibleCount = localBoardOrder.length - localHiddenBoards.length;
              const isLastVisible = isVisible && visibleCount === 1;
              const isDisabled = isSaving || isLastVisible;
              return (
                <DraggableBoardItem
                  key={boardKey}
                  boardKey={boardKey}
                  index={idx}
                  isVisible={isVisible}
                  isLastVisible={isLastVisible}
                  isDisabled={isDisabled}
                  onToggle={handleToggle}
                  onDragEnd={handleDragEnd}
                  t={t}
                  themeColors={themeColors}
                />
              );
            })}
          </View>
        </View>
        <View style={styles.footer}>
          <Button
            title={t('common:save')}
            onPress={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
            style={styles.saveButton}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default BoardSettings;
