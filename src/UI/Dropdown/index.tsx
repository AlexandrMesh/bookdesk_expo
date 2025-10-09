import React, { FC, useRef, useState, useCallback, memo } from 'react';
import { FlatList, Animated, Text, TouchableOpacity, Modal, View, useWindowDimensions, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { DROPDOWN_ICON } from '~constants/dimensions';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import DropdownIcon from '~assets/dropdown.svg';
import { BookStatus } from '~types/books';
import colors from '~styles/colors';
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
  const dropdownButton = useRef<any>();
  const [visible, setVisible] = useState(false);
  const dropdownTop = useRef<number | null>(0);
  const dropdownBottom = useRef<number | null>(0);
  const dropdownLeft = useRef<number | null>(0);
  const animatedStyle = useGetAnimatedPlaceholderStyle(isLoading as boolean);

  const handleChange = useCallback(
    (value: string) => {
      setVisible(false);
      onChange(value);
    },
    [onChange],
  );

  const openDropdown = useCallback(() => {
    dropdownButton.current?.measure((_fx: number, _fy: number, _w: number, h: number, px: number, py: number) => {
      if (height - py < dropdownHeight + 60) {
        dropdownTop.current = null;
        dropdownBottom.current = height - py;
      } else {
        dropdownBottom.current = null;
        dropdownTop.current = py + h;
      }
      dropdownLeft.current = dropdownLeftPosition || px;
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
            },
          ]}
        >
          <FlatList data={items} renderItem={renderItem} keyExtractor={getKeyExtractor} />
        </View>
      </Modal>
    );
  }, [items, getKeyExtractor, renderItem, visible]);

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
