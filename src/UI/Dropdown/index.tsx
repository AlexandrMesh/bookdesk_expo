import React, { FC, memo, useCallback, useRef, useState } from 'react';
import { Animated, FlatList, Modal, StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle, useWindowDimensions } from 'react-native';
import DropdownIcon from '~assets/dropdown.svg';
import { DROPDOWN_ICON } from '~constants/dimensions';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import colors from '~styles/colors';
import { BookStatus } from '~types/books';
import styles from './styles';

export type Props = {
  items: { title: string; value: any }[];
  selectedItem: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: any) => void;
  buttonLabel: string;
  wrapperStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ViewStyle>;
  buttonLabelStyle?: StyleProp<TextStyle>;
  dropdownLeftPosition?: number;
  dropdownHeight?: number;
  isLoading?: boolean;
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
}) => {
  const { height } = useWindowDimensions();
  const dropdownButton = useRef<any>(null);
  const [visible, setVisible] = useState(false);
  const dropdownTop = useRef<number | null>(0);
  const dropdownBottom = useRef<number | null>(0);
  const dropdownLeft = useRef<number | null>(0);
  const [maxDropdownHeight, setMaxDropdownHeight] = useState<number | undefined>(undefined);
  const animatedStyle = useGetAnimatedPlaceholderStyle(isLoading as boolean);

  const handleChange = useCallback(
    (value: string) => {
      setVisible(false);
      onChange(value);
    },
    [onChange],
  );

  const openDropdown = useCallback(() => {
    dropdownButton.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
      console.log('Dropdown button measurements:', { x, y, w, h, screenHeight: height });
      
      const spaceBelow = height - (y + h);
      const spaceAbove = y;
      const padding = 20; // Дополнительный отступ от краев экрана
      const borderOverlap = 1; // Перекрытие на 1px для визуального соединения
      
      console.log('Space calculations:', { spaceBelow, spaceAbove, dropdownHeight });
      
      // Проверяем, есть ли достаточно места снизу для дропдауна
      if (spaceBelow >= dropdownHeight) {
        // Показываем под кнопкой - перекрываем на 1px для бесшовного соединения
        dropdownBottom.current = null;
        dropdownTop.current = y + h - borderOverlap;
        setMaxDropdownHeight(undefined);
        console.log('Positioning below button:', y + h - borderOverlap);
      } else if (spaceAbove >= dropdownHeight) {
        // Показываем над кнопкой - перекрываем на 1px для бесшовного соединения
        dropdownTop.current = null;
        dropdownBottom.current = height - y + borderOverlap;
        setMaxDropdownHeight(undefined);
        console.log('Positioning above button:', height - y + borderOverlap);
      } else {
        // Если места мало с обеих сторон, показываем там где больше места
        if (spaceBelow > spaceAbove) {
          dropdownBottom.current = null;
          dropdownTop.current = y + h - borderOverlap;
          setMaxDropdownHeight(Math.max(spaceBelow - padding, 100));
          console.log('Positioning below (limited):', y + h - borderOverlap, 'maxHeight:', Math.max(spaceBelow - padding, 100));
        } else {
          dropdownTop.current = null;
          dropdownBottom.current = height - y + borderOverlap;
          setMaxDropdownHeight(Math.max(spaceAbove - padding, 100));
          console.log('Positioning above (limited):', height - y + borderOverlap, 'maxHeight:', Math.max(spaceAbove - padding, 100));
        }
      }
      
      dropdownLeft.current = dropdownLeftPosition ?? x;
      setVisible(true);
    });
  }, [dropdownHeight, dropdownLeftPosition, height]);

  const toggleDropdown = useCallback(() => (visible ? setVisible(false) : openDropdown()), [openDropdown, visible]);

  const renderItem = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        onPress={() => handleChange(item.value)}
        style={{
          ...styles.dropdownItemStyle,
          ...(item.value === selectedItem && { backgroundColor: colors.primary_medium }),
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
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} />
        <View
          style={[
            styles.dropdown,
            {
              ...(dropdownTop.current && { top: dropdownTop.current }),
              ...(dropdownBottom.current && { bottom: dropdownBottom.current }),
              left: dropdownLeft.current,
              ...(maxDropdownHeight && { maxHeight: maxDropdownHeight }),
            },
          ]}
        >
          <FlatList data={items} renderItem={renderItem} keyExtractor={getKeyExtractor} />
        </View>
      </Modal>
    );
  }, [items, getKeyExtractor, renderItem, visible, maxDropdownHeight]);

  return (
    <Animated.View style={isLoading ? { opacity: animatedStyle } : {}}>
      <TouchableOpacity ref={dropdownButton} style={[styles.dropdownButtonStyle, wrapperStyle]} disabled={isLoading} onPress={toggleDropdown}>
        <View style={styles.status}>
          <Text style={[styles.dropdownButtonLabelStyle, buttonLabelStyle]}>{buttonLabel}</Text>
          <DropdownIcon width={DROPDOWN_ICON.width} height={DROPDOWN_ICON.height} style={[styles.icon, iconStyle]} />
        </View>
        {renderDropdown()}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default memo(Dropdown);
