import { useEffect, useState } from 'react';
import { getImgUrl } from '~config/api';

const useGetImgUrl = () => {
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    async function getData() {
      const response = await getImgUrl();
      setImgUrl(response);
    }
    getData();
  }, []);

  return imgUrl;
};

export default useGetImgUrl;
