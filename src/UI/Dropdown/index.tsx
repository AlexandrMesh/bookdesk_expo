import React, { FC, memo, useCallback, useRef, useState } from 'react';

import { Animated, FlatList, Modal, StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle, useWindowDimensions } from 'react-native';

import DropdownIcon from '~assets/dropdown.svg';
import { DROPDOWN_ICON } from '~constants/dimensions';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import { BookStatus } from '~types/books';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from './styles';

export type Props = {
  items: { title: string; value: any }[];
  selectedItem: string;

  onChange: (value: any) => void;
  buttonLabel: string;
  wrapperStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ViewStyle>;
  buttonLabelStyle?: StyleProp<TextStyle>;
  dropdownLeftPosition?: number;
  dropdownHeight?: number;
  isLoading?: boolean;
  fillBackground?: boolean;
};

const Dropdown: FC<Props> = ({
  items,
  onChange,
  selectedItem,
  buttonLabel,
  wrapperStyle,
  buttonLabelStyle,
  dropdownLeftPosition,
  iconStyle,
  dropdownHeight = 150,
  isLoading,
  fillBackground = true,
}) => {
  const { height } = useWindowDimensions();
  const dropdownButton = useRef<any>(null);
  const [visible, setVisible] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const dropdownTop = useRef<number | null>(0);
  const dropdownBottom = useRef<number | null>(0);
  const dropdownLeft = useRef<number | null>(0);
  const [maxDropdownHeight, setMaxDropdownHeight] = useState<number | undefined>(undefined);
  const animatedStyle = useGetAnimatedPlaceholderStyle(isLoading as boolean);
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const handleChange = useCallback(
    (value: string) => {
      setVisible(false);
      setIsPositioned(false);
      onChange(value);
    },
    [onChange],
  );

  const openDropdown = useCallback(() => {
    dropdownButton.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
      const spaceBelow = height - (y + h);
      const spaceAbove = y;
      const padding = 20; // Дополнительный отступ от краев экрана
      const borderOverlap = 1; // Перекрытие на 1px для визуального соединения

      // Проверяем, есть ли достаточно места снизу для дропдауна
      if (spaceBelow >= dropdownHeight) {
        // Показываем под кнопкой - перекрываем на 1px для бесшовного соединения
        dropdownBottom.current = null;
        dropdownTop.current = y + h - borderOverlap;
        setMaxDropdownHeight(undefined);
      } else if (spaceAbove >= dropdownHeight) {
        // Показываем над кнопкой - перекрываем на 1px для бесшовного соединения
        dropdownTop.current = null;
        dropdownBottom.current = height - y + borderOverlap;
        setMaxDropdownHeight(undefined);
      } else {
        // Если места мало с обеих сторон, показываем там где больше места
        if (spaceBelow > spaceAbove) {
          dropdownBottom.current = null;
          dropdownTop.current = y + h - borderOverlap;
          setMaxDropdownHeight(Math.max(spaceBelow - padding, 100));
        } else {
          dropdownTop.current = null;
          dropdownBottom.current = height - y + borderOverlap;
          setMaxDropdownHeight(Math.max(spaceAbove - padding, 100));
        }
      }

      dropdownLeft.current = dropdownLeftPosition ?? x;

      // Сначала показываем модал с opacity 0, затем делаем видимым
      setVisible(true);
      setImmediate(() => {
        setIsPositioned(true);
      });
    });
  }, [dropdownHeight, dropdownLeftPosition, height]);

  const toggleDropdown = useCallback(() => {
    if (visible) {
      setVisible(false);
      setIsPositioned(false);
    } else {
      openDropdown();
    }
  }, [openDropdown, visible]);

  const renderItem = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        onPress={() => handleChange(item.value)}
        style={{
          ...styles.dropdownItemStyle,
          ...(item.value === selectedItem && { backgroundColor: themeColors.primary_medium }),
        }}
      >
        <Text style={styles.dropdownItemTextStyle}>{item.title}</Text>
      </TouchableOpacity>
    ),
    [selectedItem, handleChange],
  );

  const getKeyExtractor = useCallback((_item: { title: string; value: BookStatus }, index: number) => index.toString(), []);

  const renderDropdown = useCallback(() => {
    return (
      <Modal visible={visible} transparent animationType='none'>
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => {
            setVisible(false);
            setIsPositioned(false);
          }}
        />
        <View
          style={[
            styles.dropdown,
            {
              ...(dropdownTop.current && { top: dropdownTop.current }),
              ...(dropdownBottom.current && { bottom: dropdownBottom.current }),
              left: dropdownLeft.current,
              ...(maxDropdownHeight && { maxHeight: maxDropdownHeight }),
              opacity: isPositioned ? 1 : 0,
            },
          ]}
        >
          <FlatList data={items} renderItem={renderItem} keyExtractor={getKeyExtractor} />
        </View>
      </Modal>
    );
  }, [items, getKeyExtractor, renderItem, visible, isPositioned, maxDropdownHeight]);

  // Извлекаем borderColor из wrapperStyle для использования как backgroundColor
  const getBorderColor = (style: StyleProp<ViewStyle>): string | undefined => {
    if (Array.isArray(style)) {
      for (const s of style) {
        if (s && typeof s === 'object' && 'borderColor' in s) {
          return s.borderColor as string;
        }
      }
    } else if (style && typeof style === 'object' && 'borderColor' in style) {
      return (style as any).borderColor;
    }
    return undefined;
  };

  const statusColor = getBorderColor(wrapperStyle);
  const filledBackgroundColor = statusColor || themeColors.primary_medium;
  const buttonColors = fillBackground
    ? {
        backgroundColor: filledBackgroundColor,
        borderColor: filledBackgroundColor,
      }
    : {};

  const labelColor = fillBackground ? themeColors.neutral_white : themeColors.neutral_light;

  return (
    <Animated.View style={isLoading ? { opacity: animatedStyle } : {}}>
      <TouchableOpacity
        ref={dropdownButton}
        style={[styles.dropdownButtonStyle, buttonColors, wrapperStyle]}
        disabled={isLoading}
        onPress={toggleDropdown}
      >
        <View style={styles.status}>
          <Text style={[styles.dropdownButtonLabelStyle, buttonLabelStyle, { color: labelColor }]}>
            {buttonLabel}
          </Text>
          <DropdownIcon
            width={DROPDOWN_ICON.width}
            height={DROPDOWN_ICON.height}
            style={[styles.icon, { fill: labelColor }, iconStyle]}
          />
        </View>
        {renderDropdown()}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default memo(Dropdown);
