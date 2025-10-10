import { useCallback, useRef, useState } from 'react';

import debounce from 'lodash/debounce';

const useDebouncedSearch = (searchFunc: (query: string) => void, searchText: string, delay: number) => {
  const [searchQuery, setSearchQuery] = useState(searchText || '');
  const [isBusy, setIsBusy] = useState(false);

  const debouncedSearch = useRef(
    debounce((value) => {
      searchFunc(value);
      setIsBusy(false);
    }, delay),
  );

  const handleChange = useCallback(
    (value: string) => {
      setIsBusy(true);
      debouncedSearch.current(value);
      setSearchQuery(value);
    },
    [setSearchQuery, searchText],
  );

  const cancelExecution = () => debouncedSearch.current.cancel();

  const clearSearchText = () => setSearchQuery('');

  return [searchQuery, handleChange, clearSearchText, isBusy, cancelExecution];
};

export default useDebouncedSearch;
