import { Alert, Platform, ToastAndroid } from 'react-native';

export const showTooltip = (text?: string | null) => {
  if (!text) {
    return;
  }

  if (Platform.OS === 'android') {
    ToastAndroid.show(text, ToastAndroid.SHORT);
    return;
  }

  Alert.alert('', text);
};

