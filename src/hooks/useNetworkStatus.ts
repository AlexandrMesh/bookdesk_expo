import { useEffect, useState } from 'react';

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const getIsOnline = (state: NetInfoState) => {
  const { isConnected, isInternetReachable } = state;
  if (isConnected == null) {
    return false;
  }
  if (isInternetReachable == null) {
    return !!isConnected;
  }
  return Boolean(isConnected && isInternetReachable);
};

const useNetworkStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleStateChange = (state: NetInfoState) => {
      setIsOnline(getIsOnline(state));
    };

    const unsubscribe = NetInfo.addEventListener(handleStateChange);

    NetInfo.fetch().then(handleStateChange).catch(() => {
      // Keep previous state if fetch fails
    });

    return unsubscribe;
  }, []);

  return isOnline;
};

export default useNetworkStatus;

